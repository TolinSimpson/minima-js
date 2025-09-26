# MinimaJS v1.0.0

```
LEGEND: TGT:target DEP:dependencies ARC:architecture CMP:compatibility SZ:size PRF:performance CD:code BR:browser M/S/C:Must/Should/Could L:lines
VARS: X:src-size Y:min-size Z:nesting-depth A/B/C:feature-refs
```

## SPECS
```
TGT:[size|perf|security] DEP:[0] ARC:[spa|lib] CMP:[browser-ES6+]  
SZ:src[18]kb,min[18]kb PRF:load[16]ms CD:files[4],func[500]L,nest[3]
```

## FEATURES
```
M:[createElement, useState, useEffect, render, diff, html templates, XSS protection, CSP-strict compliance]
S:[defineComponent, computed, watch, lifecycle hooks, renderToString, hydrate, routing]
C:[development server, hot reload, error boundaries, performance monitoring, test runner]
```

## USERS
```
WHO:[JavaScript developers, AI agents] USE:[Build modern web apps, Replace React/Vue, No-build development] WIN:[<18KB bundle, <16ms render, Zero security issues]
```

## SECURITY
```
AUTH:[none-client-side] DATA:[XSS-sanitization] EXPOSE:[browser-APIs] RISKS:[XSS-injection, eval-usage, CSP-violations]
```

## ROADMAP
```
v1.0:[Core Virtual DOM + Templates]→[9KB+3KB React-like experience]
v1.1:[Component System]→depends:[Core+Templates]
v1.2:[SSR+Hydration]→depends:[All previous modes]
v2.0:[Developer Tools]→unlocks:[Professional adoption]
GOAL:[React/Vue alternative] DEPS:Core→Templates→Components→SSR BLOCKS:[None]
```

## API
```js
createElement(type:string|function, props:object, ...children):VNode
useState(initial:any):[value, setter]  
useEffect(effect:function, deps:array):void
render(vnode:VNode, container:Element):void
html(strings:array, ...values:any[]):VNode
defineComponent(options:object):Component
renderToString(component:Component, props:object):string
hydrate(component:Component, container:Element, serverHTML:string):void
```

## FLOW
```
Component→[createElement]→VNode→[diff]→DOM | State→[useState]→Rerender→[diff]→Update
Template→[html`${}`]→[parseHTMLTemplate]→[sanitize]→VNode→DOM
SSR→[renderToString]→HTML→[hydrate]→Interactive
```

## BUILD+ARCH+RULES
```
BUILD: 1.[core]→[minima-core.js]→[300]L 2.[template]→[minima-template.js]→[150]L 3.[component]→[minima-component.js]→[100]L 4.[ssr]→[minima-ssr.js]→[200]L
ARCH: /src/minima-core.js[9]kb /src/minima-template.js[3]kb /src/minima-component.js[2]kb /src/minima-ssr.js[4]kb
RULES: fn:pure[10]L events:delegate dom:surgical state:component-local security:no-eval
```

## LIMITS
```
PRF:load[16]ms,render[8]ms DEP:NONE
```

## VALIDATE
```
✓M-features ✓PRF[16]ms ✓deps[0] ✓cross-browser ✓compressed ✓CSP-strict ✓XSS-protected
```

## EDGE+TEST
```
ERR:[hook-outside-component]→[throw error] FALL:[hydration-mismatch]→[client-render] LIM:inp[sanitized],comp[WeakMap-tracked]
UNIT:[createElement]→[props,children]→[VNode] INT:[useState]→[state-change]→[rerender] BR:[chrome|firefox|safari|edge]→[pass]
```

```
PROTOCOL: DESIGN-DOC→CODE→OPT→MEASURE→VALIDATE
SUCCESS: 100%feat+SZ[18KB]+0deps+security-compliant
```
