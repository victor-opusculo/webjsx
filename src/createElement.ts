import { Fragment, VElement, VNode } from "./types.js";

type CreateElementTypes = VNode | null | undefined | Array<CreateElementTypes>;

export function createElement(
  type: string | typeof Fragment,
  props: { [key: string]: any } | null,
  ...children: CreateElementTypes[]
): VElement {
  const normalizedProps: { [key: string]: any } = props ? { ...props } : {};
  const flatChildren: VNode[] = [];

  function flatten(child: CreateElementTypes) {
    if (Array.isArray(child)) {
      child.forEach(flatten);
    } else if (typeof child === "string" || typeof child === "number") {
      flatChildren.push(child);
    } else if (
      child === null ||
      child === undefined ||
      typeof child === "boolean"
    ) {
      // Ignore nulls, undefined, and booleans
      // Ignore booleans because React ignores them
    } else {
      flatChildren.push(child);
    }
  }

  children.forEach(flatten);

  if (flatChildren.length > 0) {
    // Only set children if dangerouslySetInnerHTML is not present
    if (!normalizedProps.dangerouslySetInnerHTML) {
      normalizedProps.children = flatChildren;
    } else {
      console.warn(
        "WebJSX: Ignoring children since dangerouslySetInnerHTML is set."
      );
    }
  }

  return {
    type,
    props: normalizedProps,
  };
}
