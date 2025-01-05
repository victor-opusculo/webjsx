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
      if (Array.isArray(vnode)) {
        flat.push(...flattenVNodes(vnode));
      } else if (isFragment(vnode)) {
        const children = vnode.props.children ? vnode.props.children : [];
        // Recursively flatten nested fragments
        flat.push(...flattenVNodes(children));
      } else if (
        vnode !== null &&
        vnode !== undefined &&
        typeof vnode !== "boolean"
      ) {
        flat.push(vnode);
      }
    });

    return flat;
  } else if (isFragment(vnodes)) {
    const flat: VRealNode[] = [];
    const children = vnodes.props.children ? vnodes.props.children : [];
    // Recursively flatten nested fragments
    flat.push(...flattenVNodes(children));
    return flat;
  } else if (vnodes !== null && vnodes !== undefined) {
    return [vnodes];
  } else {
    return [];
  }
}
