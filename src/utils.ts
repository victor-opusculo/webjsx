import { Fragment, VElement, VNode } from "./types.js";

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
  vnodes: VNode | VNode[] | null | undefined
): VNode[] {
  if (Array.isArray(vnodes)) {
    const flat: VNode[] = [];

    vnodes.forEach((vnode) => {
      if (isFragment(vnode)) {
        const children = vnode.props.children ? vnode.props.children : [];
        // Recursively flatten nested fragments
        flat.push(...flattenVNodes(children));
      } else if (vnode !== null && vnode !== undefined) {
        flat.push(vnode);
      }
    });

    return flat;
  } else if (vnodes !== null && vnodes !== undefined) {
    return [vnodes];
  } else {
    return [];
  }
}
