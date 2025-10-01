/**
 * MinimaJS Full v1.0.0 - Complete Virtual DOM Framework
 * All features combined in a single file
 */

/**
 * MinimaJS Core v1.0.0 - Modern Virtual DOM Framework
 */

// Global state management
let currentComponent = null;
let hookIndex = 0;
let components = new WeakMap();

// Cached constants
const CHILDREN = 'children';
const ERR_OUTSIDE = 'outside component';

const depsEqual = (a, b) => {
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
};

// Hook initialization helper
const initHook = (name) => {
  if (!currentComponent) throw new Error(`${name}: ${ERR_OUTSIDE}`);
  const comp = components.get(currentComponent);
  const idx = hookIndex++;
  if (!comp.hooks) comp.hooks = [];
  if (!comp.hooks[idx]) comp.hooks[idx] = {};
  return [comp, idx, comp.hooks[idx]];
};

// Concurrent rendering state
let renderQueue = new Set();
let isRendering = false;
const PRIORITIES = { IMMEDIATE: 0, NORMAL: 1, IDLE: 2 };

// Transition tracking
let currentTransition = null;
let pendingTransitions = new Set();

// Suspense state management
let suspenseCache = new Map();
let currentSuspenseHandler = null;

// Virtual Node creation
const createElement = (type, props = {}, ...children) => {
  const flatChildren = children.flat();
  const vnodeProps = props && Object.keys(props).length > 0
    ? { ...props, [CHILDREN]: flatChildren }
    : { [CHILDREN]: flatChildren };

  const vnode = { type, props: vnodeProps, key: props?.key || null };

  // Validate keys in children for duplicates (only when > 1 child)
  if (flatChildren.length > 1) {
    const keys = new Set();
    flatChildren.forEach(child => {
      if (child?.key && keys.has(child.key)) {
        console.warn('createElement: Duplicate keys detected in children. This may cause rendering issues.');
        return;
      }
      if (child?.key) keys.add(child.key);
    });
  }

  return vnode;
};

// Component state hook
const useState = (initial) => {
  const [comp, idx, hook] = initHook('useState');
  if (hook.state === undefined) hook.state = initial;

  const setState = (newState) => {
    const value = typeof newState === 'function' ? newState(hook.state) : newState;
    if (hook.state !== value) {
      hook.state = value;
      scheduleRender(currentComponent);
    }
  };

  return [hook.state, setState];
};

// Effect hook with dependency tracking
const useEffect = (effect, deps) => {
  const [comp, idx, hook] = initHook('useEffect');

  if (!depsEqual(hook.deps, deps)) {
    if (hook.cleanup) hook.cleanup();
    hook.cleanup = effect();
    hook.deps = deps;
  }

  if (!comp.cleanup) comp.cleanup = () => comp.hooks?.forEach(h => h.cleanup?.());
};

// Memo hook for expensive computations
const useMemo = (factory, deps) => {
  const [, , hook] = initHook('useMemo');
  if (!depsEqual(hook.deps, deps)) {
    hook.value = factory();
    hook.deps = deps;
  }
  return hook.value;
};

// Callback hook for stable function references
const useCallback = (callback, deps) => {
  const [, , hook] = initHook('useCallback');
  if (!depsEqual(hook.deps, deps)) {
    hook.callback = callback;
    hook.deps = deps;
  }
  return hook.callback;
};

// Transition hook for concurrent updates
const useTransition = () => {
  const [, , hook] = initHook('useTransition');
  if (hook.isPending === undefined) hook.isPending = false;

  const startTransition = (callback) => {
    const transition = {
      id: Math.random().toString(36).slice(2, 11),
      priority: PRIORITIES.NORMAL,
      callback,
      startTime: performance.now()
    };

    currentTransition = transition;
    pendingTransitions.add(transition);
    hook.isPending = true;

    try {
      callback();
    } finally {
      pendingTransitions.delete(transition);
      if (pendingTransitions.size === 0) currentTransition = null;
      hook.isPending = false;
    }
  };

  return [hook.isPending, startTransition];
};

// Deferred value hook for concurrent updates
const useDeferredValue = (value) => {
  const [, , hook] = initHook('useDeferredValue');
  if (hook.deferredValue !== value) {
    hook.deferredValue = value;
    scheduleRender(currentComponent);
  }
  return hook.deferredValue;
};

// Resource hook for async data fetching
const useResource = (resourceFactory) => {
  const [, , hook] = initHook('useResource');
  if (!hook.result) hook.result = resourceFactory();
  return hook.result;
};

// Suspense component
const Suspense = ({ children, fallback }) => {
  const prevSuspenseHandler = currentSuspenseHandler;
  currentSuspenseHandler = () => fallback;

  try {
    return children;
  } catch (promise) {
    if (promise && typeof promise.then === 'function') {
      return fallback; // Render fallback while promise is pending
    }
    throw promise;
  } finally {
    currentSuspenseHandler = prevSuspenseHandler;
  }
};

// Rendering queue
const scheduleRender = (component) => {
  renderQueue.add(component);
  if (!isRendering) {
    isRendering = true;
    // Use requestIdleCallback if available, fallback to setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        renderQueue.forEach(comp => renderComponent(comp));
        renderQueue.clear();
        isRendering = false;
      }, { timeout: 100 });
    } else {
      setTimeout(() => {
        renderQueue.forEach(comp => renderComponent(comp));
        renderQueue.clear();
        isRendering = false;
      }, 0);
    }
  }
};

