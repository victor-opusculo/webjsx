import { HTML_NAMESPACE } from "./constants.js";
import { createNode } from "./createNode.js";
import { VNode, VElement, Fragment } from "./types.js";
import { updateAttributes } from "./attributes.js";
import { flattenVNodes } from "./utils.js";

/**
 * Applies the differences between the new virtual node(s) and the existing DOM.
 * @param parent The parent DOM node where the virtual nodes will be applied.
 * @param newVirtualNode A single virtual node or an array of virtual nodes.
 */
export function applyDiff(parent: Node, newVirtualNode: VNode | VNode[]): void {
  const newVNodes = Array.isArray(newVirtualNode)
    ? newVirtualNode
    : [newVirtualNode];
  diffChildren(parent, newVNodes);
}

/**
 * Diffs and updates the children of a DOM node based on the new virtual nodes.
 * @param parent The parent DOM node whose children will be diffed.
 * @param childVNodes An array of new virtual nodes.
 */
function diffChildren(parent: Node, childVNodes: VNode[]): void {
  const flattenedVNodes = flattenVNodes(childVNodes);
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
    .filter(isVElementWithKey)
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
    const newKey = isVElement(newVNode) ? newVNode.props.key : undefined;
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
      if (isVElement(newVNode) && newVNode.props.key !== undefined) {
        (newDomNode as any).__webjsx_key = newVNode.props.key;
        (newDomNode as HTMLElement).setAttribute(
          "data-key",
          String(newVNode.props.key)
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
 * Updates a DOM node to match the new virtual node.
 * @param domNode The existing DOM node to be updated.
 * @param newVNode The new virtual node to apply.
 */
function updateNode(domNode: Node, newVNode: VNode): void {
  if (typeof newVNode === "string") {
    if (
      domNode.nodeType !== Node.TEXT_NODE ||
      domNode.textContent !== newVNode
    ) {
      const newTextNode = document.createTextNode(newVNode);
      domNode.parentNode?.replaceChild(newTextNode, domNode);
    }
    return;
  }

  if (typeof newVNode === "number" || typeof newVNode === "boolean") {
    if (
      domNode.nodeType !== Node.TEXT_NODE ||
      domNode.textContent !== String(newVNode)
    ) {
      const newTextNode = document.createTextNode(String(newVNode));
      domNode.parentNode?.replaceChild(newTextNode, domNode);
    }
    return;
  }

  if (newVNode.type === Fragment) {
    const fragment = document.createDocumentFragment();

    const children = flattenVNodes(newVNode.props.children);

    children.forEach((child) => {
      fragment.appendChild(createNode(child, undefined));
    });

    domNode.parentNode?.replaceChild(fragment, domNode);
    return;
  }

  if (
    domNode instanceof HTMLElement &&
    domNode.tagName.toLowerCase() === (newVNode.type as string).toLowerCase()
  ) {
    const oldProps = (domNode as any).__webjsx_props || {};
    const newProps = newVNode.props || {};
    updateAttributes(domNode, newProps, oldProps);

    if (isVElement(newVNode) && newVNode.props.key !== undefined) {
      (domNode as any).__webjsx_key = newVNode.props.key;
      domNode.setAttribute("data-key", String(newVNode.props.key));
    } else {
      delete (domNode as any).__webjsx_key;
      domNode.removeAttribute("data-key");
    }

    if (newProps.ref) {
      assignRef(domNode, newProps.ref);
    }

    if (!newProps.dangerouslySetInnerHTML && newProps.children !== undefined) {
      diffChildren(domNode, flattenVNodes(newProps.children));
    }
  } else {
    const newDomNode = createNode(
      newVNode,
      domNode.parentNode ? getNamespaceURI(domNode.parentNode) : undefined
    );

    if (isVElement(newVNode) && newVNode.props.key !== undefined) {
      (newDomNode as any).__webjsx_key = newVNode.props.key;
      (newDomNode as HTMLElement).setAttribute(
        "data-key",
        String(newVNode.props.key)
      );
    }

    if (isVElement(newVNode) && newVNode.props.ref) {
      assignRef(newDomNode, newVNode.props.ref);
    }

    domNode.parentNode?.replaceChild(newDomNode, domNode);
  }
}

/**
 * Assigns a ref to a node.
 * @param node The DOM node.
 * @param ref The ref to assign.
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
 * Type guard to check if a VNode is a VElement.
 * @param vnode The virtual node to check.
 * @returns True if vnode is a VElement, false otherwise.
 */
function isVElement(vnode: VNode): vnode is VElement {
  return typeof vnode === "object" && vnode !== null && "props" in vnode;
}

/**
 * Type guard to check if a VNode is a VElement with a key.
 * @param vnode The virtual node to check.
 * @returns True if vnode is a VElement with a key, false otherwise.
 */
function isVElementWithKey(
  vnode: VNode
): vnode is VElement & { props: { key: string | number } } {
  return isVElement(vnode) && vnode.props.key !== undefined;
}

function getNamespaceURI(node: Node): string | undefined {
  return node instanceof Element && node.namespaceURI !== HTML_NAMESPACE
    ? node.namespaceURI ?? undefined
    : undefined;
}
