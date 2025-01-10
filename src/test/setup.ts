import { JSDOM } from "jsdom";

import { install as sourceMapInstall } from "source-map-support";
sourceMapInstall();

let dom: JSDOM;
function setupJSDOM() {
  dom = new JSDOM(`<!DOCTYPE html><body><div id="app"></div></body>`, {
    runScripts: "dangerously",
    resources: "usable",
  });

  const { window } = dom;

  // Assign JSDOM globals to the Node.js global scope
  (global as any).window = window;
  (global as any).document = window.document;
  (global as any).Element = window.Element;
  (global as any).HTMLElement = window.HTMLElement;
  (global as any).Node = window.Node;
  (global as any).customElements = window.customElements;
  return dom;
}

setupJSDOM();

export function getDOM() {
  return dom;
}

export function resetContainer(): HTMLElement {
  const existingContainer = document.getElementById("app");
  if (existingContainer) {
    existingContainer.remove(); // Remove the existing element if it exists
  }

  const container = document.createElement("div"); // Create a new div element
  container.id = "app"; // Set the id to "app"
  document.body.appendChild(container); // Append the new element to the body
  return container;
}
