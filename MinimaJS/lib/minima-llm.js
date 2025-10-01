/**
 * MinimaJS LLM Layer v1.0.0 - AI-Optimized Development Experience
 * 
 * High-level abstractions designed specifically for LLM code generation
 * - Template builders for common patterns
 * - Fluent chain syntax
 * - Pattern macros for complete features
 * - Error recovery helpers
 * - Type-guided builders
 */

import { 
  h, div, span, p, button, input, a, img, form, ul, li, h1, h2, h3,
  useState, useEffect, component, fc, memo, t, css, render, mount, app,
  click, submit, change, style, className, id, props, attr,
  when, unless, each,
  onMount, onUpdate, onDestroy,
  toggle, counter, inputState, formState,
  fade, slide, route, link, context, debug, log
} from './minima-api.js';

// Cached constants
const CLS = 'className';
const cls = (name) => ({ [CLS]: name });

// =============================================================================
// 1. TEMPLATE BUILDERS - Common UI patterns in one-liners
// =============================================================================

const quickForm = (config) => {
  const [values, updateValue, resetForm] = formState(config.initialValues || {});
  
  const fields = config.fields.map(field => {
    const isStr = typeof field === 'string';
    const fieldName = isStr ? field : field.name;
    const fieldType = isStr ? 'text' : field.type || 'text';
    const fieldLabel = isStr ? field : field.label || fieldName;

    return div(cls('form-field'), [
      p(fieldLabel + ':'),
      input({
        type: fieldType,
        value: values[fieldName] || '',
        onChange: updateValue(fieldName),
        placeholder: fieldLabel
      })
    ]);
  });
  
  return form({
    ...submit(e => {
      e.preventDefault();
      if (config.onSubmit) config.onSubmit(values);
    })
  }, [
    ...fields,
    div(cls('form-actions'), [
      button('Submit'),
      when(config.showReset, button({ onClick: resetForm }, 'Reset'))
    ])
  ]);
};

const quickList = (items, renderItem, options = {}) => 
  h(options.ordered ? 'ol' : 'ul', cls(options[CLS]), 
    items.map((item, index) => li({ key: item.id || index }, renderItem(item, index)))
  );

const quickModal = (isOpen, content, options = {}) => {
  const [show, setShow] = useState(isOpen);
  useEffect(() => setShow(isOpen), [isOpen]);
  
  return when(show, 
    div({ ...cls('modal-overlay'), onClick: () => options.onClose?.() }, [
      div({ ...cls('modal-content'), onClick: e => e.stopPropagation() }, [
        when(options.showClose, button({ ...cls('modal-close'), onClick: () => options.onClose?.() }, '×')),
        content
      ])
    ])
  );
};

const quickCard = (title, content, actions = []) => 
  div(cls('card'), [
    when(title, div(cls('card-header'), h3(title))),
    div(cls('card-body'), content),
    when(actions.length, div(cls('card-actions'), actions))
  ]);

const quickTable = (data, columns) => 
  h('table', cls('data-table'), [
    h('thead', h('tr', columns.map(col => h('th', col.header || col.key)))),
    h('tbody', data.map((row, index) => 
      h('tr', { key: row.id || index }, 
        columns.map(col => h('td', col.render ? col.render(row[col.key], row) : row[col.key]))
      )
    ))
  ]);

// =============================================================================
// 2. CHAIN SYNTAX - Fluent API for component building
// =============================================================================

class ElementBuilder {
  constructor(tag) {
    this.tag = tag;
    this.props = {};
    this.children = [];
  }
  
  class(className) {
    this.props.className = className;
    return this;
  }
  
  text(content) {
    this.children.push(content);
    return this;
  }
  
  child(...elements) {
    this.children.push(...elements);
    return this;
  }
  
  onClick(handler) {
    this.props.onClick = handler;
    return this;
  }
  
  onChange(handler) {
    this.props.onChange = handler;
    return this;
  }
  
