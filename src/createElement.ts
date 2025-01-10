import { KNOWN_ELEMENTS } from "./elementTags.js";
import {
  ChildTypes,
  Fragment,
  NonBooleanPrimitive,
  VElement,
  VNode,
  VRealNode,
} from "./types.js";
import { flattenVNodes } from "./utils.js";

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
  ...children: ChildTypes[]
): VElement {
  const normalizedProps: { [key: string]: any } = props ? { ...props } : {};
  const flatChildren: VRealNode[] = flattenVNodes(children);
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
    tagName:
      typeof type === "string"
        ? KNOWN_ELEMENTS[type as keyof typeof KNOWN_ELEMENTS] ||
          type.toUpperCase()
        : undefined,
    props: normalizedProps,
  };
}

// As called from jsx-runtime.jsx function.
export function createElementJSX(
  type: string | typeof Fragment,
  props: { [key: string]: any } | null,
  key?: NonBooleanPrimitive
): VElement {
  props = props || {};
  const flatChildren: VRealNode[] = props ? flattenVNodes(props.children) : [];
  if (key !== undefined) {
    props.key = key;
  }
  if (flatChildren.length > 0) {
    // Set children property only if dangerouslySetInnerHTML is not present
    if (!props.dangerouslySetInnerHTML) {
      props.children = flatChildren;
    } else {
      props.children = [];
      console.warn(
        "WebJSX: Ignoring children since dangerouslySetInnerHTML is set."
      );
    }
  }
  return {
    type,
    tagName:
      typeof type === "string"
        ? KNOWN_ELEMENTS[type as keyof typeof KNOWN_ELEMENTS] ||
          type.toUpperCase()
        : undefined,
    props,
  };
}
