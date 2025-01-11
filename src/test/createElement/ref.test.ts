import { expect } from "chai";
import { createElement } from "../../index.js";
import { Ref, VElement } from "../../types.js";
import "../setup.js";

describe("createElement - Ref Handling", () => {
  it("should include function ref in props", () => {
    const ref: Ref = (node) => {};
    const vdom = createElement("div", { ref, id: "ref-div" }, "Content");

    expect((vdom as VElement).props.ref).to.equal(ref);
    expect((vdom as VElement).props.id).to.equal("ref-div");
    expect((vdom as VElement).props.children).to.deep.equal(["Content"]);
  });

  it("should include object ref in props", () => {
    const refObject: { current: Node | null } = { current: null };
    const vdom = createElement(
      "span",
      { ref: refObject, id: "ref-span" },
      "Span Content"
    );

    expect((vdom as VElement).props.ref).to.equal(refObject);
    expect((vdom as VElement).props.id).to.equal("ref-span");
    expect((vdom as VElement).props.children).to.deep.equal(["Span Content"]);
  });
});
