import { createStore } from './index';

const initialState = {
  a: 'hello',
  name: {
    first: 'john',
    last: 'doe',
  },
};

const newA = 'world';
const newFirstName = 'james';

describe('updateState', () => {
  it('updates shallow state', () => {
    /* Setup */
    const { updateState } = createStore(initialState);

    /* Action */
    const newState = updateState(d => {
      d.a = newA;
    });

    /* Test */
    expect(newState.a).toBe(newA);
  });

  it('updates deep state', () => {
    /* Setup */
    const { updateState } = createStore(initialState);

    /* Action */
    const newState = updateState(d => {
      d.name.first = newFirstName;
    });

    /* Test */
    expect(newState.name.first).toBe(newFirstName);
  });

  it('updates state from async functions', async () => {
    /* Setup */
    const { updateState } = createStore(initialState);
    const asyncAction = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return updateState(draft => {
        draft.a = newA;
      });
    };

    /* Action */
    const newState = await asyncAction();

    /* Test */
    expect(newState.a).toBe(newA);
  });

  it("doesn't update the wrong state", () => {
    /* Setup */
    const { updateState } = createStore(initialState);

    /* Action */
    const newState = updateState(d => {
      d.name.first = newFirstName;
    });

    /* Test */
    expect(newState.a).toBe(initialState.a);
  });
});
