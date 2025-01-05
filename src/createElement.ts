import { Fragment, VElement, VNode } from "./types.js";

type CreateElementTypes = VNode | null | undefined | Array<CreateElementTypes>;

/**
 * Creates a virtual element representing a DOM node or Fragment.
 * @param type Element type (tag name) or Fragment
 * @param props Properties and attributes for the element
 * @param children Child elements or content
 * @returns Virtual element representation
 */
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
      // Skip null, undefined, and boolean children
    } else {
      flatChildren.push(child);
    }
  }

  children.forEach(flatten);

  if (flatChildren.length > 0) {
    // Set children property only if dangerouslySetInnerHTML is not present
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
