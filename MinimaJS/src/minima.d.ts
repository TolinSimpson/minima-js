/**
 * MinimaJS TypeScript Definitions v1.0.0
 */

// Core types
export interface VNode {
  type: string | Function;
  props: Record<string, any>;
  key?: string | number | null;
}

export interface ComponentProps {
  children?: VNode | VNode[] | string | number;
  key?: string | number;
  [prop: string]: any;
}

export type StateSetter<T> = (value: T | ((prev: T) => T)) => void;
export type StateHook<T> = [T, StateSetter<T>];

export type EffectCallback = () => void | (() => void);
export type DependencyList = ReadonlyArray<any>;

// Event types
export interface DOMAttributes<T> {
  onClick?: (event: MouseEvent) => void;
  onInput?: (event: InputEvent) => void;
  onChange?: (event: Event) => void;
  onSubmit?: (event: SubmitEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
}

export interface HTMLAttributes<T> extends DOMAttributes<T> {
  id?: string;
  className?: string;
  style?: string | Partial<CSSStyleDeclaration>;
  title?: string;
  lang?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  hidden?: boolean;
  tabIndex?: number;
}

// Core API
export function createElement<P = {}>(
  type: string | ((props: P) => VNode),
  props?: P & ComponentProps,
  ...children: (VNode | string | number)[]
): VNode;

export function useState<T>(initialState: T): StateHook<T>;
export function useState<T = undefined>(): StateHook<T | undefined>;

export function useEffect(effect: EffectCallback, deps?: DependencyList): void;

export function render(vnode: VNode, container: Element): void;

// Template API
export function html(
  strings: TemplateStringsArray,
  ...values: any[]
): VNode;

export function loadTemplate(url: string): Promise<VNode>;
export function sanitizeText(text: string): string;

// Component API
export interface ComponentOptions<P = {}> {
  name?: string;
  props?: Record<string, PropType>;
  setup?: (props: P) => Record<string, any>;
  render?: (this: ComponentContext<P>) => VNode;
  beforeMount?: () => void;
  mounted?: () => void;
  beforeUpdate?: () => void;
  updated?: () => void;
  beforeUnmount?: () => void;
  unmounted?: () => void;
  computed?: Record<string, () => any>;
  watch?: Record<string, (newVal: any, oldVal: any) => void>;
}

export interface PropType {
  type?: any;
  required?: boolean;
  default?: any;
}

export interface ComponentContext<P = {}> {
  props: P;
  $emit: (eventName: string, payload?: any) => void;
  $update: () => void;
  $forceUpdate: () => void;
  [key: string]: any;
}

export function defineComponent<P = {}>(
  options: ComponentOptions<P>
): (props: P) => VNode;

export function withProps<P, A>(
  Component: (props: P & A) => VNode,
  additionalProps: A
): (props: P) => VNode;

export function compose(...components: Function[]): Function;

export const Fragment: (props: { children: VNode[] }) => VNode[];

export function memo<P>(
  Component: (props: P) => VNode,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): (props: P) => VNode;

// SSR API
export function renderToString(component: Function, props?: any): string;

export function hydrate(
  component: Function,
  container: Element,
  serverHTML?: string
): void;

export function preloadComponent(componentPath: string): Promise<Function | null>;

export function ssrData<T>(key: string, fetcher: () => T): T;

export function injectSSRData(
  html: string,
  dataMap: Record<string, any>
): string;

// Enhanced API shortcuts
export const h: typeof createElement;

// HTML element shortcuts
export function div(props?: HTMLAttributes<HTMLDivElement>, ...children: (VNode | string | number)[]): VNode;
export function span(props?: HTMLAttributes<HTMLSpanElement>, ...children: (VNode | string | number)[]): VNode;
export function p(props?: HTMLAttributes<HTMLParagraphElement>, ...children: (VNode | string | number)[]): VNode;
export function button(props?: HTMLAttributes<HTMLButtonElement>, ...children: (VNode | string | number)[]): VNode;
export function input(props?: HTMLAttributes<HTMLInputElement>, ...children: (VNode | string | number)[]): VNode;
export function a(props?: HTMLAttributes<HTMLAnchorElement>, ...children: (VNode | string | number)[]): VNode;
export function img(props?: HTMLAttributes<HTMLImageElement>, ...children: (VNode | string | number)[]): VNode;
export function form(props?: HTMLAttributes<HTMLFormElement>, ...children: (VNode | string | number)[]): VNode;
export function ul(props?: HTMLAttributes<HTMLUListElement>, ...children: (VNode | string | number)[]): VNode;
export function li(props?: HTMLAttributes<HTMLLIElement>, ...children: (VNode | string | number)[]): VNode;
export function h1(props?: HTMLAttributes<HTMLHeadingElement>, ...children: (VNode | string | number)[]): VNode;
export function h2(props?: HTMLAttributes<HTMLHeadingElement>, ...children: (VNode | string | number)[]): VNode;
export function h3(props?: HTMLAttributes<HTMLHeadingElement>, ...children: (VNode | string | number)[]): VNode;

// Hook shortcuts
export const state: typeof useState;
export const effect: typeof useEffect;

// Component shortcuts
export const component: typeof defineComponent;
export function fc<P = {}>(render: (props: P) => VNode): (props: P) => VNode;

// Template shortcuts
export const t: typeof html;
export function css(strings: TemplateStringsArray, ...values: any[]): string;

// Render shortcuts
export function mount(component: VNode, target: string | Element): void;
export function app(component: VNode, target?: string): void;

// Event helpers
export function click(handler: (event: MouseEvent) => void): { onClick: (event: MouseEvent) => void };
export function submit(handler: (event: SubmitEvent) => void): { onSubmit: (event: SubmitEvent) => void };
export function change(handler: (event: Event) => void): { onChange: (event: Event) => void };

// Prop helpers
export function style(styles: Partial<CSSStyleDeclaration> | string): { style: any };
export function className(classes: string): { className: string };
export function id(idValue: string): { id: string };
export function props(...objects: Record<string, any>[]): Record<string, any>;
export function attr(name: string, value: any): Record<string, any>;

// Control flow
export function when<T>(condition: boolean, component: T): T | null;
export function unless<T>(condition: boolean, component: T): T | null;
export function each<T, R>(items: T[], renderFn: (item: T, index: number) => R): R[];

// Lifecycle helpers
export function onMount(fn: () => void | (() => void)): void;
export function onUpdate(fn: () => void | (() => void), deps?: DependencyList): void;
export function onDestroy(fn: () => void): void;

// State management helpers
export function toggle(initialValue?: boolean): [boolean, () => void];
export function counter(initialValue?: number): [number, () => void, () => void, (value: number) => void];

// Form helpers
export function form<T extends Record<string, any>>(
  initialValues?: T
): [T, (field: keyof T) => (e: Event) => void, () => void];

// Animation helpers
export function fade(show: boolean, duration?: number): { style: Partial<CSSStyleDeclaration> };
export function slide(show: boolean, duration?: number): { style: Partial<CSSStyleDeclaration> };

// Router helpers
export function route(path: string, component: VNode): VNode | null;
export function link(to: string, children: VNode | string, props?: HTMLAttributes<HTMLAnchorElement>): VNode;

// Context helpers
export function context<T>(
  initialValue: T
): [(props: { value: T; children: VNode }) => VNode, () => T];

// Debug helpers
export function debug<T>(component: T): T;
export function log<T>(value: T, label?: string): T;

// Framework metadata
export const version: string;
export const features: string[];

// Quick setup
export function createApp(rootComponent: Function, container: string | Element): {
  container: Element;
  component: Function;
};

// Default export with all APIs
declare const api: {
  createElement: typeof createElement;
  useState: typeof useState;
  useEffect: typeof useEffect;
  render: typeof render;
  html: typeof html;
  defineComponent: typeof defineComponent;
  h: typeof h;
  div: typeof div;
  span: typeof span;
  p: typeof p;
  button: typeof button;
  input: typeof input;
  a: typeof a;
  img: typeof img;
  form: typeof form;
  ul: typeof ul;
  li: typeof li;
  h1: typeof h1;
  h2: typeof h2;
  h3: typeof h3;
  state: typeof state;
  effect: typeof effect;
  component: typeof component;
  fc: typeof fc;
  memo: typeof memo;
  t: typeof t;
  css: typeof css;
  mount: typeof mount;
  app: typeof app;
  click: typeof click;
  submit: typeof submit;
  change: typeof change;
  style: typeof style;
  className: typeof className;
  id: typeof id;
  props: typeof props;
  attr: typeof attr;
  when: typeof when;
  unless: typeof unless;
  each: typeof each;
  onMount: typeof onMount;
  onUpdate: typeof onUpdate;
  onDestroy: typeof onDestroy;
  toggle: typeof toggle;
  counter: typeof counter;
  fade: typeof fade;
  slide: typeof slide;
  route: typeof route;
  link: typeof link;
  context: typeof context;
  debug: typeof debug;
  log: typeof log;
};

export default api;
