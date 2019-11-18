import { configure, mount } from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { createStore } from './index';

configure({ adapter: new Adapter() });

const initialState = {
  a: 'hello',
  name: {
    first: 'john',
    last: 'doe',
  },
};

const Comp: React.FC<{
  useState: () => any;
  useEffect?: (val: any) => any;
}> = props => {
  const val = props.useState();
  props.useEffect?.(val);
  return <span>{val.toString()}</span>;
};

describe('useStateValue', () => {
  it('renderes the initial state', () => {
    // Create store
    const { useStateValue } = createStore(initialState);
    const wrapper = mount(<Comp useState={() => useStateValue('a')} />);
    // Expect component to render the initial state provided
    expect(wrapper.find('span').text()).toBe(initialState.a);
  });

  it("doesn't try to rerender after unmounting", () => {
    const spy = jest.spyOn(global.console, 'error');

    // Create store
    const { updateState, useStateValue } = createStore(initialState);
    const wrapper = mount(<Comp useState={() => useStateValue('a')} />);
    // Expect component to render the initial state provided
    expect(wrapper.find('span').text()).toBe(initialState.a);

    wrapper.unmount();

    // Perform state change in act to suppress console error
    act(() => {
      updateState(d => {
        d.a = 'changed';
      });
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it('updates shallow state', () => {
    const newA = 'world';
    // Create store
    const { updateState, useStateValue } = createStore(initialState);
    const wrapper = mount(<Comp useState={() => useStateValue('a')} />);
    // Expect component to render the initial state provided
    expect(wrapper.find('span').text()).toBe(initialState.a);

    // Perform state change in act to suppress console error
    act(() => {
      updateState(d => {
        d.a = newA;
      });
    });
    // Expect component to render the new state
    expect(wrapper.find('span').text()).toBe(newA);
  });

  it('rerenders component that uses multiple state', () => {
    // Create store
    const { updateState, useStateValue } = createStore(initialState);
    const mockfn = jest.fn();
    const CompMulti = () => {
      const val1 = useStateValue('a');
      const val2 = useStateValue(['name', 'first']);
      React.useEffect(() => {
        mockfn();
      }, [val1, val2]);
      return (
        <span>
          {val1} {val2}
        </span>
      );
    };
    mount(<CompMulti />);
    expect(mockfn).toBeCalledTimes(1);

    // Perform state change in act to suppress console error
    act(() => {
      updateState(d => {
        d.a = 'changes';
      });
    });
    expect(mockfn).toBeCalledTimes(2);
    // Perform state change in act to suppress console error
    act(() => {
      updateState(d => {
        d.name.first = 'changes';
      });
    });
    expect(mockfn).toBeCalledTimes(3);
  });

  it('rerenders only the component that uses the updated state', () => {
    // Create store
    const { updateState, useStateValue } = createStore(initialState);
    const mockOne = jest.fn();
    const CompOne = () => (
      <Comp
        useState={() => useStateValue('a')}
        useEffect={val =>
          React.useEffect(() => {
            mockOne();
          }, [val])
        }
      />
    );
    const mockTwo = jest.fn();
    const CompTwo = () => (
      <Comp
        useState={() => useStateValue(['name', 'first'])}
        useEffect={val =>
          React.useEffect(() => {
            mockTwo();
          }, [val])
        }
      />
    );
    const mockThree = jest.fn();
    const CompThree = () => (
      <Comp
        useState={() => useStateValue(['name', 'last'])}
        useEffect={val =>
          React.useEffect(() => {
            mockThree();
          }, [val])
        }
      />
    );

    mount(
      <div>
        <CompOne />
        <CompTwo />
        <CompThree />
      </div>,
    );

    expect(mockOne).toBeCalledTimes(1);
    expect(mockTwo).toBeCalledTimes(1);
    expect(mockThree).toBeCalledTimes(1);

    // Perform state change in act to suppress console error
    act(() => {
      updateState(d => {
        d.a = 'changed';
      });
    });

    expect(mockOne).toBeCalledTimes(2);
    expect(mockTwo).toBeCalledTimes(1);
    expect(mockThree).toBeCalledTimes(1);
  });

  it('rerenders components that use parent state of changed child state', () => {
    // Create store
    const { updateState, useStateValue } = createStore(initialState);
    const mockOne = jest.fn();
    const CompOne = () => (
      <Comp
        useState={() => useStateValue('a')}
        useEffect={val =>
          React.useEffect(() => {
            mockOne();
          }, [val])
        }
      />
    );
    const mockTwo = jest.fn();
    const CompTwo = () => (
      <Comp
        useState={() => useStateValue('name')}
        useEffect={val =>
          React.useEffect(() => {
            mockTwo();
          }, [val])
        }
      />
    );
    const mockThree = jest.fn();
    const CompThree = () => (
      <Comp
        useState={() => useStateValue(['name', 'first'])}
        useEffect={val =>
          React.useEffect(() => {
            mockThree();
          }, [val])
        }
      />
    );

    mount(
      <div>
        <CompOne />
        <CompTwo />
        <CompThree />
      </div>,
    );

    expect(mockOne).toBeCalledTimes(1);
    expect(mockTwo).toBeCalledTimes(1);
    expect(mockThree).toBeCalledTimes(1);

    // Perform state change in act to suppress console error
    act(() => {
      updateState(d => {
        d.name.first = 'changed';
      });
    });

    expect(mockOne).toBeCalledTimes(1);
    expect(mockTwo).toBeCalledTimes(2);
    expect(mockThree).toBeCalledTimes(2);
  });
});
