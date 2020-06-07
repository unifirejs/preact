import { h, Component } from 'preact';
import Unifire from 'unifire/dist/unifire';
import { mount } from 'enzyme';
import { Provider, Observer, useUnifireState, useUnifire } from '../';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-preact-pure';

configure({ adapter: new Adapter });

const tick = () => new Promise((resolve) => setTimeout(resolve));

const Counter = ({ count, increment, decrement }) => (
  <div>
    <button class="decrement" onClick={() => decrement()}>-</button>
    <span class="value">{count}</span>
    <button class="increment" onClick={() => increment()}>+</button>
  </div>
);

describe('@unifire/preact', () => {
  let store;
  let Child;

  const displayTest = async (component) => {
    const wrapper = mount(component);

    const count = wrapper.find('.value');
    expect(wrapper.find('.value').text()).toBe('0');

    store.state.count = 1;
    await tick();
    expect(count.text()).toBe('1');

    wrapper.find('.decrement').simulate('click');
    await tick();
    expect(count.text()).toBe('0');

    wrapper.find('.increment').simulate('click');
    await tick();
    expect(count.text()).toBe('1');
  };

  const renderTest = async (component) => {
    const wrapper = mount(component);

    const count = wrapper.find('.value');
    expect(count.text()).toBe('0');
    expect(Child).toHaveBeenCalledTimes(1);

    store.state.count = 1;
    await tick();
    expect(count.text()).toBe('1');
    expect(Child).toHaveBeenCalledTimes(2);

    store.state.otherCount = 0;
    await tick();
    expect(count.text()).toBe('1');
    expect(Child).toHaveBeenCalledTimes(2);
  };

  beforeEach(() => {
    store = Unifire({
      state: {
        count: 0,
        otherCount: 10
      },
      actions: {
        increment: ({ state }) => state.count++,
        decrement: ({ state }) => state.count--
      }
    });
    Child = jest.fn();
  });

  it('should contain correct exports', () => {
    expect(Provider).toBeInstanceOf(Function);
    expect(Observer).toBeInstanceOf(Function);
    expect(useUnifireState).toBeInstanceOf(Function);
    expect(useUnifire).toBeInstanceOf(Function);
  });

  describe('Observer', () => {
    const El = ({ count, fire }) => (
      <div>
        <Counter
          count={count}
          increment={() => fire('increment')}
          decrement={() => fire('decrement')} />
        <Child />
      </div>
    );

    describe('Provider Function', () => {
      const Connected = Observer(El);
      const App = () => (
        <Provider value={store}>
          <Connected />
        </Provider>
      );

      it('should display current state', async () => {
        await displayTest(<App />);
      });

      it('should only rerender when count changes', async () => {
        await renderTest(<App />);
      });
    });

    describe('Provider Class', () => {
      class ClassEl extends Component {
        render ({ count, fire }) {
          return (
            <div>
              <Counter
                count={count}
                increment={() => fire('increment')}
                decrement={() => fire('decrement')} />
              <Child />
            </div>
          );
        }
      }

      const Connected = Observer(ClassEl);
      const App = () => (
        <Provider value={store}>
          <Connected />
        </Provider>
      );

      it('should display current state', async () => {
        await displayTest(<App />);
      });

      it('should only rerender when count changes', async () => {
        await renderTest(<App />);
      });
    });

    describe('Overload Function', () => {
      it('should display current state', async () => {
        const Connected = Observer(store, El);
        await displayTest(<Connected />);
      });

      it('should only rerender when count changes', async () => {
        const Connected = Observer(store, El);
        await renderTest(<Connected />);
      });
    });
  });

  describe('useUnifireState', () => {
    describe('Provider', () => {
      const Connected = () => {
        const [ count, setCount ] = useUnifireState('count');
        return (
          <div>
            <Counter
              count={count}
              increment={() => setCount(count + 1)}
              decrement={() => setCount(count - 1)} />
            <Child />
          </div>
        );
      };

      const App = () => (
        <Provider value={store}>
          <Connected />
        </Provider>
      );

      it('should display current state', async () => {
        await displayTest(<App />);
      });

      it('should only rerender when count changes', async () => {
        await renderTest(<App />);
      });
    });

    describe('Overload', () => {
      const Connected = () => {
        const [ count, setCount ] = useUnifireState(store, 'count');
        return (
          <div>
            <Counter
              count={count}
              increment={() => setCount(count + 1)}
              decrement={() => setCount(count - 1)} />
            <Child />
          </div>
        );
      };

      it('should display current state', async () => {
        await displayTest(<Connected />);
      });

      it('should only rerender when count changes', async () => {
        await renderTest(<Connected />);
      });
    });
  });

  describe('useUnifire', () => {
    describe('Provider', () => {
      const Connected = () => {
        const [ state, fire ] = useUnifire([ 'count' ]);
        return (
          <div>
            <Counter
              count={state.count}
              increment={() => fire('increment')}
              decrement={() => fire('decrement')} />
            <Child />
          </div>
        );
      };

      const App = () => (
        <Provider value={store}>
          <Connected />
        </Provider>
      );

      it('should display current state', async () => {
        await displayTest(<App />);
      });

      it('should only rerender when count changes', async () => {
        await renderTest(<App />);
      });
    });

    describe('Overload', () => {
      const Connected = () => {
        const [ state, fire ] = useUnifire(store, [ 'count' ]);
        return (
          <div>
            <Counter
              count={state.count}
              increment={() => fire('increment')}
              decrement={() => fire('decrement')} />
            <Child />
          </div>
        );
      };

      it('should display current state', async () => {
        await displayTest(<Connected />);
      });

      it('should only rerender when count changes', async () => {
        await renderTest(<Connected />);
      });
    });
  });
});
