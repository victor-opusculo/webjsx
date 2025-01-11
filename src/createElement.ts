import { KNOWN_ELEMENTS } from "./elementTags.js";
import {
  ChildTypes,
  Fragment,
  NonBooleanPrimitive,
  VNode,
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
): VNode | VNode[] {
  const normalizedProps: { [key: string]: any } = props ? { ...props } : {};
  const flatChildren: VNode[] = flattenVNodes(children);
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

  if (typeof type === "string") {
    const result: VNode = {
      type,
      tagName: KNOWN_ELEMENTS.get(type) || type.toUpperCase(),
      props: normalizedProps ?? {},
    };
    return result;
  } else {
    return flatChildren;
  }
}

// As called from jsx-runtime.jsx function.
export function createElementJSX(
  type: string | typeof Fragment,
  props: { [key: string]: any } | null,
  key?: NonBooleanPrimitive
): VNode | VNode[] {
  props = props || {};
  const flatChildren: VNode[] = props ? flattenVNodes(props.children) : [];
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

  if (typeof type === "string") {
    const result: VNode = {
      type,
      tagName: KNOWN_ELEMENTS.get(type) || type.toUpperCase(),
      props: props ?? {},
    };
    return result;
  } else {
    return flatChildren;
  }
}
