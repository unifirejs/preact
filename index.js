import { h, Component, createContext } from 'preact';
import { useContext, useLayoutEffect, useEffect, useState } from 'preact/hooks';
import { memo, forwardRef } from 'preact/compat';
import { reflect } from 'unifire/utils/dist/utils';

const StoreContext = createContext();

export const Provider = StoreContext.Provider;

function resolveArgs (store, component) {
  if (arguments.length === 1) {
    component = store;
    // Disabling eslint on this line because optionally passing a store should be constant
    store = useContext(StoreContext); // eslint-disable-line react-hooks/rules-of-hooks
  }
  return [ store, component ];
}

// export function Observer (...args) {
//   const [ store, component ] = resolveArgs(...args);
//   function Wrapper() {
//     let unsubscribe;
//     this.componentDidMount = () => {
//       const subscriber = component.prototype && component.prototype.render ? (new component()).render : component;
//       unsubscribe = store.subscribe(subscriber, () => this.setState({}));
//     };
//     this.componentWillUnmount = () => unsubscribe();
//     this.render = (props) => h(component, { ...props, ...store.state, fire: store.fire });
//   }
//   (Wrapper.prototype = new Component()).constructor = Wrapper;
//   return forwardRef((originProps, ref) => { // eslint-disable-line react/display-name
//     return h(Wrapper, { ...originProps, ...store.state, fire: store.fire, ref });
//   });
// }

// This does not use forwardRef like the above implementation. I need to look into this.
export const Observer = (...args) => {
  return memo((props) => {
    const [ store, component ] = resolveArgs(...args);
    const render = useState();
    const subscriber = component.prototype && component.prototype.render ? (new component()).render : component;
    // This line is inneficient because it runs all computed props on every render.
    // I can optimize this by only running reflect on the first render.
    // After that, I already have deps. I can use deps to only read the required props from state.
    const [ deps, output ] = reflect({ ...props, ...store.state, fire: store.fire }, subscriber);
    const unsubscribe = store.subscribe(Array.from(deps), () => render[1]({}));
    useEffect(() => () => unsubscribe(), [ unsubscribe ]);
    return output;
  });
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function useBase (...args) {
  let [ store, subscriber ] = resolveArgs(...args);
  const render = useState();
  if (typeof subscriber === 'string') subscriber = [ subscriber ];
  useIsomorphicLayoutEffect(() => store.subscribe(subscriber, () => render[1]({})), []);
  return [ store, subscriber ];
}

export function useUnifireState (...args) {
  const [ store, prop ] = useBase(...args);
  return [ store.state[prop], (val) => store.state[prop] = val ];
}

export function useUnifire (...args) {
  const [ store ] = useBase(...args);
  return [ store.state, store.fire ];
}
