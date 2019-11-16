import { EventEmitter } from 'events';
import produce, { Patch } from 'immer';
import * as React from 'react';

export const createStore = <State>(initialState: State) => {
  // Make a local copy of the initial state
  let state = produce(initialState, d => {
    /* unchanged state */
  });
  const bus = new EventEmitter();

  const updateState = (draftFn: (draft: State) => void) => {
    const changes: Patch[] = [];
    state = produce(state, draftFn, (patches, _) => {
      changes.push(...patches);
    });
    changes.forEach(c => {
      updateKeys(bus, '', c.path);
    });

    return state;
  };

  const subscribe = <T>(
    func: (state: State) => T,
    callback: (state: T) => void,
  ) => {
    const reg = /\.(.*);/;
    const res = func.toString().match(reg);
    if (res && res.length > 1) {
      const key = res[1];
      const fn = () => callback(func(state));
      bus.addListener(key, fn);
      return () => {
        bus.removeListener(key, fn);
      };
    }

    return () => {
      throw new Error('Unsubscribe is not working correctly.');
    };
  };

  const useStateValue = <T>(func: (state: State) => T) => {
    const [value, setValue] = React.useState(func(state));
    React.useEffect(() => {
      return subscribe(func, setValue);
    }, []);
    return value;
  };

  return { updateState, useStateValue, subscribe };
};

const updateKeys = (
  bus: EventEmitter,
  path: string,
  keys: Array<string | number>,
) => {
  const key = path + keys[0];
  bus.emit(key);
  if (keys.length > 1) {
    updateKeys(bus, key + '.', keys.slice(1, keys.length));
  }
};
