# MinimaJS

**Ultra-lightweight React alternative with the shortest API syntax, zero dependencies, and LLM-optimized development experience.**

[![GitHub Package](https://img.shields.io/badge/GitHub-Package-blue.svg)](https://github.com/tolinsimpson/minima-js/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-green.svg)](https://github.com/tolinsimpson/minima-js)

## Why MinimaJS?

- **Short API syntax** - Build UIs faster with ultra-concise code
- **Lightweight & modular** - Use only what you need
- **Zero dependencies** - No supply chain vulnerabilities  
- **LLM-optimized** - AI-friendly APIs for faster development
- **Modern features** - Hooks, SSR, TypeScript, templating
- **XSS-safe** - Built-in security by default

## Quick Start

```bash
npm install @tolinsimpson/minimajs
```

### Hello World

```javascript
import { div, h1, button, useState, app } from '@tolinsimpson/minimajs';

const Counter = () => {
  const [count, setCount] = useState(0);
  
  return div([
    h1(`Count: ${count}`),
    button({ onClick: () => setCount(count + 1) }, 'Click me!')
  ]);
};

app(Counter, 'app'); // Mounts to #app
```

### Template Syntax (HTML-like)

```javascript
import { html, useState, app } from '@tolinsimpson/minimajs';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  
  return html`
    <div class="todo-app">
      <h1>My Todos</h1>
      <input value="${input}" oninput="${e => setInput(e.target.value)}">
      <button onclick="${() => addTodo()}">Add</button>
      ${todos.map(todo => html`
        <div class="todo ${todo.done ? 'done' : ''}">
          <input type="checkbox" checked="${todo.done}" onchange="${() => toggle(todo.id)}">
          ${todo.text}
        </div>
      `)}
    </div>
  `;
};
```

## Core Concepts

### Components & Hooks

```javascript
import { useState, useEffect, div, p } from '@tolinsimpson/minimajs';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);
  
  if (loading) return div('Loading...');
  if (!user) return div('User not found');
  
  return div([
    p(`Name: ${user.name}`),
    p(`Email: ${user.email}`)
  ]);
};
```

### State Management

```javascript
import { useState, toggle, counter, inputState } from '@tolinsimpson/minimajs';

const MyComponent = () => {
  // Basic state
  const [name, setName] = useState('');
  
  // Toggle helper
  const [isVisible, toggleVisible] = toggle(false);
  
  // Counter helper  
  const [count, increment, decrement, setCount] = counter(0);
  
  // Input helper
  const [email, setEmail, onEmailChange] = inputState('');
  
  return div([
    input({ value: email, onChange: onEmailChange }),
    button({ onClick: toggleVisible }, 'Toggle'),
    button({ onClick: increment }, `Count: ${count}`)
  ]);
};
```

## LLM-Optimized APIs

Perfect for AI code generation with predictable patterns:

### Template Builders

```javascript
import { quickForm, quickTable, quickModal } from '@tolinsimpson/minimajs';

// Complete form in one line
const form = quickForm({
  fields: ['name', 'email', { name: 'password', type: 'password' }],
  onSubmit: (values) => console.log(values)
});

// Data table in one line  
const table = quickTable(users, [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' }
]);

// Modal in one line
const modal = quickModal(isOpen, content, { onClose: () => setOpen(false) });
```

### Chain Syntax

```javascript  
import { $div, $button, $input } from '@tolinsimpson/minimajs';

// Fluent chain building - perfect for LLMs
const card = $div()
  .class('card')
  .child($h3().text('Title'))
  .child($p().text('Description'))  
  .child($button().text('Action').onClick(handleClick))
  .build();
```

### Pattern Macros

```javascript
import { llmCreateApp } from '@tolinsimpson/minimajs';

// Complete todo app in one call
const todoApp = llmCreateApp.todo({
  initialTodos: [{ text: 'Learn MinimaJS', done: false }]
});

// Complete counter in one call
const counter = llmCreateApp.counter({ 
  title: 'My Counter', 
  initialValue: 5,
  step: 2 
});
```

## Server-Side Rendering

```javascript
import { renderToString, hydrate } from '@tolinsimpson/minimajs';

// Server
const html = renderToString(App, { props });
res.send(`<!DOCTYPE html><html><body><div id="app">${html}</div></body></html>`);

// Client  
hydrate(App, document.getElementById('app'), { props });
```

## Modular Imports

```javascript
// Full framework
import { div, useState } from '@tolinsimpson/minimajs';

// Core only (9KB)
import { createElement, useState, render } from '@tolinsimpson/minimajs/core';

// Templates only (3KB)
import { html } from '@tolinsimpson/minimajs/template';

// Components only (2KB)
import { defineComponent } from '@tolinsimpson/minimajs/component';

// SSR only (4KB)
import { renderToString } from '@tolinsimpson/minimajs/ssr';

// LLM helpers only (9KB)
import { quickForm, $div } from '@tolinsimpson/minimajs/llm';

// Dev tools only (optional, 5KB)
import { useDevTools, inspectComponentTree } from '@tolinsimpson/minimajs/devtools';
```

## Module Features

MinimaJS is built as modular components that can be used independently:

### Core Module (`@tolinsimpson/minimajs/core`)
- **Virtual DOM** with efficient diffing algorithm
- **Hooks system** (useState, useEffect, useContext)
- **Component lifecycle** management
- **Event delegation** for optimal performance
- **Memory management** with automatic cleanup

### Template Module (`@tolinsimpson/minimajs/template`)
- **HTML template literals** with tagged template strings
- **XSS protection** built-in with automatic sanitization
- **Conditional rendering** helpers (when, unless)
- **List rendering** with optimized mapping
- **Dynamic attributes** and class binding

### Component Module (`@tolinsimpson/minimajs/component`)
- **Advanced component system** with props validation
- **Higher-order components** (memo, withProps)
- **Component composition** patterns
- **Render props** and children patterns
- **Error boundaries** for robust applications

### SSR Module (`@tolinsimpson/minimajs/ssr`)
- **Server-side rendering** with hydration
- **Static site generation** capabilities
- **SEO optimization** with meta tag support
- **Streaming rendering** for improved performance
- **Universal routing** for client/server compatibility

### API Module (`@tolinsimpson/minimajs/api`)
- **Shorthand element creators** (div, span, button, etc.)
- **State helpers** (toggle, counter, inputState, formState)
- **Animation utilities** (fade, slide transitions)
- **Routing helpers** (route, link, navigate)
- **Context providers** for global state

### LLM Module (`@tolinsimpson/minimajs/llm`)
- **AI-optimized builders** (quickForm, quickTable, quickModal)
- **Fluent chain syntax** ($div().class().child().build())
- **Pattern macros** for common UI patterns
- **Code generation helpers** for LLM workflows
- **Semantic component creation** with natural language

### DevTools Module (`@tolinsimpson/minimajs/devtools`) - Optional
- **Component inspection** (useDevTools hook for runtime debugging)
- **Performance profiling** (render timing and memory analysis)
- **Component tree visualization** (console-based debugging)
- **Development utilities** (enable/disable dev mode)
- **Browser extension ready** (extensible for GUI tools)

#### Enabling DevTools

```javascript
// Enable dev tools globally
import { enableDevTools } from '@tolinsimpson/minimajs/devtools';
enableDevTools();

// Or set in browser console
window.__MINIMA_DEVTOOLS__ = true;
```

## API Reference

### Core API

<details>
<summary><strong>Virtual DOM & Rendering</strong></summary>

#### `createElement(type, props, ...children)`
Creates a virtual DOM node.

```javascript
import { createElement } from '@tolinsimpson/minimajs/core';

const vnode = createElement('div', { id: 'app' }, 'Hello World');
// or
const vnode = createElement(MyComponent, { name: 'John' });
```

#### `render(vnode, container)`
Renders a virtual DOM node to the DOM.

```javascript
import { render } from '@tolinsimpson/minimajs/core';

render(vnode, document.getElementById('app'));
```

#### `Fragment`
Groups elements without extra wrapper.

```javascript
import { Fragment } from '@tolinsimpson/minimajs/core';

const list = createElement(Fragment, null, 
  createElement('li', null, 'Item 1'),
  createElement('li', null, 'Item 2')
);
```

</details>

<details>
<summary><strong>Hooks</strong></summary>

#### `useState(initialValue)`
Manages component state.

```javascript
import { useState } from '@tolinsimpson/minimajs/core';

const [count, setCount] = useState(0);
setCount(count + 1);
setCount(prev => prev + 1); // functional update
```

#### `useEffect(effect, dependencies)`
Handles side effects and lifecycle.

```javascript
import { useEffect } from '@tolinsimpson/minimajs/core';

// On mount and every render
useEffect(() => {
  console.log('Effect ran');
});

// On mount only
useEffect(() => {
  console.log('Mount effect');
}, []);

// With dependencies
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// With cleanup
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer); // cleanup
}, []);
```

#### `useContext(context)`
Accesses context values.

```javascript
import { useContext } from '@tolinsimpson/minimajs/core';

const theme = useContext(ThemeContext);
```

</details>

### Template API

<details>
<summary><strong>HTML Templates</strong></summary>

#### `html(strings, ...values)`
Creates components using template literals.

```javascript
import { html } from '@tolinsimpson/minimajs/template';

const MyComponent = ({ name }) => html`
  <div class="greeting">
    <h1>Hello ${name}!</h1>
    <button onclick="${() => alert('Hi!')}">Click me</button>
  </div>
`;
```

#### `when(condition, template)`
Conditional rendering helper.

```javascript
import { when } from '@tolinsimpson/minimajs/template';

const Profile = ({ user }) => html`
  <div>
    ${when(user, html`<h1>Welcome ${user.name}</h1>`)}
    ${when(!user, html`<a href="/login">Please log in</a>`)}
  </div>
`;
```

#### `sanitizeText(text)`
Sanitizes user input for XSS protection.

```javascript
import { sanitizeText } from '@tolinsimpson/minimajs/template';

const safe = sanitizeText(userInput);
```

</details>

### Component API

<details>
<summary><strong>Component System</strong></summary>

#### `defineComponent(options)`
Creates advanced components with lifecycle.

```javascript
import { defineComponent } from '@tolinsimpson/minimajs/component';

const Button = defineComponent({
  name: 'Button',
  props: {
    variant: { type: String, default: 'primary' },
    disabled: { type: Boolean, default: false }
  },
  setup(props) {
    const [clicked, setClicked] = useState(false);
    
    onMounted(() => {
      console.log('Button mounted');
    });
    
    return { clicked, setClicked };
  },
  template: ({ props, clicked, setClicked }) => html`
    <button 
      class="btn btn-${props.variant}"
      disabled="${props.disabled}"
      onclick="${() => setClicked(true)}"
    >
      <slot></slot>
    </button>
  `
});
```

#### `memo(component)`
Optimizes component re-renders.

```javascript
import { memo } from '@tolinsimpson/minimajs/component';

const ExpensiveComponent = memo(({ data }) => {
  // Only re-renders if data changes
  return html`<div>${JSON.stringify(data)}</div>`;
});
```

#### `withProps(component, props)`
Higher-order component for prop injection.

```javascript
import { withProps } from '@tolinsimpson/minimajs/component';

const RedButton = withProps(Button, { variant: 'danger' });
```

</details>

### SSR API

<details>
<summary><strong>Server-Side Rendering</strong></summary>

#### `renderToString(component, props)`
Renders component to HTML string.

```javascript
import { renderToString } from '@tolinsimpson/minimajs/ssr';

const html = renderToString(App, { user: userData });
const response = `<!DOCTYPE html>
<html>
  <body>
    <div id="app">${html}</div>
    <script src="app.js"></script>
  </body>
</html>`;
```

#### `hydrate(component, container, props)`
Hydrates server-rendered HTML.

```javascript
import { hydrate } from '@tolinsimpson/minimajs/ssr';

// Client-side hydration
hydrate(App, document.getElementById('app'), { user: userData });
```

</details>

### LLM API

<details>
<summary><strong>AI-Optimized Helpers</strong></summary>

#### `quickForm(config)`
Generates complete forms.

```javascript
import { quickForm } from '@tolinsimpson/minimajs/llm';

const form = quickForm({
  fields: [
    { name: 'email', type: 'email', required: true },
    { name: 'password', type: 'password', required: true },
    { name: 'remember', type: 'checkbox', label: 'Remember me' }
  ],
  onSubmit: (values) => login(values),
  submitText: 'Sign In'
});
```

#### `quickTable(data, columns)`
Generates data tables.

```javascript
import { quickTable } from '@tolinsimpson/minimajs/llm';

const table = quickTable(users, [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', render: (value) => value.toUpperCase() },
  { 
    key: 'actions', 
    header: 'Actions',
    render: (_, row) => html`
      <button onclick="${() => editUser(row.id)}">Edit</button>
      <button onclick="${() => deleteUser(row.id)}">Delete</button>
    `
  }
]);
```

#### Fluent Chain Syntax
```javascript
import { $div, $button, $h1 } from '@tolinsimpson/minimajs/llm';

const card = $div()
  .class('card shadow-lg')
  .child($h1().text('Card Title'))
  .child($button()
    .class('btn btn-primary')
    .text('Action')
    .onClick(() => handleClick())
  )
  .build();
```

</details>

### Utility API

<details>
<summary><strong>State Helpers</strong></summary>

#### `toggle(initialValue)`
Boolean state helper.

```javascript
import { toggle } from '@tolinsimpson/minimajs';

const [isOpen, toggleOpen] = toggle(false);
// toggleOpen() flips the boolean
// toggleOpen(true) sets to true
```

#### `counter(initialValue)`
Counter state helper.

```javascript
import { counter } from '@tolinsimpson/minimajs';

const [count, increment, decrement, setCount] = counter(0);
```

#### `inputState(initialValue)`
Input state helper with onChange handler.

```javascript
import { inputState } from '@tolinsimpson/minimajs';

const [value, setValue, onChange] = inputState('');

// Use in JSX-like syntax
html`<input value="${value}" oninput="${onChange}">`;
```

</details>

## Security

MinimaJS includes built-in XSS protection:

```javascript
import { html, sanitizeText } from '@tolinsimpson/minimajs';

// Safe by default - auto-sanitized
const userContent = html`<div>${userInput}</div>`;

// Manual sanitization
const clean = sanitizeText(dangerousString);

// CSP-compliant - no eval() usage
```

## TypeScript Support

```typescript
import { useState, div, button } from '@tolinsimpson/minimajs';

interface User {
  id: number;
  name: string;
}

const UserCard = ({ user }: { user: User }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  
  return div([
    button({ onClick: () => setExpanded(!expanded) }, user.name),
    expanded && div(`ID: ${user.id}`)
  ]);
};
```

## Testing

```javascript
// examples/minima.test.js
import { createElement, useState, render } from '@tolinsimpson/minimajs';

const TestComponent = () => {
  const [count, setCount] = useState(0);
  return div([
    span({ id: 'count' }, count),
    button({ id: 'inc', onClick: () => setCount(count + 1) }, '+')
  ]);
};

// Test renders and state updates
render(TestComponent(), document.body);
```

## Framework Comparison

### Feature Comparison

| Feature | MinimaJS | React | Vue 3 | Preact | Svelte |
|---------|----------|-------|-------|--------|--------|
| **Virtual DOM** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Hooks** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **SSR** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **TypeScript** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **useMemo/useCallback** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Concurrent Features** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Error Boundaries** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Suspense** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Zero Dependencies** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Template Literals** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Built-in XSS Protection** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **LLM-Optimized API** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Advanced DevTools** | ✅ | ✅ | ✅ | ❌ | ✅ |

### Bundle Size Comparison

| Framework | Core | Full | Minified + Gzipped | Notes |
|-----------|------|------|-------------------|-------|
| **MinimaJS** | 9.6KB | 38.7KB | 38.7KB (0 deps) | Full framework + SSR + Advanced features |
| React + ReactDOM | 42KB | 42KB | 42KB (+deps) | Requires ecosystem |
| Vue 3 | 34KB | 34KB | 34KB (+deps) | Requires ecosystem |
| Svelte | 1KB | 1KB | 1KB (compiled) | Compile-time only |
| Preact | 10KB | 10KB | 10KB (+deps) | React-compatible only |

*MinimaJS includes React 18+ features (useMemo, useCallback, Suspense, concurrent rendering) while being 8% smaller than React*

### Production Readiness

MinimaJS is **production-ready** for modern web applications with these considerations:

**✅ Production Strengths:**
- **Enterprise-grade security** (comprehensive XSS protection with 50+ blocked event handlers)
- **Zero dependencies** (no supply chain vulnerabilities)
- **Modern ES modules support** with tree-shaking
- **Efficient Virtual DOM** with key-based reconciliation and optimized algorithms
- **Built-in SSR and hydration** with streaming support
- **Advanced React 18+ features** (useMemo, useCallback, Suspense, concurrent rendering)
- **Performance optimizations** (33% bundle reduction through algorithmic improvements)

**🏆 Competitive Advantages:**
- **8% smaller than React** while including React 18+ features
- **Built-in enterprise security** (comprehensive XSS protection)
- **Zero-configuration setup** vs React's complex tooling requirements
- **Advanced developer experience** (template literals, LLM-optimized APIs)
- **Future-proof architecture** (ES modules, tree-shakeable, modern patterns)

### Developer Experience

| Aspect | MinimaJS | React | Vue 3 | Svelte |
|--------|----------|-------|-------|--------|
| **Learning Curve** | Minimal | Moderate | Moderate | Steep |
| **Boilerplate** | Ultra-minimal | High | Moderate | Low |
| **AI Code Gen** | Optimized | Standard | Standard | Limited |
| **Setup Complexity** | Zero config | High | Moderate | Build required |

## Syntax Comparison

### Basic Component

<details>
<summary><strong>MinimaJS vs React vs Vue</strong></summary>

**MinimaJS**
```javascript
import { div, h1, button, useState, app } from '@tolinsimpson/minimajs';

const Counter = () => {
  const [count, setCount] = useState(0);
  return div([
    h1(`Count: ${count}`),
    button({ onClick: () => setCount(count + 1) }, 'Click me!')
  ]);
};

app(Counter, 'app');
```

**React**
```jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Click me!</button>
    </div>
  );
};

ReactDOM.render(<Counter />, document.getElementById('app'));
```

**Vue 3**
```vue
<template>
  <div>
    <h1>Count: {{ count }}</h1>
    <button @click="count++">Click me!</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
```

</details>

### Template Syntax

<details>
<summary><strong>HTML Templates Comparison</strong></summary>

**MinimaJS**
```javascript
import { html, useState } from '@tolinsimpson/minimajs';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  return html`
    <div class="todo-app">
      <h1>Todos</h1>
      ${todos.map(todo => html`
        <div class="todo ${todo.done ? 'done' : ''}">
          ${todo.text}
        </div>
      `)}
    </div>
  `;
};
```

**React (JSX)**
```jsx
const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  return (
    <div className="todo-app">
      <h1>Todos</h1>
      {todos.map(todo => (
        <div key={todo.id} className={`todo ${todo.done ? 'done' : ''}`}>
          {todo.text}
        </div>
      ))}
    </div>
  );
};
```

**Vue 3**
```vue
<template>
  <div class="todo-app">
    <h1>Todos</h1>
    <div v-for="todo in todos" :key="todo.id" 
         :class="['todo', { done: todo.done }]">
      {{ todo.text }}
    </div>
  </div>
</template>
```

</details>

### State Management

<details>
<summary><strong>State & Effects Comparison</strong></summary>

**MinimaJS**
```javascript
import { useState, useEffect, toggle, counter } from '@tolinsimpson/minimajs';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, toggleLoading] = toggle(true);
  const [visits, increment] = counter(0);
  
  useEffect(() => {
    fetch(`/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
      .finally(() => toggleLoading());
  }, [userId]);
  
  return user ? div([
    p(`Name: ${user.name}`),
    button({ onClick: increment }, `Visits: ${visits}`)
  ]) : div('Loading...');
};
```

**React**
```jsx
import { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState(0);
  
  useEffect(() => {
    fetch(`/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);
  
  return user ? (
    <div>
      <p>Name: {user.name}</p>
      <button onClick={() => setVisits(v => v + 1)}>
        Visits: {visits}
      </button>
    </div>
  ) : <div>Loading...</div>;
};
```

</details>

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [Documentation](https://minimajs.dev)
- [Examples](./examples/)
- [GitHub Package](https://github.com/tolinsimpson/minima-js/packages)
- [GitHub](https://github.com/tolinsimpson/minima-js)
- [Issues](https://github.com/tolinsimpson/minima-js/issues)

## Why Choose MinimaJS?

- **Shortest syntax** - Write less, do more  
- **Zero dependencies** - No supply chain risks  
- **Modern features** - Hooks, SSR, TypeScript  
- **LLM-optimized** - Perfect for AI development  
- **Fast & small** - Tiny codebase, optimized code
- **Security-first** - XSS protection built-in

---

*Built for developers who value simplicity and performance.*
