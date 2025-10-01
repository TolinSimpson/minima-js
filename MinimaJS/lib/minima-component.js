/**
 * MinimaJS Component System v1.0.0 - Advanced Component Features
 */

import { createElement, useState, useEffect } from './minima-core.js';

// Cached constants
const ANON = 'AnonymousComponent';
const REQUIRED_WARN = (name, key) => `Component ${name}: Required prop '${key}' missing`;
const NO_RENDER_WARN = (name) => `Component ${name}: No render function provided`;

// Define a component with enhanced features
const defineComponent = (options) => {
  const {
    name = ANON,
    props: propTypes = {},
    setup,
    render: renderFn,
    beforeMount,
    mounted: onMounted,
    beforeUpdate,
    updated,
    beforeUnmount,
    unmounted,
    computed = {},
    watch = {}
  } = options;

  return function Component(props = {}) {
    // Validate props
    Object.keys(propTypes).forEach(key => {
      if (propTypes[key].required && !(key in props)) console.warn(REQUIRED_WARN(name, key));
    });

    // Component instance state
    const [isMounted, setIsMounted] = useState(false);
    const [updateCount, setUpdateCount] = useState(0);

    // Setup function - runs once per component instance
    const setupContext = setup ? setup(props) : {};

    // Computed properties with caching
    const cache = new Map();
    const computedProps = {};

    Object.keys(computed).forEach(key => {
      Object.defineProperty(computedProps, key, {
        get: () => {
          if (!cache.has(key)) cache.set(key, computed[key].call(setupContext));
          return cache.get(key);
        },
        enumerable: true
      });
    });

    const invalidateComputed = () => (cache.clear(), setUpdateCount(prev => prev + 1));

    Object.keys(watch).forEach(key => {
      let oldValue = setupContext[key];
      useEffect(() => {
        const newValue = setupContext[key];
        if (oldValue !== newValue) {
          watch[key].call(setupContext, newValue, oldValue);
          oldValue = newValue;
        }
      }, [setupContext[key]]);
    });

    // Lifecycle: beforeMount
    useEffect(() => {
      if (beforeMount) beforeMount.call(setupContext);
      return () => {
        if (beforeUnmount) beforeUnmount.call(setupContext);
        if (unmounted) unmounted.call(setupContext);
      };
    }, []);

    // Lifecycle: mounted
    useEffect(() => {
      if (!isMounted) {
        setIsMounted(true);
        if (onMounted) onMounted.call(setupContext);
      }
    }, [isMounted]);

    // Lifecycle: beforeUpdate/updated
    useEffect(() => {
      if (isMounted && updateCount > 0) {
        if (beforeUpdate) beforeUpdate.call(setupContext);
        if (updated) setTimeout(() => updated.call(setupContext), 0);
      }
    }, [updateCount]);

    // Enhanced render context
    const renderContext = {
      ...setupContext,
      ...computedProps,
      props,
      $emit: (eventName, payload) => {
        const handler = props[`on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`];
        if (handler && typeof handler === 'function') {
          handler(payload);
        }
      },
      $update: invalidateComputed,
      $forceUpdate: () => setUpdateCount(prev => prev + 1)
    };

    // Render component
    if (renderFn) return renderFn.call(renderContext, props, renderContext);
    console.warn(NO_RENDER_WARN(name));
    return createElement('div', { 'data-error': `No render function: ${name}` });
  };
};

// Higher-order component wrapper
const withProps = (Component, additionalProps) => 
  (props) => createElement(Component, { ...additionalProps, ...props });

// Component composition helper
const compose = (...components) => {
  return components.reduce((acc, component) => 
    (props) => createElement(component, props, createElement(acc, props))
  );
};

// Fragment component for multiple root elements
const Fragment = ({ children }) => children;

// Memo component for performance optimization
const memo = (Component, areEqual) => {
  let lastProps = {}, lastResult = null;
  return (props) => {
    const shouldUpdate = areEqual ? !areEqual(lastProps, props) :
      Object.keys(props).some(key => props[key] !== lastProps[key]) ||
      Object.keys(lastProps).some(key => !(key in props));
    if (shouldUpdate || !lastResult) {
      lastResult = createElement(Component, props);
      lastProps = props;
    }
    return lastResult;
  };
};

export { defineComponent, withProps, compose, Fragment, memo };
