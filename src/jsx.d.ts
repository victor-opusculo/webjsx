import type * as JSXTypes from "./jsxTypes.js";
import { Fragment, VNode, FragmentType } from "./types.js";

declare global {
  namespace JSX {
    interface IntrinsicElements extends JSXTypes.IntrinsicElements {}
    interface ElementAttributesProperty extends JSXTypes.ElementAttributesProperty {}
    interface ElementChildrenAttribute extends JSXTypes.ElementChildrenAttribute {}
    interface Element {
      type: string | FragmentType;
      props: any;
    }
    interface IntrinsicAttributes {
      key?: string | number;
    }
  }
}