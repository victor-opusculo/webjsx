import { flattenVNodes } from "./utils.js";

export const Fragment = (props: { children?: ChildTypes }): VNode[] => {
  return flattenVNodes(props.children);
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
export type VElement = {
  type: string | FragmentType;
  props: ElementProps;
};

export type VNode = VElement | Primitive;

export type VRealElement = {
  type: string;
  props: ElementProps;
};

export type VRealNode = VRealElement | Primitive;

export type ChildTypes = VNode | null | undefined | ChildTypes[];

/**
 * Interface for components that support render suspension.
 */
export type WebJSXAwareComponent = {
  __webjsx_suspendRendering?: () => void;
  __webjsx_resumeRendering?: () => void;
} & HTMLElement;
