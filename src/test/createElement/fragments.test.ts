import { expect } from "chai";
import { createElement, Fragment } from "../../index.js";
import { VElement } from "../../types.js";
import "../setup.js";

describe("createElement - Fragments", () => {
  it("should support fragments", () => {
    const vdom = createElement(
      Fragment,
      null,
      createElement("p", null, "Paragraph 1"),
      createElement("p", null, "Paragraph 2")
    );

    expect(Array.isArray(vdom)).to.be.true;
    expect(vdom as Array<VElement>).to.have.lengthOf(2);
    expect((vdom as Array<VElement>)[0].type).to.equal("p");
    expect((vdom as Array<VElement>)[1].type).to.equal("p");
  });
});
