/**
 * MinimaJS Enhanced API v1.0.0 - Ultra-concise shortcuts
 */

import {
  createElement, useState, useEffect, useMemo, useCallback,
  useTransition, useDeferredValue, useResource, Suspense, render as coreRender
} from './minima-core.js';
import {
  useDevTools, useProfiler, inspectComponentTree, analyzePerformance,
  enableDevTools, disableDevTools
} from './minima-devtools.js';
import { html } from './minima-template.js';
import { defineComponent } from './minima-component.js';

// Ultra-short element creators
const h = createElement;
const tag = (t) => (...args) => h(t, ...args);
const div = tag('div'), span = tag('span'), p = tag('p'), button = tag('button');
const input = tag('input'), a = tag('a'), img = tag('img'), form = tag('form');
const ul = tag('ul'), li = tag('li'), h1 = tag('h1'), h2 = tag('h2'), h3 = tag('h3');

// Component creation shortcuts
const component = defineComponent;
const fc = (render) => () => render();

// Shallow equality check - much faster than JSON.stringify
const shallowEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => a[key] === b[key]);
};

const memo = (Component) => {
  let lastProps = null;
  let lastResult = null;
  return (props) => {
    if (!lastProps || !shallowEqual(props, lastProps)) {
      lastResult = h(Component, props);
      lastProps = props;
    }
    return lastResult;
  };
};

// Template shortcuts
const t = html;
const css = (strings, ...values) => 
  strings.reduce((result, str, i) => result + (values[i - 1] || '') + str);

// Rendering shortcuts
const render = (component, target) => {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  return coreRender(component, container);
};

const mount = render;
const app = (component, target = 'app') => render(component, target);

// Event shortcuts
const evt = (type, handler) => ({ [`on${type}`]: handler });
const click = (handler) => evt('Click', handler);
const submit = (handler) => evt('Submit', handler);
const change = (handler) => evt('Change', handler);
const inputEvent = (handler) => evt('Input', handler);

// Style shortcuts  
const prop = (k, v) => ({ [k]: v });
const style = (styles) => prop('style', styles);
const className = (classes) => prop('className', classes);
const id = (idValue) => prop('id', idValue);

// Conditional rendering
const when = (condition, component) => condition ? component : null;
const unless = (condition, component) => !condition ? component : null;

// List rendering
const each = (items, renderFn) => items.map((item, index) => renderFn(item, index));

// Props spreading helpers
const props = (...objects) => Object.assign({}, ...objects);
const attr = prop;

// Lifecycle shortcuts for components
const onMount = (fn) => useEffect(fn, []);
const onUpdate = (fn, deps) => useEffect(fn, deps);
const onDestroy = (fn) => useEffect(() => fn, []);

// State management helpers
const toggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  return [value, () => setValue(!value)];
};

const counter = (initialValue = 0) => {
  const [count, setCount] = useState(initialValue);
  return [count, () => setCount(count + 1), () => setCount(count - 1), setCount];
};

const inputState = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);
  return [value, setValue, (e) => setValue(e.target.value)];
};

// Form helpers
const formState = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const update = (field) => (e) => setValues({ ...values, [field]: e.target.value });
  return [values, update, () => setValues(initialValues)];
};

// Animation helpers
const fade = (show, duration = 300) => style({
  opacity: show ? 1 : 0,
  transition: `opacity ${duration}ms ease`
}).style;

const slide = (show, duration = 300) => style({
  maxHeight: show ? '1000px' : '0',
  overflow: 'hidden',
  transition: `max-height ${duration}ms ease`
}).style;

// Router helpers
const route = (path, component) => {
  const currentPath = window.location.hash.slice(1) || '/';
  return currentPath === path ? component : null;
};

const link = (to, children, linkProps = {}) => 
  h('a', { ...linkProps, href: `#${to}`, onClick: (e) => {
    e.preventDefault();
    window.location.hash = to;
  }}, children);

// Context helpers
const context = (initialValue) => {
  let value = initialValue;
  const listeners = new Set();

  const Provider = ({ value: newValue, children }) => {
    if (newValue !== value) {
      value = newValue;
      listeners.forEach(fn => fn(value));
    }
    return children;
  };

  const use = () => {
    const [currentState, setState] = useState(value);
    useEffect(() => {
      listeners.add(setState);
      return () => listeners.delete(setState);
    }, []);
    return currentState;
  };

  const Consumer = ({ children }) => 
    typeof children === 'function' ? children(use()) : children;

  return { Provider, Consumer, use };
};

// Create context with default export pattern
const createContext = context;

// Error boundary component
const ErrorBoundary = (fallback = null) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      setError(event.error || event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (error) {
    if (typeof fallback === 'function') {
      return fallback(error);
    }
    return div({ className: 'error-boundary' }, [
      h2('Something went wrong'),
      p(error.message || 'An unexpected error occurred'),
      button({ onClick: () => setError(null) }, 'Try again')
    ]);
  }

  return null;
};

// Development helpers
const debug = (component) => (console.log('Component render:', component), component);
const log = (value, label = 'Debug') => (console.log(`${label}:`, value), value);

// Bundle everything for easy importing
const api = {
  // Core (standard names)
  createElement, useState, useEffect, useMemo, useCallback, useTransition, useDeferredValue, useResource,
  useDevTools, useProfiler, inspectComponentTree, analyzePerformance, Suspense, render: coreRender, html, defineComponent,

  // Shortcuts
  h, div, span, p, button, input, a, img, form, ul, li, h1, h2, h3,
  useState, useEffect, useMemo, useCallback, useTransition, useDeferredValue, useResource,
  useDevTools, useProfiler, inspectComponentTree, analyzePerformance, Suspense, component, fc, memo, t, css, render, mount, app,

  // Events & Props
  click, submit, change, input, style, className, id, props, attr,

  // Control flow
  when, unless, each,

  // Lifecycle
  onMount, onUpdate, onDestroy,

  // State helpers
  toggle, counter, inputState, formState,

  // Animations
  fade, slide,

  // Routing
  route, link,

  // Context
  context, createContext,

  // Error handling
  ErrorBoundary,

  // Debug
  debug, log
};

// Export individual functions
export {
  // Core
  createElement, useState, useEffect, useMemo, useCallback, useTransition, useDeferredValue, useResource,
  useDevTools, useProfiler, inspectComponentTree, analyzePerformance, Suspense, render, html, defineComponent,

  // Shortcuts
  h, div, span, p, button, input, a, img, form, ul, li, h1, h2, h3,
  component, fc, memo, t, css, mount, app,

  // Utilities
  click, submit, change, inputEvent, style, className, id, when, unless, each,
  props, attr, onMount, onUpdate, onDestroy, toggle, counter, inputState, formState,
  fade, slide, route, link, context, createContext, ErrorBoundary, debug, log
};
// Export bundle
export default api;
