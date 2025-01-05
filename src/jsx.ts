import { ElementProps, FragmentType, VElement, VNode } from "./types.js";

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      key?: string | number;
    }

    interface ElementAttributesProperty {
      props: ElementProps;
    }

    interface ElementChildrenAttribute {
      children: VNode[];
    }

    interface Element extends VElement {
      type: string | FragmentType;
      props: ElementProps;
    }

    type ElementAttributesFor<T extends Node> = Partial<{
      [K in Exclude<keyof T, "children">]: T[K] extends Function
        ? T[K]
        : T[K] | string;
    }> &
      ElementProps;

    type DOMIntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: ElementAttributesFor<
        HTMLElementTagNameMap[K]
      >;
    } & {
      [K in keyof SVGElementTagNameMap]: ElementAttributesFor<
        SVGElementTagNameMap[K]
      >;
    };

    interface IntrinsicElements extends DOMIntrinsicElements {
      // Empty to allow merging
    }
  }
}