// Virtual DOM diffing algorithm with key-based reconciliation
const diff = (oldVNode, newVNode, container, index = 0) => {
  if (!newVNode && oldVNode) return removeNode(oldVNode, container, index);
  if (newVNode && !oldVNode) return addNode(newVNode, container);
  if (oldVNode.type !== newVNode.type) return replaceNode(newVNode, container, index);

  if (typeof newVNode === 'string' || typeof newVNode === 'number')
    return updateTextNode(oldVNode, newVNode, container, index);

  const node = container.childNodes[index];
  updateProps(node, oldVNode.props, newVNode.props);
  diffChildren(node, oldVNode.props[CHILDREN] || [], newVNode.props[CHILDREN] || []);
};

// Node removal with component cleanup
const removeNode = (oldVNode, container, index) => {
  container.removeChild(container.childNodes[index]);
  if (oldVNode.type && typeof oldVNode.type === 'function') {
    const comp = components.get(oldVNode.type);
    if (comp?.cleanup) comp.cleanup();
  }
};

// Node addition
const addNode = (newVNode, container) =>
  container.appendChild(createDOMElement(newVNode));

// Node replacement
const replaceNode = (newVNode, container, index) =>
  container.replaceChild(createDOMElement(newVNode), container.childNodes[index]);

// Text node updates
const updateTextNode = (oldVNode, newVNode, container, index) => {
  if (oldVNode !== newVNode)
    container.childNodes[index].textContent = newVNode;
};

// Children reconciliation
const diffChildren = (parent, oldChildren, newChildren) => {
  const { oldKeyed, oldKeyless } = groupChildren(oldChildren);
  const { newKeyed, newKeyless } = groupChildren(newChildren);

  processKeyedChildren(parent, oldKeyed, newKeyed);
  processKeylessChildren(parent, oldKeyless, newKeyless);
};

// Group children by keys for reconciliation
const groupChildren = (children) => {
  const keyed = new Map(), keyless = [];
  children.forEach((child, i) => {
    const key = child?.key;
    if (key) keyed.set(key, { child, index: i });
    else keyless.push({ child, index: i });
  });
  return { keyed, keyless };
};

// Process keyed children reconciliation
const processKeyedChildren = (parent, oldKeyed, newKeyed) => {
  const allKeys = new Set([...oldKeyed.keys(), ...newKeyed.keys()]);
  allKeys.forEach(key => {
    const old = oldKeyed.get(key), nw = newKeyed.get(key);
    if (!nw) return removeKeyedChild(parent, old);
    if (!old) return addKeyedChild(parent, nw, newKeyed, key);
    diff(old.child, nw.child, parent, old.index);
  });
};

// Remove keyed child from DOM
const removeKeyedChild = (parent, old) => {
  if (old) {
    const domIndex = findDOMIndex(parent, old.index);
    if (domIndex >= 0) parent.removeChild(parent.childNodes[domIndex]);
  }
};

// Add keyed child to DOM
const addKeyedChild = (parent, nw, newKeyed, key) => {
  const beforeKey = findBeforeKey(newKeyed, key);
  const beforeIndex = beforeKey ? findDOMIndex(parent, newKeyed.get(beforeKey).index) : -1;
  const domElement = createDOMElement(nw.child);
  if (beforeIndex >= 0) parent.insertBefore(domElement, parent.childNodes[beforeIndex]);
  else parent.appendChild(domElement);
};

// Process keyless children (simple positional diff)
const processKeylessChildren = (parent, oldKeyless, newKeyless) => {
  const maxLen = Math.max(oldKeyless.length, newKeyless.length);
  for (let i = 0; i < maxLen; i++) {
    const oldChild = oldKeyless[i]?.child, newChild = newKeyless[i]?.child;
    const index = oldKeyless[i]?.index ?? i;
    diff(oldChild, newChild, parent, index);
  }
};

// Helper function to find DOM index from VNode index
const findDOMIndex = (parent, vnodeIndex) => {
  const children = Array.from(parent.childNodes);
  let domIndex = 0;
  for (let i = 0; i < vnodeIndex && domIndex < children.length; i++) {
    domIndex++;
  }
  return domIndex < children.length ? domIndex : -1;
};

