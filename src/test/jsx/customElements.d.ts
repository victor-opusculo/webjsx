declare global {
  namespace JSX {
    interface IntrinsicElements {
      "my-shadow-element": {
        title?: string;
        count?: number;
        children?: any;
      };
      "nested-shadow-element": {
        label?: string;
        value?: string;
        children?: any;
      };
      "parent-shadow-element": {
        title?: string;
        count?: number;
        children?: any;
      };
      // Keep these type declarations for other potential tests
      "clickable-element": {
        onclick?: (event: Event) => void;
        children?: any;
      };
      "my-slot-element": {
        title?: string;
        children?: any;
      };
      "named-slot-element": {
        children?: any;
      };
      "my-custom-slot-element": {
        children?: any;
      };
      "my-dynamic-slot-element": {
        children?: any;
      };
      "multi-slot-element": {
        children?: any;
      };
      "tracking-element": {
        tracked?: string;
        children?: any;
      };
    }
  }
}

export {};
