/**
 * MinimaJS Component System v1.0.0 - Advanced Component Features
 */

import { createElement, useState, useEffect } from './minima-core.js';

// Define a component with enhanced features
const defineComponent = (options) => {
  const {
    name = 'AnonymousComponent',
    props: propTypes = {},
    setup,
    render: renderFn,
    beforeMount,
    mounted,
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
      if (propTypes[key].required && !(key in props)) {
        console.warn(`Component ${name}: Required prop '${key}' missing`);
      }
    });

    // Component instance state
    const [mounted, setMounted] = useState(false);
    const [updateCount, setUpdateCount] = useState(0);

    // Setup function - runs once per component instance
    const setupContext = setup ? setup(props) : {};

    // Computed properties with caching
    const computedCache = new Map();
    const computedProps = {};

    for (const key in computed) {
      Object.defineProperty(computedProps, key, {
        get() {
          if (!computedCache.has(key)) {
            computedCache.set(key, computed[key].call(setupContext));
          }
          return computedCache.get(key);
        },
        enumerable: true
      });
    }

    // Invalidate computed cache on updates
    const invalidateComputed = () => {
      computedCache.clear();
      setUpdateCount(prev => prev + 1);
    };

    for (const key in watch) {
      let oldValue = setupContext[key];
      useEffect(() => {
        const newValue = setupContext[key];
        if (oldValue !== newValue) {
          watch[key].call(setupContext, newValue, oldValue);
          oldValue = newValue;
        }
      }, [setupContext[key]]);
    }

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
      if (!mounted) {
        setMounted(true);
        if (mounted) mounted.call(setupContext);
      }
    }, [mounted]);

    // Lifecycle: beforeUpdate/updated
    useEffect(() => {
      if (mounted && updateCount > 0) {
        if (beforeUpdate) beforeUpdate.call(setupContext);
        // Schedule updated callback after render
        setTimeout(() => {
          if (updated) updated.call(setupContext);
        }, 0);
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
    if (renderFn) {
      return renderFn.call(renderContext, props, renderContext);
    } else {
      console.warn(`Component ${name}: No render function provided`);
      return createElement('div', { 'data-error': `No render function: ${name}` });
    }
  };
};

// Higher-order component wrapper
const withProps = (Component, additionalProps) => {
  return function WrappedComponent(props) {
    return createElement(Component, { ...additionalProps, ...props });
  };
};

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
  let lastProps = {};
  let lastResult = null;

  return function MemoizedComponent(props) {
    const shouldUpdate = areEqual ?
      !areEqual(lastProps, props) :
      Object.keys(props).some(key => props[key] !== lastProps[key]) ||
      Object.keys(lastProps).some(key => !(key in props));

    if (shouldUpdate || !lastResult) {
      lastResult = createElement(Component, props);
      lastProps = props; // Use reference instead of spread for better performance
    }

    return lastResult;
  };
};

export { defineComponent, withProps, compose, Fragment, memo };
