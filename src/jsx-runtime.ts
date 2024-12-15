import { createElement } from "./createElement.js";
import { Fragment } from "./types.js";

export { Fragment };

export function jsx(type: any, props: any, key: any) {
  const normalizedProps = { ...props };
  if (key !== undefined) {
    normalizedProps.key = key;
  }
  return createElement(type, normalizedProps);
}

export function jsxs(type: any, props: any, key: any) {
  return jsx(type, props, key);
}

export function jsxDEV(type: any, props: any, key: any) {
  return jsx(type, props, key);
}

// Add this new export
export const JSXFragment = Fragment;