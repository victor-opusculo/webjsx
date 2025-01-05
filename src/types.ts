export const Fragment = (props: { children?: VNode | VNode[] }): VNode[] => {
  return props.children
    ? Array.isArray(props.children)
      ? props.children
      : [props.children]
    : [];
};

export type FragmentType = typeof Fragment;

export type Primitive = string | number | boolean;

export type Ref<T extends Node = Node> =
  | ((node: T | null) => void)
  | { current: T | null };

export interface ElementProps {
  [key: string]: any;

  xmlns?: string;
  class?: string;
  children?: VNode | VNode[] | null;
  key?: string | number;
  dangerouslySetInnerHTML?: { __html: string };
  ref?: Ref<Node>;
}

export interface VElement {
  type: string | FragmentType;
  props: ElementProps;
}

export type VNode = VElement | Primitive;

export type WebJSXAwareComponent = {
  __webjsx_suspendRendering?: () => void;
  __webjsx_resumeRendering?: () => void;
} & HTMLElement;
