# MinimaJS

**Ultra-minimalist JavaScript Framework**

- 🎯 **< 7KB** minified + gzipped (packed with features!)
- 🚫 **Zero dependencies** - runs everywhere
- 🌐 **Universal browser support** (ES6+)
- 🔥 **Hot reload** development server
- 🧱 **Component-based** architecture with lifecycle hooks
- 🔄 **Reactive state** with computed properties
- 🗺️ **SPA routing** with guards and query params
- 🧪 **Runtime type checking** (dev mode)
- ⚡ **Performance optimized** with memoization and batching
- 🎨 **Enhanced templates** with interpolation and event binding
- 🧩 **Fragment support** for flexible component structure

## Quick Start

```bash
# Clone and run
git clone https://github.com/minimajs/minimajs.git
cd minimajs
npm run dev

# Or just include the script
<script src="https://cdn.jsdelivr.net/npm/minimajs/src/minima.js"></script>
```

## Example Component

```javascript
const Counter = MinimaJS.defineComponent(function(props) {
  // Enhanced state with computed properties
  this.state = MinimaJS.createState({ 
    count: 0,
    name: props.name || 'Counter'
  }, {
    // Computed property - automatically updates when count changes
    doubleCount: function(state) {
      return state.count * 2;
    }
  });
  
  // Component methods
  this.increment = () => this.state.count++;
  this.decrement = () => this.state.count--;
  this.reset = () => this.state.count = 0;
  
  // Lifecycle hooks
  this.onInit = function() {
    console.log(`${this.state.name} initialized!`);
  };
  
  this.onDestroy = function() {
    console.log(`${this.state.name} destroyed!`);
  };
  
  // Enhanced template with interpolation and event binding
  return `
    <div>
      <h2>{{state.name}}: {{state.count}}</h2>
      <p>Double: {{state.doubleCount}}</p>
      <button @click="increment">+</button>
      <button @click="decrement">-</button>
      <button @click="reset">Reset</button>
    </div>
  `;
});

MinimaJS.render(Counter, document.getElementById('app'));
```

## Features

### 🧱 Components
- Function-based components with enhanced lifecycle
- Reactive state with Proxy and computed properties
- Lifecycle hooks: `onInit`, `onUpdate`, `onDestroy`, `shouldUpdate`
- Enhanced template syntax with `{{}}` interpolation
- Event binding with `@event="handler"` syntax
- Fragment support for multiple root elements
- Component memoization for performance

### 🔄 State Management
- Local component state with computed properties
- Global stores with pub/sub pattern
- Automatic dependency tracking and cache invalidation
- Batch updates for optimal performance
- Runtime computed property addition

### 🗺️ Routing
- SPA routing with History API and guards
- Dynamic parameters and query string parsing
- Navigation guards (`beforeEach`, `afterEach`)
- Route protection and authentication flows
- Automatic link interception with 404 handling

### 🛠️ Development & Performance
- Hot reload server with WebSocket communication
- Runtime type checking with enhanced error reporting
- Component memoization and shallow equality checking
- Batch DOM updates using `requestAnimationFrame`
- Memory leak prevention with automatic cleanup
- Performance monitoring and optimization hints

## Development Server

```bash
npm run dev
# Server starts at http://localhost:8080
# Auto-reloads on file changes
# WebSocket-based hot reload
```

## File Structure

```
src/
├── minima.js      # Core framework (~5KB)
├── minima.dev.js  # Development tools
└── start-dev.js   # Development server

examples/
├── index.html     # Basic examples
├── todo-app.html  # Todo application  
└── spa-demo.html  # Routing demo
```

## Browser Support

- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+

Requires ES6 features: Proxy, template literals, arrow functions, destructuring.

## API Reference

### Core
- `MinimaJS.defineComponent(fn)` - Define component
- `MinimaJS.render(component, container)` - Render component
- `MinimaJS.createElement(tag, props, children)` - Create VNode
- `MinimaJS.createFragment(children)` - Create fragment VNode
- `MinimaJS.memo(component, props)` - Memoized component rendering

