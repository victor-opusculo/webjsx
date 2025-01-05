import { WebJSXAwareComponent } from "./types.js";

/**
 * Executes a callback with render suspension handling.
 * @param el Element that may have render suspension
 * @param callback Function to execute during suspension
 * @returns Result of the callback
 */
export function withRenderSuspension<T>(el: Element, callback: () => T): T {
  const isRenderingSuspended = !!(el as WebJSXAwareComponent)
    .__webjsx_suspendRendering;
  if (isRenderingSuspended) {
    (el as WebJSXAwareComponent).__webjsx_suspendRendering!();
  }

  try {
    return callback();
  } finally {
    if (isRenderingSuspended) {
      (el as WebJSXAwareComponent).__webjsx_resumeRendering!();
    }
  }
}
