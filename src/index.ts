import { EventEmitter } from 'events';
import { Patch, produceWithPatches } from 'immer';
import * as React from 'react';

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
  const bus = new EventEmitter();

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
      emitDeep(bus, c.path);
    });

    // Return updated state
    return state;
  };

  /**
   * Subscribes to a piece of state
   * Runs callback every time the state piece is changed
   * @param stateValue piece of state to subscribe to
   * @param callback function to run when state piece changes
   * @returns function to unsubscribe the callback
   */
  const subscribe = <T>(
    stateValue: (state: State) => T,
    callback: (state: T) => void,
  ) => {
    // Little messy way of grabbing the state path from the params
    const res = stateValue.toString().match(/\.(.*);/);
    // This should always pass but is needed for intellisense
    if (res && res.length > 1) {
      const key = res[1];
      const fn = () => callback(stateValue(state));
      // Add to event bus
      bus.addListener(key, fn);
      // Return function to remove from event bus
      return () => {
        bus.removeListener(key, fn);
      };
    }

    // If it somehow breaks, calling unsubscribe will throw error
    return () => {
      throw new Error('Unsubscribe is not working correctly.');
    };
  };

  /**
   * Subscribes to a piece of state
   * Rerenders every time the state changes
   * Unsubscribes when unmounts
   * @param func piece of state to subscribe to
   * @returns state piece current value
   */
  const useStateValue = <T>(func: (state: State) => T) => {
    const [value, setValue] = React.useState(func(state));
    React.useEffect(() => {
      return subscribe(func, setValue);
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
  bus: EventEmitter,
  paths: Array<string | number>,
  parent: string = '',
) => {
  const key = parent + paths[0];
  bus.emit(key);
  if (paths.length > 1) {
    emitDeep(bus, paths.slice(1, paths.length), key + '.');
  }
};
