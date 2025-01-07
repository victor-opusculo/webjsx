import { ChildTypes, Fragment, VElement, VNode, VRealNode } from "./types.js";

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
  } else if (!ignoreVNode(vnodes)) {
    result.push(vnodes);
  }

  return result;
}
export function ignoreVNode(vnode: VNode | null | undefined) {
  return vnode === null || vnode === undefined || typeof vnode === "boolean";
}
