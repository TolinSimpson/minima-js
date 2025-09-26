/**
 * MinimaJS Enhanced API v1.0.0 - Ultra-concise shortcuts
 */

import { createElement, useState, useEffect, render as coreRender } from './minima-core.js';
import { html } from './minima-template.js';
import { defineComponent } from './minima-component.js';

// Ultra-short element creators
const h = createElement;
const div = (...args) => h('div', ...args);
const span = (...args) => h('span', ...args);
const p = (...args) => h('p', ...args);
const button = (...args) => h('button', ...args);
const input = (...args) => h('input', ...args);
const a = (...args) => h('a', ...args);
const img = (...args) => h('img', ...args);
const form = (...args) => h('form', ...args);
const ul = (...args) => h('ul', ...args);
const li = (...args) => h('li', ...args);
const h1 = (...args) => h('h1', ...args);
const h2 = (...args) => h('h2', ...args);
const h3 = (...args) => h('h3', ...args);

// Component creation shortcuts
const component = defineComponent;
const fc = (render) => () => render();
const memo = (Component) => {
  let lastProps = null;
  let lastResult = null;
  return (props) => {
    if (JSON.stringify(props) !== JSON.stringify(lastProps)) {
      lastResult = h(Component, props);
      lastProps = props;
    }
    return lastResult;
  };
};

// Template shortcuts
const t = html;
const css = (strings, ...values) => {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) result += values[i];
  }
  return result;
};

// Rendering shortcuts
const render = (component, target) => {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  return coreRender(component, container);
};

const mount = render;
const app = (component, target = 'app') => render(component, target);

// Event shortcuts
const click = (handler) => ({ onClick: handler });
const submit = (handler) => ({ onSubmit: handler });
const change = (handler) => ({ onChange: handler });
const inputEvent = (handler) => ({ onInput: handler });

// Style shortcuts  
const style = (styles) => ({ style: styles });
const className = (classes) => ({ className: classes });
const id = (idValue) => ({ id: idValue });

// Conditional rendering
const when = (condition, component) => condition ? component : null;
const unless = (condition, component) => !condition ? component : null;

// List rendering
const each = (items, renderFn) => items.map((item, index) => renderFn(item, index));

// Props spreading helpers
const props = (...objects) => Object.assign({}, ...objects);
const attr = (name, value) => ({ [name]: value });

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
  return [
    count,
    () => setCount(count + 1),
    () => setCount(count - 1),
    (value) => setCount(value)
  ];
};

const inputState = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);
  return [value, setValue, (e) => setValue(e.target.value)];
};

// Form helpers
const formState = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const update = (field) => (e) => {
    setValues({ ...values, [field]: e.target.value });
  };
  const reset = () => setValues(initialValues);
  return [values, update, reset];
};

// Animation helpers
const fade = (show, duration = 300) => ({
  style: {
    opacity: show ? 1 : 0,
    transition: `opacity ${duration}ms ease`
  }
});

const slide = (show, duration = 300) => ({
  style: {
    maxHeight: show ? '1000px' : '0',
    overflow: 'hidden',
    transition: `max-height ${duration}ms ease`
  }
});

// Router helpers
const route = (path, component) => {
  const currentPath = window.location.hash.slice(1) || '/';
  return currentPath === path ? component : null;
};

const link = (to, children, props = {}) => 
  h('a', { ...props, href: `#${to}`, onClick: (e) => {
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
      const updateState = (newValue) => setState(newValue);
      listeners.add(updateState);
      return () => listeners.delete(updateState);
    }, []);
    return currentState;
  };
  
  return [Provider, use];
};

// Development helpers
const debug = (component) => {
  console.log('Component render:', component);
  return component;
};

const log = (value, label = 'Debug') => {
  console.log(`${label}:`, value);
  return value;
};

// Bundle everything for easy importing
const api = {
  // Core (standard names)
  createElement, useState, useEffect, render: coreRender, html, defineComponent,
  
  // Shortcuts (ultra-concise)
  h, div, span, p, button, input, a, img, form, ul, li, h1, h2, h3,
  useState, useEffect, component, fc, memo, t, css, render, mount, app,
  
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
  context,
  
  // Debug
  debug, log
};

// Export individual functions
export {
  // Core
  createElement, useState, useEffect, render, html, defineComponent,
  
  // Shortcuts
  h, div, span, p, button, input, a, img, form, ul, li, h1, h2, h3,
  useState, useEffect, component, fc, memo, t, css, mount, app,
  
  // Utilities
  click, submit, change, inputEvent, style, className, id, when, unless, each,
  props, attr, onMount, onUpdate, onDestroy, toggle, counter, inputState, formState,
  fade, slide, route, link, context, debug, log
};

// Export bundle
export default api;
