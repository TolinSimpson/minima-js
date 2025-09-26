# MinimaJS JavaScript API v1.0.0

```
LEGEND: REQ:required OPT:optional CTX:context ERR:error-types RET:return-type
VARS: X:version Y:method-count Z:max-complexity
```

## OVERVIEW
```
NAMESPACE:[window.MinimaJS] MODES:[core|template|component|ssr] SIZE:[9KB-18KB] COMPAT:[ES6+browsers]
```

## CORE API (9KB)
```
createElement(type:string|function, props:object OPT, ...children:any[]) → VNode REQ:type CTX:any
render(vnode:VNode, container:Element) → void REQ:both CTX:browser-only
useState(initial:any) → [value:any, setter:function] REQ:initial CTX:component-only
useEffect(effect:function, deps:array OPT) → void REQ:effect CTX:component-only
Fragment → Symbol REQ:none CTX:any
```

## TEMPLATE API (+3KB)
```
html(strings:TemplateStringsArray, ...values:any[]) → VNode REQ:strings CTX:template-mode
css(strings:TemplateStringsArray, ...values:any[]) → StyleSheet REQ:strings CTX:template-mode
when(condition:boolean, template:VNode) → VNode REQ:both CTX:template-mode
map(items:array, fn:function) → VNode[] REQ:both CTX:template-mode
parseTemplate(template:string, context:object) → VNode REQ:template CTX:secure-only
```

## COMPONENT API (+2KB)
```
defineComponent(options:ComponentOptions) → Component REQ:options CTX:component-mode
computed(getter:function) → ComputedRef REQ:getter CTX:component-only  
watch(source:any, callback:function) → UnsubscribeFn REQ:both CTX:component-only
onMounted(callback:function) → void REQ:callback CTX:component-lifecycle
onUpdated(callback:function) → void REQ:callback CTX:component-lifecycle
onUnmounted(callback:function) → void REQ:callback CTX:component-lifecycle
```

## SSR API (+4KB)
```
renderToString(component:Component, props:object OPT) → string REQ:component CTX:node-js
renderToStream(component:Component, props:object OPT) → ReadableStream REQ:component CTX:node-js
hydrate(component:Component, container:Element, serverHTML:string) → void REQ:all CTX:browser-ssr
generateChecksum(html:string) → string REQ:html CTX:ssr-validation
createRouter(routes:RouteConfig[]) → Router REQ:routes CTX:universal
generateStaticHTML(routes:RouteConfig[]) → Promise<string[]> REQ:routes CTX:node-js
```

## TYPE DEFINITIONS
```js
VNode{type:string, tag:string|function, props:object, children:VNode[], key:string|number|null, ref:function|object|null}
ComponentOptions{data:function OPT, methods:object OPT, computed:object OPT, watch:object OPT, mounted:function OPT, render:function REQ}
ComputedRef{value:any readonly, dependencies:any[]}
RouteConfig{path:string REQ, component:Component REQ, meta:object OPT, guards:function[] OPT}
```

## SECURITY SCHEMAS
```js
SanitizedHTML{content:string, safe:boolean, checksum:string}
SecureTemplate{template:string, valuePositions:object[], compiled:function}
CSPPolicy{scriptSrc:string[], styleSrc:string[], defaultSrc:string[]}
```

## CONTEXT REQUIREMENTS
```
component-only:[useState, useEffect, computed, watch] → Must be called inside component render
template-mode:[html, css, when, map] → Requires MinimaJS.template loaded
node-js:[renderToString, renderToStream, generateStaticHTML] → Server-side only
browser-ssr:[hydrate] → Client-side hydration only
```

## ERROR TYPES
```
HookError:called-outside-component→[useState/useEffect outside render] DEV-ACTION:[Move inside component]
SecurityError:unsafe-template→[Blocked dangerous content] DEV-ACTION:[Review template values]
HydrationError:checksum-mismatch→[Server/client HTML differs] DEV-ACTION:[Check server rendering]
ContextError:wrong-environment→[SSR method in browser] DEV-ACTION:[Use correct environment]
ValidationError:invalid-props→[Component props validation failed] DEV-ACTION:[Check prop types]
```

## PERFORMANCE LIMITS
```
COMPONENT-NESTING:[10]levels MAX-CHILDREN:[1000]per-element TEMPLATE-CACHE:[500]entries
HOOK-COUNT:[50]per-component STATE-UPDATES:[batched]per-frame MEMORY-LIMIT:[auto-cleanup]
```

## BROWSER COMPATIBILITY
```
ES6-FEATURES:[Map, Set, WeakMap, Proxy, Symbol] APIS:[DOM, DOMParser, requestAnimationFrame]
SUPPORT:[Chrome≥51, Firefox≥54, Safari≥10, Edge≥79] POLYFILLS:[not-provided]
```

## VALIDATION
```
✓all-methods-tested ✓security-enforced ✓performance-limits ✓errors-documented ✓type-safety
```
