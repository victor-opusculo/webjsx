import { expect } from "chai";
import { JSDOM } from "jsdom";
import { applyDiff } from "../../applyDiff.js";
import * as webjsx from "../../index.js";
import "../setup.js";
import { resetContainer } from "../setup.js";

describe("JSX Syntax - Lists and Keys", () => {
  let dom: JSDOM;
  let document: Document;
  let container: HTMLElement;

  beforeEach(() => {
    container = resetContainer();
  });

  it("should handle lists in JSX with keys", () => {
    const items = ["Apple", "Banana", "Cherry"];

    const vdom = (
      <ul>
        {items.map((item, index) => (
          <li key={index} data-key={index}>
            {item}
          </li>
        ))}
      </ul>
    );

    applyDiff(container, vdom);

    const ul = container.querySelector("ul");
    expect(ul).to.exist;
    const lis = ul?.querySelectorAll("li");
    expect(lis).to.have.lengthOf(3);
    expect((lis?.[0] as any).__webjsx_key).to.equal(0);
    expect((lis?.[1] as any).__webjsx_key).to.equal(1);
    expect((lis?.[2] as any).__webjsx_key).to.equal(2);
    expect(lis?.[0].textContent).to.equal("Apple");
    expect(lis?.[1].textContent).to.equal("Banana");
    expect(lis?.[2].textContent).to.equal("Cherry");
  });

  it("should reorder elements based on keys while preserving DOM nodes", () => {
    // Initial render with original order
    const initialVdom = (
      <ul>
        <li key="a" data-testid="a">
          Item A
        </li>
        <li key="b" data-testid="b">
          Item B
        </li>
        <li key="c" data-testid="c">
          Item C
        </li>
      </ul>
    );

    applyDiff(container, initialVdom);

    // Reverse the order
    const reversedVdom = (
      <ul>
        <li key="c" data-testid="c">
          Item C
        </li>
        <li key="b" data-testid="b">
          Item B
        </li>
        <li key="a" data-testid="a">
          Item A
        </li>
      </ul>
    );

    applyDiff(container, reversedVdom);

    // Get reordered elements
    const reorderedElements = Array.from(container.querySelectorAll("li")).map(
      (li) => ({
        key: (li as any).__webjsx_key,
        text: li.textContent,
      })
    );

    // Verify the order changed but keys match their original text
    expect(reorderedElements[0].key).to.equal("c");
    expect(reorderedElements[0].text).to.equal("Item C");
    expect(reorderedElements[1].key).to.equal("b");
    expect(reorderedElements[1].text).to.equal("Item B");
    expect(reorderedElements[2].key).to.equal("a");
    expect(reorderedElements[2].text).to.equal("Item A");
  });

  it("should handle complex reordering with mixed keyed and non-keyed elements", () => {
    // Initial render with mix of keyed and non-keyed elements
    const initialVdom = (
      <ul>
        <li key="a" data-testid="a">
          Keyed A
        </li>
        <li>Non-keyed 1</li>
        <li key="b" data-testid="b">
          Keyed B
        </li>
        <li>Non-keyed 2</li>
        <li key="c" data-testid="c">
          Keyed C
        </li>
      </ul>
    );

    applyDiff(container, initialVdom);

    // Reorder keyed elements and change non-keyed elements
    const reorderedVdom = (
      <ul>
        <li key="c" data-testid="c">
          Keyed C
        </li>
        <li>New Non-keyed 1</li>
        <li key="a" data-testid="a">
          Keyed A
        </li>
        <li>New Non-keyed 2</li>
        <li key="b" data-testid="b">
          Keyed B
        </li>
      </ul>
    );

    applyDiff(container, reorderedVdom);

    const finalElements = Array.from(container.querySelectorAll("li"));

    // Verify keyed elements maintained their content
    expect((finalElements[0] as any).__webjsx_key).to.equal("c");
    expect(finalElements[0].textContent).to.equal("Keyed C");
    expect(finalElements[1].textContent).to.equal("New Non-keyed 1");
    expect((finalElements[2] as any).__webjsx_key).to.equal("a");
    expect(finalElements[2].textContent).to.equal("Keyed A");
    expect(finalElements[3].textContent).to.equal("New Non-keyed 2");
    expect((finalElements[4] as any).__webjsx_key).to.equal("b");
    expect(finalElements[4].textContent).to.equal("Keyed B");
  });

  it("should handle nested keyed elements with complex updates", () => {
    // Initial render with nested keyed elements
    const initialVdom = (
      <div>
        <div key="outer1" data-testid="outer1">
          <span key="inner1" data-testid="inner1">
            Inner 1
          </span>
          <span key="inner2" data-testid="inner2">
            Inner 2
          </span>
        </div>
        <div key="outer2" data-testid="outer2">
          <span key="inner3" data-testid="inner3">
            Inner 3
          </span>
          <span key="inner4" data-testid="inner4">
            Inner 4
          </span>
        </div>
      </div>
    );

    applyDiff(container, initialVdom);

    // Store references to original DOM nodes
    const originalOuter1 = container.querySelector('[data-testid="outer1"]');
    const originalOuter2 = container.querySelector('[data-testid="outer2"]');
    const originalInner1 = container.querySelector('[data-testid="inner1"]');
    const originalInner2 = container.querySelector('[data-testid="inner2"]');
    const originalInner3 = container.querySelector('[data-testid="inner3"]');
    const originalInner4 = container.querySelector('[data-testid="inner4"]');

    // Reorder both outer and inner elements
    const reorderedVdom = (
      <div>
        <div key="outer2" data-testid="outer2">
          <span key="inner4" data-testid="inner4">
            Inner 4
          </span>
          <span key="inner3" data-testid="inner3">
            Inner 3
          </span>
        </div>
        <div key="outer1" data-testid="outer1">
          <span key="inner2" data-testid="inner2">
            Inner 2
          </span>
          <span key="inner1" data-testid="inner1">
            Inner 1
          </span>
        </div>
      </div>
    );

    applyDiff(container, reorderedVdom);

    // Get elements after reordering
    const finalDivs = Array.from(
      container.firstElementChild!.children
    ) as HTMLElement[];
    const finalOuter2 = container.querySelector('[data-testid="outer2"]');
    const finalOuter1 = container.querySelector('[data-testid="outer1"]');

    // Verify the actual DOM nodes were reused and reordered
    expect(finalDivs[0] === originalOuter2).to.be.true; // outer2 should now be first
    expect(finalDivs[1] === originalOuter1).to.be.true; // outer1 should now be second

    // Verify inner elements were reordered within outer2
    const outer2Spans = Array.from(finalOuter2!.querySelectorAll("span"));
    expect(outer2Spans[0] === originalInner4).to.be.true;
    expect(outer2Spans[1] === originalInner3).to.be.true;

    // Verify inner elements were reordered within outer1
    const outer1Spans = Array.from(finalOuter1!.querySelectorAll("span"));
    expect(outer1Spans[0] === originalInner2).to.be.true;
    expect(outer1Spans[1] === originalInner1).to.be.true;
  });

  it("should handle dynamic insertion and removal of keyed elements", () => {
    // Initial render
    const initialVdom = (
      <ul>
        <li key="a" data-testid="a">
          Item A
        </li>
        <li key="b" data-testid="b">
          Item B
        </li>
        <li key="c" data-testid="c">
          Item C
        </li>
      </ul>
    );

    applyDiff(container, initialVdom);

    // Insert new elements between existing ones and remove one
    const modifiedVdom = (
      <ul>
        <li key="new1" data-testid="new1">
          New 1
        </li>
        <li key="a" data-testid="a">
          Item A
        </li>
        <li key="new2" data-testid="new2">
          New 2
        </li>
        <li key="c" data-testid="c">
          Item C
        </li>
        <li key="new3" data-testid="new3">
          New 3
        </li>
      </ul>
    );

    applyDiff(container, modifiedVdom);

    const finalElements = Array.from(container.querySelectorAll("li"));

    // Verify structure and content
    expect(finalElements).to.have.lengthOf(5);
    expect((finalElements[0] as any).__webjsx_key).to.equal("new1");
    expect(finalElements[0].textContent).to.equal("New 1");
    expect((finalElements[1] as any).__webjsx_key).to.equal("a");
    expect(finalElements[1].textContent).to.equal("Item A");
    expect((finalElements[2] as any).__webjsx_key).to.equal("new2");
    expect(finalElements[2].textContent).to.equal("New 2");
    expect((finalElements[3] as any).__webjsx_key).to.equal("c");
    expect(finalElements[3].textContent).to.equal("Item C");
    expect((finalElements[4] as any).__webjsx_key).to.equal("new3");
    expect(finalElements[4].textContent).to.equal("New 3");

    // Verify B was removed
    expect(container.textContent).to.not.include("Item B");
  });
});
