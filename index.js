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

// This implementation lacks forwardRef and accesses every state prop on every render.
// It also cannot tell the difference between props prop a parent component, a ref, and store.state.
// (If I decide to compute derived state eagerly then accessing all state on every render is no longer a problem.)
// export const Observer = (...args) => {
//   return (props, ref) => {
//     const [ store, component ] = resolveArgs(...args);
//     const render = useState();
//     const subscriber = component.prototype && component.prototype.render ? (new component()).render : component;
//     const [ deps, output ] = reflect({ ...props, ref, state: store.state, fire: store.fire }, subscriber);
//     const unsubscribe = store.subscribe(Array.from(deps), () => render[1]({}));
//     useEffect(() => () => unsubscribe(), [ unsubscribe ]);
//     return output;
//   };
// }

// This implementation uses forwardRef but required the user to pass an array of state props as the first argument.
// export const Observer = (...args) => {
//   const deps = args.shift();
//   const [ store, component ] = resolveArgs(...args);
//   return forwardRef((originProps, ref) => {
//     const render = useState();
//     useEffect(() => store.subscribe(deps, () => render[1]({})), []);
//     const props = { ...originProps, ref, fire: store.fire };
//     deps.forEach((dep) => props[dep] = store.state[dep]);
//     return h(component, props);
//   });
// }

// This eimplementation uses forwardRef, does not require a list of arguments, and does not access all state on each render.
// However, it does require that state be accessed via a prop called `state` rather than spreading the desired values onto `props`.
// This comes with the side-effect of allowing users to directly manipulate state within components.
export const Observer = (...args) => {
  const [ store, component ] = resolveArgs(...args);
  return forwardRef((props, ref) => {
    const render = useState();
    const subscriber = component.prototype && component.prototype.render
      ? (new component()).render
      : component;
    const deps = new Set();
    const state = new Proxy(store.state, {
      get (obj, prop) {
        deps.add(prop);
        return obj[prop];
      }
    })
    const output = subscriber({ ...props, ref, state, fire: store.fire });
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
