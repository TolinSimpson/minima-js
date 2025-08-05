## Design Document: Data Binding and State Management in MinimaJS 🔄

This document details the design for data binding and state management within MinimaJS, focusing on a reactive, efficient, and minimalist approach that leverages native JavaScript features for universal browser compatibility.

-----

### 1\. Introduction

Effective data binding and state management are crucial for building dynamic and interactive web applications. MinimaJS aims to provide a robust yet extremely lightweight solution for these concerns. By utilizing JavaScript's native `Proxy` object, MinimaJS ensures that changes to application data automatically and efficiently reflect in the user interface, without the need for complex boilerplate or external libraries.

-----

### 2\. Core Concepts

MinimaJS's data binding and state management revolve around two primary concepts:

  * **Reactivity**: The ability for the UI to automatically update when the underlying data changes.
  * **State**: The data that drives a component's or the application's behavior and appearance.

-----

### 3\. Component-Level State

Each MinimaJS component will manage its own encapsulated, reactive state.

#### 3.1. `this.state` Object

  * **Initialization**: When a component is initialized, MinimaJS will create a special `this.state` object for it. This object will be a **Proxy** around a plain JavaScript object provided by the developer.
  * **Reactive Properties**: Any property accessed or modified on `this.state` will be tracked by the framework. When a property's value changes, the `Proxy` automatically intercepts the change.
  * **Automatic Re-render**: Upon detection of a state change, the framework will automatically trigger the component's `onUpdate()` lifecycle hook and initiate a re-render cycle for that specific component and any of its child components that depend on the changed state. This ensures the UI is always in sync with the data.

#### 3.2. State Updates

Developers will update component state by directly assigning new values to properties on the `this.state` object:

```javascript
// Inside a MinimaJS component function
const MyCounter = (props) => {
  // Initial state (proxied by the framework)
  this.state = { count: 0 };

  const increment = () => {
    this.state.count++; // Direct modification, intercepted by Proxy
  };

  return `<button onclick="this.increment()">Count: ${this.state.count}</button>`;
};
```

-----

### 4\. Global State Management

For sharing data across multiple components that are not in a direct parent-child relationship, MinimaJS will provide a simple, built-in global state mechanism based on the **Publish-Subscribe (Pub/Sub) pattern**.

#### 4.1. `MinimaJS.store()`

  * **Centralized Store**: Developers can define a global store using `MinimaJS.store('storeName', initialState)`. This creates a single, reactive source of truth for application-wide data.
  * **Reactivity**: Similar to component state, the global store's object will also be a `Proxy`, making its properties reactive.
  * **Subscription**: Components that need access to global state can subscribe to specific parts of the store. When a subscribed piece of data changes, only the relevant components will be notified and re-rendered.

#### 4.2. Pub/Sub Mechanism

  * **Publishers**: When a property in the global store changes, the store acts as a "publisher," notifying all "subscribers" interested in that specific data.
  * **Subscribers**: Components can register themselves as "subscribers" to specific global state properties. This ensures that only components affected by a change are re-rendered, optimizing performance.

<!-- end list -->

```javascript
// Example Global Store Definition (in a separate file)
MinimaJS.store('settings', { theme: 'light', user: null });

// Inside a component subscribing to global state
const ThemeChanger = () => {
  const toggleTheme = () => {
    const currentTheme = MinimaJS.store('settings').theme;
    MinimaJS.store('settings').theme = currentTheme === 'light' ? 'dark' : 'light';
  };

  // Subscribe to theme changes
  MinimaJS.onGlobalStateChange('settings', 'theme', () => {
    // This callback will run when 'theme' changes in the 'settings' store
    this.reRender(); // Trigger component re-render
  });

  return `<button onclick="this.toggleTheme()">Toggle Theme: ${MinimaJS.store('settings').theme}</button>`;
};
```

-----

### 5\. Data Flow and Immutability (Guidance)

While MinimaJS allows direct state modification for simplicity, developers will be encouraged to adopt practices that promote predictable data flow:

  * **Unidirectional Flow**: Data primarily flows downwards from parent to child components via props.
  * **Shallow Immutability**: For complex objects or arrays within state, developers will be advised to create new copies when modifying them (e.g., `this.state.items = [...this.state.items, newItem]`) rather than mutating them directly. This helps the `Proxy` system detect changes more reliably and simplifies debugging.

-----

### 6\. Dev-Mode Enhancements (`minima.dev.js`)

The development-only file will provide crucial insights into state management.

  * **State Inspection**: `minima.dev.js` can expose a global object or function to allow developers to inspect the current state of any component or the global store directly in the browser's console.
  * **State Change Logging**: In development mode, every state change (both component and global) can be logged to the console, showing the old and new values, and which component triggered the change. This is invaluable for debugging reactivity issues.
  * **Performance Warnings**: `minima.dev.js` could detect and warn about excessive or unnecessary state updates that might impact performance.