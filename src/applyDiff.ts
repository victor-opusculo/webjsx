import { updateAttributes } from "./attributes.js";
import { HTML_NAMESPACE } from "./constants.js";
import { createNode } from "./createNode.js";
import { VNode, VRealElement, VRealNode } from "./types.js";
import { flattenVNodes } from "./utils.js";

/**
 * Applies the differences between new virtual node(s) and the existing DOM.
 * @param parent Parent DOM node where the virtual nodes will be applied
 * @param vnodes Single virtual node or array of virtual nodes
 */
export function applyDiff(parent: Node, vnodes: VNode | VNode[]): void {
  const newVNodes = flattenVNodes(vnodes);
  diffChildren(parent, newVNodes);
}

/**
 * Updates the children of a DOM node by comparing with new virtual nodes.
 * @param parent Parent DOM node whose children will be diffed
 * @param childVNodes Array of new virtual nodes
 */
function diffChildren(parent: Node, flattenedVNodes: VRealNode[]): void {
  const keyedMap = new Map<string | number, Node>();
  const childNodes = parent.childNodes;

  // Populate keyedMap with existing keyed nodes
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];
    const key = (node as any).__webjsx_key;
    if (key !== undefined) {
      keyedMap.set(key, node);
    }
  }

  const newKeys = flattenedVNodes
    .filter(isVRealElementWithKey)
    .map((vnode) => vnode.props.key);

  // Remove nodes that are no longer needed
  for (let i = childNodes.length - 1; i >= 0; i--) {
    const node = childNodes[i];
    const key = (node as any).__webjsx_key;
    if (key !== undefined && !newKeys.includes(key)) {
      parent.removeChild(node);
    }
  }

  flattenedVNodes.forEach((newVNode, i) => {
    const newKey = isVRealElement(newVNode) ? newVNode.props.key : undefined;
    let existingNode: Node | null = null;

    if (newKey !== undefined) {
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
        (newDomNode as HTMLElement).setAttribute(
          "data-key",
          newVNode.props.key.toString()
        );
      }
      parent.insertBefore(newDomNode, childNodes[i] || null);
    }
  });

  // Remove excess nodes
  while (childNodes.length > flattenedVNodes.length) {
    parent.removeChild(parent.lastChild!);
  }
}

/**
 * Updates an existing DOM node to match a new virtual node.
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
      domNode.parentNode?.insertBefore(newTextNode, domNode);
    }
    return;
  }

  if (typeof newVNode === "number") {
    if (
      domNode.nodeType !== Node.TEXT_NODE ||
      domNode.textContent !== newVNode.toString()
    ) {
      const newTextNode = document.createTextNode(newVNode.toString());
      domNode.parentNode?.insertBefore(newTextNode, domNode);
    }
    return;
  }

  if (
    domNode instanceof HTMLElement &&
    domNode.tagName.toLowerCase() === (newVNode.type as string).toLowerCase()
  ) {
    const oldProps = (domNode as any).__webjsx_props || {};
    const newProps = newVNode.props || {};
    updateAttributes(domNode, newProps, oldProps);

    if (isVRealElement(newVNode) && newVNode.props.key !== undefined) {
      (domNode as any).__webjsx_key = newVNode.props.key;
      domNode.setAttribute("data-key", newVNode.props.key.toString());
    } else {
      delete (domNode as any).__webjsx_key;
      domNode.removeAttribute("data-key");
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
      (newDomNode as HTMLElement).setAttribute(
        "data-key",
        newVNode.props.key.toString()
      );
    }

    if (isVRealElement(newVNode) && newVNode.props.ref) {
      assignRef(newDomNode, newVNode.props.ref);
    }

    domNode.parentNode?.insertBefore(newDomNode, domNode);
  }
}

/**
 * Assigns a ref to a DOM node.
 * @param node DOM node to assign the ref to
 * @param ref Reference to assign (function or object with current property)
 */
function assignRef(node: Node, ref: any): void {
  const currentRef = (node as any).__webjsx_assignedRef;

  // Only assign the ref if it's different
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

/**
 * Checks if a virtual node is a VElement.
 * @param vnode Virtual node to check
 * @returns True if vnode is a VElement
 */
function isVRealElement(vnode: VRealNode): vnode is VRealElement {
  return typeof vnode === "object" && vnode !== null && "props" in vnode;
}

/**
 * Checks if a virtual node is a VElement with a key property.
 * @param vnode Virtual node to check
 * @returns True if vnode is a VElement with a key
 */
function isVRealElementWithKey(
  vnode: VRealNode
): vnode is VRealElement & { props: { key: string | number } } {
  return isVRealElement(vnode) && vnode.props.key !== undefined;
}

function getNamespaceURI(node: Node): string | undefined {
  return node instanceof Element && node.namespaceURI !== HTML_NAMESPACE
    ? node.namespaceURI ?? undefined
    : undefined;
}
