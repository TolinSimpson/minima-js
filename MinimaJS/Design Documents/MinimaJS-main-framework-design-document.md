# MinimaJS Framework - AI Implementation Guide

**OPTIMIZED FOR CLAUDE-4-SONNET CODING**

This design document provides explicit implementation specifications for building the MinimaJS framework. Each section includes exact code patterns, data structures, and implementation requirements optimized for AI development.

## 1. Introduction & Core Architecture

**MinimaJS** is an ultra-minimalist JavaScript framework (~5KB) with these exact specifications:

### Global Object Structure
```javascript
// EXACT API - Implement exactly as specified
window.MinimaJS = {
  // Core rendering functions
  render: function(component, container) {},
  createElement: function(tag, props, children) {},
  
  // Component system
  defineComponent: function(componentFn) {},
  
  // State management
  createState: function(initialState) {},
  store: function(name, initialState) {},
  onGlobalStateChange: function(storeName, key, callback) {},
  
  // Router
  router: {
    init: function(routes) {},
    navigate: function(path) {},
    getCurrentRoute: function() {},
    _routes: [],
    _currentRoute: null
  },
  
  // Internal properties (DO NOT expose to users)
  _components: new Map(),
  _globalStores: new Map(),
  _subscribers: new Map()
};
```

### Browser Compatibility Requirements
- **ES6 Baseline**: Proxy, template literals, arrow functions, destructuring
- **DOM APIs**: querySelector, addEventListener, History API
- **NO dependencies**: Zero external libraries

***

## 2. Implementation Principles

### Code Organization Rules
1. **Single File Structure**: All core functionality in `minima.js` (~300-400 lines)
2. **IIFE Pattern**: Wrap everything in `(function() { ... })()`
3. **No Classes**: Use factory functions and closures only
4. **Explicit Error Handling**: Every function must handle edge cases

### Performance Requirements
- **Bundle Size**: Exactly under 5KB minified+gzipped
- **Memory Usage**: Minimal object allocation in hot paths
- **DOM Operations**: Batch all DOM updates

### Browser Support Matrix
```javascript
// Required feature detection (implement these checks)
const REQUIRED_FEATURES = {
  proxy: typeof Proxy !== 'undefined',
  historyAPI: !!(window.history && window.history.pushState),
  templateLiterals: true, // ES6 baseline
  destructuring: true,    // ES6 baseline
  arrowFunctions: true    // ES6 baseline
};
```

***

## 3. Core Feature Specifications

### 3.1. Component Architecture - EXACT IMPLEMENTATION

#### Component Function Signature
```javascript
// EXACT pattern - all components must follow this
const MyComponent = function(props) {
  // 'this' context provided by framework
  // this.state - reactive state object
  // this.onInit - lifecycle hook
  // this.onUpdate - lifecycle hook
  
  return `<div>${props.title}</div>`; // MUST return template string
};
```

#### Component Registration
```javascript
// EXACT implementation in minima.js
MinimaJS.defineComponent = function(componentFn) {
  const componentId = componentFn.name || `Component_${Date.now()}`;
  
  // Validate component function
  if (typeof componentFn !== 'function') {
    throw new Error('MinimaJS: Component must be a function');
  }
  
  // Create component wrapper with state and lifecycle
  const wrappedComponent = function(props = {}) {
    const componentInstance = {
      state: MinimaJS.createState({}),
      onInit: function() {},
      onUpdate: function() {},
      _isInitialized: false,
      _element: null
    };
    
    // Bind component function to instance
    const boundFn = componentFn.bind(componentInstance);
    return boundFn(props);
  };
  
  MinimaJS._components.set(componentId, wrappedComponent);
  return wrappedComponent;
};
```

#### Template Parsing Rules
```javascript
// Template interpolation patterns to support
const TEMPLATE_PATTERNS = {
  stateVariable: /\$\{this\.state\.(\w+)\}/g,
  propsVariable: /\$\{props\.(\w+)\}/g,
  methodCall: /\$\{this\.(\w+)\(\)\}/g,
  eventHandler: /on(\w+)="this\.(\w+)\(\)"/g
};
```

***

### 3.2. Data Binding and State Management 🔄

MinimaJS will use a reactive data binding system to keep the UI in sync with the application's state.

-   **Proxy-based Reactivity**: The framework will utilize the native **Proxy** object to detect changes to a component's `state` object. Since `Proxy` is a universal ES6 feature, it's a perfect fit for our "browser universalism" principle.
-   **Global State**: A simple, pub/sub (publish/subscribe) pattern will be used for global state management. Developers can create a central state object and components can subscribe to changes, triggering a re-render only when the relevant data updates.

***

### 3.3. Virtual DOM and Performance 🚀

The Virtual DOM is the key to MinimaJS's performance.

-   **Lightweight Virtual DOM**: The VDOM will be a plain JavaScript object tree. The diffing algorithm will be highly optimized to compare these trees and apply changes to the real DOM with minimal overhead.
-   **Direct DOM Manipulation**: Instead of complex patch operations, the diffing algorithm will identify which parts of the DOM need to be updated and perform targeted, low-level changes using standard DOM APIs like `innerHTML` and `setAttribute`. This reduces the complexity of the core codebase.

***

### 3.4. Routing and SPAs 🗺️

MinimaJS will feature a built-in router for creating Single-Page Applications.

-   **Universal History API**: The router will use the browser's **History API** (`pushState`, `popState`) for managing URL changes without full page reloads. This API is supported by all modern browsers.
-   **Component Mapping**: Routes will be simple configurations that map URL paths to specific components.

***

### 3.5. Runtime Type-Checking 🧪

To address the need for type-safety without a separate build step, MinimaJS will include a simple runtime type-checking mechanism.

-   **JSDoc and Type Inference**: The framework's core code will be heavily documented with **JSDoc** comments. Developers can also use JSDoc in their component files. This provides powerful type-hinting and autocompletion in code editors like VS Code, without any compilation. 
-   **Assert Function**: A global `assert` function will be provided to perform explicit type checks at runtime. This function will take a value and a type definition (e.g., `assert(data, { id: 'number', name: 'string' })`). If the value does not match the expected type, it will throw a descriptive error. This allows developers to enforce data contracts, especially for data coming from external APIs, and catch errors early.

***

## 4. Technical Specifications

-   **Language**: ES6+ JavaScript. All language features must have near-universal browser support.
-   **Bundle Size Goal**: The core library's target size remains under 5KB (minified and gzipped).
-   **No Dependencies**: The framework will not have any external dependencies.
-   **Browser Support**: The framework is designed to work out-of-the-box with all major modern browsers, relying on the **ECMAScript 2015 (ES6)** standard as its baseline.