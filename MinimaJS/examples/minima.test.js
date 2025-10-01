/**
 * MinimaJS Test Suite v1.0.0 - Comprehensive Framework Testing
 */

import { createElement, useState, useEffect, render, html, defineComponent, createApp } from '@tolinsimpson/minimajs';

// Test utilities
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

const asyncTest = async (testFn, name) => {
  try {
    await testFn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}:`, error.message);
    throw error;
  }
};

// DOM test utilities
const createTestContainer = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
};

const cleanup = (container) => {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
};

// Test Suite
class MinimaTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.total = 0;
  }

  async run() {
    console.log('Starting MinimaJS Test Suite...\n');

    await this.testCore();
    await this.testHooks();
    await this.testTemplates();
    await this.testComponents();
    await this.testPerformance();
    await this.testSecurity();

    this.summary();
  }

  async testCore() {
    console.log('Testing Core Virtual DOM...');

    // createElement tests
    const vnode = createElement('div', { id: 'test', className: 'container' }, 'Hello');
    assert(vnode.type === 'div', 'createElement creates correct type');
    assert(vnode.props.id === 'test', 'createElement preserves props');
    assert(vnode.props.children[0] === 'Hello', 'createElement handles children');

    // render tests
    const container = createTestContainer();
    render(createElement('p', null, 'Test content'), container);
    assert(container.innerHTML.includes('Test content'), 'render creates DOM elements');
    
    // Re-render test
    render(createElement('p', null, 'Updated'), container);
    assert(container.innerHTML.includes('Updated'), 'render updates existing elements');
    
    cleanup(container);
    this.passed += 4;
  }

  async testHooks() {
    console.log('Testing Hooks System...');
    
    let testState, setTestState;
    let effectCalled = false;
    
    const TestComponent = () => {
      [testState, setTestState] = useState(0);
      
      useEffect(() => {
        effectCalled = true;
      }, [testState]);
      
      return createElement('div', null, `Count: ${testState}`);
    };

    const container = createTestContainer();
    render(createElement(TestComponent), container);
    
    assert(testState === 0, 'reactive initializes correctly');
    assert(effectCalled === true, 'hook runs on mount');
    
    // State update test
    effectCalled = false;
    setTestState(1);
    
    // Wait for async render
    await new Promise(resolve => setTimeout(resolve, 10));
    
    assert(testState === 1, 'reactive updates state');
    assert(container.innerHTML.includes('Count: 1'), 'UI updates with state');
    assert(effectCalled === true, 'hook runs on state change');
    
    cleanup(container);
    this.passed += 5;
  }

  async testTemplates() {
    console.log('Testing Template System...');
    
    // Basic template test
    const name = 'World';
    const template = html`<div>Hello ${name}!</div>`;
    
    const container = createTestContainer();
    render(template, container);
    
    assert(container.innerHTML.includes('Hello World!'), 'html template interpolation works');
    
    // XSS protection test
    const malicious = '<script>alert("xss")</script>';
    const safeTemplate = html`<div>${malicious}</div>`;
    
    render(safeTemplate, container);
    assert(!container.innerHTML.includes('<script>'), 'XSS protection works');
    assert(container.innerHTML.includes('&lt;script&gt;'), 'Dangerous tags are escaped');
    
    // Event handler test
    let clicked = false;
    const handler = () => { clicked = true; };
    const eventTemplate = html`<button onClick="${handler}">Click me</button>`;
    
    render(eventTemplate, container);
    const button = container.querySelector('button');
    button.click();
    
    assert(clicked === true, 'Event handlers work in templates');
    
    cleanup(container);
    this.passed += 4;
  }

  async testComponents() {
    console.log('Testing Component System...');
    
    let mountCalled = false;
    let updateCalled = false;
    
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup(props) {
        const [count, setCount] = useState(props.initial || 0);
        return { count, setCount };
      },
      mounted() {
        mountCalled = true;
      },
      updated() {
        updateCalled = true;
      },
      computed: {
        doubled() {
          return this.count * 2;
        }
      },
      render() {
        return createElement('div', null, [
          createElement('span', null, `Count: ${this.count}`),
          createElement('span', null, `Doubled: ${this.doubled}`)
        ]);
      }
    });

    const container = createTestContainer();
    render(createElement(TestComponent, { initial: 5 }), container);
    
    assert(container.innerHTML.includes('Count: 5'), 'Component props work');
    assert(container.innerHTML.includes('Doubled: 10'), 'Computed properties work');
    
    // Wait for lifecycle
    await new Promise(resolve => setTimeout(resolve, 10));
    assert(mountCalled === true, 'mounted lifecycle hook called');
    
    cleanup(container);
    this.passed += 3;
  }

  async testPerformance() {
    console.log('Testing Performance...');
    
    const startTime = performance.now();
    
    // Create 1000 components
    const items = Array.from({ length: 1000 }, (_, i) => 
      createElement('div', { key: i }, `Item ${i}`)
    );
    
    const container = createTestContainer();
    render(createElement('div', null, items), container);
    
    const renderTime = performance.now() - startTime;
    
    assert(renderTime < 100, `Large render completes quickly (${renderTime.toFixed(2)}ms)`);
    assert(container.children[0].children.length === 1000, 'All items rendered correctly');
    
    // Memory usage test
    const memBefore = performance.memory?.usedJSHeapSize || 0;
    
    // Create and destroy components
    for (let i = 0; i < 100; i++) {
      const testContainer = createTestContainer();
      render(createElement('div', null, `Test ${i}`), testContainer);
      cleanup(testContainer);
    }
    
    const memAfter = performance.memory?.usedJSHeapSize || 0;
    const memDelta = memAfter - memBefore;
    
    if (performance.memory) {
      assert(memDelta < 1024 * 1024, `Memory usage reasonable (${(memDelta/1024).toFixed(1)}KB)`);
    }
    
    cleanup(container);
    this.passed += performance.memory ? 3 : 2;
  }

  async testSecurity() {
    console.log('Testing Security Features...');
    
    const container = createTestContainer();
    
    // XSS in props
    const maliciousProps = { 
      onClick: 'javascript:alert("xss")',
      href: 'javascript:void(0)',
      src: 'data:text/html,<script>alert(1)</script>'
    };
    
    render(createElement('a', maliciousProps, 'Link'), container);
    const link = container.querySelector('a');
    
    // Check that dangerous attributes are sanitized
    assert(!link.getAttribute('href')?.startsWith('javascript:'), 'JavaScript URLs blocked');
    
    // XSS in content
    const xssContent = '<img src="x" onerror="alert(1)">';
    render(html`<div>${xssContent}</div>`, container);
    
    assert(!container.innerHTML.includes('onerror='), 'Event attributes escaped');
    assert(container.innerHTML.includes('&lt;img'), 'HTML tags escaped');
    
    // CSP compliance test
    const cspTest = html`<div style="background: url(javascript:alert(1))">Test</div>`;
    render(cspTest, container);
    
    assert(!container.innerHTML.includes('javascript:'), 'JavaScript in CSS blocked');
    
    cleanup(container);
    this.passed += 4;
  }

  summary() {
    console.log(`\nTest Results:`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed === 0) {
      console.log('All tests passed! MinimaJS is working perfectly.');
    } else {
      console.log('Some tests failed. Check the output above.');
    }
    
    return this.failed === 0;
  }
}

// Auto-run tests if in browser
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const testSuite = new MinimaTestSuite();
    const success = await testSuite.run();
    
    // Display results in UI
    document.body.insertAdjacentHTML('beforeend', `
      <div style="position:fixed;top:10px;right:10px;background:${success ? '#d4edda' : '#f8d7da'};
                  color:${success ? '#155724' : '#721c24'};padding:15px;border-radius:8px;
                  box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:9999;font-family:monospace;font-size:12px">
        <strong>MinimaJS Tests:</strong><br>
        ${testSuite.passed} passed<br>
        ${testSuite.failed} failed<br>
        ${success ? 'All Good!' : 'Issues Found'}
      </div>
    `);
  });
}

export { MinimaTestSuite };
