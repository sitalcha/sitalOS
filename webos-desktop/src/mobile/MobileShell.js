import "./mobileShell.css";
import { initDeviceDetector } from "./deviceDetector.js";
import { initGestureManager } from "./gestureManager.js";
import { initMobileShellRouter, getActiveSessionMode } from "./MobileShellRouter.js";
import { bus } from "../core/EventBus.js";

export { initDeviceDetector } from "./deviceDetector.js";
export { initGestureManager } from "./gestureManager.js";
export { initMobileShellRouter, getActiveSessionMode } from "./MobileShellRouter.js";

export const initMobileShell = (os) => {
  const eventBus = os?.eventBus || os?.events || bus;
  initDeviceDetector(eventBus);
  initGestureManager(os);
  const router = initMobileShellRouter(os);
  return router;
};