// Helper function to find the key that should come before this one
const findBeforeKey = (keyedMap, targetKey) => {
  const keys = Array.from(keyedMap.keys());
  const targetIndex = keys.indexOf(targetKey);
  for (let i = targetIndex - 1; i >= 0; i--) {
    if (keyedMap.has(keys[i])) return keys[i];
  }
  return null;
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

  (vnode.props[CHILDREN] || []).forEach(child => {
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
  const parentNode = compData.element.parentNode;
  const siblings = parentNode.childNodes;
  let elementIndex = 0;
  for (; elementIndex < siblings.length && siblings[elementIndex] !== compData.element; elementIndex++);
  diff(compData.oldVNode, newVNode, parentNode, elementIndex);

  compData.oldVNode = newVNode;
  currentComponent = prevComponent;
  hookIndex = prevHookIndex;
};

const updateProps = (element, oldProps = {}, newProps = {}) => {
  const oldKeys = Object.keys(oldProps), newKeys = Object.keys(newProps);

  // Remove old props
  oldKeys.forEach(key => {
    if (key === CHILDREN || key in newProps) return;
    if (key.startsWith('on')) {
      element.removeEventListener(key.slice(2).toLowerCase(), oldProps[key]);
    } else if (key in element) {
      element[key] = '';
    } else {
      element.removeAttribute(key);
    }
  });

  // Set new props
  newKeys.forEach(key => {
    if (key === CHILDREN) return;
    const oldValue = oldProps[key], newValue = newProps[key];
    if (oldValue === newValue) return;

    if (key.startsWith('on')) {
      const event = key.slice(2).toLowerCase();
      if (oldValue) element.removeEventListener(event, oldValue);
      element.addEventListener(event, newValue);
    } else if (key in element) {
      element[key] = newValue;
    } else {
      element.setAttribute(key, newValue);
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

/**
 * MinimaJS Component System v1.0.0 - Advanced Component Features
 */

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

/**
 * MinimaJS DevTools v1.0.0 - Lightweight debugging utilities
 */

// Cached constants
const HAS_WINDOW = typeof window !== 'undefined';
const WARN_DISABLED = 'MinimaJS DevTools not enabled. Set window.__MINIMA_DEVTOOLS__ = true to enable.';

// Dev tools state (minimal overhead)
let devToolsEnabled = HAS_WINDOW && window.__MINIMA_DEVTOOLS__;
let componentTree = new Map();
let renderTimings = new Map();

// Dev tools hook for component inspection
const useDevTools = (componentName) => {
  if (!devToolsEnabled || !currentComponent) return {};

  const compKey = currentComponent;
  const existing = componentTree.get(compKey);

  // Update render count
  componentTree.set(compKey, {
    name: componentName || existing?.name || 'Anonymous',
    renderCount: (existing?.renderCount || 0) + 1,
    timestamp: Date.now()
  });

  return {
    inspect: () => componentTree.get(compKey),
    logState: () => console.log('Component:', componentTree.get(compKey))
  };
};

// Performance profiling hook
const useProfiler = (componentName) => {
  if (!devToolsEnabled) return {};

  const startTime = performance.now();

  // This would need to be integrated with core's useEffect
  // For now, provide a manual profiling API
  return {
    getTimings: () => renderTimings.get(currentComponent),
    measure: (label) => {
      console.time(label);
      return () => console.timeEnd(label);
    },
    mark: (label) => performance.mark(label)
  };
};

// Component tree inspector
const inspectComponentTree = () => {
  if (!devToolsEnabled) return console.warn(WARN_DISABLED);
  const components = Array.from(componentTree.entries());
  if (!components.length) return console.log('No components tracked');
  console.log(`MinimaJS Components (${components.length}):`);
  components.forEach(([, info]) => console.log(`  ${info.name}: ${info.renderCount} renders`));
};

// Performance analyzer
const analyzePerformance = () => {
  if (!devToolsEnabled) return console.warn(WARN_DISABLED);
  const timings = Array.from(renderTimings.values());
  if (!timings.length) return console.log('Performance: No renders tracked');

  let totalTime = 0, maxTime = 0;
  for (let i = 0; i < timings.length; i++) {
    const time = timings[i].renderTime;
    totalTime += time;
    if (time > maxTime) maxTime = time;
  }

  console.log(`Performance: ${timings.length} renders, ${(totalTime / timings.length).toFixed(2)}ms avg, ${maxTime.toFixed(2)}ms max`);
};

// Enable/disable dev tools globally
const enableDevTools = () => {
  if (HAS_WINDOW) {
    window.__MINIMA_DEVTOOLS__ = devToolsEnabled = true;
    console.log('MinimaJS DevTools enabled');
  }
};

const disableDevTools = () => {
  if (HAS_WINDOW) {
    window.__MINIMA_DEVTOOLS__ = devToolsEnabled = false;
    console.log('MinimaJS DevTools disabled');
  }
};

/**
 * MinimaJS Template Engine v1.0.0 - XSS-Safe HTML Templates
 */

// XSS Prevention - Comprehensive sanitization rules
const DANGEROUS_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'applet', 'meta', 'link', 'style',
  'form', 'input', 'button', 'select', 'textarea', 'option', 'optgroup'
]);

const DANGEROUS_ATTRS = new Set([
  'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange',
  'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup',
  'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave', 'onscroll',
  'onresize', 'onhashchange', 'onpopstate', 'onbeforeunload', 'onunload',
  'onmessage', 'onstorage', 'ononline', 'onoffline', 'onabort', 'oncanplay',
  'oncanplaythrough', 'ondurationchange', 'onemptied', 'onended', 'oninput',
  'oninvalid', 'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange',
  'onseeked', 'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange',
  'onwaiting', 'onafterprint', 'onbeforeprint', 'onabort', 'oncanplay',
  'oncanplaythrough', 'oncontextmenu', 'oncuechange', 'ondblclick', 'ondrag',
  'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
  'ondurationchange', 'onemptied', 'onended', 'onformchange', 'onforminput',
  'oninput', 'oninvalid', 'onpause', 'onplay', 'onplaying', 'onprogress',
  'onratechange', 'onreset', 'onseeked', 'onseeking', 'onselect', 'onshow',
  'onstalled', 'onsubmit', 'onsuspend', 'ontimeupdate', 'ontoggle', 'onvolumechange',
  'onwaiting', 'onwheel', 'oncopy', 'oncut', 'onpaste', 'onauxclick', 'onpointerdown',
  'onpointerup', 'onpointermove', 'onpointerover', 'onpointerout', 'onpointerenter',
  'onpointerleave', 'onpointercancel', 'ongotpointercapture', 'onlostpointercapture'
]);

const URL_ATTRS = new Set([
  'href', 'src', 'action', 'formaction', 'data', 'background', 'poster',
  'icon', 'manifest', 'content', 'cite', 'longdesc', 'usemap', 'formtarget'
]);

// Sanitize text content
const ESC_MAP = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
const sanitizeText = (text) => {
  if (typeof text !== 'string') return String(text);
  return text.replace(/[<>"'\/]/g, (match) => ESC_MAP[match]);
};

// Validate URLs for XSS protection
const isValidUrl = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return !trimmed.startsWith('javascript:') && !trimmed.startsWith('data:') &&
         !trimmed.startsWith('vbscript:') && !trimmed.includes('javascript:');
};

// Sanitize attribute value
const sanitizeAttr = (name, value) => {
  const nameLower = name.toLowerCase();
  if (DANGEROUS_ATTRS.has(nameLower)) return null;
  if (URL_ATTRS.has(nameLower) && !isValidUrl(value)) return null;
  return typeof value === 'string' ? value.replace(/["']/g, (m) => m === '"' ? '&quot;' : '&#x27;') : value;
};

// HTML parser state machine
const parseHTML = (html) => {
  const tokens = [];
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) break;

      const tagContent = html.slice(i + 1, tagEnd);
      const isClosing = tagContent.startsWith('/');
      const tagName = (isClosing ? tagContent.slice(1) : tagContent).split(/\s/)[0].toLowerCase();

      tokens.push(isClosing ? { type: 'close', tag: tagName } :
        { type: 'open', tag: tagName, attrs: parseAttrs(tagContent.slice(tagName.length)), self: tagContent.endsWith('/') });
      i = tagEnd + 1;
    } else {
      const nextTag = html.indexOf('<', i);
      const text = html.slice(i, nextTag === -1 ? html.length : nextTag).trim();
      if (text) tokens.push({ type: 'text', content: text });
      i = nextTag === -1 ? html.length : nextTag;
    }
  }
  return tokens;
};

// Parse attributes from tag content
const parseAttrs = (attrStr) => {
  const attrs = {};
  const regex = /(\w+)(?:=["']([^"']*?)["'])?/g;
  let match;

  while ((match = regex.exec(attrStr)) !== null) {
    const [, name, value = ''] = match;
    const sanitized = sanitizeAttr(name, value);
    if (sanitized !== null) attrs[name] = sanitized;
  }

  return attrs;
};

// Convert HTML tokens to VNode tree
const tokensToVNode = (tokens) => {
  const stack = [{ children: [] }];

  tokens.forEach(token => {
    const current = stack[stack.length - 1];

    if (token.type === 'text') {
      current.children.push(sanitizeText(token.content));
    } else if (token.type === 'open' && !DANGEROUS_TAGS.has(token.tag)) {
      const element = { type: token.tag, props: { ...token.attrs }, children: [] };
      current.children.push(element);
      if (!token.self) stack.push(element);
    } else if (token.type === 'close' && stack.length > 1 && !DANGEROUS_TAGS.has(token.tag)) {
      stack.pop();
    }
  });

  return stack[0].children;
};

// Template literal processor
const html = (strings, ...values) => {
  let result = '';
  strings.forEach((str, i) => {
    result += str;
    if (i < values.length) {
      const value = values[i];
      if (typeof value === 'function') {
        result += `__HANDLER_${i}__`;
      } else if (Array.isArray(value)) {
        value.forEach(v => result += typeof v === 'string' ? sanitizeText(v) : '__VNODE__');
      } else {
        result += sanitizeText(value);
      }
    }
  });

  const vnodes = tokensToVNode(parseHTML(result));

  const processVNode = (vnode) => {
    if (typeof vnode === 'string') {
      return vnode.replace(/__HANDLER_(\d+)__/g, (match, idx) => {
        const handler = values[+idx];
        return typeof handler === 'function' ? handler : match;
      });
    }

    if (vnode?.type && vnode.props) {
      Object.keys(vnode.props).forEach(key => {
        const value = vnode.props[key];
        if (typeof value === 'string' && value.includes('__HANDLER_')) {
          const handlerMatch = value.match(/__HANDLER_(\d+)__/);
          if (handlerMatch) {
            const handler = values[+handlerMatch[1]];
            if (typeof handler === 'function') {
              const eventName = key.startsWith('on') ? key : `on${key}`;
              delete vnode.props[key];
              vnode.props[eventName] = handler;
            }
          }
        }
      });

      if (vnode.children?.length) {
        vnode.children = vnode.children.map(processVNode);
        vnode.props.children = vnode.children;
      }

      return createElement(vnode.type, vnode.props, ...vnode.children);
    }

    return vnode;
  };

  if (vnodes.length === 1) return processVNode(vnodes[0]);
  if (vnodes.length > 1) return createElement('div', { className: 'minima-fragment' }, ...vnodes.map(processVNode));
  return null;
};

// CSP-compatible dynamic imports
const loadTemplate = async (url) => {
  if (!isValidUrl(url)) throw new Error('Invalid template URL');
  const response = await fetch(url);
  const text = await response.text();
  return html([text]);
};

/**
 * MinimaJS Server-Side Rendering v1.0.0 - Universal Rendering
 */

// Cached constants
const isServer = typeof window === 'undefined';

// HTML attribute serialization
const serializeAttrs = (props) => {
  if (!props || typeof props !== 'object') return '';
  let result = '';
  for (const key in props) {
    if (key === CHILDREN || key === KEY) continue;
    const value = props[key];
    if (key.startsWith('on') && typeof value === 'function') continue;
    if (value === true) result += ` ${key}`;
    else if (value !== false && value != null) result += ` ${key}="${sanitizeText(String(value))}"`;
  }
  return result;
};

// Self-closing HTML tags
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr'
]);

// VNode to HTML string conversion
const vnodeToString = (vnode) => {
  if (vnode == null || vnode === false) return '';
  if (typeof vnode === 'string' || typeof vnode === 'number') return sanitizeText(String(vnode));

  if (Array.isArray(vnode)) return vnode.map(vnodeToString).join('');

  if (typeof vnode === 'function') return vnodeToString(vnode({}));
  if (!vnode.type) return '';
  if (typeof vnode.type === 'function') return vnodeToString(vnode.type(vnode.props || {}));

  // Regular HTML element
  const tag = vnode.type, attrs = serializeAttrs(vnode.props || {});
  const children = vnode.props?.[CHILDREN] || [];

  if (VOID_ELEMENTS.has(tag)) return `<${tag}${attrs}/>`;

  const childrenHTML = Array.isArray(children) ? children.map(vnodeToString).join('') : vnodeToString(children);
  return `<${tag}${attrs}>${childrenHTML}</${tag}>`;
};

// Server-side rendering entry point
const renderToString = (component, props = {}) => {
  if (typeof component === 'function') return vnodeToString(component(props));
  if (component?.type) return vnodeToString(component);
  throw new Error('renderToString: Invalid component');
};

// Hydration - make server-rendered HTML interactive
const hydrate = (component, container, serverHTML) => {
  if (isServer) return console.warn('hydrate() called in server environment');

  const originalHTML = container.innerHTML;

  try {
    container.setAttribute('data-minima-hydrating', 'true');
    const vnode = typeof component === 'function' ? component({}) : component;
    const clientNormalized = normalizeHTML(vnodeToString(vnode));
    const serverNormalized = normalizeHTML(serverHTML || originalHTML);

    if (serverNormalized !== clientNormalized) {
      console.warn('Hydration mismatch detected, falling back to client render');
      container.innerHTML = '';
      hydrateClientOnly(vnode, container);
    } else {
      hydrateInteractive(container);
    }
  } catch (error) {
    console.error('Hydration error:', error);
    container.innerHTML = '';
    hydrateClientOnly(typeof component === 'function' ? component({}) : component, container);
  } finally {
    container.removeAttribute('data-minima-hydrating');
  }
};

// Normalize HTML for comparison
const normalizeHTML = (html) => html
  .replace(/>s+</g, '>\n<')
  .replace(/^\s+/, '')
  .replace(/\s+$/, '')
  .replace(/=['"]\s+/g, '="')
  .replace(/\s+['"]/g, '"')
  .toLowerCase();

// Client-only rendering fallback
const hydrateClientOnly = (vnode, container) => {
  render(vnode, container);
};

// Attach event listeners to server-rendered HTML
const hydrateInteractive = (container) => {
  container.querySelectorAll('[data-minima-events]').forEach(element => {
    try {
      const events = JSON.parse(element.getAttribute('data-minima-events'));
      Object.keys(events).forEach(eventType => {
        const handler = window[events[eventType]];
        if (typeof handler === 'function') element.addEventListener(eventType, handler);
      });
    } catch (e) {
      console.warn('Failed to parse event data:', element.getAttribute('data-minima-events'));
    }
  });
};

// Preload components for better SSR performance
const preloadComponent = async (componentPath) => {
  try {
    if (isServer) {
      const module = await import(componentPath);
      return module.default || module;
    }
    const response = await fetch(componentPath);
    const blob = new Blob([await response.text()], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const module = await import(url);
    URL.revokeObjectURL(url);
    return module.default || module;
  } catch (error) {
    console.error('Failed to preload component:', componentPath, error);
    return null;
  }
};

// SSR-friendly data fetching
const ssrData = (key, fetcher) => {
  if (isServer) return fetcher();
  const ssrDataElement = document.querySelector(`script[data-ssr-key="${key}"]`);
  if (ssrDataElement) {
    try {
      return JSON.parse(ssrDataElement.textContent);
    } catch (e) {
      console.warn('Failed to parse SSR data for key:', key);
    }
  }
  return fetcher();
};

// Inject SSR data into HTML (server-side)
const injectSSRData = (html, dataMap) => {
  const scripts = Object.keys(dataMap).map(key =>
    `<script type="application/json" data-ssr-key="${key}">${JSON.stringify(dataMap[key])}</script>`
  ).join('');
  return html.replace('</body>', `${scripts}</body>`);
};

/**
 * MinimaJS Enhanced API v1.0.0 - Ultra-concise shortcuts
 */

// Ultra-short element creators
const h = createElement;
const tag = (t) => (...args) => h(t, ...args);
const div = tag('div'), span = tag('span'), p = tag('p'), button = tag('button');
const input = tag('input'), a = tag('a'), img = tag('img'), form = tag('form');
const ul = tag('ul'), li = tag('li'), h1 = tag('h1'), h2 = tag('h2'), h3 = tag('h3');

// Component creation shortcuts
const component = defineComponent;
const fc = (render) => () => render();

// Shallow equality check
const shallowEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => a[key] === b[key]);
};

// Template shortcuts
const t = html;
const css = (strings, ...values) =>
  strings.reduce((result, str, i) => result + (values[i - 1] || '') + str);

// Rendering shortcuts
const renderToElement = (component, target) => {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  return render(component, container);
};

const mount = renderToElement;
const app = (component, target = 'app') => renderToElement(component, target);

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
const fade = (show, duration = 300) => ({
  opacity: show ? 1 : 0,
  transition: `opacity ${duration}ms ease`
});

const slide = (show, duration = 300) => ({
  maxHeight: show ? '1000px' : '0',
  overflow: 'hidden',
  transition: `max-height ${duration}ms ease`
});

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

/**
 * MinimaJS LLM Layer v1.0.0 - AI-Optimized Development Experience
 */

// Cached constants
const CLS = 'className';
const cls = (name) => ({ [CLS]: name });

// =============================================================================
// 1. TEMPLATE BUILDERS - Common UI patterns in one-liners
// =============================================================================

const quickForm = (config) => {
  const [values, updateValue, resetForm] = formState(config.initialValues || {});

  const fields = config.fields.map(field => {
    const isStr = typeof field === 'string';
    const fieldName = isStr ? field : field.name;
    const fieldType = isStr ? 'text' : field.type || 'text';
    const fieldLabel = isStr ? field : field.label || fieldName;

    return div(cls('form-field'), [
      p(fieldLabel + ':'),
      input({
        type: fieldType,
        value: values[fieldName] || '',
        onChange: updateValue(fieldName),
        placeholder: fieldLabel
      })
    ]);
  });

  return form({
    ...submit(e => {
      e.preventDefault();
      if (config.onSubmit) config.onSubmit(values);
    })
  }, [
    ...fields,
    div(cls('form-actions'), [
      button('Submit'),
      when(config.showReset, button({ onClick: resetForm }, 'Reset'))
    ])
  ]);
};

const quickList = (items, renderItem, options = {}) =>
  h(options.ordered ? 'ol' : 'ul', cls(options[CLS]),
    items.map((item, index) => li({ key: item.id || index }, renderItem(item, index)))
  );

const quickModal = (isOpen, content, options = {}) => {
  const [show, setShow] = useState(isOpen);
  useEffect(() => setShow(isOpen), [isOpen]);

  return when(show,
    div({ ...cls('modal-overlay'), onClick: () => options.onClose?.() }, [
      div({ ...cls('modal-content'), onClick: e => e.stopPropagation() }, [
        when(options.showClose, button({ ...cls('modal-close'), onClick: () => options.onClose?.() }, '×')),
        content
      ])
    ])
  );
};

const quickCard = (title, content, actions = []) =>
  div(cls('card'), [
    when(title, div(cls('card-header'), h3(title))),
    div(cls('card-body'), content),
    when(actions.length, div(cls('card-actions'), actions))
  ]);

const quickTable = (data, columns) =>
  h('table', cls('data-table'), [
    h('thead', h('tr', columns.map(col => h('th', col.header || col.key)))),
    h('tbody', data.map((row, index) =>
      h('tr', { key: row.id || index },
        columns.map(col => h('td', col.render ? col.render(row[col.key], row) : row[col.key]))
      )
    ))
  ]);

// =============================================================================
// 2. CHAIN SYNTAX - Fluent API for component building
// =============================================================================

class ElementBuilder {
  constructor(tag) {
    this.tag = tag;
    this.props = {};
    this.children = [];
  }

  class(className) {
    this.props.className = className;
    return this;
  }

  text(content) {
    this.children.push(content);
    return this;
  }

  child(...elements) {
    this.children.push(...elements);
    return this;
  }

  onClick(handler) {
    this.props.onClick = handler;
    return this;
  }

  onChange(handler) {
    this.props.onChange = handler;
    return this;
  }

  onSubmit(handler) {
    this.props.onSubmit = handler;
    return this;
  }

  style(styles) {
    this.props.style = styles;
    return this;
  }

  attr(name, value) {
    this.props[name] = value;
    return this;
  }

  when(condition) {
    return condition ? this : new NullBuilder();
  }

  build() {
    return h(this.tag, this.props, ...this.children);
  }
}

class NullBuilder extends ElementBuilder {
  constructor() { super(null); }
  build() { return null; }
  class() { return this; }
  text() { return this; }
  child() { return this; }
  onClick() { return this; }
  onChange() { return this; }
  onSubmit() { return this; }
  style() { return this; }
  attr() { return this; }
  when() { return this; }
}

// Element builder factories
const $ = (tag) => new ElementBuilder(tag);
const $el = (t) => () => new ElementBuilder(t);
const $div = $el('div'), $span = $el('span'), $p = $el('p'), $button = $el('button');
const $input = $el('input'), $form = $el('form'), $h1 = $el('h1'), $h2 = $el('h2'), $h3 = $el('h3');

// =============================================================================
// 3. PATTERN MACROS - Complete features in minimal code
// =============================================================================

const createApp = {
  // Complete todo app in one call
  todo: (config = {}) => {
    const [todos, setTodos] = useState(config.initialTodos || []);
    const [input, setInput] = useState('');

    const addTodo = () => {
      if (input.trim()) {
        setTodos([...todos, { id: Date.now(), text: input, done: false }]);
        setInput('');
      }
    };

    return div(cls('todo-app'), [
      h1('Todo App'),
      div(cls('todo-input'), [
        input({
          value: input,
          onChange: e => setInput(e.target.value),
          placeholder: 'Add new todo...',
          onKeyPress: e => e.key === 'Enter' && addTodo()
        }),
        button({ onClick: addTodo }, 'Add')
      ]),
      quickList(todos, todo =>
        div({ ...cls(todo.done ? 'todo-item done' : 'todo-item'), key: todo.id }, [
          input({
            type: 'checkbox',
            checked: todo.done,
            onChange: () => setTodos(todos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))
          }),
          span(todo.text),
          button({ onClick: () => setTodos(todos.filter(t => t.id !== todo.id)) }, '×')
        ])
      )
    ]);
  },

  // Complete counter app
  counter: (config = {}) => {
    const [count, setCount] = useState(config.initialValue || 0);
    const step = config.step || 1, resetValue = config.initialValue || 0;

    return div(cls('counter-app'), [
      h1(config.title || 'Counter'),
      div(cls('counter-display'), count),
      div(cls('counter-controls'), [
        button({ onClick: () => setCount(count - step) }, '-'),
        button({ onClick: () => setCount(resetValue) }, 'Reset'),
        button({ onClick: () => setCount(count + step) }, '+')
      ])
    ]);
  },

  // Complete dashboard layout
  dashboard: (config) => {
    const { header, sidebar, widgets } = config;
    return div(cls('dashboard'), [
      when(header, div(cls('dashboard-header'), header)),
      div(cls('dashboard-content'), [
        when(sidebar, div(cls('dashboard-sidebar'), sidebar)),
        div(cls('dashboard-main'), widgets?.map((widget, index) => div({ ...cls('dashboard-widget'), key: index }, widget)))
      ])
    ]);
  }
};

// =============================================================================
// 4. ERROR RECOVERY - Self-correcting APIs
// =============================================================================

const safeRender = (component, target) => {
  try {
    if (typeof target === 'string') target = document.getElementById(target) || document.querySelector(target);
    if (!target) {
      console.warn('safeRender: Target element not found, creating div');
      target = document.createElement('div');
      document.body.appendChild(target);
    }
    return render(component, target);
  } catch (e) {
    console.error('Render error:', e);
    return render(div(cls('error-boundary'), [
      h2('Render Error'),
      p(`Error: ${e.message}`),
      button({ onClick: () => location.reload() }, 'Reload Page')
    ]), target);
  }
};

const safeComponent = (componentFn) => (...args) => {
  try {
    return componentFn(...args);
  } catch (e) {
    console.error('Component error:', e);
    return div(cls('component-error'), [h3('Component Error'), p(e.message)]);
  }
};

const tryRender = (components) => {
  for (const component of components) {
    try {
      return component();
    } catch (e) {
      console.warn('Component failed, trying next:', e.message);
    }
  }
  return div('All components failed to render');
};

// =============================================================================
// 5. TYPE-GUIDED BUILDERS - IntelliSense-friendly patterns
// =============================================================================

class PageBuilder {
  constructor() {
    this.headerContent = null;
    this.mainContent = null;
    this.footerContent = null;
    this.sidebarContent = null;
  }

  header(builder) {
    this.headerContent = typeof builder === 'function' ? builder(new NavBuilder()) : builder;
    return this;
  }

  main(builder) {
    this.mainContent = typeof builder === 'function' ? builder(new SectionBuilder()) : builder;
    return this;
  }

  sidebar(content) {
    this.sidebarContent = content;
    return this;
  }

  footer(builder) {
    this.footerContent = typeof builder === 'function' ? builder(new FooterBuilder()) : builder;
    return this;
  }

  build() {
    return div(cls('page-layout'), [
      when(this.headerContent, h('header', cls('page-header'), this.headerContent)),
      div(cls('page-body'), [
        when(this.sidebarContent, h('aside', cls('page-sidebar'), this.sidebarContent)),
        h('main', cls('page-main'), this.mainContent)
      ]),
      when(this.footerContent, h('footer', cls('page-footer'), this.footerContent))
    ]);
  }
}

class NavBuilder {
  constructor() {
    this.brandText = '';
    this.navLinks = [];
  }

  brand(text) {
    this.brandText = text;
    return this;
  }

  links(links) {
    this.navLinks = links;
    return this;
  }

  build() {
    return h('nav', cls('navbar'), [
      when(this.brandText, div(cls('navbar-brand'), this.brandText)),
      div(cls('navbar-links'), this.navLinks.map(link =>
        a({ href: typeof link === 'string' ? `#${link}` : link.href }, typeof link === 'string' ? link : link.text)
      ))
    ]);
  }
}

class SectionBuilder {
  constructor() { this.sections = []; }
  section(content) { this.sections.push(content); return this; }
  build() { return div(cls('main-content'), this.sections); }
}

class FooterBuilder {
  constructor() { this.content = []; }

  text(text) {
    this.content.push(p(text));
    return this;
  }

  links(links) {
    this.content.push(div(cls('footer-links'), links.map(link => a({ href: link.href }, link.text))));
    return this;
  }

  build() { return div(cls('footer-content'), this.content); }
}

const page = () => new PageBuilder();
const builder = () => new PageBuilder();

// =============================================================================
// EXPORTS - Bundle everything for easy importing
// =============================================================================

// Core exports
const coreApi = {
  // Core functionality
  createElement, useState, useEffect, useMemo, useCallback, useTransition,
  useDeferredValue, useResource, Suspense, render,

  // Component system
  defineComponent, withProps, compose, Fragment, memo,

  // Dev tools
  useDevTools, useProfiler, inspectComponentTree, analyzePerformance,
  enableDevTools, disableDevTools,

  // Template engine
  html, loadTemplate, sanitizeText,

  // SSR functionality
  renderToString, hydrate, preloadComponent, ssrData, injectSSRData
};

// API layer exports
const apiLayer = {
  // Core (standard names)
  createElement, useState, useEffect, useMemo, useCallback, useTransition,
  useDeferredValue, useResource, useDevTools, useProfiler, inspectComponentTree,
  analyzePerformance, Suspense, render, html, defineComponent,

  // Shortcuts
  h, div, span, p, button, input, a, img, form, ul, li, h1, h2, h3,
  component, fc, memo, t, css, renderToElement, mount, app,

  // Events & Props
  click, submit, change, inputEvent, style, className, id, props, attr,

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

// LLM layer exports
const llmLayer = {
  // Template builders
  quickForm, quickList, quickModal, quickCard, quickTable,

  // Chain syntax
  $, $div, $span, $p, $button, $input, $form, $h1, $h2, $h3,

  // Pattern macros
  createApp,

  // Error recovery
  safeRender, safeComponent, tryRender,

  // Type-guided builders
  page, builder, PageBuilder, NavBuilder, SectionBuilder, FooterBuilder,

  // Utilities
  cls
};

// Full API bundle
const minimaFull = {
  // Core
  createElement, useState, useEffect, useMemo, useCallback, useTransition,
  useDeferredValue, useResource, Suspense, render, defineComponent,
  withProps, compose, Fragment, memo, useDevTools, useProfiler,
  inspectComponentTree, analyzePerformance, enableDevTools, disableDevTools,
  html, loadTemplate, sanitizeText, renderToString, hydrate, preloadComponent,
  ssrData, injectSSRData,

  // API
  h, div, span, p, button, input, a, img, form, ul, li, h1, h2, h3,
  component, fc, t, css, renderToElement, mount, app, click, submit,
  change, inputEvent, style, className, id, props, attr, when, unless, each,
  onMount, onUpdate, onDestroy, toggle, counter, inputState, formState,
  fade, slide, route, link, context, createContext, ErrorBoundary, debug, log,

  // LLM
  quickForm, quickList, quickModal, quickCard, quickTable, $,
  $div, $span, $p, $button, $input, $form, $h1, $h2, $h3, createApp,
  safeRender, safeComponent, tryRender, page, builder, PageBuilder,
  NavBuilder, SectionBuilder, FooterBuilder, cls
};

// Export individual functions and objects
export {
  // Core functionality
  createElement, useState, useEffect, useMemo, useCallback, useTransition,
  useDeferredValue, useResource, Suspense, render, defineComponent,
  withProps, compose, Fragment, memo, useDevTools, useProfiler,
  inspectComponentTree, analyzePerformance, enableDevTools, disableDevTools,
  html, loadTemplate, sanitizeText, renderToString, hydrate, preloadComponent,
  ssrData, injectSSRData,

  // API shortcuts
  h, div, span, p, button, input, a, img, form, ul, li, h1, h2, h3,
  component, fc, t, css, renderToElement, mount, app, click, submit,
  change, inputEvent, style, className, id, props, attr, when, unless, each,
  onMount, onUpdate, onDestroy, toggle, counter, inputState, formState,
  fade, slide, route, link, context, createContext, ErrorBoundary, debug, log,

  // LLM features
  quickForm, quickList, quickModal, quickCard, quickTable, $,
  $div, $span, $p, $button, $input, $form, $h1, $h2, $h3, createApp,
  safeRender, safeComponent, tryRender, page, builder, PageBuilder,
  NavBuilder, SectionBuilder, FooterBuilder, cls
};

// Export layered APIs
export { coreApi, apiLayer, llmLayer };

// Export complete bundle as default
export default minimaFull;
