import { Fragment, VElement, VNode } from "./types.js";

/**
 * Type guard to check if a VNode is a Fragment.
 * @param vnode The virtual node to check.
 * @returns True if vnode is a Fragment, false otherwise.
 */
export function isFragment(vnode: VNode | null | undefined): vnode is VElement {
  return typeof vnode === "object" && vnode !== null && vnode.type === Fragment;
}

/**
 * Flattens the list of virtual nodes by recursively replacing Fragments with their children.
 * @param vnodes The array of virtual nodes to flatten.
 * @returns A new array of virtual nodes with all Fragments flattened.
 */
export function flattenVNodes(
  vnodes: VNode | VNode[] | null | undefined
): VNode[] {
  const flat: VNode[] = [];

  const arrayVNodes = Array.isArray(vnodes) ? vnodes : [vnodes];

  arrayVNodes.forEach((vnode) => {
    if (isFragment(vnode)) {
      const children = vnode.props.children ? vnode.props.children : [];
      // Recursively flatten any nested fragments
      flat.push(...flattenVNodes(children));
    } else if (vnode !== null && vnode !== undefined) {
      flat.push(vnode);
    }
  });

  return flat;
}
