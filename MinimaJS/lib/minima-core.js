/**
 * MinimaJS Core v1.0.0 - Modern Virtual DOM Framework
 */

// Global state management
let currentComponent = null;
let hookIndex = 0;
let components = new WeakMap();

// Virtual Node creation
const createElement = (type, props = {}, ...children) => ({
  type,
  props: { ...props, children: children.flat() },
  key: props?.key || null
});

// Component state hook
const useState = (initial) => {
  if (!currentComponent) throw new Error('useState: outside component');
  
  const comp = components.get(currentComponent);
  const idx = hookIndex++;
  
  if (!comp.hooks) comp.hooks = [];
  if (comp.hooks[idx] === undefined) comp.hooks[idx] = { state: initial };
  
  const setState = (newState) => {
    const hook = comp.hooks[idx];
    const value = typeof newState === 'function' ? newState(hook.state) : newState;
    if (hook.state !== value) {
      hook.state = value;
      scheduleRender(currentComponent);
    }
  };
  
  return [comp.hooks[idx].state, setState];
};

// Effect hook with dependency tracking
const useEffect = (effect, deps) => {
  if (!currentComponent) throw new Error('useEffect: outside component');
  
  const comp = components.get(currentComponent);
  const idx = hookIndex++;
  
  if (!comp.hooks) comp.hooks = [];
  if (!comp.hooks[idx]) comp.hooks[idx] = {};
  
  const hook = comp.hooks[idx];
  const depsChanged = !hook.deps || !deps || 
    deps.length !== hook.deps.length ||
    deps.some((dep, i) => dep !== hook.deps[i]);
  
  if (depsChanged) {
    if (hook.cleanup) hook.cleanup();
    hook.cleanup = effect();
    hook.deps = deps ? [...deps] : null;
  }
};

// Component rendering queue
const renderQueue = new Set();
let isRendering = false;

const scheduleRender = (component) => {
  renderQueue.add(component);
  if (!isRendering) {
    isRendering = true;
    Promise.resolve().then(() => {
      renderQueue.forEach(comp => renderComponent(comp));
      renderQueue.clear();
      isRendering = false;
    });
  }
};

// Virtual DOM diffing algorithm
const diff = (oldVNode, newVNode, container, index = 0) => {
  // Remove old node
  if (!newVNode && oldVNode) {
    container.removeChild(container.childNodes[index]);
    return;
  }
  
  // Add new node
  if (newVNode && !oldVNode) {
    container.appendChild(createDOMElement(newVNode));
    return;
  }
  
  // Replace different types
  if (oldVNode.type !== newVNode.type) {
    container.replaceChild(createDOMElement(newVNode), container.childNodes[index]);
    return;
  }
  
  // Text nodes
  if (typeof newVNode === 'string' || typeof newVNode === 'number') {
    if (oldVNode !== newVNode) {
      container.childNodes[index].textContent = newVNode;
    }
    return;
  }
  
  // Update props
  const node = container.childNodes[index];
  updateProps(node, oldVNode.props, newVNode.props);
  
  // Diff children
  const oldChildren = oldVNode.props.children || [];
  const newChildren = newVNode.props.children || [];
  const maxChildren = Math.max(oldChildren.length, newChildren.length);
  
  for (let i = 0; i < maxChildren; i++) {
    diff(oldChildren[i], newChildren[i], node, i);
  }
};

// Create DOM element from VNode
const createDOMElement = (vnode) => {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(vnode);
  }
  
  if (typeof vnode.type === 'function') {
    return renderFunction(vnode);
  }
  
  const element = document.createElement(vnode.type);
  updateProps(element, {}, vnode.props);
  
  (vnode.props.children || []).forEach(child => {
    if (child != null) element.appendChild(createDOMElement(child));
  });
  
  return element;
};

// Function component rendering
const renderFunction = (vnode) => {
  const comp = vnode.type;
  const prevComponent = currentComponent;
  const prevHookIndex = hookIndex;
  
  // Set up component context
  currentComponent = comp;
  hookIndex = 0;
  
  if (!components.has(comp)) {
    components.set(comp, { 
      element: null, 
      oldVNode: null,
      props: vnode.props 
    });
  }
  
  // Render component
  const compData = components.get(comp);
  const rendered = comp(vnode.props);
  
  if (!compData.element) {
    compData.element = createDOMElement(rendered);
    compData.oldVNode = rendered;
  }
  
  // Restore context
  currentComponent = prevComponent;
  hookIndex = prevHookIndex;
  
  return compData.element;
};

// Re-render component
const renderComponent = (comp) => {
  const compData = components.get(comp);
  if (!compData.element) return;
  
  const prevComponent = currentComponent;
  const prevHookIndex = hookIndex;
  
  currentComponent = comp;
  hookIndex = 0;
  
  const newVNode = comp(compData.props);
  diff(compData.oldVNode, newVNode, compData.element.parentNode, 
    Array.from(compData.element.parentNode.childNodes).indexOf(compData.element));
  
  compData.oldVNode = newVNode;
  currentComponent = prevComponent;
  hookIndex = prevHookIndex;
};

// Update element properties
const updateProps = (element, oldProps = {}, newProps = {}) => {
  // Remove old props
  Object.keys(oldProps).forEach(key => {
    if (key === 'children') return;
    if (!(key in newProps)) {
      if (key.startsWith('on')) {
        element.removeEventListener(key.substring(2).toLowerCase(), oldProps[key]);
      } else if (key in element) {
        element[key] = '';
      } else {
        element.removeAttribute(key);
      }
    }
  });
  
  // Set new props
  Object.keys(newProps).forEach(key => {
    if (key === 'children') return;
    if (oldProps[key] !== newProps[key]) {
      if (key.startsWith('on')) {
        const event = key.substring(2).toLowerCase();
        if (oldProps[key]) element.removeEventListener(event, oldProps[key]);
        element.addEventListener(event, newProps[key]);
      } else if (key in element) {
        element[key] = newProps[key];
      } else {
        element.setAttribute(key, newProps[key]);
      }
    }
  });
};

// Main render function
const render = (vnode, container) => {
  if (container._minimaVNode) {
    diff(container._minimaVNode, vnode, container, 0);
  } else {
    container.appendChild(createDOMElement(vnode));
  }
  container._minimaVNode = vnode;
};

// Export public API
export { createElement, useState, useEffect, render };
