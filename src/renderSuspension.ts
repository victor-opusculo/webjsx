import { WebJSXAwareComponent } from "./types.js";

/**
 * Handles suspension of rendering during updates
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
