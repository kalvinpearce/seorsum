import { Patch, produceWithPatches } from 'immer';
import * as React from 'react';
import { getFromPath, Path, PathValue } from './path';

type FunctionBank = { [name: string]: (() => void) | undefined };
type Subscriptions = { [name: string]: FunctionBank };
/**
 * Create store object for state management
 * @param initialState
 * @returns {Object} { subscribe, updateState, useStateValue }
 */
export const createStore = <State>(initialState: State) => {
  // Make a local copy of the initial state
  let [state] = produceWithPatches(initialState, d => {
    /* unchanged state */
  });
  // Create event bus
  const subscriptions: Subscriptions = {};

  /**
   * Create update state function
   * Applies draft and emits relevant events
   * @param draftFn changes to apply to the state
   * @returns updated state
   */
  const updateState = (draftFn: (draft: State) => void) => {
    let changes: Patch[] = [];
    // Update state from draft and record the changes made
    [state, changes] = produceWithPatches(state, draftFn);
    // Emit callback for every change
    changes.forEach(c => {
      emitDeep(subscriptions, c.path);
    });

    // Return updated state
    return state;
  };

  /**
   * Subscribes to a piece of state
   * Runs callback every time the state piece is changed
   * @param stateValue piece of state to subscribe to using string key
   * or array of keys for deeper property access
   * @param callback function to run when state piece changes
   * @returns function to unsubscribe the callback
   */
  const subscribe = <PPath extends Path<State, PPath>>(
    statePath: PPath,
    callback: (state: PathValue<State, PPath> | State[keyof State]) => void,
  ) => {
    const fn = () => callback(getFromPath(state, statePath));

    const key = Array.isArray(statePath)
      ? statePath.join('.')
      : (statePath as string);

    // Add to event bus
    if (subscriptions[key] === undefined) {
      subscriptions[key] = {};
    }
    const keys = Object.keys(subscriptions[key]);
    const index = keys.length;
    subscriptions[key][index] = fn;
    // Return function to remove from event bus
    return () => {
      subscriptions[key][index] = undefined;
    };
  };

  /**
   * Subscribes to a piece of state
   * Rerenders every time the state changes
   * Unsubscribes when unmounts
   * @param statePath piece of state to subscribe to
   * @returns state piece current value
   */
  const useStateValue = <PPath extends Path<State, PPath>>(
    statePath: PPath,
  ) => {
    const [value, setValue] = React.useState(getFromPath(state, statePath));
    React.useEffect(() => {
      return subscribe(statePath, setValue);
    }, []);
    return value;
  };

  return {
    subscribe,
    updateState,
    useStateValue,
  };
};

// Emits to event bus for each path parent and child
const emitDeep = (
  subscriptions: Subscriptions,
  paths: Array<string | number>,
  parent: string = '',
) => {
  const path = parent + paths[0];
  const keys = Object.keys(subscriptions).filter(k => k.includes(path));
  keys.forEach(key => {
    const subKeys = Object.keys(subscriptions[key]);
    subKeys.forEach(subKey => subscriptions[key][subKey]?.());
  });
  if (paths.length > 1) {
    emitDeep(subscriptions, paths.slice(1, paths.length), path + '.');
  }
};
