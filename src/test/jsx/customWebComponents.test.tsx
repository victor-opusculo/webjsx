import { expect } from "chai";
import { JSDOM } from "jsdom";
import { applyDiff } from "../../applyDiff.js";
import * as webjsx from "../../index.js";
import "../setup.js";
import { resetContainer } from "../setup.js";

describe("JSX Syntax - Custom Web Components with Shadow DOM", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = resetContainer();
  });

  it("should handle custom web components with shadow DOM created with JSX and update their props", () => {
    // Define a custom web component with shadow DOM
    class MyShadowElement extends HTMLElement {
      static get observedAttributes() {
        return ["title"];
      }

      private _count: number = 0;
      private shadow: ShadowRoot;

      constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
      }

      connectedCallback() {
        this.render();
      }

      attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null
      ) {
        if (name === "title") {
          this.render();
        }
      }

      set count(val: number) {
        this._count = val;
        this.render();
      }

      get count() {
        return this._count;
      }

      render() {
        const vdom = (
          <div class="shadow-content">
            <h2>{this.getAttribute("title")}</h2>
            <p>Count: {this.count}</p>
          </div>
        );
        applyDiff(this.shadow, vdom);
      }
    }

    // Register the custom element
    if (!customElements.get("my-shadow-element")) {
      customElements.define("my-shadow-element", MyShadowElement);
    }

    // Initial JSX VDOM with string and non-string props
    const initialVdom = (
      <my-shadow-element title="Initial Title" count={10}></my-shadow-element>
    );

    // Apply the initial render
    applyDiff(container, initialVdom);

    // Select the custom element
    const myShadowElement = container.querySelector(
      "my-shadow-element"
    ) as MyShadowElement;
    expect(myShadowElement).to.exist;
    expect(myShadowElement.getAttribute("title")).to.equal("Initial Title");
    expect(myShadowElement.count).to.equal(10);

    // Verify the shadow DOM content
    const shadowRoot = myShadowElement.shadowRoot;
    expect(shadowRoot).to.exist;
    expect(shadowRoot?.querySelector("h2")?.textContent).to.equal("Initial Title");
    expect(shadowRoot?.querySelector("p")?.textContent).to.equal("Count: 10");

    // Updated JSX VDOM with new props
    const updatedVdom = (
      <my-shadow-element title="Updated Title" count={20}></my-shadow-element>
    );

    // Apply the diff to update props
    applyDiff(container, updatedVdom);

    // Verify that the attributes and properties have been updated
    expect(myShadowElement.getAttribute("title")).to.equal("Updated Title");
    expect(myShadowElement.count).to.equal(20);

    // Verify the updated shadow DOM content
    expect(shadowRoot?.querySelector("h2")?.textContent).to.equal("Updated Title");
    expect(shadowRoot?.querySelector("p")?.textContent).to.equal("Count: 20");
  });

  it("should handle nested custom web components with shadow DOM", () => {
    // Define a nested custom web component
    class NestedShadowElement extends HTMLElement {
      static get observedAttributes() {
        return ["label"];
      }

      private _value: string = "";
      private shadow: ShadowRoot;

      constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
      }

      connectedCallback() {
        this.render();
      }

      attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null
      ) {
        if (name === "label") {
          this.render();
        }
      }

      set value(val: string) {
        this._value = val;
        this.render();
      }

      get value() {
        return this._value;
      }

      render() {
        const vdom = (
          <div class="nested-content">
            <h3>{this.getAttribute("label")}</h3>
            <p>Value: {this.value}</p>
          </div>
        );
        applyDiff(this.shadow, vdom);
      }
    }

    // Define a parent custom web component
    class ParentShadowElement extends HTMLElement {
      static get observedAttributes() {
        return ["title"];
      }

      private _count: number = 0;
      private shadow: ShadowRoot;

      constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
      }

      connectedCallback() {
        this.render();
      }

      attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null
      ) {
        if (name === "title") {
          this.render();
        }
      }

      set count(val: number) {
        this._count = val;
        this.render();
      }

      get count() {
        return this._count;
      }

      render() {
        const vdom = (
          <div class="parent-content">
            <h2>{this.getAttribute("title")}</h2>
            <nested-shadow-element 
              label="Nested Label" 
              value="Nested Value"
            ></nested-shadow-element>
            <p>Count: {this.count}</p>
          </div>
        );
        applyDiff(this.shadow, vdom);
      }
    }

    // Register the custom elements
    if (!customElements.get("nested-shadow-element")) {
      customElements.define("nested-shadow-element", NestedShadowElement);
    }
    if (!customElements.get("parent-shadow-element")) {
      customElements.define("parent-shadow-element", ParentShadowElement);
    }

    const initialVdom = (
      <parent-shadow-element title="Parent Title" count={5}></parent-shadow-element>
    );

    applyDiff(container, initialVdom);

    const parentElement = container.querySelector(
      "parent-shadow-element"
    ) as ParentShadowElement;
    expect(parentElement).to.exist;

    // Verify parent shadow DOM
    const parentShadow = parentElement.shadowRoot;
    expect(parentShadow).to.exist;
    expect(parentShadow?.querySelector("h2")?.textContent).to.equal("Parent Title");
    expect(parentShadow?.querySelector("p")?.textContent).to.equal("Count: 5");

    // Verify nested component within parent's shadow DOM
    const nestedElement = parentShadow?.querySelector(
      "nested-shadow-element"
    ) as NestedShadowElement;
    expect(nestedElement).to.exist;

    // Verify nested shadow DOM
    const nestedShadow = nestedElement.shadowRoot;
    expect(nestedShadow).to.exist;
    expect(nestedShadow?.querySelector("h3")?.textContent).to.equal("Nested Label");
    expect(nestedShadow?.querySelector("p")?.textContent).to.equal("Value: Nested Value");

    // Update with new props
    const updatedVdom = (
      <parent-shadow-element title="Updated Parent" count={10}></parent-shadow-element>
    );

    applyDiff(container, updatedVdom);

    // Verify updated parent shadow DOM
    expect(parentShadow?.querySelector("h2")?.textContent).to.equal("Updated Parent");
    expect(parentShadow?.querySelector("p")?.textContent).to.equal("Count: 10");
  });
});