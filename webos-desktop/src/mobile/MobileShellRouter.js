import { $, $$, bindEvent } from "../shared/domUtils.js";
import { bus, BusEvents } from "../core/EventBus.js";
import { createSitalOSMobile } from "./shells/sitalOSMobile.js";
import { createMacOSMobile } from "./shells/macOSMobile.js";
import { createChromeOSMobile } from "./shells/chromeOSMobile.js";
import { createKaliMobile } from "./shells/kaliMobile.js";
import { adaptWindow } from "./shells/commonMobileUI.js";

export const getActiveSessionMode = (os) => {
  if (os && os.modes && typeof os.modes.getActive === "function") {
    const mode = os.modes.getActive();
    if (mode) return mode;
  }
  if (os && os.modes && typeof os.modes.getActiveModes === "function") {
    const modes = os.modes.getActiveModes();
    if (modes && modes.length > 0) return modes[0];
  }
  const root = document.documentElement;
  if (root.classList.contains("mac-mode")) return "mac";
  if (root.classList.contains("chromeos-mode")) return "chromeos";
  if (root.classList.contains("kali-mode")) return "kali";
  return "default";
};

export const isMobileActive = () => {
  const root = document.documentElement;
  return root.classList.contains("device-phone") ||
         root.classList.contains("device-tablet") ||
         root.classList.contains("is-phone") ||
         root.classList.contains("is-tablet") ||
         root.dataset.deviceType === "phone" ||
         root.dataset.deviceType === "tablet";
};

export const getShellFactory = (mode) => {
  switch (mode) {
    case "mac":
      return createMacOSMobile;
    case "chromeos":
      return createChromeOSMobile;
    case "kali":
      return createKaliMobile;
    case "default":
    case "reset":
    default:
      return createSitalOSMobile;
  }
};

let activeRouterInstance = null;

