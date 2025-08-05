/**
 * MinimaJS Development Enhancements
 * 
 * This file provides development-only features:
 * - Runtime type checking with schemas
 * - Enhanced error messages and debugging
 * - Performance monitoring
 * - Component inspection tools
 * 
 * NOT INCLUDED IN PRODUCTION BUILDS
 */

(function() {
  'use strict';

  // Only load if MinimaJS core is available
  if (typeof window.MinimaJS === 'undefined') {
    console.error('MinimaJS Dev: Core framework not loaded. Include minima.js before minima.dev.js');
    return;
  }

  // Development mode flag
  const IS_DEV_MODE = true;

  // =========================================================================
  // TYPE VALIDATION SYSTEM
  // =========================================================================

  /**
   * Valid type constructors for schema validation
   */
  const VALID_TYPES = {
    String: (value) => typeof value === 'string',
    Number: (value) => typeof value === 'number' && !isNaN(value),
    Boolean: (value) => typeof value === 'boolean',
    Array: (value) => Array.isArray(value),
    Object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
    Function: (value) => typeof value === 'function',
    Date: (value) => value instanceof Date,
    RegExp: (value) => value instanceof RegExp,
    Null: (value) => value === null,
    Undefined: (value) => value === undefined
  };

  /**
   * Validates data against a schema definition
   * @param {*} data - Data to validate
   * @param {Object} schema - Schema definition
   * @param {string} path - Current validation path for error messages
   * @throws {Error} If validation fails
   */
  function validateData(data, schema, path = '') {
    if (!schema || typeof schema !== 'object') {
      return; // No validation needed
    }

    for (const key in schema) {
      const expectedType = schema[key];
      const value = data ? data[key] : undefined;
      const currentPath = path ? `${path}.${key}` : key;
      
      // Handle nested objects (recursive validation)
      if (typeof expectedType === 'object' && 
          expectedType !== String && 
          expectedType !== Number && 
          expectedType !== Boolean && 
          expectedType !== Array && 
          expectedType !== Object && 
          expectedType !== Function &&
          expectedType !== Date &&
          expectedType !== RegExp) {
        
        if (!VALID_TYPES.Object(value)) {
          throw new Error(`MinimaJS Type Error: Expected object at '${currentPath}', got '${typeof value}'`);
        }
        
        // Recursively validate nested object
        validateData(value, expectedType, currentPath);
        continue;
      }
      
      // Handle array type with element validation
      if (expectedType === Array) {
        if (!VALID_TYPES.Array(value)) {
          throw new Error(`MinimaJS Type Error: Expected array at '${currentPath}', got '${typeof value}'`);
        }
        continue;
      }
      
      // Handle primitive type validation
      const typeChecker = VALID_TYPES[expectedType.name];
      if (!typeChecker) {
        console.warn(`MinimaJS Type Warning: Unknown type '${expectedType.name}' in schema at '${currentPath}'`);
        continue;
      }
      
      if (!typeChecker(value)) {
        const actualType = value === null ? 'null' : typeof value;
        throw new Error(`MinimaJS Type Error: Expected ${expectedType.name} at '${currentPath}', got '${actualType}'`);
      }
    }
  }

  /**
   * Enhanced component definition with type checking
   * Overrides the basic MinimaJS.defineComponent in development
   */
  const originalDefineComponent = MinimaJS.defineComponent;
  
  MinimaJS.defineComponent = function(schemaOrFunction, componentFunction) {
    // Handle both old and new syntax
    let schema = null;
    let componentFn = null;
    
    if (typeof schemaOrFunction === 'function') {
      // Old syntax: defineComponent(componentFn)
      componentFn = schemaOrFunction;
    } else if (typeof schemaOrFunction === 'object' && typeof componentFunction === 'function') {
      // New syntax: defineComponent(schema, componentFn)
      schema = schemaOrFunction;
      componentFn = componentFunction;
    } else {
      throw new Error('MinimaJS Dev: Invalid arguments to defineComponent');
    }
    
    const componentName = componentFn.name || `Component_${Date.now()}`;
    
    // Create enhanced component wrapper with type checking
    const EnhancedComponentWrapper = function(props = {}) {
      // Validate props against schema if provided
      if (schema && schema.props) {
        try {
          validateData(props, schema.props, 'props');
        } catch (error) {
          console.error(`MinimaJS Type Error in component '${componentName}':`, error.message);
          console.error('Props received:', props);
          console.error('Expected schema:', schema.props);
          
          // Return error component in development
          return {
            _vnode: MinimaJS.createElement('div', { 
              style: 'border: 2px solid red; padding: 10px; background: #ffe6e6;' 
            }, [
              `Type Error in ${componentName}: ${error.message}`
            ]),
            _isInitialized: false,
            _element: null,
            _subscriptions: [],
            state: MinimaJS.createState({}),
            onInit: function() {},
            onUpdate: function() {}
          };
        }
      }
      
      // Create component instance with performance monitoring
      const startTime = performance.now();
      let instance;
      
      try {
        // Call original component wrapper
        const originalWrapper = originalDefineComponent(componentFn);
        instance = originalWrapper(props);
        
        // Validate initial state against schema if provided
        if (schema && schema.state && instance.state) {
          try {
            validateData(instance.state, schema.state, 'state');
          } catch (error) {
            console.error(`MinimaJS Type Error in component '${componentName}' initial state:`, error.message);
          }
        }
        
      } catch (error) {
        console.error(`MinimaJS Component Error in '${componentName}':`, error);
        
        // Return error component
        return {
          _vnode: MinimaJS.createElement('div', { 
            style: 'border: 2px solid red; padding: 10px; background: #ffe6e6;' 
          }, [
            `Component Error in ${componentName}: ${error.message}`
          ]),
          _isInitialized: false,
          _element: null,
          _subscriptions: [],
          state: MinimaJS.createState({}),
          onInit: function() {},
          onUpdate: function() {}
        };
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log performance if it's slow
      if (renderTime > 10) {
        console.warn(`MinimaJS Performance: Component '${componentName}' took ${renderTime.toFixed(2)}ms to render`);
      }
      
      // Enhance state with validation if schema provided
      if (schema && schema.state && instance.state) {
        const originalState = instance.state;
        const originalSubscribe = originalState._subscribe;
        
        // Override state setter to include validation
        instance.state = new Proxy(originalState, {
          set(target, property, value) {
            // Validate individual property if it exists in schema
            if (schema.state[property]) {
              const tempObj = {};
              tempObj[property] = value;
              try {
                validateData(tempObj, { [property]: schema.state[property] }, 'state');
              } catch (error) {
                console.error(`MinimaJS Type Error setting state.${property} in '${componentName}':`, error.message);
                return false; // Prevent invalid assignment
              }
            }
            
            return Reflect.set(target, property, value);
          }
        });
        
        // Preserve subscription functionality
        instance.state._subscribe = originalSubscribe;
      }
      
      return instance;
    };
    
    // Store enhanced component
    MinimaJS._components.set(componentName, EnhancedComponentWrapper);
    
    return EnhancedComponentWrapper;
  };

  // =========================================================================
  // DEVELOPMENT DEBUGGING TOOLS
  // =========================================================================

  /**
   * Component inspector for debugging
   * @param {string} componentName - Name of component to inspect
   * @returns {Object} Component information
   */
  function inspectComponent(componentName) {
    const component = MinimaJS._components.get(componentName);
    if (!component) {
      console.error(`MinimaJS Inspector: Component '${componentName}' not found`);
      return null;
    }
    
    return {
      name: componentName,
      component: component,
      instances: 0, // Would need instance tracking for this
      registered: true
    };
  }

  /**
   * Lists all registered components
   * @returns {Array} Array of component names
   */
  function listComponents() {
    return Array.from(MinimaJS._components.keys());
  }

  /**
   * Inspects global stores
   * @param {string} storeName - Optional store name to inspect
   * @returns {Object} Store information
   */
  function inspectStore(storeName) {
    if (storeName) {
      const store = MinimaJS._globalStores.get(storeName);
      if (!store) {
        console.error(`MinimaJS Inspector: Store '${storeName}' not found`);
        return null;
      }
      
      // Create a safe copy of store data (without proxy)
      const storeData = {};
      for (const key in store) {
        if (key !== '_subscribe') {
          storeData[key] = store[key];
        }
      }
      
      return {
        name: storeName,
        data: storeData,
        subscriberCount: 0 // Would need subscriber tracking
      };
    }
    
    // List all stores
    return Array.from(MinimaJS._globalStores.keys());
  }

  /**
   * Performance monitoring for render operations
   */
  const originalRender = MinimaJS.render;
  let renderCount = 0;
  const renderTimes = [];
  
  MinimaJS.render = function(component, container) {
    const startTime = performance.now();
    renderCount++;
    
    try {
      const result = originalRender.call(this, component, container);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      renderTimes.push(renderTime);
      
      // Keep only last 100 render times
      if (renderTimes.length > 100) {
        renderTimes.shift();
      }
      
      console.log(`MinimaJS Render #${renderCount}: ${renderTime.toFixed(2)}ms`);
      
      // Log slow renders
      if (renderTime > 16) { // Slower than 60fps
        console.warn(`MinimaJS Performance: Slow render detected (${renderTime.toFixed(2)}ms)`);
      }
      
      return result;
    } catch (error) {
      console.error('MinimaJS Render Error:', error);
      throw error;
    }
  };

  /**
   * Gets performance statistics
   * @returns {Object} Performance data
   */
  function getPerformanceStats() {
    if (renderTimes.length === 0) {
      return { message: 'No render data available' };
    }
    
    const avg = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const max = Math.max(...renderTimes);
    const min = Math.min(...renderTimes);
    
    return {
      totalRenders: renderCount,
      averageRenderTime: avg.toFixed(2) + 'ms',
      maxRenderTime: max.toFixed(2) + 'ms',
      minRenderTime: min.toFixed(2) + 'ms',
      recentRenders: renderTimes.slice(-10)
    };
  }

  // =========================================================================
  // ENHANCED ERROR HANDLING
  // =========================================================================

  /**
   * Better error messages for common mistakes
   */
  window.addEventListener('error', function(event) {
    const error = event.error;
    
    if (error && error.message) {
      // Enhance MinimaJS-specific errors
      if (error.message.includes('MinimaJS')) {
        console.group('🚨 MinimaJS Development Error');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // Provide helpful suggestions
        if (error.message.includes('Component must be a function')) {
          console.info('💡 Suggestion: Make sure you\'re passing a function to defineComponent()');
          console.info('Example: MinimaJS.defineComponent(function MyComponent(props) { return `<div>Hello</div>`; })');
        } else if (error.message.includes('Type Error')) {
          console.info('💡 Suggestion: Check your component props and state types match the schema');
        } else if (error.message.includes('Router')) {
          console.info('💡 Suggestion: Check your route configuration and component definitions');
        }
        
        console.groupEnd();
      }
    }
  });

  // =========================================================================
  // DEVELOPMENT CONSOLE API
  // =========================================================================

  // Add development tools to global scope
  window.MinimaJS.dev = {
    // Component inspection
    inspectComponent: inspectComponent,
    listComponents: listComponents,
    
    // Store inspection
    inspectStore: inspectStore,
    
    // Performance monitoring
    getPerformanceStats: getPerformanceStats,
    
    // Type validation
    validateData: validateData,
    
    // Internal access for debugging
    getInternalState: function() {
      return {
        components: MinimaJS._components,
        stores: MinimaJS._globalStores,
        renderCount: renderCount,
        renderTimes: renderTimes
      };
    }
  };

  // =========================================================================
  // HELPFUL CONSOLE MESSAGES
  // =========================================================================

  console.log('🔧 MinimaJS Development Mode Enabled');
  console.log('📚 Available dev tools: MinimaJS.dev.*');
  console.log('🔍 Try: MinimaJS.dev.listComponents()');
  console.log('📊 Try: MinimaJS.dev.getPerformanceStats()');

  // Hot reload support indicator
  if (window.WebSocket) {
    console.log('🔥 Hot reload support available');
  }

})();