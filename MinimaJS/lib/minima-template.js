/**
 * MinimaJS Template Engine v1.0.0 - XSS-Safe HTML Templates
 */

import { createElement } from './minima-core.js';

// XSS Prevention - Comprehensive sanitization rules
const DANGEROUS_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'applet', 'meta', 'link', 'style',
  'form', 'input', 'button', 'select', 'textarea', 'option', 'optgroup'
]);

const DANGEROUS_ATTRS = new Set([
  'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange',
  'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup',
  'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave', 'onscroll',
  'onresize', 'onhashchange', 'onpopstate', 'onbeforeunload', 'onunload',
  'onmessage', 'onstorage', 'ononline', 'onoffline', 'onabort', 'oncanplay',
  'oncanplaythrough', 'ondurationchange', 'onemptied', 'onended', 'oninput',
  'oninvalid', 'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange',
  'onseeked', 'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange',
  'onwaiting', 'onafterprint', 'onbeforeprint', 'onabort', 'oncanplay',
  'oncanplaythrough', 'oncontextmenu', 'oncuechange', 'ondblclick', 'ondrag',
  'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
  'ondurationchange', 'onemptied', 'onended', 'onformchange', 'onforminput',
  'oninput', 'oninvalid', 'onpause', 'onplay', 'onplaying', 'onprogress',
  'onratechange', 'onreset', 'onseeked', 'onseeking', 'onselect', 'onshow',
  'onstalled', 'onsubmit', 'onsuspend', 'ontimeupdate', 'ontoggle', 'onvolumechange',
  'onwaiting', 'onwheel', 'oncopy', 'oncut', 'onpaste', 'onauxclick', 'onpointerdown',
  'onpointerup', 'onpointermove', 'onpointerover', 'onpointerout', 'onpointerenter',
  'onpointerleave', 'onpointercancel', 'ongotpointercapture', 'onlostpointercapture'
]);

const URL_ATTRS = new Set([
  'href', 'src', 'action', 'formaction', 'data', 'background', 'poster',
  'icon', 'manifest', 'content', 'cite', 'longdesc', 'usemap', 'formtarget'
]);

// Sanitize text content
const ESC_MAP = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
const sanitizeText = (text) => {
  if (typeof text !== 'string') return String(text);
  return text.replace(/[<>"'\/]/g, (match) => ESC_MAP[match]);
};

// Validate URLs for XSS protection
const isValidUrl = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return !trimmed.startsWith('javascript:') && !trimmed.startsWith('data:') && 
         !trimmed.startsWith('vbscript:') && !trimmed.includes('javascript:');
};

// Sanitize attribute value
const sanitizeAttr = (name, value) => {
  const nameLower = name.toLowerCase();
  if (DANGEROUS_ATTRS.has(nameLower)) return null;
  if (URL_ATTRS.has(nameLower) && !isValidUrl(value)) return null;
  return typeof value === 'string' ? value.replace(/["']/g, (m) => m === '"' ? '&quot;' : '&#x27;') : value;
};

// HTML parser state machine
const parseHTML = (html) => {
  const tokens = [];
  let i = 0;
  
  while (i < html.length) {
    if (html[i] === '<') {
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) break;
      
      const tagContent = html.slice(i + 1, tagEnd);
      const isClosing = tagContent.startsWith('/');
      const tagName = (isClosing ? tagContent.slice(1) : tagContent).split(/\s/)[0].toLowerCase();
      
      tokens.push(isClosing ? { type: 'close', tag: tagName } : 
        { type: 'open', tag: tagName, attrs: parseAttrs(tagContent.slice(tagName.length)), self: tagContent.endsWith('/') });
      i = tagEnd + 1;
    } else {
      const nextTag = html.indexOf('<', i);
      const text = html.slice(i, nextTag === -1 ? html.length : nextTag).trim();
      if (text) tokens.push({ type: 'text', content: text });
      i = nextTag === -1 ? html.length : nextTag;
    }
  }
  return tokens;
};

// Parse attributes from tag content
const parseAttrs = (attrStr) => {
  const attrs = {};
  const regex = /(\w+)(?:=["']([^"']*?)["'])?/g;
  let match;
  
  while ((match = regex.exec(attrStr)) !== null) {
    const [, name, value = ''] = match;
    const sanitized = sanitizeAttr(name, value);
    if (sanitized !== null) attrs[name] = sanitized;
  }
  
  return attrs;
};

// Convert HTML tokens to VNode tree
const tokensToVNode = (tokens) => {
  const stack = [{ children: [] }];
  
  tokens.forEach(token => {
    const current = stack[stack.length - 1];
    
    if (token.type === 'text') {
      current.children.push(sanitizeText(token.content));
    } else if (token.type === 'open' && !DANGEROUS_TAGS.has(token.tag)) {
      const element = { type: token.tag, props: { ...token.attrs }, children: [] };
      current.children.push(element);
      if (!token.self) stack.push(element);
    } else if (token.type === 'close' && stack.length > 1 && !DANGEROUS_TAGS.has(token.tag)) {
      stack.pop();
    }
  });
  
  return stack[0].children;
};

// Template literal processor
const html = (strings, ...values) => {
  let result = '';
  strings.forEach((str, i) => {
    result += str;
    if (i < values.length) {
      const value = values[i];
      if (typeof value === 'function') {
        result += `__HANDLER_${i}__`;
      } else if (Array.isArray(value)) {
        value.forEach(v => result += typeof v === 'string' ? sanitizeText(v) : '__VNODE__');
      } else {
        result += sanitizeText(value);
      }
    }
  });

  const vnodes = tokensToVNode(parseHTML(result));

  const processVNode = (vnode) => {
    if (typeof vnode === 'string') {
      return vnode.replace(/__HANDLER_(\d+)__/g, (match, idx) => {
        const handler = values[+idx];
        return typeof handler === 'function' ? handler : match;
      });
    }

    if (vnode?.type && vnode.props) {
      Object.keys(vnode.props).forEach(key => {
        const value = vnode.props[key];
        if (typeof value === 'string' && value.includes('__HANDLER_')) {
          const handlerMatch = value.match(/__HANDLER_(\d+)__/);
          if (handlerMatch) {
            const handler = values[+handlerMatch[1]];
            if (typeof handler === 'function') {
              const eventName = key.startsWith('on') ? key : `on${key}`;
              delete vnode.props[key];
              vnode.props[eventName] = handler;
            }
          }
        }
      });

      if (vnode.children?.length) {
        vnode.children = vnode.children.map(processVNode);
        vnode.props.children = vnode.children;
      }

      return createElement(vnode.type, vnode.props, ...vnode.children);
    }

    return vnode;
  };

  if (vnodes.length === 1) return processVNode(vnodes[0]);
  if (vnodes.length > 1) return createElement('div', { className: 'minima-fragment' }, ...vnodes.map(processVNode));
  return null;
};

// CSP-compatible dynamic imports
const loadTemplate = async (url) => {
  if (!isValidUrl(url)) throw new Error('Invalid template URL');
  const response = await fetch(url);
  const text = await response.text();
  return html([text]);
};

export { html, loadTemplate, sanitizeText };
