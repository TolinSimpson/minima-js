# MinimaJS AI Implementation Summary 🤖

**OPTIMIZED FOR CLAUDE-4-SONNET CODING**

This document provides a complete implementation roadmap for building MinimaJS from scratch, optimized for AI development. All patterns, functions, and data structures are precisely specified for direct code generation.

## 📋 Implementation Order & Dependencies

### Phase 1: Core Foundation (REQUIRED FIRST)
1. **Virtual DOM** (`minima.js` lines 1-100)
2. **Component System** (`minima.js` lines 101-200) 
3. **Reactive State** (`minima.js` lines 201-250)

### Phase 2: Framework Features  
4. **Router Implementation** (`minima.js` lines 251-350)
5. **Main Render System** (`minima.js` lines 351-400)

### Phase 3: Development Tools
6. **Type Checking** (`minima.dev.js` - complete file)
7. **Development Server** (`start-dev.js` - complete file)

---

## 🏗️ Exact File Structure

```
MinimaJS/
├── src/
│   ├── minima.js              # Production core (~400 lines, <5KB)
│   ├── minima.dev.js          # Development enhancements (~200 lines)
│   └── start-dev.js           # Development server (~340 lines)
├── examples/
│   ├── index.html             # Basic example
│   ├── todo-app.html          # Todo application demo
│   └── components-demo.html   # Component showcase
└── package.json               # NPM configuration
```

---

## 🎯 Core API Specification

### Global MinimaJS Object
```javascript
// EXACT API structure - implement in minima.js
window.MinimaJS = {
  // Core VirtualDOM functions
  createElement: function(tag, props, children) {},
  render: function(component, container) {},
  
  // Component system
  defineComponent: function(componentFn) {},
  
  // State management  
  createState: function(initialState) {},
  store: function(name, initialState) {},
  onGlobalStateChange: function(storeName, key, callback) {},
  
  // Router
  router: {
    init: function(routes, container) {},
    navigate: function(path) {},
    getCurrentRoute: function() {},
    _routes: [],
    _currentRoute: null,
    _container: null
  },
  
  // Internal storage (DO NOT expose publicly)
  _components: new Map(),
  _globalStores: new Map(),
  _subscribers: new Map(),
  _vnodeCache: new Map()
};
```

---

## 🔧 Key Implementation Patterns

### 1. VNode Structure (EXACT FORMAT)
```javascript
// All VNodes must follow this exact structure
const VNode = {
  tag: 'string|null',          // HTML tag name or null for text
  props: {},                   // Attributes and event handlers
  children: [],                // Array of child VNodes or strings
  _key: 'string|null',         // Unique identifier for diffing
  _dom: 'Element|null',        // Reference to actual DOM element
  _type: 'element|text|fragment', // Node type identifier
  text: 'string|undefined'     // Text content (only for text nodes)
};
```

### 2. Component Function Signature (EXACT PATTERN)
```javascript
// All components MUST follow this exact pattern
const MyComponent = function(props) {
  // 'this' context automatically provided by framework
  // Available: this.state, this.onInit, this.onUpdate
  
  this.onInit = function() {
    // Lifecycle hook - called once on mount
  };
  
  this.onUpdate = function() {
    // Lifecycle hook - called on state/prop changes
  };
  
  // Component logic here
  
  return `<div>${props.title}</div>`; // MUST return template string
};
```

### 3. State Reactivity (EXACT PROXY PATTERN)
```javascript
// Reactive state implementation using Proxy
MinimaJS.createState = function(initialState = {}) {
  const subscribers = new Set();
  
  return new Proxy(initialState, {
    set(target, property, value) {
      const oldValue = target[property];
      target[property] = value;
      
      if (oldValue !== value) {
        subscribers.forEach(callback => callback(property, value, oldValue));
      }
      return true;
    },
    
    get(target, property) {
      if (property === '_subscribe') {
        return (callback) => {
          subscribers.add(callback);
          return () => subscribers.delete(callback);
        };
      }
      return target[property];
    }
  });
};
```

