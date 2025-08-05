# Component Architecture Implementation Guide 🧱

**OPTIMIZED FOR CLAUDE-4-SONNET CODING**

This document provides exact implementation specifications for the component system in MinimaJS. All patterns are designed for direct AI implementation with precise function signatures and data structures.

-----

### 1\. Introduction

MinimaJS embraces a **component-based architecture** as its fundamental building block for user interfaces. This approach promotes modularity, reusability, and easier maintenance by breaking down complex UIs into smaller, self-contained units. In MinimaJS, components are designed to be lightweight and efficient, aligning with the framework's overall goal of minimalism and universal browser compatibility.

-----

### 2\. Core Concepts

At its heart, a MinimaJS component is a **plain JavaScript function** that defines a piece of the UI and its associated logic. These functions return a template string, which the framework then uses to render and manage the corresponding DOM elements.

-----

### 3\. Component Definition - EXACT IMPLEMENTATION

#### Component Function Signature
```javascript
// EXACT pattern - all components MUST follow this signature
const MyComponent = function(props) {
  // 'this' context is automatically bound by MinimaJS.defineComponent()
  // Available properties on 'this':
  // - this.state: reactive state object (Proxy)
  // - this.onInit: lifecycle hook function
  // - this.onUpdate: lifecycle hook function
  // - this._isInitialized: boolean (internal)
  // - this._element: DOM element reference (internal)
  
  // Define lifecycle hooks
  this.onInit = function() {
    // Called once when component is first mounted
    console.log('Component initialized');
  };
  
  this.onUpdate = function() {
    // Called when state or props change
    console.log('Component updated');
  };
  
  // Define event handlers
  const handleClick = () => {
    this.state.count = (this.state.count || 0) + 1;
  };
  
  // MUST return template string
  return `
    <div class="my-component">
      <h2>${props.title}</h2>
      <p>Count: ${this.state.count || 0}</p>
      <button onclick="handleClick()">Click me</button>
    </div>
  `;
};
```

#### Component Registration System
```javascript
// EXACT implementation for MinimaJS.defineComponent()
MinimaJS.defineComponent = function(componentFn) {
  if (typeof componentFn !== 'function') {
    throw new Error('MinimaJS: defineComponent expects a function');
  }
  
  const componentName = componentFn.name || `AnonymousComponent_${Date.now()}`;
  
  // Create enhanced component wrapper
  const ComponentWrapper = function(props = {}) {
    // Create component instance with framework-managed state
    const instance = {
      state: MinimaJS.createState({}),
      onInit: function() {},
      onUpdate: function() {},
      _isInitialized: false,
      _element: null,
      _vnode: null,
      _subscriptions: []
    };
    
    // Bind the original component function to the instance
    const boundComponent = componentFn.bind(instance);
    
    // Execute component function to get template
    const template = boundComponent(props);
    
    if (typeof template !== 'string') {
      throw new Error(`MinimaJS: Component '${componentName}' must return a string template`);
    }
    
    // Store instance for lifecycle management
    instance._template = template;
    instance._props = props;
    
    return instance;
  };
  
  // Store component for framework use
  MinimaJS._components.set(componentName, ComponentWrapper);
  
  return ComponentWrapper;
};
```

#### Template Parsing Engine
```javascript
// EXACT template parser implementation
function parseTemplate(template, state, props) {
  // Replace state variables: ${this.state.variableName}
  template = template.replace(/\$\{this\.state\.(\w+)\}/g, (match, varName) => {
    return state[varName] !== undefined ? String(state[varName]) : '';
  });
  
  // Replace props variables: ${props.variableName}
  template = template.replace(/\$\{props\.(\w+)\}/g, (match, varName) => {
    return props[varName] !== undefined ? String(props[varName]) : '';
  });
  
  // Replace method calls: ${this.methodName()}
  template = template.replace(/\$\{this\.(\w+)\(\)\}/g, (match, methodName) => {
    // This would need access to the component instance methods
    return `[Method: ${methodName}]`; // Placeholder for now
  });
  
  return template;
}
```

-----

### 4\. Templating and Interpolation

MinimaJS will use a straightforward interpolation syntax within template strings to embed dynamic data.

  * **Basic Interpolation**: Data from `props` or `state` will be injected directly into the template using `${}` syntax, similar to native JavaScript template literals.
  * **Event Handling**: Event listeners (e.g., `onclick`, `oninput`) will be defined directly in the template, with their handlers referencing methods available within the component's scope. The framework will handle event delegation efficiently to minimize direct DOM listener attachments.

-----

### 5\. Component Lifecycle

To maintain a minimal footprint, MinimaJS will offer a very small, essential set of **lifecycle hooks**. These hooks allow developers to execute code at specific points in a component's existence.

  * `onInit()`: Called once when the component is first created and mounted to the DOM. Ideal for initial setup, fetching data, or setting up non-DOM-related listeners.
  * `onUpdate()`: Called whenever the component's internal state or its received props change, leading to a re-render. Useful for reacting to data changes or performing DOM updates that require direct manipulation.

-----

### 6\. Component Rendering

The MinimaJS renderer is responsible for efficiently translating component definitions into actual DOM elements.

  * **Initial Render**: When the application starts, the root component is rendered, and its template string is converted into a virtual DOM tree. This tree is then used to create the initial real DOM structure.
  * **Re-rendering**: Upon state or prop changes, the component's `render()` method is called again, generating a new virtual DOM tree. The framework's **diffing algorithm** (as described in the Virtual DOM section) then compares this new tree with the previous one, identifying only the necessary changes to update the real DOM. This targeted updating is crucial for performance.
  * **Direct DOM Manipulation**: The framework will use efficient, low-level DOM APIs (`innerHTML` for large content blocks, `setAttribute` for attributes, `appendChild`/`removeChild` for structural changes) to apply updates, avoiding heavy abstraction layers.

-----

### 7\. Props and Communication

Components communicate with each other through **props** (properties).

  * **Unidirectional Data Flow**: Data flows from parent components to child components via props. This makes data flow predictable and easier to debug.
  * **Prop Definition**: Props are passed as arguments to the component function.
  * **Event Emission**: For child-to-parent communication, components will emit custom events (e.g., using `CustomEvent` and `dispatchEvent`), which parent components can listen for.

-----

### 8\. Internal State

Each component can manage its own **reactive internal state**.

  * **`this.state` Object**: Components will have a `this.state` object (managed by the framework's reactivity system using `Proxy`).
  * **Reactive Updates**: Any modification to `this.state` will automatically trigger the component's `onUpdate()` lifecycle hook and a re-render, ensuring the UI reflects the latest data.

-----

### 9\. Dev-Mode Enhancements (`minima.dev.js`)

The `minima.dev.js` file significantly enhances the component development experience without bloating the production bundle.

  * **Prop Schema Validation**: In development mode, `MinimaJS.defineComponent()` will validate incoming `props` against a defined schema (e.g., `props: { label: String, isActive: Boolean }`). If types don't match, a clear console error will be displayed. This helps catch common bugs early.
  * **Lifecycle Hook Warnings**: `minima.dev.js` can provide warnings or suggestions related to improper use of lifecycle hooks or potential performance pitfalls.
  * **Component Debugging Tools**: Future enhancements could include in-browser visual debugging tools for inspecting component trees and state, available only in development.