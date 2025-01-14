import { expect } from "chai";
import { JSDOM } from "jsdom";
import { applyDiff } from "../../applyDiff.js";
import * as webjsx from "../../index.js";
import "../setup.js";
import { resetContainer } from "../setup.js";

describe("JSX Syntax - Conditional Rendering", () => {
  let dom: JSDOM;
  let document: Document;
  let container: HTMLElement;

  beforeEach(() => {
    container = resetContainer();
  });

  it("should handle conditional rendering in JSX", () => {
    const isLoggedIn = true;
    const vdom = (
      <div>{isLoggedIn ? <p>Welcome back!</p> : <p>Please log in.</p>}</div>
    );

    applyDiff(container, vdom);

    const p = container.querySelector("p");
    expect(p).to.exist;
    expect(p?.textContent).to.equal("Welcome back!");
  });

  it("should remove all elements when condition becomes false", () => {
    // Initial state with count = 0 (no elements)
    let count = 0;

    const createVdom = (count: number) => (
      <div>
        <button>Increment</button>
        <button>Decrement</button>
        <div>
          {count >= 1 &&
            Array.from({ length: count }).map((_, idx) => (
              <p key={idx + 1}>Item: {idx + 1}</p>
            ))}
        </div>
      </div>
    );

    // Initial render with count = 0
    applyDiff(container, createVdom(count));
    let items = container.querySelectorAll("p");
    expect(items.length).to.equal(0);

    // Simulate increment to 2
    count = 2;
    applyDiff(container, createVdom(count));
    items = container.querySelectorAll("p");
    expect(items.length).to.equal(2);
    expect(items[0].textContent).to.equal("Item: 1");
    expect(items[1].textContent).to.equal("Item: 2");

    // Simulate decrement to 1
    count = 1;
    applyDiff(container, createVdom(count));
    items = container.querySelectorAll("p");
    expect(items.length).to.equal(1);
    expect(items[0].textContent).to.equal("Item: 1");

    // Simulate decrement to 0 - this should remove all items
    count = 0;
    applyDiff(container, createVdom(count));
    items = container.querySelectorAll("p");
    expect(items.length).to.equal(0);
  });
});
