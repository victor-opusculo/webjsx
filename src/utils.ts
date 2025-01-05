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
export function flattenVNodes(vnodes: ChildTypes): VRealNode[] {
  if (Array.isArray(vnodes)) {
    const flat: VRealNode[] = [];
    vnodes.forEach((vnode) => {
      flat.push(...flattenVNodes(vnode));
    });
    return flat;
  } else if (isFragment(vnodes)) {
    const flat: VRealNode[] = [];
    const children = vnodes.props.children ?? [];
    flat.push(...flattenVNodes(children));
    return flat;
  } else if (ignoreVNode(vnodes)) {
    return [];
  } else {
    return [vnodes];
  }
}

export function ignoreVNode(vnode: VNode | null | undefined) {
  return vnode === null || vnode === undefined || typeof vnode === "boolean";
}
