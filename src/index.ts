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

    const changedKeys: string[] = [];
    changes.forEach(c => {
      const fullPath = c.path.join('.');
      const keys = Object.keys(subscriptions).filter(
        k => k.includes(fullPath) || fullPath.includes(k),
      );

      // Push unique keys to the array
      keys.forEach(k => {
        if (!changedKeys.includes(k)) {
          changedKeys.push(k);
        }
      });
    });

    // Run every callback for each changed key
    changedKeys.forEach(key => {
      const subKeys = Object.keys(subscriptions[key]);
      subKeys.forEach(subKey => subscriptions[key][subKey]?.());
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
  const subscribe = <PPath extends Path<S, PPath>, S extends State = State>(
    statePath: PPath,
    callback: (state: PathValue<S, PPath>) => void,
  ) => {
    const fn = () => callback(getFromPath(state as S, statePath));

    const key = statePath.join('.');

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
  const useStateValue = <PPath extends Path<S, PPath>, S extends State = State>(
    statePath: PPath,
  ) => {
    const [value, setValue] = React.useState(
      getFromPath<S, PPath>(state as S, statePath),
    );
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
