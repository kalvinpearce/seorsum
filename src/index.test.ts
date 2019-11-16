import { createStore } from './index';

const initialState = {
  a: 'hello',
  name: {
    first: 'john',
    last: 'doe',
  },
};

describe('updateState', () => {
  it('updates shallow state', () => {
    const newA = 'world';

    const { updateState } = createStore(initialState);
    const newState = updateState(d => {
      d.a = newA;
    });
    expect(newState.a).toBe(newA);
  });

  it('updates state from async functions', async () => {
    const newA = 'world';

    const { updateState } = createStore(initialState);
    const asyncAction = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return updateState(draft => {
        draft.a = newA;
      });
    };

    const newState = await asyncAction();
    expect(newState.a).toBe(newA);
  });

  it('updates deep state', () => {
    const newFirstName = 'james';

    const { updateState } = createStore(initialState);
    const newState = updateState(d => {
      d.name.first = newFirstName;
    });
    expect(newState.name.first).toBe(newFirstName);
  });

  it("doesn't update the wrong state", () => {
    const newFirstName = 'james';
    const initialA = initialState.a;

    const { updateState } = createStore(initialState);
    const newState = updateState(d => {
      d.name.first = newFirstName;
    });
    expect(newState.a).toBe(initialA);
  });

  it('calls subscribed event when relevant state is changed', () => {
    const newA = 'world';
    const mockSub = jest.fn();

    const { updateState, subscribe } = createStore(initialState);
    subscribe(s => s.a, mockSub);
    const newState = updateState(d => {
      d.a = newA;
    });
    expect(newState.a).toBe(newA);
    expect(mockSub).toBeCalledTimes(1);
  });

  it('calls subscribed event with new state', () => {
    const newA = 'world';
    const mockSub = jest.fn();

    const { updateState, subscribe } = createStore(initialState);
    subscribe(s => s.a, mockSub);
    const newState = updateState(d => {
      d.a = newA;
    });
    expect(newState.a).toBe(newA);
    expect(mockSub).toBeCalledWith(newA);
  });

  it('calls multiple subscribed events', () => {
    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();

    const { updateState, subscribe } = createStore(initialState);
    subscribe(s => s.a, mockSub1);
    subscribe(s => s.a, mockSub2);
    updateState(d => {
      d.a = 'changed';
    });
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(1);
  });

  it("it doesn't call subscribed event after unsubscribe", () => {
    const mockSub = jest.fn();

    const { updateState, subscribe } = createStore(initialState);
    const unsub = subscribe(s => s.a, mockSub);
    updateState(d => {
      d.a = 'changed';
    });
    expect(mockSub).toBeCalledTimes(1);

    unsub();

    updateState(d => {
      d.a = 'changed again';
    });
    expect(mockSub).toBeCalledTimes(1);
  });

  it("it doesn't call subscribed event after unsubscribe but still calls subscribed events", () => {
    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();

    const { updateState, subscribe } = createStore(initialState);
    const unsub1 = subscribe(s => s.a, mockSub1);
    const unsub2 = subscribe(s => s.a, mockSub2);
    updateState(d => {
      d.a = 'changed';
    });
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(1);

    unsub1();

    updateState(d => {
      d.a = 'changed again';
    });
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(2);
  });
});
