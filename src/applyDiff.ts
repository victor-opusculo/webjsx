import { updateAttributes } from "./attributes.js";
import { createNode } from "./createNode.js";
import {
  NonBooleanPrimitive,
  VNode,
  VRealElement,
  VRealNode,
  WebJSXManagedElement,
} from "./types.js";
import {
  assignRef,
  flattenVNodes,
  getChildNodes,
  getNamespaceURI,
  getWebJSXChildNodeCache,
  getWebJSXProps,
  isNonBooleanPrimitive,
  isVRealElement,
  setWebJSXChildNodeCache,
  setWebJSXProps,
} from "./utils.js";

type DOMChange =
  | { type: "create"; vnode: VRealNode }
  | { type: "update"; node: Node; newVNode: VRealNode; oldVNode: VRealNode };

export function applyDiff(parent: Element | ShadowRoot, vnodes: VNode): void {
  const newVNodes = flattenVNodes(vnodes);
  const newNodes = diffChildren(parent, newVNodes);
  const props = getWebJSXProps(parent);
  props.children = newVNodes;
  setWebJSXChildNodeCache(parent, newNodes);
}

function diffChildren(
  parent: Element | ShadowRoot,
  newVNodes: VRealNode[]
): Node[] {
  const parentProps = getWebJSXProps(parent);
  const oldVNodes = parentProps.children ?? [];
  const changes: DOMChange[] = [];
  let keyedMap: Map<NonBooleanPrimitive, Node> | null = null;

  const originalChildNodes =
    getWebJSXChildNodeCache(parent) ?? getChildNodes(parent);

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
          type: "update",
          node: keyedNode,
          newVNode,
          oldVNode,
        });
      } else {
        changes.push({ type: "create", vnode: newVNode });
      }
    } else {
      if (
        !hasKeyedNodes &&
        canUpdateVNodes(newVNode, oldVNode) &&
        currentNode
      ) {
        changes.push({
          type: "update",
          node: currentNode,
          newVNode,
          oldVNode,
        });
      } else {
        changes.push({ type: "create", vnode: newVNode });
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
  const nodes: Node[] = [];

  let lastPlacedNode: Node | null = null;

  for (const change of changes) {
    if (change.type === "create") {
      let node: Node | undefined = undefined;
      if (isVRealElement(change.vnode)) {
        node = createNode(change.vnode, getNamespaceURI(parent));
      } else {
        node = document.createTextNode(
          typeof change.vnode === "number" || typeof change.vnode === "bigint"
            ? change.vnode.toString()
            : change.vnode
        );
      }
      if (!lastPlacedNode) {
        parent.prepend(node);
      } else {
        parent.insertBefore(node, lastPlacedNode.nextSibling ?? null);
      }
      lastPlacedNode = node;
      nodes.push(node);
    } else {
      const { node, newVNode, oldVNode } = change;
      if (isVRealElement(newVNode)) {
        const oldProps = (node as WebJSXManagedElement).__webjsx_props || {};
        const newProps = newVNode.props;
        updateAttributes(node as Element, newProps, oldProps);

        if (newVNode.props.key !== undefined) {
          (node as WebJSXManagedElement).__webjsx_key = newVNode.props.key;
        } else {
          if ((oldVNode as VRealElement).props?.key) {
            delete (node as any).__webjsx_key;
          }
        }

        if (newVNode.props.ref) {
          assignRef(node, newVNode.props.ref);
        }

        if (!newProps.dangerouslySetInnerHTML && newProps.children != null) {
          const childNodes = diffChildren(node as Element, newProps.children);
          setWebJSXProps(node as Element, newProps);
          setWebJSXChildNodeCache(node as Element, childNodes);
        }
      } else {
        if (newVNode !== oldVNode) {
          node.textContent =
            typeof newVNode !== "string" ? newVNode.toString() : newVNode;
        }
      }

      if (!lastPlacedNode) {
        if (node !== originalNodes[0]) {
          parent.prepend(node);
        }
      } else {
        if (lastPlacedNode.nextSibling !== node) {
          parent.insertBefore(node, lastPlacedNode.nextSibling ?? null);
        }
      }
      lastPlacedNode = node;
      nodes.push(node);
    }
  }
  return { nodes, lastNode: lastPlacedNode };
}
