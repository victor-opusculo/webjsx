import { withRenderSuspension } from "./renderSuspension.js";
import { VNode, Fragment, WebJSXAwareComponent } from "./types.js";

/**
 * Handles event listener updates for an element
 */
function updateEventListener(
  el: Element,
  eventName: string,
  newHandler?: Function,
  oldHandler?: Function
): void {
  if (oldHandler && oldHandler !== newHandler) {
    el.removeEventListener(eventName, oldHandler as any);
  }
  if (newHandler && oldHandler !== newHandler) {
    el.addEventListener(eventName, newHandler as any);
    (el as any).__webjsx_listeners = {
      ...((el as any).__webjsx_listeners || {}),
      [eventName]: newHandler,
    };
  }
}

/**
 * Updates a single property or attribute on an element
 */
function updatePropOrAttr(el: Element, key: string, value: any): void {
  if (el instanceof HTMLElement) {
    if (key in el) {
      // Fast path: property exists on HTMLElement
      (el as any)[key] = value;
      return;
    }
    if (typeof value === "string") {
      el.setAttribute(key, value);
      return;
    }
    // Fallback for non-string values on HTMLElement
    (el as any)[key] = value;
    return;
  }

  // SVG/Other namespace elements
  const isSVG = el.namespaceURI === "http://www.w3.org/2000/svg";
  if (isSVG) {
    if (value !== undefined && value !== null) {
      el.setAttribute(key, value.toString());
    } else {
      el.removeAttribute(key);
    }
    return;
  }

  // Fallback for other element types
  if (typeof value === "string") {
    el.setAttribute(key, value);
  } else {
    (el as any)[key] = value;
  }
}

/**
 * Core function to update attributes and properties on a DOM element
 */
function updateAttributesCore(
  el: Element,
  newProps: { [key: string]: any },
  oldProps: { [key: string]: any } = {}
): void {
  // Handle new/updated props
  for (const [key, value] of Object.entries(newProps)) {
    if (
      key === "children" ||
      key === "key" ||
      key === "dangerouslySetInnerHTML"
    )
      continue;

    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.substring(2).toLowerCase();
      updateEventListener(
        el,
        eventName,
        value,
        (el as any).__webjsx_listeners?.[eventName]
      );
    } else if (value !== oldProps[key]) {
      updatePropOrAttr(el, key, value);
    }
  }

  // Handle dangerouslySetInnerHTML
  if ("dangerouslySetInnerHTML" in newProps) {
    const html = newProps.dangerouslySetInnerHTML.__html || "";
    el.innerHTML = html;
  } else if ("dangerouslySetInnerHTML" in oldProps) {
    el.innerHTML = "";
  }

  // If this is a fresh set (no oldProps), remove any attributes not in newProps
  if (Object.keys(oldProps).length === 0) {
    const currentAttrs = Array.from(el.attributes).map((attr) => attr.name);
    for (const attr of currentAttrs) {
      if (!(attr in newProps) && !attr.startsWith("on")) {
        el.removeAttribute(attr);
      }
    }
  }

  // Remove old props/attributes
  for (const key of Object.keys(oldProps)) {
    if (
      !(key in newProps) &&
      key !== "children" &&
      key !== "key" &&
      key !== "dangerouslySetInnerHTML"
    ) {
      if (key.startsWith("on")) {
        const eventName = key.substring(2).toLowerCase();
        const existingListener = (el as any).__webjsx_listeners?.[eventName];
        if (existingListener) {
          el.removeEventListener(eventName, existingListener);
          delete (el as any).__webjsx_listeners[eventName];
        }
      } else if (key in el) {
        (el as any)[key] = undefined;
      } else {
        el.removeAttribute(key);
      }
    }
  }

  // Store current props for future updates
  (el as any).__webjsx_props = newProps;
}

/**
 * Sets attributes and properties on a DOM element based on the provided props.
 * If the property exists on the element, it sets it as a property.
 * Otherwise, it sets it as an attribute or property based on the value type.
 *
 * @param el - The DOM element to update.
 * @param props - The new properties to apply.
 */
export function setAttributes(
  el: Element,
  props: { [key: string]: any }
): void {
  withRenderSuspension(el, () => {
    updateAttributesCore(el, props);
  });
}

/**
 * Updates attributes and properties on a DOM element based on the new and old props.
 *
 * @param el - The DOM element to update.
 * @param newProps - The new properties to apply.
 * @param oldProps - The old properties to compare against.
 */
export function updateAttributes(
  el: HTMLElement,
  newProps: { [key: string]: any },
  oldProps: { [key: string]: any }
): void {
  withRenderSuspension(el, () => {
    updateAttributesCore(el, newProps, oldProps);
  });
}
