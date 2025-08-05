/**
 * MinimaJS - Ultra-minimalist JavaScript Framework
 * Production build - Target: <5KB minified+gzipped
 * 
 * Core Features:
 * - Virtual DOM with efficient diffing
 * - Component-based architecture
 * - Reactive state management with Proxy
 * - SPA routing with History API
 * - Universal browser compatibility (ES6+)
 */

(function() {
  'use strict';

  // Feature detection for browser compatibility
  const REQUIRED_FEATURES = {
    proxy: typeof Proxy !== 'undefined',
    historyAPI: !!(window.history && window.history.pushState),
    templateLiterals: true,
    destructuring: true,
    arrowFunctions: true
  };

  // Enhanced error reporting system
  const errorReporter = {
    report: function(context, error, details = {}) {
      const errorInfo = {
        context: context,
        message: error.message || error,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        details: details
      };
      
      console.group(`🔴 MinimaJS Error in ${context}`);
      console.error('Message:', errorInfo.message);
      if (errorInfo.stack) console.error('Stack:', errorInfo.stack);
      console.info('Context Details:', errorInfo.details);
      console.info('Browser:', errorInfo.userAgent);
      console.info('URL:', errorInfo.url);
      console.info('Timestamp:', errorInfo.timestamp);
      
      // Provide helpful suggestions based on error type
      this.provideSuggestions(context, error);
      console.groupEnd();
      
      return errorInfo;
    },

    provideSuggestions: function(context, error) {
      const suggestions = [];
      const message = error.message || error;
      
      if (context.includes('Template') && message.includes('expression')) {
        suggestions.push('• Check your template syntax: use {{state.property}} or {{props.property}}');
        suggestions.push('• Ensure the property exists in your component state or props');
      }
      
      if (context.includes('Component') && message.includes('function')) {
        suggestions.push('• Make sure your component is defined as a function');
        suggestions.push('• Check that you\'re returning a string template from your component');
      }
      
      if (context.includes('State') && message.includes('object')) {
        suggestions.push('• Initial state must be a plain object: {}');
        suggestions.push('• Use createState({}) to create reactive state');
      }
      
      if (context.includes('Router')) {
        suggestions.push('• Check your route definitions: {path: "/path", component: ComponentFunction}');
        suggestions.push('• Ensure components are properly defined before adding to routes');
      }
      
      if (suggestions.length > 0) {
        console.info('💡 Suggestions:');
        suggestions.forEach(suggestion => console.info(suggestion));
      }
    }
  };

  // Check for required browser features with enhanced error reporting
  for (const [feature, supported] of Object.entries(REQUIRED_FEATURES)) {
    if (!supported) {
      const error = new Error(`Browser does not support required feature: ${feature}`);
      errorReporter.report('Browser Compatibility', error, { 
        feature,
        requiredFeatures: REQUIRED_FEATURES 
      });
      throw error;
    }
  }

  // =========================================================================
  // VIRTUAL DOM IMPLEMENTATION
  // =========================================================================

  /**
   * Creates a virtual DOM element node
   * @param {string} tag - HTML tag name
   * @param {Object} props - Element attributes and event handlers
   * @param {Array} children - Child VNodes or text strings
   * @returns {Object} VNode object
   */
  function createVNode(tag, props = {}, children = []) {
    if (typeof tag !== 'string') {
      throw new Error('MinimaJS VirtualDOM: Element tag must be a string');
    }
    
    return {
      tag: tag,
      props: props || {},
      children: Array.isArray(children) ? children : [children],
      _key: props.key || null,
      _dom: null,
      _type: 'element'
    };
  }

  /**
   * Creates a virtual DOM text node
   * @param {string} text - Text content
   * @returns {Object} Text VNode object
   */
  function createTextVNode(text) {
    return {
      tag: null,
      props: {},
      children: [],
      _key: null,
      _dom: null,
      _type: 'text',
      text: String(text)
    };
  }

  /**
   * Creates a virtual DOM fragment for multiple root elements
   * @param {Array} children - Array of child VNodes
   * @returns {Object} Fragment VNode object
   */
  function createFragmentVNode(children) {
    return {
      tag: null,
      props: {},
      children: Array.isArray(children) ? children : [children],
      _key: null,
      _dom: null,
      _type: 'fragment'
    };
  }

  /**
   * Creates a real DOM element from a VNode
   * @param {Object} vnode - Virtual DOM node
   * @returns {Element|Text} DOM element
   */
  function createElement(vnode) {
    if (!vnode || typeof vnode !== 'object') {
      throw new Error('MinimaJS VirtualDOM: Invalid VNode provided');
    }

    if (vnode._type === 'text') {
      const textNode = document.createTextNode(vnode.text);
      vnode._dom = textNode;
      return textNode;
    }
    
    if (vnode._type === 'element') {
      const element = document.createElement(vnode.tag);
      vnode._dom = element;
      
      // Set properties and attributes
      updateElement(element, {}, vnode.props);
      
      // Create and append children
      vnode.children.forEach(child => {
        if (typeof child === 'string') {
          child = createTextVNode(child);
        }
        const childElement = createElement(child);
        element.appendChild(childElement);
      });
      
      return element;
    }
    
    if (vnode._type === 'fragment') {
      const fragment = document.createDocumentFragment();
      vnode._dom = fragment;
      
      vnode.children.forEach(child => {
        if (typeof child === 'string') {
          child = createTextVNode(child);
        }
        const childElement = createElement(child);
        fragment.appendChild(childElement);
      });
      
      return fragment;
    }
    
    throw new Error(`MinimaJS VirtualDOM: Unknown VNode type: ${vnode._type}`);
  }

  /**
   * Updates DOM element properties and attributes
   * @param {Element} element - DOM element to update
   * @param {Object} oldProps - Previous properties
   * @param {Object} newProps - New properties
   */
  function updateElement(element, oldProps, newProps) {
    // Remove old properties that are not in newProps
    for (const key in oldProps) {
      if (!(key in newProps)) {
        if (key.startsWith('on')) {
          // Remove event listener
          const event = key.slice(2).toLowerCase();
          if (typeof oldProps[key] === 'function') {
            element.removeEventListener(event, oldProps[key]);
          }
        } else if (key === 'className') {
          element.removeAttribute('class');
        } else if (key === 'key') {
          // Skip key prop - it's internal
          continue;
        } else {
          element.removeAttribute(key);
        }
      }
    }
    
    // Set new properties
    for (const key in newProps) {
      if (oldProps[key] !== newProps[key]) {
        if (key.startsWith('on')) {
          // Event listener
          const event = key.slice(2).toLowerCase();
          if (oldProps[key] && typeof oldProps[key] === 'function') {
            element.removeEventListener(event, oldProps[key]);
          }
          if (newProps[key] && typeof newProps[key] === 'function') {
            element.addEventListener(event, newProps[key]);
          } else if (newProps[key]) {
            console.warn(`MinimaJS: Event handler for '${key}' is not a function:`, newProps[key]);
          }
        } else if (key === 'className') {
          element.setAttribute('class', newProps[key]);
        } else if (key === 'key') {
          // Skip key prop - it's internal
          continue;
        } else {
          element.setAttribute(key, newProps[key]);
        }
      }
    }
  }

  /**
   * Core diffing algorithm - compares old and new VNode trees
   * @param {Object} oldVNode - Previous virtual DOM tree
   * @param {Object} newVNode - New virtual DOM tree
   * @param {Element} parent - Parent DOM element
   * @param {number} index - Child index for insertion
   * @returns {Object} Updated VNode
   */
  function diff(oldVNode, newVNode, parent, index = 0) {
    // Case 1: No old node - create new
    if (!oldVNode) {
      const newElement = createElement(newVNode);
      if (parent) {
        parent.appendChild(newElement);
      }
      return newVNode;
    }
    
    // Case 2: No new node - remove old
    if (!newVNode) {
      if (parent && oldVNode._dom) {
        parent.removeChild(oldVNode._dom);
      }
      return null;
    }
    
    // Case 3: Different types - replace completely
    if (oldVNode._type !== newVNode._type || oldVNode.tag !== newVNode.tag) {
      const newElement = createElement(newVNode);
      if (parent && oldVNode._dom) {
        parent.replaceChild(newElement, oldVNode._dom);
      }
      return newVNode;
    }
    
    // Case 4: Same type - update in place
    newVNode._dom = oldVNode._dom;
    
    if (newVNode._type === 'text') {
      // Update text content if changed
      if (oldVNode.text !== newVNode.text) {
        newVNode._dom.textContent = newVNode.text;
      }
    } else if (newVNode._type === 'element') {
      // Update element properties
      updateElement(newVNode._dom, oldVNode.props, newVNode.props);
      
      // Reconcile children
      diffChildren(oldVNode.children, newVNode.children, newVNode._dom);
    } else if (newVNode._type === 'fragment') {
      // Reconcile fragment children
      diffChildren(oldVNode.children, newVNode.children, parent);
    }
    
    return newVNode;
  }

  /**
   * Reconciles children arrays during diffing with key-based optimization
   * @param {Array} oldChildren - Previous children VNodes
   * @param {Array} newChildren - New children VNodes
   * @param {Element} parent - Parent DOM element
   */
  function diffChildren(oldChildren, newChildren, parent) {
    // Normalize children (convert strings to text VNodes)
    const normalizeChild = (child) => typeof child === 'string' ? createTextVNode(child) : child;
    const normalizedOld = oldChildren.map(normalizeChild);
    const normalizedNew = newChildren.map(normalizeChild);
    
    // Check if we should use key-based reconciliation
    const hasKeys = normalizedNew.some(child => child && child._key !== null);
    
    if (hasKeys) {
      // Key-based reconciliation for better performance with lists
      diffChildrenWithKeys(normalizedOld, normalizedNew, parent);
    } else {
      // Simple index-based reconciliation
      diffChildrenByIndex(normalizedOld, normalizedNew, parent);
    }
  }

  /**
   * Simple index-based children reconciliation
   * @param {Array} oldChildren - Previous children VNodes
   * @param {Array} newChildren - New children VNodes
   * @param {Element} parent - Parent DOM element
   */
  function diffChildrenByIndex(oldChildren, newChildren, parent) {
    const maxLength = Math.max(oldChildren.length, newChildren.length);
    
    for (let i = 0; i < maxLength; i++) {
      diff(oldChildren[i], newChildren[i], parent, i);
    }
  }

  /**
   * Key-based children reconciliation for optimal list performance
   * @param {Array} oldChildren - Previous children VNodes
   * @param {Array} newChildren - New children VNodes
   * @param {Element} parent - Parent DOM element
   */
  function diffChildrenWithKeys(oldChildren, newChildren, parent) {
    // Create key maps for efficient lookups
    const oldKeyMap = new Map();
    const newKeyMap = new Map();
    
    // Build maps of keyed elements
    oldChildren.forEach((child, index) => {
      if (child && child._key !== null) {
        oldKeyMap.set(child._key, { child, index });
      }
    });
    
    newChildren.forEach((child, index) => {
      if (child && child._key !== null) {
        newKeyMap.set(child._key, { child, index });
      }
    });
    
    // Track which old children have been matched
    const matchedOldIndices = new Set();
    const operations = [];
    
    // First pass: Match existing keyed elements
    newChildren.forEach((newChild, newIndex) => {
      if (!newChild || newChild._key === null) {
        // Handle non-keyed elements separately
        operations.push({ type: 'update', newChild, newIndex, oldChild: null });
        return;
      }
      
      const oldEntry = oldKeyMap.get(newChild._key);
      if (oldEntry) {
        // Found matching key - update in place
        const { child: oldChild, index: oldIndex } = oldEntry;
        matchedOldIndices.add(oldIndex);
        
        // Update the existing element
        diff(oldChild, newChild, parent);
        
        // Move element if position changed
        if (oldIndex !== newIndex && newChild._dom && parent.children[newIndex] !== newChild._dom) {
          const referenceNode = parent.children[newIndex] || null;
          parent.insertBefore(newChild._dom, referenceNode);
        }
      } else {
        // New element - insert
        operations.push({ type: 'insert', newChild, newIndex });
      }
    });
    
    // Second pass: Remove unmatched old elements
    oldChildren.forEach((oldChild, oldIndex) => {
      if (!matchedOldIndices.has(oldIndex) && oldChild && oldChild._dom) {
        parent.removeChild(oldChild._dom);
      }
    });
    
    // Third pass: Handle insertions and non-keyed updates
    operations.forEach(({ type, newChild, newIndex, oldChild }) => {
      if (type === 'insert') {
        const newElement = createElement(newChild);
        const referenceNode = parent.children[newIndex] || null;
        parent.insertBefore(newElement, referenceNode);
      } else if (type === 'update') {
        // Handle non-keyed elements by index
        const oldChild = oldChildren[newIndex];
        diff(oldChild, newChild, parent, newIndex);
      }
    });
  }

  // =========================================================================
  // REACTIVE STATE MANAGEMENT
  // =========================================================================

  // Batch update system for preventing excessive re-renders
  const batchSystem = {
    _pending: new Set(),
    _scheduled: false,
    
    schedule(callback) {
      this._pending.add(callback);
      if (!this._scheduled) {
        this._scheduled = true;
        // Use requestAnimationFrame for optimal rendering performance
        requestAnimationFrame(() => this.flush());
      }
    },
    
    flush() {
      const callbacks = Array.from(this._pending);
      this._pending.clear();
      this._scheduled = false;
      
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('MinimaJS Batch: Error in batched callback:', error);
        }
      });
    }
  };

  /**
   * Creates a reactive state object using Proxy with computed properties support
   * @param {Object} initialState - Initial state values
   * @param {Object} computed - Computed properties definitions
   * @returns {Proxy} Reactive state object
   */
  function createState(initialState = {}, computed = {}) {
    if (typeof initialState !== 'object' || initialState === null) {
      throw new Error('MinimaJS State: Initial state must be an object');
    }

    const subscribers = new Set();
    const computedCache = new Map();
    const computedDependencies = new Map();
    
    // Track which computed properties depend on which state properties
    const trackComputedDependencies = (computedKey, getter) => {
      const deps = new Set();
      const originalState = { ...initialState };
      
      // Create a proxy to track property access during computation
      const trackingProxy = new Proxy(originalState, {
        get(target, prop) {
          deps.add(prop);
          return target[prop];
        }
      });
      
      try {
        getter.call(trackingProxy, trackingProxy);
      } catch (error) {
        // Ignore errors during dependency tracking
      }
      
      computedDependencies.set(computedKey, deps);
    };
    
    // Initialize computed property dependencies
    for (const [key, getter] of Object.entries(computed)) {
      if (typeof getter === 'function') {
        trackComputedDependencies(key, getter);
      }
    }
    
    const state = new Proxy({ ...initialState }, {
      set(target, property, value) {
        const oldValue = target[property];
        target[property] = value;
        
        // Clear computed cache for properties that depend on this state
        for (const [computedKey, deps] of computedDependencies.entries()) {
          if (deps.has(property)) {
            computedCache.delete(computedKey);
          }
        }
        
        // Trigger subscribers if value changed (batched for performance)
        if (oldValue !== value) {
          batchSystem.schedule(() => {
            subscribers.forEach(callback => {
              try {
                callback(property, value, oldValue);
              } catch (error) {
                console.error('MinimaJS State: Error in subscriber callback:', error);
              }
            });
          });
        }
        return true;
      },
      
      get(target, property) {
        // Special method for subscribing to changes
        if (property === '_subscribe') {
          return (callback) => {
            if (typeof callback !== 'function') {
              throw new Error('MinimaJS State: Subscriber callback must be a function');
            }
            subscribers.add(callback);
            // Return unsubscribe function
            return () => subscribers.delete(callback);
          };
        }
        
        // Special method for adding computed properties
        if (property === '_addComputed') {
          return (key, getter) => {
            if (typeof getter !== 'function') {
              throw new Error('MinimaJS State: Computed property getter must be a function');
            }
            computed[key] = getter;
            trackComputedDependencies(key, getter);
            computedCache.delete(key); // Clear cache if it exists
          };
        }
        
        // Check if it's a computed property
        if (computed[property]) {
          // Use cached value if available
          if (computedCache.has(property)) {
            return computedCache.get(property);
          }
          
          // Compute and cache the value
          try {
            const value = computed[property].call(target, target);
            computedCache.set(property, value);
            return value;
          } catch (error) {
            console.error(`MinimaJS State: Error computing property '${property}':`, error);
            return undefined;
          }
        }
        
        return target[property];
      }
    });
    
    return state;
  }

  // =========================================================================
  // COMPONENT SYSTEM
  // =========================================================================

  /**
   * Defines a MinimaJS component with lifecycle management
   * @param {Function} componentFn - Component function that returns template string
   * @returns {Function} Enhanced component wrapper
   */
  function defineComponent(componentFn) {
    if (typeof componentFn !== 'function') {
      throw new Error('MinimaJS Component: Component must be a function');
    }
    
    const componentName = componentFn.name || `AnonymousComponent_${Date.now()}`;
    
    // Create enhanced component wrapper
    const ComponentWrapper = function(props = {}) {
      // Create component instance with framework-managed state
      const instance = {
        state: createState({}),
        onInit: function() {},
        onUpdate: function() {},
        onDestroy: function() {},
        shouldUpdate: function(newProps, newState) { return true; },
        _isInitialized: false,
        _element: null,
        _vnode: null,
        _subscriptions: [],
        _eventListeners: [],
        _mounted: false,
        _destroyed: false
      };
      
      // Bind the original component function to the instance
      const boundComponent = componentFn.bind(instance);
      
      // Execute component function to get template
      let template;
      try {
        template = boundComponent(props);
      } catch (error) {
        errorReporter.report('Component Execution', error, { componentName, props });
        return createTextVNode(`[Component Error: ${componentName}]`);
      }
      
      if (typeof template !== 'string') {
        throw new Error(`MinimaJS Component: Component '${componentName}' must return a string template`);
      }
      
      // Parse template into VNode tree with full component context
      const vnode = parseTemplate(template, instance.state, props, instance);
      
      // Store instance data
      instance._template = template;
      instance._props = props;
      instance._vnode = vnode;
      
      // Set up state change subscription for re-rendering
      const unsubscribe = instance.state._subscribe((property, newValue, oldValue) => {
        if (instance._destroyed) return; // Don't update if component is destroyed
        
        // Check if component should update
        if (instance.shouldUpdate && !instance.shouldUpdate(instance._props, instance.state)) {
          return;
        }
        
        if (instance.onUpdate) {
          try {
            instance.onUpdate();
          } catch (error) {
            console.error(`MinimaJS Component: Error in onUpdate for '${componentName}':`, error);
          }
        }
        // Re-render component when state changes
        // This would trigger a re-render cycle in a full implementation
      });
      
      instance._subscriptions.push(unsubscribe);
      
      // Add cleanup method to instance
      instance.destroy = function() {
        if (instance._destroyed) return;
        
        try {
          // Call onDestroy lifecycle hook
          if (instance.onDestroy) {
            instance.onDestroy();
          }
          
          // Clean up subscriptions
          instance._subscriptions.forEach(unsub => {
            try {
              unsub();
            } catch (error) {
              console.error(`MinimaJS Component: Error unsubscribing in '${componentName}':`, error);
            }
          });
          instance._subscriptions = [];
          
          // Clean up event listeners
          instance._eventListeners.forEach(({ element, event, handler }) => {
            try {
              element.removeEventListener(event, handler);
            } catch (error) {
              console.error(`MinimaJS Component: Error removing event listener in '${componentName}':`, error);
            }
          });
          instance._eventListeners = [];
          
          // Mark as destroyed
          instance._destroyed = true;
          instance._mounted = false;
          
        } catch (error) {
          console.error(`MinimaJS Component: Error in destroy for '${componentName}':`, error);
        }
      };
      
      // Add helper method to register event listeners for cleanup
      instance.addEventListener = function(element, event, handler) {
        if (instance._destroyed) return;
        
        element.addEventListener(event, handler);
        instance._eventListeners.push({ element, event, handler });
      };
      
      return instance;
    };
    
    // Store component for framework use
    MinimaJS._components.set(componentName, ComponentWrapper);
    
    return ComponentWrapper;
  }

  /**
   * Enhanced template parser - converts template string to VNode with proper interpolation
   * @param {string} template - HTML template string with interpolations
   * @param {Object} state - Component state
   * @param {Object} props - Component props
   * @param {Object} instance - Component instance with methods
   * @returns {Object} VNode tree
   */
  function parseTemplate(template, state, props, instance) {
    if (!template || typeof template !== 'string') {
      return createTextVNode('');
    }

    // Create a context for template evaluation including component methods
    const context = { ...props, state: state };
    
    // Add component methods to context if instance is provided
    if (instance) {
      // Add all methods from the instance to the context
      for (const key in instance) {
        if (typeof instance[key] === 'function' && !key.startsWith('_') && !key.startsWith('on')) {
          context[key] = instance[key].bind(instance);
        }
      }
    }
    
    try {
      // Process template interpolations {{expression}}
      let processedTemplate = template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
        try {
          // Simple expression evaluation - supports dot notation
          const value = evaluateExpression(expression.trim(), context);
          return value !== null && value !== undefined ? String(value) : '';
        } catch (error) {
          console.warn(`MinimaJS Template: Error evaluating expression '${expression}':`, error);
          return match; // Return original if evaluation fails
        }
      });

      // Parse the processed template into VNode structure
      return parseHTMLToVNode(processedTemplate, context);
          } catch (error) {
        errorReporter.report('Template Parsing', error, { template, state, props });
        return createTextVNode(`[Template Error: ${error.message}]`);
      }
  }

  /**
   * Evaluates simple expressions in template context
   * @param {string} expression - Expression to evaluate
   * @param {Object} context - Available variables
   * @returns {*} Evaluated result
   */
  function evaluateExpression(expression, context) {
    // Handle simple property access (state.prop, props.prop)
    const parts = expression.split('.');
    let result = context;
    
    for (const part of parts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part];
      } else {
        return undefined;
      }
    }
    
    return result;
  }

  /**
   * Parses HTML string into VNode tree
   * @param {string} html - HTML string
   * @param {Object} context - Template context for event handlers
   * @returns {Object} VNode tree
   */
  function parseHTMLToVNode(html, context) {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();
    
    // Convert DOM to VNode tree
    if (tempDiv.children.length === 0) {
      // Text-only content
      return createTextVNode(tempDiv.textContent || '');
    } else if (tempDiv.children.length === 1) {
      // Single root element
      return domToVNode(tempDiv.children[0], context);
    } else {
      // Multiple root elements - use fragment
      const children = Array.from(tempDiv.children).map(child => domToVNode(child, context));
      return createFragmentVNode(children);
    }
  }

  /**
   * Converts DOM element to VNode
   * @param {Element} element - DOM element
   * @param {Object} context - Template context
   * @returns {Object} VNode
   */
  function domToVNode(element, context) {
    if (element.nodeType === Node.TEXT_NODE) {
      return createTextVNode(element.textContent || '');
    }
    
    if (element.nodeType !== Node.ELEMENT_NODE) {
      return createTextVNode('');
    }

    const tag = element.tagName.toLowerCase();
    const props = {};
    const children = [];

    // Extract attributes and convert to props
    for (const attr of element.attributes) {
      const name = attr.name;
      const value = attr.value;

      if (name.startsWith('@')) {
        // Event handler: @click="methodName" or @click="method()"
        const eventName = name.slice(1);
        const handlerName = value.replace(/\(\)$/, ''); // Remove () if present
        
        // Create event handler that calls method from context
        props[`on${eventName}`] = function(event) {
          if (context[handlerName] && typeof context[handlerName] === 'function') {
            context[handlerName](event);
          } else {
            console.warn(`MinimaJS Template: Event handler '${handlerName}' not found in context`);
          }
        };
      } else if (name === 'class') {
        props.className = value;
      } else {
        props[name] = value;
      }
    }

    // Convert child nodes
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          children.push(createTextVNode(text));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(domToVNode(child, context));
      }
    }

    return createVNode(tag, props, children);
  }

  // =========================================================================
  // GLOBAL STATE MANAGEMENT
  // =========================================================================

  /**
   * Creates or retrieves a global state store
   * @param {string} name - Store name
   * @param {Object} initialState - Initial state (only used if store doesn't exist)
   * @returns {Proxy} Global store object
   */
  function store(name, initialState) {
    if (typeof name !== 'string') {
      throw new Error('MinimaJS Store: Store name must be a string');
    }

    if (MinimaJS._globalStores.has(name)) {
      return MinimaJS._globalStores.get(name);
    }
    
    const globalStore = createState(initialState || {});
    MinimaJS._globalStores.set(name, globalStore);
    
    return globalStore;
  }

  /**
   * Subscribe to global state changes
   * @param {string} storeName - Name of the store
   * @param {string} key - State property to watch
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  function onGlobalStateChange(storeName, key, callback) {
    const globalStore = MinimaJS._globalStores.get(storeName);
    if (!globalStore) {
      throw new Error(`MinimaJS Store: Store '${storeName}' not found`);
    }
    
    return globalStore._subscribe((changedKey, newValue, oldValue) => {
      if (changedKey === key) {
        callback(newValue, oldValue);
      }
    });
  }

  // =========================================================================
  // ROUTER IMPLEMENTATION
  // =========================================================================

  const router = {
    _routes: [],
    _currentRoute: null,
    _container: null,
    _guards: {
      beforeEach: [],
      afterEach: []
    },
    
    /**
     * Initialize the router with routes and container
     * @param {Array} routes - Array of {path, component} objects
     * @param {Element} container - DOM element to render components into
     */
    init: function(routes, container = document.body) {
      if (!Array.isArray(routes)) {
        throw new Error('MinimaJS Router: routes must be an array');
      }
      
      this._routes = routes;
      this._container = container;
      
      // Set up event listeners
      window.addEventListener('popstate', () => this._handleRouteChange());
      document.addEventListener('click', (e) => this._handleLinkClick(e));
      
      // Handle initial route
      this._handleRouteChange();
    },
    
    /**
     * Navigate to a specific path
     * @param {string} path - The path to navigate to
     */
    navigate: function(path) {
      if (typeof path !== 'string') {
        throw new Error('MinimaJS Router: path must be a string');
      }
      
      // Update browser history
      history.pushState({}, '', path);
      
      // Trigger route change
      this._handleRouteChange();
    },
    
    /**
     * Get current route information
     * @returns {Object|null} Current route with params and query
     */
    getCurrentRoute: function() {
      return this._currentRoute;
    },

    /**
     * Add a navigation guard that runs before each route change
     * @param {Function} guard - Guard function (to, from, next)
     */
    beforeEach: function(guard) {
      if (typeof guard !== 'function') {
        throw new Error('MinimaJS Router: Guard must be a function');
      }
      this._guards.beforeEach.push(guard);
    },

    /**
     * Add a navigation guard that runs after each route change
     * @param {Function} guard - Guard function (to, from)
     */
    afterEach: function(guard) {
      if (typeof guard !== 'function') {
        throw new Error('MinimaJS Router: Guard must be a function');
      }
      this._guards.afterEach.push(guard);
    },
    
    // Private methods
    _handleRouteChange: function() {
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      const matchedRoute = this._matchRoute(currentPath);
      
      if (matchedRoute) {
        // Add query parameters to route
        matchedRoute.query = this._parseQueryString(currentSearch);
        
        // Execute navigation guards
        this._executeGuards(matchedRoute, this._currentRoute, (allowed) => {
          if (allowed !== false) {
            const previousRoute = this._currentRoute;
            this._currentRoute = matchedRoute;
            this._renderRoute(matchedRoute);
            
            // Execute after guards
            this._guards.afterEach.forEach(guard => {
              try {
                guard(matchedRoute, previousRoute);
              } catch (error) {
                console.error('MinimaJS Router: Error in afterEach guard:', error);
              }
            });
          }
        });
      } else {
        console.error(`MinimaJS Router: No route found for '${currentPath}'`);
        this._render404();
      }
    },
    
    _handleLinkClick: function(event) {
      const target = event.target.closest('a');
      
      if (target && target.href) {
        const url = new URL(target.href);
        
        // Check if it's an internal link (same origin)
        if (url.origin === window.location.origin) {
          event.preventDefault();
          this.navigate(url.pathname);
        }
      }
    },
    
    _matchRoute: function(path) {
      for (const route of this._routes) {
        const match = this._pathMatches(route.path, path);
        if (match) {
          return {
            path: route.path,
            component: route.component,
            params: match.params,
            actualPath: path
          };
        }
      }
      return null;
    },
    
    _pathMatches: function(routePath, actualPath) {
      // Handle exact matches first
      if (routePath === actualPath) {
        return { params: {} };
      }
      
      // Handle dynamic parameters (:param)
      const paramNames = [];
      const regexPattern = routePath.replace(/:([^/]+)/g, (match, paramName) => {
        paramNames.push(paramName);
        return '([^/]+)';
      });
      
      const regex = new RegExp(`^${regexPattern}$`);
      const match = actualPath.match(regex);
      
      if (match) {
        const params = {};
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { params };
      }
      
      return null;
    },
    
    _renderRoute: function(route) {
      try {
        // Create component instance
        const component = route.component;
        
        if (typeof component !== 'function') {
          throw new Error(`MinimaJS Router: Route component must be a function`);
        }
        
        // Pass route params as props
        const componentInstance = component({ 
          ...route.params,
          _route: route 
        });
        
        // Render component into container
        MinimaJS.render(componentInstance, this._container);
        
      } catch (error) {
        console.error('MinimaJS Router: Error rendering route:', error);
        this._render404();
      }
    },
    
    _render404: function() {
      this._container.innerHTML = `
        <div class="minima-404">
          <h1>404 - Page Not Found</h1>
          <p>The requested page could not be found.</p>
          <a href="/">Go Home</a>
        </div>
      `;
    },

    /**
     * Parses URL query string into object
     * @param {string} search - URL search string (e.g., "?foo=bar&baz=qux")
     * @returns {Object} Parsed query parameters
     */
    _parseQueryString: function(search) {
      const query = {};
      if (!search || search.length <= 1) return query;
      
      const params = search.slice(1).split('&');
      params.forEach(param => {
        const [key, value] = param.split('=').map(decodeURIComponent);
        if (key) {
          query[key] = value || '';
        }
      });
      
      return query;
    },

    /**
     * Executes navigation guards before route change
     * @param {Object} to - Target route
     * @param {Object} from - Current route
     * @param {Function} callback - Callback with guard result
     */
    _executeGuards: function(to, from, callback) {
      if (this._guards.beforeEach.length === 0) {
        callback(true);
        return;
      }
      
      let guardIndex = 0;
      const executeNextGuard = (allowed = true) => {
        if (allowed === false || guardIndex >= this._guards.beforeEach.length) {
          callback(allowed);
          return;
        }
        
        const guard = this._guards.beforeEach[guardIndex++];
        try {
          // Guard can call next() to continue, next(false) to abort, or next('/path') to redirect
          guard(to, from, (result) => {
            if (typeof result === 'string') {
              // Redirect to different path
              this.navigate(result);
              callback(false);
            } else {
              executeNextGuard(result);
            }
          });
        } catch (error) {
          console.error('MinimaJS Router: Error in beforeEach guard:', error);
          callback(false);
        }
      };
      
      executeNextGuard();
    }
  };

  // =========================================================================
  // MAIN RENDER FUNCTION
  // =========================================================================

  /**
   * Renders a component into a DOM container
   * @param {Function|Object} component - Component function or instance
   * @param {Element} container - DOM element to render into
   */
  function render(component, container) {
    if (!container || !container.nodeType) {
      throw new Error('MinimaJS Render: Container must be a DOM element');
    }

    let componentInstance;
    
    if (typeof component === 'function') {
      // Create component instance
      componentInstance = component({});
    } else if (component && typeof component === 'object') {
      // Already an instance
      componentInstance = component;
    } else {
      throw new Error('MinimaJS Render: Component must be a function or object');
    }

    if (componentInstance._vnode) {
      // Create DOM from VNode
      const element = createElement(componentInstance._vnode);
      
      // Clear container and append new content
      container.innerHTML = '';
      container.appendChild(element);
      
      // Call onInit if not already initialized
      if (!componentInstance._isInitialized && componentInstance.onInit) {
        try {
          componentInstance.onInit();
          componentInstance._isInitialized = true;
        } catch (error) {
          console.error('MinimaJS Render: Error in component onInit:', error);
        }
      }
    }
  }

  // =========================================================================
  // GLOBAL API EXPOSURE
  // =========================================================================

  // Component memoization cache
  const componentCache = new Map();

  /**
   * Memoized component wrapper for performance optimization
   * @param {Function} component - Component function
   * @param {Object} props - Component props
   * @returns {Object} Cached or new component instance
   */
  function memoizeComponent(component, props) {
    const propsKey = JSON.stringify(props || {});
    const cacheKey = `${component.name || 'anonymous'}_${propsKey}`;
    
    if (componentCache.has(cacheKey)) {
      const cached = componentCache.get(cacheKey);
      
      // Check if props changed significantly
      if (shallowEqual(cached.props, props)) {
        return cached.instance;
      }
    }
    
    // Create new instance
    const instance = component(props);
    componentCache.set(cacheKey, { props, instance });
    
    // Limit cache size to prevent memory leaks
    if (componentCache.size > 100) {
      const firstKey = componentCache.keys().next().value;
      componentCache.delete(firstKey);
    }
    
    return instance;
  }

  /**
   * Shallow equality check for props comparison
   * @param {Object} obj1 - First object
   * @param {Object} obj2 - Second object
   * @returns {boolean} True if shallowly equal
   */
  function shallowEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }
    
    return true;
  }

  // Create global MinimaJS object
  window.MinimaJS = {
    // Core VirtualDOM functions
    createElement: createVNode,
    render: render,
    
    // Component system
    defineComponent: defineComponent,
    memo: memoizeComponent, // New memoization utility
    
    // State management  
    createState: createState,
    store: store,
    onGlobalStateChange: onGlobalStateChange,
    
    // Router
    router: router,
    
    // Utilities
    batchUpdates: (callback) => batchSystem.schedule(callback),
    createFragment: createFragmentVNode, // Expose fragment creation
    
    // Internal storage (DO NOT expose publicly)
    _components: new Map(),
    _globalStores: new Map(),
    _subscribers: new Map(),
    _vnodeCache: new Map(),
    _componentCache: componentCache
  };

  // Expose some internal functions for development
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
    MinimaJS._internal = {
      createTextVNode,
      createFragmentVNode,
      diff,
      parseTemplate
    };
  }

})();