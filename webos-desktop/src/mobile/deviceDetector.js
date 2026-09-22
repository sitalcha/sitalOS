import { toggleClass, bindEvent } from "../shared/domUtils.js";

export const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < 600) return "phone";
  if (width <= 1024) return "tablet";
  return "desktop";
};

export const updateDeviceType = () => {
  const type = getDeviceType();
  const root = document.documentElement;
  root.setAttribute("data-device-type", type);
  root.dataset.deviceType = type;

  const isPhone = type === "phone";
  const isTablet = type === "tablet";
  const isDesktop = type === "desktop";
  const isMobile = isPhone || isTablet;

  toggleClass(root, "device-phone", isPhone);
  toggleClass(root, "is-phone", isPhone);
  toggleClass(root, "device-tablet", isTablet);
  toggleClass(root, "is-tablet", isTablet);
  toggleClass(root, "device-desktop", isDesktop);
  toggleClass(root, "is-mobile", isMobile);

  return type;
};

let activeCleanup = null;

export const initDeviceDetector = (bus) => {
  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }

  const dispatchDeviceChange = (deviceType) => {
    const detail = { deviceType };
    window.dispatchEvent(new CustomEvent("sitalos:device-changed", { detail }));
    if (bus && typeof bus.emit === "function") {
      bus.emit("sitalos:device-changed", detail);
    }
  };

  let currentType = updateDeviceType();
  dispatchDeviceChange(currentType);

  let resizeTimer = null;
  const handleResizeOrOrientation = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const nextType = updateDeviceType();
      if (nextType !== currentType) {
        currentType = nextType;
        dispatchDeviceChange(currentType);
      }
    }, 150);
  };

  bindEvent(window, "resize", handleResizeOrOrientation);
  bindEvent(window, "orientationchange", handleResizeOrOrientation);

  const cleanup = () => {
    clearTimeout(resizeTimer);
    window.removeEventListener("resize", handleResizeOrOrientation);
    window.removeEventListener("orientationchange", handleResizeOrOrientation);
    if (activeCleanup === cleanup) {
      activeCleanup = null;
    }
  };

  activeCleanup = cleanup;
  return cleanup;
};
