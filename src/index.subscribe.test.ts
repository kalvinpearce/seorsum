import { createStore } from './index';

const initialState = {
  a: 'hello',
  name: {
    first: 'john',
    last: 'doe',
  },
  obj: {
    thing: {
      a: 1,
      b: [
        {
          hello: 0,
        },
        {
          hello: 1,
        },
        {
          hello: 2,
        },
      ],
    },
  },
};

describe('subscribe', () => {
  it('calls event when relevant state is changed', () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub = jest.fn();
    subscribe('a', mockSub);

    /* Action */
    updateState(d => {
      d.a = 'changed';
    });

    /* Test */
    expect(mockSub).toBeCalledTimes(1);
  });

  it('calls deep property event when relevant state is changed', () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub = jest.fn();
    subscribe(['name', 'first'], mockSub);

    /* Action */
    updateState(d => {
      d.name.first = 'changed';
    });

    /* Test */
    expect(mockSub).toBeCalledTimes(1);
  });

  it('calls even deeper property event when relevant state is changed', () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub = jest.fn();
    subscribe(['obj', 'thing', 'b', 0, 'hello'], mockSub);

    /* Action */
    updateState(d => {
      d.obj.thing.b[0].hello = 10;
    });

    /* Test */
    expect(mockSub).toBeCalledTimes(1);
  });

  it('calls event when relevant state is changed with different param versions', () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub = jest.fn();
    subscribe('a', mockSub);
    subscribe(['a'], mockSub);

    /* Action */
    updateState(d => {
      d.a = 'changed';
    });

    /* Test */
    expect(mockSub).toBeCalledTimes(2);
  });

  it("doesn't call event when irrelevant state is changed", () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();
    subscribe(['name', 'first'], mockSub1);
    subscribe(['name', 'last'], mockSub2);

    /* Action */
    updateState(d => {
      d.name.first = 'changed';
    });

    /* Test */
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(0);
  });

  it('calls event with new state', () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub = jest.fn();
    const newA = 'changed';
    subscribe('a', mockSub);

    /* Action */
    updateState(d => {
      d.a = newA;
    });

    /* Test */
    expect(mockSub).toBeCalledWith(newA);
  });

  it('calls multiple events', () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();
    subscribe('a', mockSub1);
    subscribe('a', mockSub2);

    /* Action */
    updateState(d => {
      d.a = 'changed';
    });

    /* Test */
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(1);
  });

  it('calls event when parent changes', () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub = jest.fn();
    subscribe(['name', 'first'], mockSub);

    /* Action */
    updateState(d => {
      d.name = {
        first: 'new',
        last: 'changed',
      };
    });

    /* Test */
    expect(mockSub).toBeCalledTimes(1);
  });

  it('calls event when child changes', () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub = jest.fn();
    subscribe('name', mockSub);

    /* Action */
    updateState(d => {
      d.name.first = 'changed';
    });

    /* Test */
    expect(mockSub).toBeCalledTimes(1);
  });

  it('calls event once when parent & child changes at same time', () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub = jest.fn();
    subscribe(['name', 'first'], mockSub);

    /* Action */
    updateState(d => {
      d.name = {
        first: 'new',
        last: 'changed',
      };

      d.name.first = 'newer';
    });

    /* Test */
    expect(mockSub).toBeCalledTimes(1);
  });

  it("it doesn't call event after unsubscribe", () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub = jest.fn();
    const unsub = subscribe('a', mockSub);

    /* Action */
    updateState(d => {
      d.a = 'changed';
    });

    /* Test */
    expect(mockSub).toBeCalledTimes(1);

    /* Action */
    unsub();

    updateState(d => {
      d.a = 'changed again';
    });

    /* Test */
    expect(mockSub).toBeCalledTimes(1);
  });

  it("it doesn't call event after unsubscribe but still calls other events", () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();
    const unsub1 = subscribe('a', mockSub1);
    const unsub2 = subscribe('a', mockSub2);

    /* Action */
    updateState(d => {
      d.a = 'changed';
    });

    /* Test */
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(1);

    /* Action */
    unsub1();

    updateState(d => {
      d.a = 'changed again';
    });

    /* Test */
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(2);
  });

  it("it doesn't unsubscribe the wrong event with different param types 1", () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();
    const unsub1 = subscribe('a', mockSub1);
    const unsub2 = subscribe(['a'], mockSub2);

    /* Action */
    updateState(d => {
      d.a = 'changed';
    });

    /* Test */
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(1);

    /* Action */
    unsub1();

    updateState(d => {
      d.a = 'changed again';
    });

    /* Test */
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(2);
  });

  it("it doesn't unsubscribe the wrong event with different param types 2", () => {
    /* Setup */
    const { updateState, subscribe } = createStore(initialState);
    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();
    const unsub1 = subscribe('a', mockSub1);
    const unsub2 = subscribe(['a'], mockSub2);

    /* Action */
    updateState(d => {
      d.a = 'changed';
    });

    /* Test */
    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(1);

    /* Action */
    unsub2();

    updateState(d => {
      d.a = 'changed again';
    });

    /* Test */
    expect(mockSub1).toBeCalledTimes(2);
    expect(mockSub2).toBeCalledTimes(1);
  });
});
