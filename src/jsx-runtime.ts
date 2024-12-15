import { createElement } from "./createElement.js";
import { Fragment } from "./types.js";
export * from "./jsx.js";

export { Fragment };

export function jsx(type: any, props: any, key: any) {
  const normalizedProps = { ...props };
  if (key !== undefined) {
    normalizedProps.key = key;
  }
  const { children, ...restProps } = normalizedProps;
  return createElement(type, restProps, children);
}

export function jsxs(type: any, props: any, key: any) {
  return jsx(type, props, key);
}

export function jsxDEV(type: any, props: any, key: any) {
  return jsx(type, props, key);
}

export const JSXFragment = Fragment;