export const initMobileShellRouter = (os) => {
  if (activeRouterInstance) {
    activeRouterInstance.destroy();
    activeRouterInstance = null;
  }

  if (os && os.modes && typeof os.modes.getActive !== "function") {
    os.modes.getActive = () => getActiveSessionMode(os);
  }

  let currentShell = null;
  let currentMode = null;

  const handleGoHome = () => {
    if (currentShell && typeof currentShell.goHome === "function") {
      currentShell.goHome();
    }
  };

  const handleOpenAppSwitcher = () => {
    if (currentShell && typeof currentShell.openAppSwitcher === "function") {
      currentShell.openAppSwitcher();
    }
  };

  const handleOpenControlCenter = () => {
    if (currentShell && typeof currentShell.openControlCenter === "function") {
      currentShell.openControlCenter();
    }
  };

  const handleOpenNotifications = () => {
    const nc = os?.notificationCenter || os?.notify?.notificationCenter;
    if (nc && typeof nc.toggle === "function") {
      nc.toggle();
    } else if (currentShell && typeof currentShell.openControlCenter === "function") {
      currentShell.openControlCenter();
    }
  };

  const syncState = () => {
    const active = isMobileActive();
    if (!active) {
      if (currentShell) {
        currentShell.unmount();
        currentShell = null;
        currentMode = null;
      }
      return;
    }

    const rawMode = getActiveSessionMode(os);
    const normalizedMode = rawMode === "reset" ? "default" : rawMode;

    if (currentShell && currentMode === normalizedMode) {
      return;
    }

    if (currentShell) {
      currentShell.unmount();
      currentShell = null;
    }

    const factory = getShellFactory(normalizedMode);
    currentShell = factory(os);
    currentShell.mount();
    currentMode = normalizedMode;
  };

  const onModeChange = () => {
    syncState();
  };

  const onDeviceChange = () => {
    syncState();
  };

  const onWindowActive = ({ winId, win }) => {
    if (isMobileActive()) {
      adaptWindow(winId, win, os);
    }
  };

  const unbindModeEntered = bus.on(BusEvents.MODE_ENTERED, onModeChange);
  const unbindModeExited = bus.on(BusEvents.MODE_EXITED, onModeChange);
  const unbindWinCreated = bus.on(BusEvents.WINDOW_CREATED, onWindowActive);
  const unbindWinFocused = bus.on(BusEvents.WINDOW_FOCUSED, onWindowActive);

  const unbindDeviceBus = typeof bus.on === "function"
    ? bus.on("sitalos:device-changed", onDeviceChange)
    : null;

  const unbindHomeBus = typeof bus.on === "function"
    ? bus.on("sitalos:go-home", handleGoHome)
    : null;

  const unbindSwitcherBus = typeof bus.on === "function"
    ? bus.on("sitalos:open-app-switcher", handleOpenAppSwitcher)
    : null;

  const unbindControlBus = typeof bus.on === "function"
    ? bus.on("sitalos:open-control-center", handleOpenControlCenter)
    : null;

  const unbindQuickSettingsBus = typeof bus.on === "function"
    ? bus.on("sitalos:open-quick-settings", handleOpenControlCenter)
    : null;

  const unbindNotificationsBus = typeof bus.on === "function"
    ? bus.on("sitalos:open-notifications", handleOpenNotifications)
    : null;

  bindEvent(window, "sitalos:device-changed", onDeviceChange);
  bindEvent(window, "sitalos:go-home", handleGoHome);
  bindEvent(document, "sitalos:go-home", handleGoHome);
  bindEvent(window, "sitalos:open-app-switcher", handleOpenAppSwitcher);
  bindEvent(document, "sitalos:open-app-switcher", handleOpenAppSwitcher);
  bindEvent(window, "sitalos:open-control-center", handleOpenControlCenter);
  bindEvent(document, "sitalos:open-control-center", handleOpenControlCenter);
  bindEvent(window, "sitalos:open-quick-settings", handleOpenControlCenter);
  bindEvent(document, "sitalos:open-quick-settings", handleOpenControlCenter);
  bindEvent(window, "sitalos:open-notifications", handleOpenNotifications);
  bindEvent(document, "sitalos:open-notifications", handleOpenNotifications);

  const rootObserver = new MutationObserver(() => {
    syncState();
  });
  rootObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-device-type"]
  });

  const desktopObserver = new MutationObserver(() => {
    if (isMobileActive()) {
      $$(".window").forEach((win) => adaptWindow(win.id, win, os));
    }
  });
  const desktop = $("#desktop") || document.body;
  desktopObserver.observe(desktop, { childList: true, subtree: true });

  syncState();

  const router = {
    getActiveMode: () => getActiveSessionMode(os),
    getCurrentShell: () => currentShell,
    isMobile: () => isMobileActive(),
    sync: syncState,
    destroy: () => {
      if (currentShell) {
        currentShell.unmount();
        currentShell = null;
        currentMode = null;
      }
      rootObserver.disconnect();
      desktopObserver.disconnect();
      if (typeof unbindModeEntered === "function") unbindModeEntered();
      if (typeof unbindModeExited === "function") unbindModeExited();
      if (typeof unbindWinCreated === "function") unbindWinCreated();
      if (typeof unbindWinFocused === "function") unbindWinFocused();
      if (typeof unbindDeviceBus === "function") unbindDeviceBus();
      if (typeof unbindHomeBus === "function") unbindHomeBus();
      if (typeof unbindSwitcherBus === "function") unbindSwitcherBus();
      if (typeof unbindControlBus === "function") unbindControlBus();
      if (typeof unbindQuickSettingsBus === "function") unbindQuickSettingsBus();
      if (typeof unbindNotificationsBus === "function") unbindNotificationsBus();
      window.removeEventListener("sitalos:device-changed", onDeviceChange);
      window.removeEventListener("sitalos:go-home", handleGoHome);
      document.removeEventListener("sitalos:go-home", handleGoHome);
      window.removeEventListener("sitalos:open-app-switcher", handleOpenAppSwitcher);
      document.removeEventListener("sitalos:open-app-switcher", handleOpenAppSwitcher);
      window.removeEventListener("sitalos:open-control-center", handleOpenControlCenter);
      document.removeEventListener("sitalos:open-control-center", handleOpenControlCenter);
      window.removeEventListener("sitalos:open-quick-settings", handleOpenControlCenter);
      document.removeEventListener("sitalos:open-quick-settings", handleOpenControlCenter);
      window.removeEventListener("sitalos:open-notifications", handleOpenNotifications);
      document.removeEventListener("sitalos:open-notifications", handleOpenNotifications);
      if (activeRouterInstance === router) {
        activeRouterInstance = null;
      }
    }
  };

  activeRouterInstance = router;
  return router;
};
