import { updateAttributes } from "./attributes.js";
import { createNode } from "./createNode.js";
import {
  NonBooleanPrimitive,
  VNode,
  VRealNode,
  WebJSXManagedElement,
} from "./types.js";
import {
  assignRef,
  flattenVNodes,
  getChildNodes,
  getNamespaceURI,
  getWebJSXProps,
  isNonBooleanPrimitive,
  isVRealElement,
  setWebJSXProps,
} from "./utils.js";

const CREATE_NODE_CHANGE = 1 as const;
const UPDATE_NODE_CHANGE = 2 as const;

type DOMChange =
  | { type: typeof CREATE_NODE_CHANGE; vnode: VRealNode }
  | {
      type: typeof UPDATE_NODE_CHANGE;
      domNode: Node;
      newVNode: VRealNode;
      oldVNode: VRealNode;
    };

export function applyDiff(parent: Element | ShadowRoot, vnodes: VNode): void {
  const newVNodes = flattenVNodes(vnodes);
  const newDomNodes = diffChildren(parent, newVNodes);
  setWebJSXProps(parent, newVNodes, newDomNodes);
}

function diffChildren(
  parent: Element | ShadowRoot,
  newVNodes: VRealNode[]
): Node[] {
  const webJSXProps = getWebJSXProps(parent);
  const oldVNodes = webJSXProps?.children ?? [];
  const changes: DOMChange[] = [];
  let keyedMap: Map<NonBooleanPrimitive, Node> | null = null;
  const originalChildNodes = webJSXProps.addedDomNodes ?? getChildNodes(parent);
  let hasKeyedNodes = false;

  for (let i = 0; i < newVNodes.length; i++) {
    const newVNode = newVNodes[i];
    const oldVNode = oldVNodes[i];
    const currentNode = originalChildNodes[i];
    const newKey = isVRealElement(newVNode) ? newVNode.props.key : undefined;

    if (newKey !== undefined) {
      if (!keyedMap) {
        hasKeyedNodes = true;
        keyedMap = new Map();
        for (const node of originalChildNodes) {
          const key = (node as WebJSXManagedElement).__webjsx_key;
          if (key !== undefined) {
            keyedMap.set(key, node);
          }
        }
      }

      const keyedNode = keyedMap.get(newKey);
      if (keyedNode) {
        changes.push({
          type: UPDATE_NODE_CHANGE,
          domNode: keyedNode,
          newVNode,
          oldVNode,
        });
      } else {
        changes.push({ type: CREATE_NODE_CHANGE, vnode: newVNode });
      }
    } else {
      if (
        !hasKeyedNodes &&
        canUpdateVNodes(newVNode, oldVNode) &&
        currentNode
      ) {
        changes.push({
          type: UPDATE_NODE_CHANGE,
          domNode: currentNode,
          newVNode,
          oldVNode,
        });
      } else {
        changes.push({ type: CREATE_NODE_CHANGE, vnode: newVNode });
      }
    }
  }

  const { nodes, lastNode: lastPlacedNode } = applyChanges(
    parent,
    changes,
    originalChildNodes
  );

  // Remove any remaining nodes
  let nodeToRemove = lastPlacedNode ? lastPlacedNode.nextSibling : null;

  while (nodeToRemove) {
    const nextNode = nodeToRemove.nextSibling;
    parent.removeChild(nodeToRemove);
    nodeToRemove = nextNode;
  }

  return nodes;
}

function canUpdateVNodes(
  newVNode: VRealNode,
  oldVNode: VRealNode | undefined
): boolean {
  if (!oldVNode) return false;

  if (isNonBooleanPrimitive(newVNode) && isNonBooleanPrimitive(oldVNode)) {
    return true;
  } else {
    if (isVRealElement(oldVNode) && isVRealElement(newVNode)) {
      const oldKey = oldVNode.props.key;
      const newKey = newVNode.props.key;

      return (
        oldVNode.tagName === newVNode.tagName &&
        ((oldKey === undefined && newKey === undefined) ||
          (oldKey !== undefined && newKey !== undefined && oldKey === newKey))
      );
    } else {
      return false;
    }
  }
}

function applyChanges(
  parent: Element | ShadowRoot,
  changes: DOMChange[],
  originalNodes: Node[]
): { nodes: Node[]; lastNode: Node | null } {
  const addedNodes: Node[] = [];

  let lastPlacedNode: Node | null = null;

  for (const change of changes) {
    if (change.type === CREATE_NODE_CHANGE) {
      let newNode: Node | undefined = undefined;
      if (isVRealElement(change.vnode)) {
        newNode = createNode(change.vnode, getNamespaceURI(parent));
      } else {
        newNode = document.createTextNode(
          typeof change.vnode === "number" || typeof change.vnode === "bigint"
            ? change.vnode.toString()
            : change.vnode
        );
      }
      if (!lastPlacedNode) {
        parent.prepend(newNode);
      } else {
        parent.insertBefore(newNode, lastPlacedNode.nextSibling ?? null);
      }
      addedNodes.push(newNode);
      lastPlacedNode = newNode;
    } else {
      const { domNode, newVNode, oldVNode } = change;
      if (isVRealElement(newVNode)) {
        const oldProps = (domNode as WebJSXManagedElement).__webjsx_props || {};
        const newProps = newVNode.props;
        updateAttributes(domNode as Element, newProps, oldProps);

        if (newVNode.props.key !== undefined) {
          (domNode as WebJSXManagedElement).__webjsx_key = newVNode.props.key;
        } else {
          delete (domNode as any).__webjsx_key;
        }

        if (newVNode.props.ref) {
          assignRef(domNode, newVNode.props.ref);
        }

        if (!newProps.dangerouslySetInnerHTML && newProps.children != null) {
          const children = flattenVNodes(newProps.children);
          const newDomNodes = diffChildren(domNode as Element, children);
          setWebJSXProps(domNode as Element, children, newDomNodes);
        }
      } else {
        if (newVNode !== oldVNode) {
          domNode.textContent =
            typeof newVNode !== "string" ? newVNode.toString() : newVNode;
        }
      }

      if (!lastPlacedNode) {
        if (domNode !== originalNodes[0]) {
          parent.prepend(domNode);
        }
      } else {
        if (lastPlacedNode.nextSibling !== domNode) {
          parent.insertBefore(domNode, lastPlacedNode.nextSibling ?? null);
        }
      }
      addedNodes.push(domNode);
      lastPlacedNode = domNode;
    }
  }
  return { nodes: addedNodes, lastNode: lastPlacedNode };
}
