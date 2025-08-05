# Migration Guide: v1.0 to v1.1

This guide helps you upgrade your MinimaJS project from version 1.0 to 1.1.

## 🚀 What's New in v1.1

MinimaJS v1.1 introduces powerful new features while maintaining **100% backward compatibility** with v1.0 code. Your existing applications will continue to work without any changes.

### 🎯 Key Improvements

- **Enhanced Template System** with `{{}}` interpolation and `@event` binding
- **Computed Properties** for derived state with automatic dependency tracking
- **Component Lifecycle Enhancements** with `onDestroy` and `shouldUpdate` hooks
- **Performance Optimizations** with memoization and batch updates
- **Router Enhancements** with navigation guards and query parameters
- **Fragment Support** for components with multiple root elements
- **Enhanced Error Reporting** with contextual suggestions

## 📋 Upgrade Checklist

### Step 1: Update Framework Version

```bash
# If using npm
npm update minimajs

# Or update your CDN link
<script src="https://cdn.jsdelivr.net/npm/minimajs@1.1.0/src/minima.js"></script>
```

### Step 2: Optional - Adopt New Template Syntax

Your existing template strings continue to work, but you can now use the enhanced syntax:

#### Before (v1.0 - still works)
```javascript
const Counter = MinimaJS.defineComponent(function(props) {
  this.state = MinimaJS.createState({ count: 0 });
  
  const increment = () => this.state.count++;
  
  return `
    <div>
      <h2>Count: ${this.state.count}</h2>
      <button onclick="increment()">+</button>
    </div>
  `;
});
```

#### After (v1.1 - enhanced)
```javascript
const Counter = MinimaJS.defineComponent(function(props) {
  this.state = MinimaJS.createState({ count: 0 });
  
  this.increment = () => this.state.count++; // Method now available in template
  
  return `
    <div>
      <h2>Count: {{state.count}}</h2>
      <button @click="increment">+</button>
    </div>
  `;
});
```

### Step 3: Add Computed Properties (Optional)

Enhance your state management with computed properties:

#### Before (v1.0)
```javascript
const TodoList = MinimaJS.defineComponent(function(props) {
  this.state = MinimaJS.createState({
    todos: [],
    filter: 'all'
  });
  
  // Manual filtering in template
  const getFilteredTodos = () => {
    switch (this.state.filter) {
      case 'active': return this.state.todos.filter(t => !t.completed);
      case 'completed': return this.state.todos.filter(t => t.completed);
      default: return this.state.todos;
    }
  };
  
  return `<div>${getFilteredTodos().map(todo => `...`).join('')}</div>`;
});
```

#### After (v1.1)
```javascript
const TodoList = MinimaJS.defineComponent(function(props) {
  this.state = MinimaJS.createState({
    todos: [],
    filter: 'all'
  }, {
    // Computed properties automatically update when dependencies change
    filteredTodos: function(state) {
      switch (state.filter) {
        case 'active': return state.todos.filter(t => !t.completed);
        case 'completed': return state.todos.filter(t => t.completed);
        default: return state.todos;
      }
    },
    activeCount: function(state) {
      return state.todos.filter(t => !t.completed).length;
    }
  });
  
  return `<div>{{state.filteredTodos.map(todo => '...').join('')}}</div>`;
});
```

### Step 4: Add Lifecycle Hooks (Optional)

Enhance your components with proper cleanup:

#### Before (v1.0)
```javascript
const DataComponent = MinimaJS.defineComponent(function(props) {
  this.state = MinimaJS.createState({ data: null });
  
  // Manual setup - no cleanup
  setTimeout(() => {
    this.state.data = 'Loaded data';
  }, 1000);
  
  return `<div>Data: {{state.data || 'Loading...'}}</div>`;
});
```

#### After (v1.1)
```javascript
const DataComponent = MinimaJS.defineComponent(function(props) {
  this.state = MinimaJS.createState({ data: null });
  
  let timer;
  
  this.onInit = function() {
    timer = setTimeout(() => {
      this.state.data = 'Loaded data';
    }, 1000);
  };
  
  this.onDestroy = function() {
    clearTimeout(timer); // Proper cleanup
  };
  
  return `<div>Data: {{state.data || 'Loading...'}}</div>`;
});
```

### Step 5: Enhance Router (Optional)

Add navigation guards and query parameter handling:

#### Before (v1.0)
```javascript
MinimaJS.router.init([
  { path: '/', component: HomePage },
  { path: '/profile', component: ProfilePage }
]);
```

#### After (v1.1)
```javascript
// Add navigation guards
MinimaJS.router.beforeEach((to, from, next) => {
  if (to.path.includes('/admin') && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});

MinimaJS.router.init([
  { path: '/', component: HomePage },
  { path: '/profile/:id', component: ProfilePage } // Dynamic params
]);

// Access query parameters in components
const ProfilePage = MinimaJS.defineComponent(function(props) {
  const route = MinimaJS.router.getCurrentRoute();
  const userId = route.params.id;
  const tab = route.query.tab || 'general';
  
  return `<div>User ${userId}, Tab: ${tab}</div>`;
});
```

