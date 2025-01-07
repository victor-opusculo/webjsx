import { updateAttributes } from "./attributes.js";
import { HTML_NAMESPACE } from "./constants.js";
import { createNode } from "./createNode.js";
import {
  NonBooleanPrimitive,
  VNode,
  VRealElement,
  VRealNode,
  WebJSXManagedElement,
} from "./types.js";
import { flattenVNodes } from "./utils.js";

type DOMChange =
  | { type: "create"; vnode: VRealNode }
  | { type: "update"; domNode: Node; vnode: VRealNode };

export function applyDiff(parent: Element | ShadowRoot, vnodes: VNode): void {
  const newVNodes = flattenVNodes(vnodes);
  diffChildren(parent, newVNodes);
  (parent as WebJSXManagedElement).__webjsx_props = { children: newVNodes };
}

function diffChildren(
  parent: Element | ShadowRoot,
  newVNodes: VRealNode[]
): void {
  const oldVNodes =
    (parent as WebJSXManagedElement).__webjsx_props?.children ?? [];
  const changes: DOMChange[] = [];
  let keyedMap: Map<string | number, Node> | null = null;
  let nodeAtPosition: Node | null = parent.firstChild;

  for (let i = 0; i < newVNodes.length; i++) {
    const newVNode = newVNodes[i];
    const oldVNode = oldVNodes[i];
    const newKey = isVRealElement(newVNode) ? newVNode.props.key : undefined;

    if (newKey !== undefined) {
      if (!keyedMap) {
        keyedMap = new Map();
        let node: Node | null = nodeAtPosition;
        while (node) {
          const key = (node as any).__webjsx_key;
          if (key !== undefined) {
            keyedMap.set(key, node);
          }
          node = node.nextSibling;
        }
      }

      const keyedNode = keyedMap.get(newKey);
      if (keyedNode) {
        changes.push({ type: "update", domNode: keyedNode, vnode: newVNode });
        continue;
      }
    }

    if (canUpdateVNodes(oldVNode, newVNode) && nodeAtPosition) {
      changes.push({
        type: "update",
        domNode: nodeAtPosition,
        vnode: newVNode,
      });
    } else {
      changes.push({ type: "create", vnode: newVNode });
    }

    nodeAtPosition = nodeAtPosition?.nextSibling ?? null;
  }

  // Apply the changes
  let lastPlacedNode: Node | null = null;

  for (const change of changes) {
    if (change.type === "create") {
      if (isVRealElement(change.vnode)) {
        const newDomNode = createNode(change.vnode, getNamespaceURI(parent));
        if (change.vnode.props.key !== undefined) {
          (newDomNode as any).__webjsx_key = change.vnode.props.key;
        }
        if (change.vnode.props.ref) {
          assignRef(newDomNode, change.vnode.props.ref);
        }
        if (!lastPlacedNode) {
          parent.prepend(newDomNode);
        } else {
          parent.insertBefore(newDomNode, lastPlacedNode?.nextSibling ?? null);
        }

        lastPlacedNode = newDomNode;
      } else {
        const newTextNode = document.createTextNode(
          typeof change.vnode === "number" || typeof change.vnode === "bigint"
            ? change.vnode.toString()
            : change.vnode
        );
        if (!lastPlacedNode) {
          parent.prepend(newTextNode);
        } else {
          parent.insertBefore(newTextNode, lastPlacedNode?.nextSibling ?? null);
        }

        lastPlacedNode = newTextNode;
      }
    } else {
      const { domNode, vnode } = change;
      if (isVRealElement(vnode)) {
        const oldProps = (domNode as WebJSXManagedElement).__webjsx_props || {};
        const newProps = vnode.props;
        updateAttributes(domNode as Element, newProps, oldProps);

        if (vnode.props.key !== undefined) {
          (domNode as any).__webjsx_key = vnode.props.key;
        } else {
          delete (domNode as any).__webjsx_key;
        }

        if (vnode.props.ref) {
          assignRef(domNode, vnode.props.ref);
        }

        if (!newProps.dangerouslySetInnerHTML && newProps.children != null) {
          const children = flattenVNodes(newProps.children);
          diffChildren(domNode as Element, children);
        }
      } else {
        domNode.textContent =
          typeof vnode !== "string" ? vnode.toString() : vnode;
      }

      if (!lastPlacedNode) {
        parent.prepend(domNode);
      } else {
        if (lastPlacedNode.nextSibling !== domNode) {
          parent.insertBefore(domNode, lastPlacedNode?.nextSibling ?? null);
        }
      }
      lastPlacedNode = domNode;
    }
  }

  // Remove any remaining nodes
  let nodeToRemove = lastPlacedNode ? lastPlacedNode.nextSibling : null;

  while (nodeToRemove) {
    const nextNode = nodeToRemove.nextSibling;
    parent.removeChild(nodeToRemove);
    nodeToRemove = nextNode;
  }
}

function canUpdateVNodes(
  oldVNode: VRealNode | undefined,
  newVNode: VRealNode
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

function isVRealElement(vnode: VRealNode): vnode is VRealElement {
  return (
    typeof vnode !== "string" &&
    typeof vnode !== "number" &&
    typeof vnode !== "bigint"
  );
}

function isNonBooleanPrimitive(vnode: VRealNode): vnode is NonBooleanPrimitive {
  return (
    typeof vnode === "string" ||
    typeof vnode === "number" ||
    typeof vnode === "bigint"
  );
}

function getNamespaceURI(node: Node): string | undefined {
  return node instanceof Element && node.namespaceURI !== HTML_NAMESPACE
    ? node.namespaceURI ?? undefined
    : undefined;
}