  onSubmit(handler) {
    this.props.onSubmit = handler;
    return this;
  }
  
  style(styles) {
    this.props.style = styles;
    return this;
  }
  
  attr(name, value) {
    this.props[name] = value;
    return this;
  }
  
  when(condition) {
    return condition ? this : new NullBuilder();
  }
  
  build() {
    return h(this.tag, this.props, ...this.children);
  }
}

class NullBuilder extends ElementBuilder {
  constructor() { super(null); }
  build() { return null; }
  class() { return this; }
  text() { return this; }
  child() { return this; }
  onClick() { return this; }
  onChange() { return this; }
  onSubmit() { return this; }
  style() { return this; }
  attr() { return this; }
  when() { return this; }
}

// Element builder factories
const $ = (tag) => new ElementBuilder(tag);
const $el = (t) => () => new ElementBuilder(t);
const $div = $el('div'), $span = $el('span'), $p = $el('p'), $button = $el('button');
const $input = $el('input'), $form = $el('form'), $h1 = $el('h1'), $h2 = $el('h2'), $h3 = $el('h3');

// =============================================================================
// 3. PATTERN MACROS - Complete features in minimal code
// =============================================================================

const createApp = {
  // Complete todo app in one call
  todo: (config = {}) => {
    const [todos, setTodos] = useState(config.initialTodos || []);
    const [input, setInput] = useState('');

    const addTodo = () => {
      if (input.trim()) {
        setTodos([...todos, { id: Date.now(), text: input, done: false }]);
        setInput('');
      }
    };

    return div(cls('todo-app'), [
      h1('Todo App'),
      div(cls('todo-input'), [
        input({
          value: input,
          onChange: e => setInput(e.target.value),
          placeholder: 'Add new todo...',
          onKeyPress: e => e.key === 'Enter' && addTodo()
        }),
        button({ onClick: addTodo }, 'Add')
      ]),
      quickList(todos, todo =>
        div({ ...cls(todo.done ? 'todo-item done' : 'todo-item'), key: todo.id }, [
          input({
            type: 'checkbox',
            checked: todo.done,
            onChange: () => setTodos(todos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))
          }),
          span(todo.text),
          button({ onClick: () => setTodos(todos.filter(t => t.id !== todo.id)) }, '×')
        ])
      )
    ]);
  },
  
  // Complete counter app
  counter: (config = {}) => {
    const [count, setCount] = useState(config.initialValue || 0);
    const step = config.step || 1, resetValue = config.initialValue || 0;

    return div(cls('counter-app'), [
      h1(config.title || 'Counter'),
      div(cls('counter-display'), count),
      div(cls('counter-controls'), [
        button({ onClick: () => setCount(count - step) }, '-'),
        button({ onClick: () => setCount(resetValue) }, 'Reset'),
        button({ onClick: () => setCount(count + step) }, '+')
      ])
    ]);
  },
  
  // Complete dashboard layout
  dashboard: (config) => {
    const { header, sidebar, widgets } = config;
    return div(cls('dashboard'), [
      when(header, div(cls('dashboard-header'), header)),
      div(cls('dashboard-content'), [
        when(sidebar, div(cls('dashboard-sidebar'), sidebar)),
        div(cls('dashboard-main'), widgets?.map((widget, index) => div({ ...cls('dashboard-widget'), key: index }, widget)))
      ])
    ]);
  }
};

// =============================================================================
// 4. ERROR RECOVERY - Self-correcting APIs
// =============================================================================

const safeRender = (component, target) => {
  try {
    if (typeof target === 'string') target = document.getElementById(target) || document.querySelector(target);
    if (!target) {
      console.warn('safeRender: Target element not found, creating div');
      target = document.createElement('div');
      document.body.appendChild(target);
    }
    return render(component, target);
  } catch (e) {
    console.error('Render error:', e);
    return render(div(cls('error-boundary'), [
      h2('Render Error'),
      p(`Error: ${e.message}`),
      button({ onClick: () => location.reload() }, 'Reload Page')
    ]), target);
  }
};

