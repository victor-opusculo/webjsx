import { createElement } from "./createElement.js";
import { Fragment } from "./types.js";
export * from "./jsx.js";

export { Fragment };

/**
 * JSX transform factory function.
 * @param type Element type or component
 * @param props Element properties
 * @param key Optional key for element identification
 * @returns Virtual element
 */
export function jsx(type: any, props: any, key: any) {
  const normalizedProps = { ...props };
  if (key !== undefined) {
    normalizedProps.key = key;
  }
  const { children, ...restProps } = normalizedProps;
  return createElement(type, restProps, children);
}

/**
 * JSX transform factory for elements with multiple children.
 * Functionally identical to jsx() in this implementation.
 */
export function jsxs(type: any, props: any, key: any) {
  return jsx(type, props, key);
}

/**
 * Development mode JSX transform factory.
 * Currently identical to jsx() in this implementation.
 */
export function jsxDEV(type: any, props: any, key: any) {
  return jsx(type, props, key);
}

export const JSXFragment = Fragment;
