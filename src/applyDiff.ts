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
    let nodeAtPosition: Node | null = childNodes[i] || null;

    if (newKey !== undefined) {
      // Lazily initialize keyedMap only when first keyed node is encountered
      if (!keyedMap) {
        keyedMap = new Map();
        for (let j = 0; j < childNodes.length; j++) {
          const node = childNodes[j];
          const key = (node as any).__webjsx_key;
          if (key !== undefined) {
            keyedMap.set(key, node);
          }
        }
      }
      const keyedNode = keyedMap.get(newKey);
      if (keyedNode && keyedNode !== nodeAtPosition) {
        parent.insertBefore(keyedNode, nodeAtPosition);
        nodeAtPosition = keyedNode;
      }
    }

    tryUpdateOrCreateNode(parent, nodeAtPosition, newVNode);
  });

  // Remove any remaining old nodes that weren't reused
  while (childNodes.length > flattenedVNodes.length) {
    parent.removeChild(parent.lastChild!);
  }
}

/**
 * Updates an existing DOM node or creates a new one to match a virtual node.
 * Handles node positioning, text nodes, element attributes, and children.
 * @param parent The parent DOM node
 * @param nodeAtPosition Existing DOM node at the target position
 * @param newVNode New virtual node to apply
 */
function tryUpdateOrCreateNode(
  parent: Node,
  nodeAtPosition: Node | null,
  newVNode: VRealNode
): void {
  if (nodeAtPosition) {
    if (typeof newVNode === "string") {
      if (
        nodeAtPosition.nodeType !== Node.TEXT_NODE ||
        nodeAtPosition.textContent !== newVNode
      ) {
        const newTextNode = document.createTextNode(newVNode);
        parent.insertBefore(newTextNode, nodeAtPosition);
      }
      return;
    }

    if (typeof newVNode === "number") {
      if (
        nodeAtPosition.nodeType !== Node.TEXT_NODE ||
        nodeAtPosition.textContent !== newVNode.toString()
      ) {
        const newTextNode = document.createTextNode(newVNode.toString());
        parent.insertBefore(newTextNode, nodeAtPosition);
      }
      return;
    }

    // Try to update existing element
    const domNodeKey = (nodeAtPosition as any).__webjsx_key;
    const newVNodeKey = newVNode.props.key;
    const sameTagName =
      nodeAtPosition instanceof HTMLElement &&
      nodeAtPosition.tagName === newVNode.tagName;

    if (
      sameTagName &&
      ((domNodeKey === undefined && newVNodeKey === undefined) ||
        (domNodeKey !== undefined &&
          newVNodeKey !== undefined &&
          domNodeKey === newVNodeKey))
    ) {
      const element = nodeAtPosition as HTMLElement;
      if (element !== nodeAtPosition) {
        parent.insertBefore(element, nodeAtPosition);
      }

      const oldProps = (element as any).__webjsx_props || {};
      const newProps = newVNode.props || {};
      updateAttributes(element, newProps, oldProps);

      if (newVNode.props.key !== undefined) {
        (element as any).__webjsx_key = newVNode.props.key;
      } else {
        delete (element as any).__webjsx_key;
      }

      if (newProps.ref) {
        assignRef(element, newProps.ref);
      }

      if (
        !newProps.dangerouslySetInnerHTML &&
        newProps.children !== undefined &&
        newProps.children !== null
      ) {
        const children = flattenVNodes(newProps.children);
        diffChildren(element, children);
      }
      return;
    }
  }

  // Create new node
  const newDomNode = createNode(newVNode, getNamespaceURI(parent));
  if (typeof newVNode !== "string" && typeof newVNode !== "number") {
    if (newVNode.props.key !== undefined) {
      (newDomNode as any).__webjsx_key = newVNode.props.key;
    }
    if (newVNode.props.ref) {
      assignRef(newDomNode, newVNode.props.ref);
    }
  }
  parent.insertBefore(newDomNode, nodeAtPosition);
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
