import { HTML_NAMESPACE } from "./constants.js";
import {
  ChildTypes,
  ElementProps,
  Fragment,
  NonBooleanPrimitive,
  VElement,
  VNode,
  VRealElement,
  VRealNode,
  WebJSXManagedElement,
} from "./types.js";

/**
 * Checks if a virtual node is a Fragment.
 * @param vnode Virtual node to check
 * @returns True if node is a Fragment
 */
export function isFragment(vnode: VNode | null | undefined): vnode is VElement {
  return typeof vnode === "object" && vnode !== null && vnode.type === Fragment;
}

/**
 * Flattens nested virtual nodes by replacing Fragments with their children.
 * @param vnodes Virtual nodes to flatten
 * @returns Array of flattened virtual nodes
 */
export function flattenVNodes(
  vnodes: ChildTypes,
  result: VRealNode[] = []
): VRealNode[] {
  if (Array.isArray(vnodes)) {
    for (const vnode of vnodes) {
      flattenVNodes(vnode, result);
    }
  } else if (isFragment(vnodes)) {
    const children = vnodes.props.children;
    if (children !== undefined) {
      flattenVNodes(children, result);
    }
  } else if (!mustIgnoreVNode(vnodes)) {
    result.push(vnodes);
  }

  return result;
}
export function mustIgnoreVNode(vnode: VNode | null | undefined) {
  return vnode === null || vnode === undefined || typeof vnode === "boolean";
}

/* Get Child Nodes Efficiently */
export function getChildNodes(parent: Node): Node[] {
  const nodes: Node[] = [];
  let current: Node | null = parent.firstChild;

  while (current) {
    nodes.push(current);
    current = current.nextSibling;
  }

  return nodes;
}

/**
 * Assigns a ref to a DOM node.
 * @param node Target DOM node
 * @param ref Reference to assign (function or object with current property)
 */
export function assignRef(node: Node, ref: any): void {
  const currentRef = (node as any).__webjsx_assignedRef;

  // Only assign if the ref is different
  if (currentRef !== ref) {
    if (typeof ref === "function") {
      ref(node);
    } else if (ref && typeof ref === "object") {
      ref.current = node;
    }

    // Store the assigned ref
    (node as any).__webjsx_assignedRef = ref;
  }
}

export function isVRealElement(vnode: VRealNode): vnode is VRealElement {
  return (
    typeof vnode !== "string" &&
    typeof vnode !== "number" &&
    typeof vnode !== "bigint"
  );
}

export function isNonBooleanPrimitive(
  vnode: VRealNode
): vnode is NonBooleanPrimitive {
  return (
    typeof vnode === "string" ||
    typeof vnode === "number" ||
    typeof vnode === "bigint"
  );
}

export function getNamespaceURI(node: Node): string | undefined {
  return node instanceof Element && node.namespaceURI !== HTML_NAMESPACE
    ? node.namespaceURI ?? undefined
    : undefined;
}

export function setWebJSXProps(element: Element | ShadowRoot, props: ElementProps) {
  (element as WebJSXManagedElement).__webjsx_props = props;
}
