import { expect } from "chai";
import { applyDiff } from "../../applyDiff.js";
import * as webjsx from "../../index.js";
import "../setup.js";
import { resetContainer } from "../setup.js";

describe("JSX Syntax - Props Handling", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = resetContainer();
  });

  it("should handle string props as attributes and non-string props as properties", () => {
    const vdom = <div id="test" customProp={123}></div>;

    applyDiff(container, vdom);

    const div = container.querySelector("div");
    expect(div).to.exist;
    expect(div?.getAttribute("id")).to.equal("test");
    expect((div as any).customProp).to.equal(123);
  });

  it("should not update props that haven't changed", () => {
    // Define a custom element that tracks prop updates
    class TrackingElement extends HTMLElement {
      private _tracked: string = "";
      private setCount: number = 0;

      get tracked() {
        return this._tracked;
      }

      set tracked(value: string) {
        this._tracked = value;
        this.setCount += 1;
      }

      getSetCount() {
        return this.setCount;
      }
    }

    // Register the custom element
    if (!customElements.get("tracking-element")) {
      customElements.define("tracking-element", TrackingElement);
    }

    // Initial render with a prop
    const vdom = (
      <tracking-element tracked="initial">Initial Content</tracking-element>
    );
    applyDiff(container, vdom);

    const trackingElement = container.querySelector(
      "tracking-element"
    ) as TrackingElement;
    expect(trackingElement.tracked).to.equal("initial");
    expect(trackingElement.getSetCount()).to.equal(1);

    // Re-render with same prop value
    const sameVdom = (
      <tracking-element tracked="initial">Initial Content</tracking-element>
    );
    applyDiff(container, sameVdom);

    // Verify the prop wasn't set again since it didn't change
    expect(trackingElement.tracked).to.equal("initial");
    expect(trackingElement.getSetCount()).to.equal(1); // Should still be 1

    // Update with different value
    const newVdom = (
      <tracking-element tracked="updated">Initial Content</tracking-element>
    );
    applyDiff(container, newVdom);

    // Verify prop was updated
    expect(trackingElement.tracked).to.equal("updated");
    expect(trackingElement.getSetCount()).to.equal(2);
  });
});
