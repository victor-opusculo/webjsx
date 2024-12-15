import "../setup.js";
import { expect } from "chai";
import { createElement, Fragment } from "../../index.js";
import { VElement } from "../../types.js";

describe("createElement - Fragments", () => {
  it("should support fragments", () => {
    const vdom = createElement(
      Fragment,
      null,
      createElement("p", null, "Paragraph 1"),
      createElement("p", null, "Paragraph 2")
    );

    expect((vdom as VElement).type).to.equal(Fragment);
    expect((vdom as VElement).props.children).to.have.lengthOf(2);
    const children = (vdom as VElement).props.children as Array<VElement>;
    expect(children[0].type).to.equal("p");
    expect(children[1].type).to.equal("p");
  });
});
