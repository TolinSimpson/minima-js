/**
 * MinimaJS Server-Side Rendering v1.0.0 - Universal Rendering
 */

import { createElement } from './minima-core.js';
import { sanitizeText } from './minima-template.js';

// Server environment detection
const isServer = typeof window === 'undefined';

// HTML attribute serialization
const serializeAttrs = (props) => {
  const attrs = [];
  Object.keys(props).forEach(key => {
    if (key === 'children' || key === 'key') return;
    
    const value = props[key];
    if (key.startsWith('on') && typeof value === 'function') {
      // Skip event handlers in SSR
      return;
    }
    
    if (value === true) {
      attrs.push(key);
    } else if (value !== false && value != null) {
      attrs.push(`${key}="${sanitizeText(String(value))}"`);
    }
  });
  return attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
};

// Self-closing HTML tags
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr'
]);

// VNode to HTML string conversion
const vnodeToString = (vnode) => {
  if (vnode == null || vnode === false) return '';
  
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return sanitizeText(String(vnode));
  }
  
  if (Array.isArray(vnode)) {
    return vnode.map(vnodeToString).join('');
  }
  
  if (typeof vnode === 'function') {
    // Function component - execute in SSR context
    return vnodeToString(vnode({}));
  }
  
  if (!vnode.type) return '';
  
  if (typeof vnode.type === 'function') {
    // Component - render and convert
    const rendered = vnode.type(vnode.props || {});
    return vnodeToString(rendered);
  }
  
  // Regular HTML element
  const tag = vnode.type;
  const attrs = serializeAttrs(vnode.props || {});
  const children = vnode.props?.children || [];
  
  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${attrs}/>`;
  }
  
  const childrenHTML = Array.isArray(children) 
    ? children.map(vnodeToString).join('')
    : vnodeToString(children);
  
  return `<${tag}${attrs}>${childrenHTML}</${tag}>`;
};

// Server-side rendering entry point
const renderToString = (component, props = {}) => {
  if (typeof component === 'function') {
    const vnode = component(props);
    return vnodeToString(vnode);
  }
  
  if (component && component.type) {
    return vnodeToString(component);
  }
  
  throw new Error('renderToString: Invalid component');
};

// Hydration - make server-rendered HTML interactive
const hydrate = (component, container, serverHTML) => {
  if (isServer) {
    console.warn('hydrate() called in server environment');
    return;
  }
  
  // Store original HTML for mismatch detection
  const originalHTML = container.innerHTML;
  
  try {
    // Mark container as hydrating
    container.setAttribute('data-minima-hydrating', 'true');
    
    // Render component on client
    const vnode = typeof component === 'function' 
      ? component({})
      : component;
    
    // Compare with server HTML for mismatches
    const clientHTML = vnodeToString(vnode);
    const serverNormalized = normalizeHTML(serverHTML || originalHTML);
    const clientNormalized = normalizeHTML(clientHTML);
    
    if (serverNormalized !== clientNormalized) {
      console.warn('Hydration mismatch detected, falling back to client render');
      container.innerHTML = '';
      hydrateClientOnly(vnode, container);
    } else {
      // Successful hydration - attach event listeners
      hydrateInteractive(container);
    }
    
  } catch (error) {
    console.error('Hydration error:', error);
    // Fallback to client-only rendering
    container.innerHTML = '';
    hydrateClientOnly(typeof component === 'function' ? component({}) : component, container);
  } finally {
    container.removeAttribute('data-minima-hydrating');
  }
};

// Normalize HTML for comparison (remove whitespace differences)
const normalizeHTML = (html) => {
  return html
    .replace(/>\s+</g, '><')
    .replace(/^\s+|\s+$/g, '')
    .toLowerCase();
};

// Client-only rendering fallback
const hydrateClientOnly = (vnode, container) => {
  // Import render dynamically to avoid circular dependency
  import('./minima-core.js').then(({ render }) => {
    render(vnode, container);
  });
};

// Attach event listeners to server-rendered HTML
const hydrateInteractive = (container) => {
  // Find all elements with data attributes that indicate event handlers
  const elements = container.querySelectorAll('[data-minima-events]');
  
  elements.forEach(element => {
    const eventData = element.getAttribute('data-minima-events');
    try {
      const events = JSON.parse(eventData);
      Object.keys(events).forEach(eventType => {
        const handlerName = events[eventType];
        // Handler functions would need to be registered globally or passed in context
        if (window[handlerName] && typeof window[handlerName] === 'function') {
          element.addEventListener(eventType, window[handlerName]);
        }
      });
    } catch (e) {
      console.warn('Failed to parse event data:', eventData);
    }
  });
};

// Preload components for better SSR performance
const preloadComponent = async (componentPath) => {
  if (isServer) {
    // Server-side: use dynamic import
    try {
      const module = await import(componentPath);
      return module.default || module;
    } catch (error) {
      console.error('Failed to preload component:', componentPath, error);
      return null;
    }
  } else {
    // Client-side: use fetch + eval (if CSP allows) or dynamic import
    try {
      const response = await fetch(componentPath);
      const code = await response.text();
      // Use dynamic import instead of eval for CSP compliance
      const blob = new Blob([code], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const module = await import(url);
      URL.revokeObjectURL(url);
      return module.default || module;
    } catch (error) {
      console.error('Failed to preload component:', componentPath, error);
      return null;
    }
  }
};

// SSR-friendly data fetching
const ssrData = (key, fetcher) => {
  if (isServer) {
    // Server-side: execute fetcher immediately
    return fetcher();
  } else {
    // Client-side: check for server-injected data first
    const ssrDataElement = document.querySelector(`script[data-ssr-key="${key}"]`);
    if (ssrDataElement) {
      try {
        return JSON.parse(ssrDataElement.textContent);
      } catch (e) {
        console.warn('Failed to parse SSR data for key:', key);
      }
    }
    // Fallback to client fetch
    return fetcher();
  }
};

// Inject SSR data into HTML (server-side)
const injectSSRData = (html, dataMap) => {
  let scripts = '';
  Object.keys(dataMap).forEach(key => {
    const data = JSON.stringify(dataMap[key]);
    scripts += `<script type="application/json" data-ssr-key="${key}">${data}</script>`;
  });
  
  // Insert before closing body tag
  return html.replace('</body>', `${scripts}</body>`);
};

export { renderToString, hydrate, preloadComponent, ssrData, injectSSRData };
