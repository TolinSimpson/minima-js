## Design Document: Runtime Type-Checking in MinimaJS 🧪

This document details the design for the runtime type-checking feature in MinimaJS. This feature is exclusively part of the `minima.dev.js` file, ensuring that type validation occurs only during development, providing immediate feedback to the developer without adding any overhead to the production bundle. The design prioritizes simplicity, clarity, and direct JavaScript implementation for optimal LLM coding.

-----

### 1\. Introduction

JavaScript is a dynamically typed language, which offers flexibility but can lead to runtime errors due to unexpected data types. While MinimaJS avoids a build-time type checker like TypeScript to maintain its minimalist core, it provides a robust **runtime type-checking mechanism** in development mode. This feature helps developers catch type-related bugs early, improving code quality and reducing debugging time. It's designed to be easily understood and implemented through direct JavaScript logic.

-----

### 2\. Core Concepts

  * **Schema Definition**: A way for developers to declare the expected types of data (props, state, etc.) using standard JavaScript constructors.
  * **Runtime Validation**: The process of checking actual data against the defined schema during the application's execution.
  * **Descriptive Errors**: Providing clear, actionable error messages when a type mismatch occurs.

-----

### 3\. Schema Definition

Developers will define type schemas using plain JavaScript objects where values are JavaScript's built-in constructors (e.g., `String`, `Number`, `Boolean`, `Array`, `Object`) or custom component constructors.

#### 3.1. `MinimaJS.defineComponent(schema, componentFunction)`

The `minima.dev.js` file will expose an enhanced `MinimaJS.defineComponent` function (overriding the basic one in `minima.js` during development). This function will accept a `schema` object as its first argument.

  * **`schema` Object**: This object will describe the expected types for `props` and potentially `state` if a component's initial state needs strict validation.

    ```javascript
    // Example Schema Definition for a component
    const MyComponent = MinimaJS.defineComponent({
      props: {
        title: String,      // Expects a string
        count: Number,      // Expects a number
        items: Array,       // Expects an array
        isActive: Boolean,  // Expects a boolean
        data: Object,       // Expects an object
        onClick: Function   // Expects a function
      },
      // Optional: Schema for initial state if needed
      state: {
        isLoading: Boolean,
        errorMessage: String
      }
    },
    (props) => {
      // Component logic here
      return `<div>${props.title} - ${props.count}</div>`;
    });
    ```

  * **Nested Schemas**: Schemas can be nested to validate complex object structures.

    ```javascript
    const UserProfile = MinimaJS.defineComponent({
      props: {
        user: {
          id: Number,
          name: String,
          email: String,
          address: {
            street: String,
            city: String
          }
        }
      }
    },
    (props) => { /* ... */ });
    ```

-----

### 4\. Runtime Validation Logic

The core of the type-checking feature will reside within the `MinimaJS.defineComponent` function and the internal rendering process in `minima.dev.js`.

#### 4.1. `validateData(data, schema, path)` Function

A private, recursive helper function, `validateData`, will perform the actual type checks.

  * **Inputs**:
      * `data`: The actual value to be validated (e.g., the `props` object received by a component).
      * `schema`: The expected type schema for `data`.
      * `path`: A string representing the current property path (used for clear error messages, e.g., `"props.user.address.street"`).
  * **Type Matching**:
      * **Primitive Types (`String`, `Number`, `Boolean`, `Function`, `Symbol`, `BigInt`, `Undefined`, `Null`)**: Use the `typeof` operator.
          * Special case for `null`: `typeof null` returns `"object"`. A separate check `data === null` is required.
      * **`Array`**: Use `Array.isArray(data)`.
      * **`Object`**: Use `typeof data === 'object' && data !== null && !Array.isArray(data)`.
      * **Custom Components**: If a schema value is a MinimaJS component constructor, validate that the received data is an instance of that component (though this is less common for props and more for internal structure validation).
  * **Recursive Validation**: If a schema property is itself an object (a nested schema), `validateData` will recursively call itself for that nested object.
  * **Error Reporting**: If a type mismatch is found, `validateData` will throw an `Error` with a detailed message, including the `path` to the problematic property, the expected type, and the received type. This error will be caught and logged to the console by the framework.

#### 4.2. Integration with Component Lifecycle

The `validateData` function will be invoked at key points in the component lifecycle:

  * **On Component Creation**: When a component is first instantiated, its initial `props` and `state` (if a schema is provided for state) will be validated against their respective schemas.
  * **On Prop Update**: When a parent component passes new `props` to a child component, these new `props` will be validated before the child component re-renders.

<!-- end list -->

```javascript
// Simplified internal logic within minima.dev.js (conceptual)
function defineComponent(schema, componentFn) {
  // In production, schema would be ignored
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return componentFn;
  }

  return function (props) {
    // Validate props when component is instantiated or receives new props
    try {
      if (schema.props) {
        validateData(props, schema.props, 'props');
      }
      // if (schema.state) { validateData(this.state, schema.state, 'state'); } // For initial state validation
    } catch (error) {
      console.error(`MinimaJS Type Error in component:`, componentFn.name, error.message);
      // Prevent further execution or provide a fallback UI
      return `<div>Type Error: ${error.message}</div>`; // Render error message in dev mode
    }

    // Original component function execution
    return componentFn.apply(this, [props]);
  };
}

// Simplified validateData function (for illustration)
function validateData(data, schema, path = '') {
  for (const key in schema) {
    const expectedType = schema[key];
    const value = data[key];
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof expectedType === 'object' && expectedType !== null && !Array.isArray(expectedType)) {
      // Nested schema, recurse
      if (typeof value !== 'object' || value === null) {
        throw new Error(`Expected object at '${currentPath}', got '${typeof value}'.`);
      }
      validateData(value, expectedType, currentPath);
    } else if (expectedType === String) {
      if (typeof value !== 'string') throw new Error(`Expected string at '${currentPath}', got '${typeof value}'.`);
    } else if (expectedType === Number) {
      if (typeof value !== 'number' || isNaN(value)) throw new Error(`Expected number at '${currentPath}', got '${typeof value}'.`);
    } // ... other type checks for Boolean, Array, Function, etc.
  }
}
```

-----

### 5\. Error Reporting

When a type mismatch is detected, MinimaJS will:

  * **Log to Console**: Output a clear, human-readable error message to the browser's developer console.
  * **Include Path**: The error message will specify the exact property path where the type mismatch occurred (e.g., "Expected `String` at `props.user.name`, got `Number`").
  * **Development-Only**: These errors and the validation code will be entirely absent from the production build, ensuring no performance penalty for end-users.

-----

### 6\. Optimization for LLM Coding

The design emphasizes the following for LLM coding:

  * **Explicit Schema**: The schema definition is clear, using direct JavaScript constructors.
  * **Pure JavaScript Logic**: All validation relies on fundamental JavaScript operators (`typeof`, `Array.isArray`, `instanceof`) and control flow, making it straightforward to generate.
  * **Modular Functions**: The validation logic is encapsulated in a dedicated, recursive function (`validateData`), which is easy to understand and replicate.
  * **Clear Error Messages**: The structure of error messages is well-defined, guiding the LLM to generate precise diagnostic output.