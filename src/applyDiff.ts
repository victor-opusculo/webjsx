import { updateAttributes } from "./attributes.js";
import { HTML_NAMESPACE } from "./constants.js";
import { createNode } from "./createNode.js";
import { VNode, VRealElement, VRealNode } from "./types.js";
import { flattenVNodes } from "./utils.js";

/**
 * Applies virtual DOM diffing to update the real DOM based on new virtual nodes.
 * @param parent The parent DOM node to update
 * @param vnodes New virtual nodes to apply
 */
export function applyDiff(parent: Node, vnodes: VNode | VNode[]): void {
  const newVNodes = flattenVNodes(vnodes);
  diffChildren(parent, newVNodes);
}

/**
 * Recursively updates child nodes by comparing current DOM nodes with new virtual nodes.
 * Uses a keyed map for efficient node reordering and reuse.
 * @param parent The parent DOM node containing children to diff
 * @param flattenedVNodes Array of flattened virtual nodes to compare against
 */
function diffChildren(parent: Node, flattenedVNodes: VRealNode[]): void {
  const childNodes = parent.childNodes;
  let keyedMap: Map<string | number, Node> | null = null;

  flattenedVNodes.forEach((newVNode, i) => {
    const newKey = isVRealElement(newVNode) ? newVNode.props.key : undefined;
    let existingNode: Node | null = null;

    if (newKey !== undefined) {
      // Lazily initialize keyedMap only when first keyed node is encountered
      if (!keyedMap) {
        keyedMap = new Map();
        for (let i = 0; i < childNodes.length; i++) {
          const node = childNodes[i];
          const key = (node as any).__webjsx_key;
          if (key !== undefined) {
            keyedMap.set(key, node);
          }
        }
      }
      existingNode = keyedMap.get(newKey) || null;
    }

    if (!existingNode && newKey === undefined) {
      existingNode = childNodes[i] || null;
    }

    if (existingNode) {
      if (existingNode !== childNodes[i]) {
        parent.insertBefore(existingNode, childNodes[i] || null);
      }
      updateNode(existingNode, newVNode);
    } else {
      const newDomNode = createNode(newVNode, getNamespaceURI(parent));
      if (isVRealElement(newVNode) && newVNode.props.key !== undefined) {
        (newDomNode as any).__webjsx_key = newVNode.props.key;
      }
      parent.insertBefore(newDomNode, childNodes[i] || null);
    }
  });

  // Remove any remaining old nodes that weren't reused
  while (childNodes.length > flattenedVNodes.length) {
    parent.removeChild(parent.lastChild!);
  }
}

/**
 * Updates an existing DOM node to match a new virtual node.
 * Handles text nodes, element attributes, children, and node replacement.
 * @param domNode Existing DOM node to update
 * @param newVNode New virtual node to apply
 */
function updateNode(domNode: Node, newVNode: VRealNode): void {
  if (typeof newVNode === "string") {
    if (
      domNode.nodeType !== Node.TEXT_NODE ||
      domNode.textContent !== newVNode
    ) {
      const newTextNode = document.createTextNode(newVNode);
      domNode.parentNode!.insertBefore(newTextNode, domNode);
    }
    return;
  }

  if (typeof newVNode === "number") {
    if (
      domNode.nodeType !== Node.TEXT_NODE ||
      domNode.textContent !== newVNode.toString()
    ) {
      const newTextNode = document.createTextNode(newVNode.toString());
      domNode.parentNode!.insertBefore(newTextNode, domNode);
    }
    return;
  }

  if (domNode instanceof HTMLElement) {
    const domNodeKey = (domNode as any).__webjsx_key;
    const newVNodeKey = newVNode.props.key;
    const sameTagName = domNode.tagName === newVNode.tagName;

    if (
      sameTagName &&
      // Both nodes are unkeyed
      ((domNodeKey === undefined && newVNodeKey === undefined) ||
        // Both nodes are keyed and keys match
        (domNodeKey !== undefined &&
          newVNodeKey !== undefined &&
          domNodeKey === newVNodeKey))
    ) {
      const oldProps = (domNode as any).__webjsx_props || {};
      const newProps = newVNode.props || {};
      updateAttributes(domNode, newProps, oldProps);

      if (isVRealElement(newVNode) && newVNode.props.key !== undefined) {
        (domNode as any).__webjsx_key = newVNode.props.key;
      } else {
        delete (domNode as any).__webjsx_key;
      }

      if (newProps.ref) {
        assignRef(domNode, newProps.ref);
      }

      if (
        !newProps.dangerouslySetInnerHTML &&
        newProps.children !== undefined &&
        newProps.children !== null
      ) {
        const children = flattenVNodes(newProps.children);
        diffChildren(domNode, children);
      }
    } else {
      const newDomNode = createNode(
        newVNode,
        domNode.parentNode ? getNamespaceURI(domNode.parentNode) : undefined
      );

      if (isVRealElement(newVNode) && newVNode.props.key !== undefined) {
        (newDomNode as any).__webjsx_key = newVNode.props.key;
      }

      if (isVRealElement(newVNode) && newVNode.props.ref) {
        assignRef(newDomNode, newVNode.props.ref);
      }

      domNode.parentNode!.insertBefore(newDomNode, domNode);
    }
  } else {
    const newDomNode = createNode(
      newVNode,
      domNode.parentNode ? getNamespaceURI(domNode.parentNode) : undefined
    );

    if (isVRealElement(newVNode) && newVNode.props.key !== undefined) {
      (newDomNode as any).__webjsx_key = newVNode.props.key;
    }

    if (isVRealElement(newVNode) && newVNode.props.ref) {
      assignRef(newDomNode, newVNode.props.ref);
    }

    domNode.parentNode!.insertBefore(newDomNode, domNode);
  }
}

/**
 * Assigns a ref to a DOM node, handling both function and object refs.
 * @param node DOM node to assign ref to
 * @param ref Ref to assign (function or object)
 */
function assignRef(node: Node, ref: any): void {
  const currentRef = (node as any).__webjsx_assignedRef;

  if (currentRef !== ref) {
    if (typeof ref === "function") {
      ref(node);
    } else if (ref && typeof ref === "object") {
      ref.current = node;
    }
    (node as any).__webjsx_assignedRef = ref;
  }
}

/**
 * Type guard to check if a virtual node is a VRealElement.
 * @param vnode Virtual node to check
 * @returns True if node is a VRealElement
 */
function isVRealElement(vnode: VRealNode): vnode is VRealElement {
  return typeof vnode !== "string" && typeof vnode !== "number";
}

/**
 * Gets the namespace URI for a node, used for SVG elements.
 * @param node Node to get namespace for
 * @returns Namespace URI if not HTML, undefined otherwise
 */
function getNamespaceURI(node: Node): string | undefined {
  return node instanceof Element && node.namespaceURI !== HTML_NAMESPACE
    ? node.namespaceURI ?? undefined
    : undefined;
}