## 🎯 Performance Optimizations

### Component Memoization

Optimize expensive components with memoization:

```javascript
const ExpensiveComponent = MinimaJS.defineComponent(function(props) {
  // Heavy computation here
  const processedData = heavyComputation(props.data);
  
  return `<div>${processedData}</div>`;
});

// Use memoization to cache renders with identical props
MinimaJS.render(() => 
  MinimaJS.memo(ExpensiveComponent, { data: largeDatatset })
, container);
```

### Batch Updates

Optimize multiple state changes:

```javascript
// Instead of multiple individual updates
this.state.user.name = 'John';
this.state.user.age = 30;
this.state.user.email = 'john@example.com';

// Use batch updates for better performance
MinimaJS.batchUpdates(() => {
  this.state.user.name = 'John';
  this.state.user.age = 30;
  this.state.user.email = 'john@example.com';
});
```

### Performance Hooks

Add `shouldUpdate` for fine-grained control:

```javascript
const OptimizedComponent = MinimaJS.defineComponent(function(props) {
  this.state = MinimaJS.createState({ count: 0, lastUpdate: Date.now() });
  
  // Only update if count changed significantly
  this.shouldUpdate = function(newProps, newState) {
    return Math.abs(newState.count - this.state.count) >= 5;
  };
  
  return `<div>Count: {{state.count}}</div>`;
});
```

## 🧩 New Features to Explore

### Fragment Support

Create components with multiple root elements:

```javascript
const MultiRootComponent = MinimaJS.defineComponent(function(props) {
  return `
    <header>Header content</header>
    <main>Main content</main>
    <footer>Footer content</footer>
  `;
});
```

### Enhanced Error Reporting

v1.1 provides much better error messages with suggestions:

```javascript
// v1.0: Generic error
// Error: Template parsing failed

// v1.1: Detailed error with suggestions
// 🔴 MinimaJS Error in Template Parsing
// Message: Error evaluating expression 'state.nonexistent'
// 💡 Suggestions:
// • Check your template syntax: use {{state.property}} or {{props.property}}
// • Ensure the property exists in your component state or props
```

## 🚨 Breaking Changes

**None!** MinimaJS v1.1 is fully backward compatible. All v1.0 code continues to work without modification.

## 📊 Bundle Size Impact

- **v1.0**: ~4.8KB minified+gzipped
- **v1.1**: ~6.2KB minified+gzipped (+29%)

The size increase brings significant functionality improvements while remaining well within minimalist framework bounds.

## 🐛 Common Migration Issues

### Issue: Template interpolation not working

**Problem**: Using new `{{}}` syntax but getting literal text
```javascript
return `<div>{{state.count}}</div>`; // Shows "{{state.count}}" literally
```

**Solution**: Ensure you're using v1.1 and the template is being parsed correctly
```javascript
// Make sure state.count exists and is properly defined
this.state = MinimaJS.createState({ count: 0 });
return `<div>{{state.count}}</div>`; // Will show "0"
```

### Issue: Event handlers not working

**Problem**: Using `@click` syntax but events don't fire
```javascript
return `<button @click="handleClick">Click me</button>`;
```

**Solution**: Ensure the method is defined on the component instance
```javascript
this.handleClick = () => {
  console.log('Clicked!');
};
return `<button @click="handleClick">Click me</button>`;
```

### Issue: Computed properties not updating

**Problem**: Computed property returns stale data
```javascript
this.state = MinimaJS.createState({ items: [] }, {
  itemCount: function(state) {
    return state.items.length; // Not updating when items change
  }
});
```

**Solution**: Ensure you're modifying the array properly
```javascript
// Instead of mutating the array
this.state.items.push(newItem); // Won't trigger computed update

// Create a new array
this.state.items = [...this.state.items, newItem]; // Will trigger update
```

## 🎉 Next Steps

1. **Review the [Enhanced Features Demo](../examples/enhanced-features-demo.html)** for comprehensive examples
2. **Check the [API Reference](api-reference.html)** for detailed documentation of new methods
3. **Explore the [Examples](../examples/)** directory for practical patterns
4. **Join the community** and share your upgraded applications!

## 📚 Resources

- [Changelog](changelog.md) - Complete list of changes
- [API Reference](api-reference.html) - Full method documentation  
- [Examples](../examples/) - Practical implementation examples
- [GitHub Issues](https://github.com/minimajs/minimajs/issues) - Report bugs or request features

---

**Happy upgrading!** 🚀 MinimaJS v1.1 brings powerful new capabilities while preserving the simplicity you love.