const safeComponent = (componentFn) => (...args) => {
  try {
    return componentFn(...args);
  } catch (e) {
    console.error('Component error:', e);
    return div(cls('component-error'), [h3('Component Error'), p(e.message)]);
  }
};

const tryRender = (components) => {
  for (const component of components) {
    try {
      return component();
    } catch (e) {
      console.warn('Component failed, trying next:', e.message);
    }
  }
  return div('All components failed to render');
};

// =============================================================================
// 5. TYPE-GUIDED BUILDERS - IntelliSense-friendly patterns
// =============================================================================

class PageBuilder {
  constructor() {
    this.headerContent = null;
    this.mainContent = null;
    this.footerContent = null;
    this.sidebarContent = null;
  }
  
  header(builder) {
    this.headerContent = typeof builder === 'function' ? builder(new NavBuilder()) : builder;
    return this;
  }
  
  main(builder) {
    this.mainContent = typeof builder === 'function' ? builder(new SectionBuilder()) : builder;
    return this;
  }
  
  sidebar(content) {
    this.sidebarContent = content;
    return this;
  }
  
  footer(builder) {
    this.footerContent = typeof builder === 'function' ? builder(new FooterBuilder()) : builder;
    return this;
  }
  
  build() {
    return div(cls('page-layout'), [
      when(this.headerContent, h('header', cls('page-header'), this.headerContent)),
      div(cls('page-body'), [
        when(this.sidebarContent, h('aside', cls('page-sidebar'), this.sidebarContent)),
        h('main', cls('page-main'), this.mainContent)
      ]),
      when(this.footerContent, h('footer', cls('page-footer'), this.footerContent))
    ]);
  }
}

class NavBuilder {
  constructor() {
    this.brandText = '';
    this.navLinks = [];
  }
  
  brand(text) {
    this.brandText = text;
    return this;
  }
  
  links(links) {
    this.navLinks = links;
    return this;
  }
  
  build() {
    return h('nav', cls('navbar'), [
      when(this.brandText, div(cls('navbar-brand'), this.brandText)),
      div(cls('navbar-links'), this.navLinks.map(link => 
        a({ href: typeof link === 'string' ? `#${link}` : link.href }, typeof link === 'string' ? link : link.text)
      ))
    ]);
  }
}

class SectionBuilder {
  constructor() { this.sections = []; }
  section(content) { this.sections.push(content); return this; }
  build() { return div(cls('main-content'), this.sections); }
}

class FooterBuilder {
  constructor() { this.content = []; }
  
  text(text) {
    this.content.push(p(text));
    return this;
  }
  
  links(links) {
    this.content.push(div(cls('footer-links'), links.map(link => a({ href: link.href }, link.text))));
    return this;
  }
  
  build() { return div(cls('footer-content'), this.content); }
}

const page = () => new PageBuilder();
const builder = () => new PageBuilder();

// =============================================================================
// EXPORTS - Bundle everything for easy importing
// =============================================================================

const llmApi = {
  // Template builders
  quickForm, quickList, quickModal, quickCard, quickTable,
  
  // Chain syntax
  $, $div, $span, $p, $button, $input, $form, $h1, $h2, $h3,
  
  // Pattern macros
  createApp,
  
  // Error recovery
  safeRender, safeComponent, tryRender,
  
  // Type-guided builders
  page, builder, PageBuilder, NavBuilder, SectionBuilder, FooterBuilder
};

export {
  // Template builders
  quickForm, quickList, quickModal, quickCard, quickTable,
  
  // Chain syntax
  $, $div, $span, $p, $button, $input, $form, $h1, $h2, $h3,
  
  // Pattern macros
  createApp,
  
  // Error recovery
  safeRender, safeComponent, tryRender,
  
  // Type-guided builders
  page, builder, PageBuilder, NavBuilder, SectionBuilder, FooterBuilder
};

export default llmApi;
