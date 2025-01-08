import { setAttributes } from "./attributes.js";
import { SVG_NAMESPACE } from "./constants.js";
import { VRealNode, WebJSXManagedElement } from "./types.js";
import { assignRef, flattenVNodes, setWebJSXProps } from "./utils.js";

/**
 * Creates a real DOM node from a virtual node representation.
 * @param vnode Virtual node to convert
 * @param parentNamespaceURI Namespace URI from parent element, if any
 * @returns Created DOM node
 */
export function createNode(
  vnode: VRealNode,
  parentNamespaceURI?: string
): Node {
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  } else if (typeof vnode === "number" || typeof vnode === "bigint") {
    return document.createTextNode(vnode.toString());
  } else {
    const namespaceURI =
      vnode.props.xmlns !== undefined
        ? (vnode.props.xmlns as string)
        : vnode.type === "svg"
        ? SVG_NAMESPACE
        : parentNamespaceURI ?? undefined;

    const el =
      vnode.props.is !== undefined
        ? namespaceURI !== undefined
          ? document.createElementNS(namespaceURI, vnode.type, {
              is: vnode.props.is,
            })
          : document.createElement(vnode.type, {
              is: vnode.props.is,
            })
        : namespaceURI !== undefined
        ? document.createElementNS(namespaceURI, vnode.type)
        : document.createElement(vnode.type);

    if (vnode.props) {
      setAttributes(el, vnode.props);
    }

    if (vnode.props.key !== undefined) {
      (el as WebJSXManagedElement).__webjsx_key = vnode.props.key;
    }

    if (vnode.props.ref) {
      assignRef(el, vnode.props.ref);
    }

    if (vnode.props.children && !vnode.props.dangerouslySetInnerHTML) {
      const children = flattenVNodes(vnode.props.children);

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        el.appendChild(createNode(child, namespaceURI));
      }

      setWebJSXProps(el, { children });
    }

    return el;
  }
}
