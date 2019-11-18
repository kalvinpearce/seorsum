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
    const { updateState } = createStore(initialState);
    const newState = updateState(d => {
      d.a = newA;
    });
    expect(newState.a).toBe(newA);
  });

  it('updates deep state', () => {
    const { updateState } = createStore(initialState);
    const newState = updateState(d => {
      d.name.first = newFirstName;
    });
    expect(newState.name.first).toBe(newFirstName);
  });

  it('updates state from async functions', async () => {
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

  it("doesn't update the wrong state", () => {
    const { updateState } = createStore(initialState);
    const newState = updateState(d => {
      d.name.first = newFirstName;
    });
    expect(newState.a).toBe(initialState.a);
  });
});