### State Management
- `MinimaJS.createState(initial, computed)` - Create reactive state with computed properties
- `MinimaJS.store(name, initial)` - Global store
- `MinimaJS.onGlobalStateChange(store, key, callback)` - Subscribe to global state
- `MinimaJS.batchUpdates(callback)` - Batch state updates manually

### Router
- `MinimaJS.router.init(routes, container)` - Initialize router
- `MinimaJS.router.navigate(path)` - Navigate to path
- `MinimaJS.router.getCurrentRoute()` - Get current route with params and query
- `MinimaJS.router.beforeEach(guard)` - Add navigation guard
- `MinimaJS.router.afterEach(guard)` - Add post-navigation hook

### Component Lifecycle
- `component.onInit()` - Called when component is first rendered
- `component.onUpdate()` - Called when component state changes
- `component.onDestroy()` - Called when component is destroyed
- `component.shouldUpdate(props, state)` - Performance optimization hook
- `component.destroy()` - Manually destroy component and cleanup
- `component.addEventListener(element, event, handler)` - Managed event listener

### State Extensions
- `state._subscribe(callback)` - Subscribe to state changes
- `state._addComputed(key, getter)` - Add computed property at runtime

### Development (Dev Mode Only)
- `MinimaJS.dev.listComponents()` - List registered components
- `MinimaJS.dev.getPerformanceStats()` - Performance metrics
- `MinimaJS.dev.inspectStore(name)` - Inspect global store

## Examples

Visit the `/examples` directory for:
- **Basic component examples** (`index.html`) - Simple component patterns
- **Advanced todo application** (`todo-app.html`) - Complete SPA with routing
- **Enhanced features demo** (`enhanced-features-demo.html`) - Showcase of v1.1 features
- **Component showcase** (`components-demo.html`) - Various component patterns
- **Routing demonstration** - Navigation and guards examples
- **State management patterns** - Local and global state examples

### Quick Examples

#### Enhanced Template Syntax
```javascript
const UserCard = MinimaJS.defineComponent(function(props) {
  this.state = MinimaJS.createState({
    likes: 0,
    isFollowing: false
  }, {
    // Computed property
    displayStatus: function(state) {
      return state.isFollowing ? 'Following' : 'Follow';
    }
  });

  this.toggleFollow = () => {
    this.state.isFollowing = !this.state.isFollowing;
  };

  this.addLike = () => {
    this.state.likes++;
  };

  return `
    <div class="user-card">
      <h3>{{props.name}}</h3>
      <p>{{props.bio}}</p>
      <p>❤️ {{state.likes}} likes</p>
      <button @click="addLike">Like</button>
      <button @click="toggleFollow">{{state.displayStatus}}</button>
    </div>
  `;
});
```

#### Router with Guards
```javascript
// Set up authentication guard
MinimaJS.router.beforeEach((to, from, next) => {
  if (to.path.includes('/admin') && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});

// Initialize routes with query parameters
MinimaJS.router.init([
  { path: '/', component: HomePage },
  { path: '/profile/:id', component: ProfilePage },
  { path: '/admin', component: AdminPanel }
]);
```

#### Component Memoization
```javascript
// Optimize expensive components
const ExpensiveChart = MinimaJS.defineComponent(function(props) {
  // Heavy computation here
  return `<div>Chart for ${props.dataset}</div>`;
});

// Use memoization to cache identical prop renders
MinimaJS.render(() => 
  MinimaJS.memo(ExpensiveChart, { dataset: 'sales-data' })
, container);
```

## Upgrading from v1.0?

📖 **[Migration Guide](docs/migration-v1.1.md)** - Comprehensive guide for upgrading from v1.0 to v1.1 with examples and best practices.

v1.1 is **100% backward compatible** - your existing code will continue to work without any changes!

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test with `npm run dev`
5. Submit pull request

## License

MIT License - see LICENSE file for details.

---

**MinimaJS** - Sometimes less is more. 🚀