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
    /* Setup */
    const { useStateValue } = createStore(initialState);
    const wrapper = mount(<Comp useState={() => useStateValue(['a'])} />);

    /* Test */
    expect(wrapper.find('span').text()).toBe(initialState.a);
  });

  it("doesn't try to rerender after unmounting", () => {
    /* Setup */
    const spy = jest.spyOn(global.console, 'error');
    const { updateState, useStateValue } = createStore(initialState);
    const wrapper = mount(<Comp useState={() => useStateValue(['a'])} />);

    /* Test */
    expect(wrapper.find('span').text()).toBe(initialState.a);

    /* Action */
    wrapper.unmount();
    act(() => {
      updateState(d => {
        d.a = 'changed';
      });
    });

    /* Test */
    expect(spy).not.toHaveBeenCalled();
  });

  it('updates shallow state', () => {
    /* Setup */
    const newA = 'world';
    const { updateState, useStateValue } = createStore(initialState);
    const wrapper = mount(<Comp useState={() => useStateValue(['a'])} />);

    /* Test */
    expect(wrapper.find('span').text()).toBe(initialState.a);

    /* Action */
    act(() => {
      updateState(d => {
        d.a = newA;
      });
    });

    /* Test */
    expect(wrapper.find('span').text()).toBe(newA);
  });

  it('rerenders component that uses multiple state', () => {
    /* Setup */
    const { updateState, useStateValue } = createStore(initialState);
    const mockfn = jest.fn();
    const CompMulti = () => {
      const val1 = useStateValue(['a']);
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

    /* Test */
    expect(mockfn).toBeCalledTimes(1);

    /* Action */
    act(() => {
      updateState(d => {
        d.a = 'changes';
      });
    });

    /* Test */
    expect(mockfn).toBeCalledTimes(2);

    /* Action */
    act(() => {
      updateState(d => {
        d.name.first = 'changes';
      });
    });

    /* Test */
    expect(mockfn).toBeCalledTimes(3);
  });

  it('rerenders only the component that uses the updated state', () => {
    /* Setup */
    const { updateState, useStateValue } = createStore(initialState);
    const mockOne = jest.fn();
    const mockTwo = jest.fn();
    const mockThree = jest.fn();
    const CompOne = () => (
      <Comp
        useState={() => useStateValue(['a'])}
        useEffect={val =>
          React.useEffect(() => {
            mockOne();
          }, [val])
        }
      />
    );
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

    /* Test */
    expect(mockOne).toBeCalledTimes(1);
    expect(mockTwo).toBeCalledTimes(1);
    expect(mockThree).toBeCalledTimes(1);

    /* Action */
    act(() => {
      updateState(d => {
        d.a = 'changed';
      });
    });

    /* Test */
    expect(mockOne).toBeCalledTimes(2);
    expect(mockTwo).toBeCalledTimes(1);
    expect(mockThree).toBeCalledTimes(1);
  });

  it('rerenders components that use parent state of changed child state', () => {
    /* Setup */
    const { updateState, useStateValue } = createStore(initialState);
    const mockOne = jest.fn();
    const mockTwo = jest.fn();
    const mockThree = jest.fn();
    const CompOne = () => (
      <Comp
        useState={() => useStateValue(['a'])}
        useEffect={val =>
          React.useEffect(() => {
            mockOne();
          }, [val])
        }
      />
    );
    const CompTwo = () => (
      <Comp
        useState={() => useStateValue(['name'])}
        useEffect={val =>
          React.useEffect(() => {
            mockTwo();
          }, [val])
        }
      />
    );
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

    /* Test */
    expect(mockOne).toBeCalledTimes(1);
    expect(mockTwo).toBeCalledTimes(1);
    expect(mockThree).toBeCalledTimes(1);

    /* Action */
    act(() => {
      updateState(d => {
        d.name.first = 'changed';
      });
    });

    /* Test */
    expect(mockOne).toBeCalledTimes(1);
    expect(mockTwo).toBeCalledTimes(2);
    expect(mockThree).toBeCalledTimes(2);
  });
});
