import "../setup.js";
import { expect } from "chai";
import { applyDiff } from "../../applyDiff.js";
import { createElement } from "../../index.js";

describe("applyDiff - Boolean Rendering", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.getElementById("app") as HTMLElement;
    container.innerHTML = ""; // Clear container before each test
  });

  it("should not render boolean values", () => {
    const vdom = createElement("div", null, false);
    applyDiff(container, vdom);

    const div = container.querySelector("div");
    expect(div).to.exist;
    expect(div?.textContent).to.equal("");
    expect(div?.childNodes).to.have.lengthOf(0);
  });

  it("should handle boolean values in arrays", () => {
    const vdom = createElement("div", null, ["Start", false, "End"]);
    applyDiff(container, vdom);

    const div = container.querySelector("div");
    expect(div).to.exist;
    expect(div?.textContent).to.equal("StartEnd");
    expect(div?.childNodes).to.have.lengthOf(2); // Only two text nodes
  });

  it("should handle boolean values mixed with elements", () => {
    const vdom = createElement(
      "div",
      null,
      createElement("span", null, "First"),
      false,
      createElement("span", null, "Second")
    );
    applyDiff(container, vdom);

    const div = container.querySelector("div");
    const spans = container.querySelectorAll("span");
    expect(spans).to.have.lengthOf(2);
    expect(div?.childNodes).to.have.lengthOf(2); // Only the two spans
    expect(spans[0].textContent).to.equal("First");
    expect(spans[1].textContent).to.equal("Second");
  });

  it("should handle switching between boolean and real values", () => {
    // Initial render with boolean
    const initialVdom = createElement(
      "div",
      null,
      createElement("span", null, "Start"),
      false,
      createElement("span", null, "End")
    );
    applyDiff(container, initialVdom);

    let spans = container.querySelectorAll("span");
    expect(spans).to.have.lengthOf(2);

    // Update with a real element instead of boolean
    const updatedVdom = createElement(
      "div",
      null,
      createElement("span", null, "Start"),
      createElement("span", null, "Middle"),
      createElement("span", null, "End")
    );
    applyDiff(container, updatedVdom);

    spans = container.querySelectorAll("span");
    expect(spans).to.have.lengthOf(3);
    expect(spans[1].textContent).to.equal("Middle");
  });

  it("should handle boolean values in keyed elements", () => {
    const vdom = createElement(
      "div",
      null,
      createElement("span", { key: "1" }, "One"),
      false,
      createElement("span", { key: "2" }, "Two")
    );
    applyDiff(container, vdom);

    const spans = container.querySelectorAll("span");
    expect(spans).to.have.lengthOf(2);
    expect(spans[0].getAttribute("data-key")).to.equal("1");
    expect(spans[1].getAttribute("data-key")).to.equal("2");
  });

  it("should handle true values the same as false", () => {
    const vdom = createElement(
      "div",
      null,
      true,
      createElement("span", null, "Middle"),
      false
    );
    applyDiff(container, vdom);

    const div = container.querySelector("div");
    const span = container.querySelector("span");
    expect(div?.childNodes).to.have.lengthOf(1); // Only the span
    expect(span?.textContent).to.equal("Middle");
  });
});
