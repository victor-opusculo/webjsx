export const Fragment = (props: { children?: VNode | VNode[] }): VNode[] => {
  return props.children
    ? Array.isArray(props.children)
      ? props.children
      : [props.children]
    : [];
};

export type FragmentType = typeof Fragment;

export type Primitive = string | number | boolean;

/**
 * Reference type for DOM nodes.
 * Can be either a callback function or an object with a current property.
 */
export type Ref<T extends Node = Node> =
  | ((node: T | null) => void)
  | { current: T | null };

/**
 * Properties that can be applied to elements.
 */
export interface ElementProps {
  [key: string]: any;

  xmlns?: string;
  class?: string;
  children?: VNode | VNode[] | null;
  key?: string | number;
  dangerouslySetInnerHTML?: { __html: string };
  ref?: Ref<Node>;
}

/**
 * Virtual element structure.
 */
export interface VElement {
  type: string | FragmentType;
  props: ElementProps;
}

export type VNode = VElement | Primitive;

/**
 * Interface for components that support render suspension.
 */
export type WebJSXAwareComponent = {
  __webjsx_suspendRendering?: () => void;
  __webjsx_resumeRendering?: () => void;
} & HTMLElement;