---

## 📏 Bundle Size Requirements

### minima.js (Production)
- **Target**: Exactly under 5KB minified + gzipped
- **Line limit**: ~400 lines maximum
- **Features**: VirtualDOM, Components, State, Router, Render
- **NO dev tools**: No type checking, no debugging features

### minima.dev.js (Development) 
- **Size**: Unlimited (not included in production)
- **Features**: Type validation, enhanced error messages, debugging tools
- **Dependencies**: Extends minima.js functionality

### start-dev.js (Development Server)
- **Size**: Unlimited (Node.js only)
- **Dependencies**: Node.js built-in modules only
- **Features**: HTTP server, WebSocket, file watching, hot reload

---

## ⚡ Performance Requirements

### DOM Operations
```javascript
// Batch all DOM updates using requestAnimationFrame
function batchDOMUpdates(updates) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}
```

### Event Delegation
```javascript
// Use single event listener at document level
document.addEventListener('click', function(event) {
  // Delegate to component handlers
  handleComponentEvent(event);
});
```

### Memory Management
```javascript
// Clean up references to prevent memory leaks
function cleanup(component) {
  component._subscriptions.forEach(unsub => unsub());
  component._subscriptions = [];
  component._element = null;
  component._vnode = null;
}
```

---

## 🧪 Error Handling Standards

### Error Message Format
```javascript
// All errors must follow this exact format
throw new Error('MinimaJS [Module]: Specific error description');

// Examples:
throw new Error('MinimaJS Component: Component must be a function');
throw new Error('MinimaJS Router: No route found for path "/invalid"');
throw new Error('MinimaJS VirtualDOM: Invalid VNode structure');
```

### Validation Patterns
```javascript
// Input validation for all public functions
function validateInput(value, expectedType, functionName) {
  if (typeof value !== expectedType) {
    throw new Error(`MinimaJS ${functionName}: Expected ${expectedType}, got ${typeof value}`);
  }
}
```

---

## 📚 Development Workflow

### 1. Create Basic Structure
```bash
mkdir MinimaJS && cd MinimaJS
mkdir src examples
touch src/minima.js src/minima.dev.js src/start-dev.js
touch examples/index.html package.json
```

### 2. Implementation Order
1. Start with VNode creation functions
2. Implement diffing algorithm  
3. Add component system
4. Create reactive state with Proxy
5. Build router with History API
6. Add development enhancements
7. Create development server

### 3. Testing Strategy
```javascript
// Test each feature independently
const testCases = [
  {
    name: 'VNode creation',
    input: ['div', {class: 'test'}, ['Hello']],
    expected: {tag: 'div', props: {class: 'test'}, children: ['Hello']}
  },
  {
    name: 'Component rendering',
    component: TestComponent,
    props: {title: 'Test'},
    expected: '<div>Test</div>'
  }
];
```

---

## 🎨 Example Implementation Files

### Basic HTML Template
```html
<!DOCTYPE html>
<html>
<head>
  <title>MinimaJS Example</title>
</head>
<body>
  <div id="app"></div>
  
  <script src="src/minima.js"></script>
  <script src="src/minima.dev.js"></script>
  
  <script>
    // Example component
    const App = MinimaJS.defineComponent(function(props) {
      this.state = MinimaJS.createState({ count: 0 });
      
      const increment = () => {
        this.state.count++;
      };
      
      return `
        <div>
          <h1>Count: ${this.state.count}</h1>
          <button onclick="increment()">Click me</button>
        </div>
      `;
    });
    
    // Render application
    MinimaJS.render(App, document.getElementById('app'));
  </script>
</body>
</html>
```

This implementation guide provides all the exact specifications needed for Claude-4-Sonnet to build a complete, functional MinimaJS framework. Each section includes precise code patterns, data structures, and requirements for direct AI implementation.