import { flattenVNodes } from "./utils.js";

export const Fragment = (props: { children?: ChildTypes }): VNode[] => {
  return flattenVNodes(props.children);
};

export type FragmentType = typeof Fragment;

export type Primitive = string | number | bigint | boolean;

export type NonBooleanPrimitive = string | number | bigint;

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
  children?: VRealNode[] | null;
  key?: NonBooleanPrimitive;
  dangerouslySetInnerHTML?: { __html: string };
  ref?: Ref<Node>;
}

/**
 * Virtual element structure.
 */
export type VElement = {
  type: string | FragmentType;
  tagName?: string;
  props: ElementProps;
};

export type VNode = VElement | Primitive;

export type VRealElement = {
  type: string;
  tagName: string;
  props: ElementProps;
};

export type VRealNode = VRealElement | NonBooleanPrimitive;

export type ChildTypes = VNode | null | undefined | ChildTypes[];

/**
 * Interface for components that support render suspension.
 */
export type WebJSXAwareComponent = {
  __webjsx_suspendRendering?: () => void;
  __webjsx_resumeRendering?: () => void;
} & Element;

export type WebJSXManagedElement = {
  __webjsx_key: NonBooleanPrimitive;
  __webjsx_props: ElementProps;
  __webjsx_listeners: {
    [name: string]: EventListenerOrEventListenerObject;
  };
} & Element;
