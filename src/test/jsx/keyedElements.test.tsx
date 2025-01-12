import { expect } from "chai";
import { applyDiff } from "../../applyDiff.js";
import "../setup.js";
import { resetContainer } from "../setup.js";

/**
 * Keyed reorder test where each node gets a new "data-test" attribute.
 * We confirm that the old attribute values (a1, b1, c1) are gone,
 * replaced by the new ones (a2, b2, c2).
 *
 * In the old diff approach, if 'k3' is erroneously updated using oldVNode for 'k1',
 * it may remove 'a1' from the 'k3' node instead of removing 'c1', causing mismatches.
 */

describe("Keyed reorder (k1->k2->k3) => (k3->k2->k1) with updated attributes", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = resetContainer();
  });

  it("should remove old attributes correctly and not leave any leftover from mismatched oldVNodes", () => {
    // 1) Initial: [ k1(a1), k2(b1), k3(c1) ]
    const initial = (
      <>
        <div key="k1" data-a1="a1">
          K1
        </div>
        <div key="k2" data-b1="b1">
          K2
        </div>
        <div key="k3" data-c1="c1">
          K3
        </div>
      </>
    );
    applyDiff(container, initial);

    let divs = container.querySelectorAll("div");
    expect(divs.length).to.equal(3);

    // Check initial attribute values
    expect(divs[0].getAttribute("data-a1")).to.equal("a1");
    expect(divs[1].getAttribute("data-b1")).to.equal("b1");
    expect(divs[2].getAttribute("data-c1")).to.equal("c1");

    // 2) Swapped: [ k3(c2), k2(b2), k1(a2) ]
    const swapped = (
      <>
        <div key="k3" data-c2="c2">
          K3 updated
        </div>
        <div key="k2" data-b2="b2">
          K2 updated
        </div>
        <div key="k1" data-a2="a2">
          K1 updated
        </div>
      </>
    );
    applyDiff(container, swapped);

    // Now the DOM order should be k3 -> k2 -> k1
    divs = container.querySelectorAll("div");
    expect(divs.length).to.equal(3);

    // The first div is now k3, so it should have data-test="c2"
    expect(divs[0].getAttribute("data-c2")).to.equal("c2");
    // Make sure it no longer has c1
    expect(divs[0].getAttribute("data-c1")).to.equal(null);

    // The second div is k2 => data-test="b2"
    expect(divs[1].getAttribute("data-b2")).to.equal("b2");
    // Make sure it no longer has b1
    expect(divs[1].getAttribute("data-b1")).to.equal(null);

    // The third div is k1 => data-test="a2"
    expect(divs[2].getAttribute("data-a2")).to.equal("a2");
    // Make sure it no longer has a1
    expect(divs[2].getAttribute("data-a1")).to.equal(null);

    // Also check text content if desired
    expect(divs[0].textContent).to.equal("K3 updated");
    expect(divs[1].textContent).to.equal("K2 updated");
    expect(divs[2].textContent).to.equal("K1 updated");
  });
});
