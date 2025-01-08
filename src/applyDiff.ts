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
  isNonBooleanPrimitive,
  isVRealElement,
  setWebJSXProps,
} from "./utils.js";

type DOMChange =
  | { type: "create"; vnode: VRealNode }
  | { type: "update"; domNode: Node; newVNode: VRealNode; oldVNode: VRealNode };

export function applyDiff(parent: Element | ShadowRoot, vnodes: VNode): void {
  const newVNodes = flattenVNodes(vnodes);
  diffChildren(parent, newVNodes);
  const currentProps = (parent as WebJSXManagedElement).__webjsx_props;
  if (currentProps) {
    currentProps.children = newVNodes;
  } else {
    setWebJSXProps(parent, { children: newVNodes });
  }
}

function diffChildren(
  parent: Element | ShadowRoot,
  newVNodes: VRealNode[]
): void {
  const oldVNodes =
    (parent as WebJSXManagedElement).__webjsx_props?.children ?? [];
  const changes: DOMChange[] = [];
  let keyedMap: Map<NonBooleanPrimitive, Node> | null = null;
  const originalChildNodes = getChildNodes(parent);
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
          domNode: keyedNode,
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
          domNode: currentNode,
          newVNode,
          oldVNode,
        });
      } else {
        changes.push({ type: "create", vnode: newVNode });
      }
    }
  }

  const lastPlacedNode = applyChanges(parent, changes, originalChildNodes);

  // Remove any remaining nodes
  let nodeToRemove = lastPlacedNode ? lastPlacedNode.nextSibling : null;

  while (nodeToRemove) {
    const nextNode = nodeToRemove.nextSibling;
    parent.removeChild(nodeToRemove);
    nodeToRemove = nextNode;
  }
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
): Node | null {
  let lastPlacedNode: Node | null = null;

  for (const change of changes) {
    if (change.type === "create") {
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
          diffChildren(domNode as Element, children);
          setWebJSXProps(domNode as Element, newProps);
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
      lastPlacedNode = domNode;
    }
  }
  return lastPlacedNode;
}
