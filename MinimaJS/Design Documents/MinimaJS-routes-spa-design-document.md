# Router & SPA Implementation Guide 🗺️

**OPTIMIZED FOR CLAUDE-4-SONNET CODING**

This document provides exact implementation specifications for the routing system in MinimaJS. All code patterns include precise function signatures, data structures, and algorithms for direct AI implementation.

-----

### 1\. Introduction

The routing feature in MinimaJS enables the creation of **Single-Page Applications (SPAs)**, which load a single HTML page and dynamically update the content as the user navigates. This provides a fast, seamless user experience without full page reloads. The router will be simple, reliable, and integrated directly into the framework's core, adhering to the principles of minimalism and universal browser compatibility.

-----

### 2\. Core Concepts

  * **Router**: A built-in module that manages the application's navigation state.
  * **Routes**: A configuration that maps URL paths to specific MinimaJS components.
  * **SPA**: An application that loads a single HTML document and updates its content dynamically based on user interactions and the URL.
  * **History API**: The browser's native `history` object, which is used to manipulate the URL and browser history without a full page reload.

-----

### 3\. Router Design and Implementation

The router will be a globally accessible, singleton object within the MinimaJS framework.

#### 3.1. Route Configuration

Routes will be defined as an array of objects. Each object will contain a `path` and a `component` property.

  * **`path`**: A string representing the URL path. It will support dynamic parameters using a colon prefix (e.g., `/posts/:id`).
  * **`component`**: A reference to the MinimaJS component to be rendered when the path matches.

<!-- end list -->

```javascript
// Example Route Configuration
const routes = [
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
  { path: '/posts/:id', component: PostPage }
];

MinimaJS.router.init(routes);
```

### 3.2. Router Implementation - EXACT CODE

```javascript
// EXACT router object structure - implement exactly as specified
MinimaJS.router = {
  _routes: [],
  _currentRoute: null,
  _container: null,
  
  /**
   * Initialize the router with routes and container
   * @param {Array} routes - Array of {path, component} objects
   * @param {Element} container - DOM element to render components into
   */
  init: function(routes, container = document.body) {
    // Validate input
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
   * @returns {Object|null} Current route with params
   */
  getCurrentRoute: function() {
    return this._currentRoute;
  },
  
  // Private methods
  _handleRouteChange: function() {
    const currentPath = window.location.pathname;
    const matchedRoute = this._matchRoute(currentPath);
    
    if (matchedRoute) {
      this._currentRoute = matchedRoute;
      this._renderRoute(matchedRoute);
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
  }
};
```

### 3.3. Route Configuration Format

```javascript
// EXACT route configuration structure
const routes = [
  {
    path: '/',                    // string: URL path pattern
    component: HomeComponent      // function: MinimaJS component
  },
  {
    path: '/about',
    component: AboutComponent
  },
  {
    path: '/users/:id',           // Dynamic parameter with :id
    component: UserComponent      // Will receive {id: "123"} as props
  },
  {
    path: '/posts/:category/:id', // Multiple parameters
    component: PostComponent      // Will receive {category: "tech", id: "456"}
  }
];

// Initialize router
MinimaJS.router.init(routes, document.getElementById('app'));
```

-----

### 4\. Component Integration

MinimaJS components will interact with the router in a few key ways:

  * **Dynamic Parameters**: The component rendered by a dynamic route will receive the URL parameters as a `params` object in its props. For example, for the URL `/posts/123`, the `PostPage` component will receive `{ id: '123' }` as props.
  * **Programmatic Navigation**: A `MinimaJS.router.navigate()` function will be available for components to trigger navigation programmatically (e.g., after a form submission or a button click).

-----

### 5\. Dev-Mode Enhancements (`minima.dev.js`)

The development-only script will provide crucial debugging and diagnostic tools for the router.

  * **Route Warnings**: In development, `minima.dev.js` will check for common routing errors, such as duplicate path definitions or paths that don't match any route. It will log clear, actionable warnings to the console.
  * **Navigation Logging**: Every time a route change occurs, `minima.dev.js` will log the event to the console, showing the previous path, the new path, and the component that was rendered. This helps in debugging complex navigation flows.
  * **Visual Route Map**: A future enhancement could be an in-browser visualization of the application's route configuration, available only in dev mode.