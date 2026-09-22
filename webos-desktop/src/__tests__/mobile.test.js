import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getDeviceType, updateDeviceType, initDeviceDetector } from "../mobile/deviceDetector.js";
import { initGestureManager, GESTURE_SPRING_CURVE } from "../mobile/gestureManager.js";
import { initTabletManager, splitView, isTabletMode, snapToLeft, snapToRight, snapToMaximize } from "../mobile/tabletManager.js";
import { getActiveSessionMode, isMobileActive, initMobileShellRouter } from "../mobile/MobileShellRouter.js";
import { initMobileShell } from "../mobile/MobileShell.js";
import { bus, BusEvents } from "../core/EventBus.js";

describe("deviceDetector", () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    document.documentElement.className = "";
    delete document.documentElement.dataset.deviceType;
  });

  it("returns correct device types based on window width", () => {
    window.innerWidth = 500;
    expect(getDeviceType()).toBe("phone");

    window.innerWidth = 599;
    expect(getDeviceType()).toBe("phone");

    window.innerWidth = 600;
    expect(getDeviceType()).toBe("tablet");

    window.innerWidth = 1024;
    expect(getDeviceType()).toBe("tablet");

    window.innerWidth = 1025;
    expect(getDeviceType()).toBe("desktop");
  });

  it("updates dataset and toggles html classes correctly", () => {
    window.innerWidth = 500;
    updateDeviceType();
    expect(document.documentElement.dataset.deviceType).toBe("phone");
    expect(document.documentElement.classList.contains("device-phone")).toBe(true);
    expect(document.documentElement.classList.contains("is-phone")).toBe(true);
    expect(document.documentElement.classList.contains("is-mobile")).toBe(true);
    expect(document.documentElement.classList.contains("device-tablet")).toBe(false);
    expect(document.documentElement.classList.contains("device-desktop")).toBe(false);

    window.innerWidth = 800;
    updateDeviceType();
    expect(document.documentElement.dataset.deviceType).toBe("tablet");
    expect(document.documentElement.classList.contains("device-tablet")).toBe(true);
    expect(document.documentElement.classList.contains("is-tablet")).toBe(true);
    expect(document.documentElement.classList.contains("is-mobile")).toBe(true);
    expect(document.documentElement.classList.contains("device-phone")).toBe(false);
    expect(document.documentElement.classList.contains("device-desktop")).toBe(false);

    window.innerWidth = 1200;
    updateDeviceType();
    expect(document.documentElement.dataset.deviceType).toBe("desktop");
    expect(document.documentElement.classList.contains("device-desktop")).toBe(true);
    expect(document.documentElement.classList.contains("is-mobile")).toBe(false);
  });

  it("dispatches event and notifies bus on init and resize", () => {
    window.innerWidth = 800;
    const busMock = { emit: vi.fn() };
    const eventHandler = vi.fn();
    window.addEventListener("sitalos:device-changed", eventHandler);

    const cleanup = initDeviceDetector(busMock);

    expect(eventHandler).toHaveBeenCalled();
    expect(busMock.emit).toHaveBeenCalledWith("sitalos:device-changed", { deviceType: "tablet" });

    cleanup();
    window.removeEventListener("sitalos:device-changed", eventHandler);
  });
});

describe("gestureManager", () => {
  let cleanup = null;
  let mockOs = null;

  beforeEach(() => {
    window.innerHeight = 800;
    window.innerWidth = 400;
    mockOs = {
      window: {
        minimize: vi.fn(),
        getOpenWindows: vi.fn(() => new Map([["test-win", {}]]))
      },
      events: {
        emit: vi.fn()
      }
    };

    const win = document.createElement("div");
    win.id = "test-win";
    win.className = "window";
    win.style.display = "block";
    win.style.zIndex = "10";
    document.body.appendChild(win);

    cleanup = initGestureManager(mockOs);
  });

  afterEach(() => {
    if (cleanup) cleanup();
    document.body.innerHTML = "";
  });

  it("exports gesture spring curve", () => {
    expect(GESTURE_SPRING_CURVE).toBe("cubic-bezier(0.175, 0.885, 0.32, 1.275)");
  });

  it("triggers back action on left edge swipe", () => {
    const eventHandler = vi.fn();
    window.addEventListener("sitalos:back", eventHandler);

    document.dispatchEvent(new TouchEvent("touchstart", {
      touches: [{ clientX: 20, clientY: 200 }]
    }));
    document.dispatchEvent(new TouchEvent("touchmove", {
      touches: [{ clientX: 100, clientY: 210 }]
    }));
    document.dispatchEvent(new TouchEvent("touchend"));

    expect(mockOs.window.minimize).toHaveBeenCalled();
    expect(eventHandler).toHaveBeenCalled();
    window.removeEventListener("sitalos:back", eventHandler);
  });

  it("triggers forward action on right edge swipe", () => {
    const forwardHandler = vi.fn();
    const backHandler = vi.fn();
    window.addEventListener("sitalos:forward", forwardHandler);
    window.addEventListener("sitalos:back", backHandler);

    document.dispatchEvent(new TouchEvent("touchstart", {
      touches: [{ clientX: 385, clientY: 200 }]
    }));
    document.dispatchEvent(new TouchEvent("touchmove", {
      touches: [{ clientX: 310, clientY: 205 }]
    }));
    document.dispatchEvent(new TouchEvent("touchend"));

    expect(forwardHandler).toHaveBeenCalled();
    expect(backHandler).toHaveBeenCalled();
    window.removeEventListener("sitalos:forward", forwardHandler);
    window.removeEventListener("sitalos:back", backHandler);
  });

  it("closes open switcher on left edge swipe", () => {
    const switcher = document.createElement("div");
    switcher.id = "window-switcher-overlay";
    switcher.className = "open";
    document.body.appendChild(switcher);

    document.dispatchEvent(new TouchEvent("touchstart", {
      touches: [{ clientX: 10, clientY: 200 }]
    }));
    document.dispatchEvent(new TouchEvent("touchmove", {
      touches: [{ clientX: 95, clientY: 205 }]
    }));
    document.dispatchEvent(new TouchEvent("touchend"));

    expect(switcher.classList.contains("open")).toBe(false);
  });

  it("emits go-home on quick flick up from bottom", () => {
    const homeHandler = vi.fn();
    window.addEventListener("sitalos:go-home", homeHandler);

    document.dispatchEvent(new TouchEvent("touchstart", {
      touches: [{ clientX: 200, clientY: 780 }]
    }));
    document.dispatchEvent(new TouchEvent("touchmove", {
      touches: [{ clientX: 200, clientY: 650 }]
    }));
    document.dispatchEvent(new TouchEvent("touchend"));

    expect(homeHandler).toHaveBeenCalled();
    expect(mockOs.window.minimize).toHaveBeenCalled();
    window.removeEventListener("sitalos:go-home", homeHandler);
  });

  it("emits open-control-center on top swipe down", () => {
    const ccHandler = vi.fn();
    window.addEventListener("sitalos:open-control-center", ccHandler);

    document.dispatchEvent(new TouchEvent("touchstart", {
      touches: [{ clientX: 200, clientY: 20 }]
    }));
    document.dispatchEvent(new TouchEvent("touchmove", {
      touches: [{ clientX: 200, clientY: 120 }]
    }));
    document.dispatchEvent(new TouchEvent("touchend"));

    expect(ccHandler).toHaveBeenCalled();
    window.removeEventListener("sitalos:open-control-center", ccHandler);
  });

  it("emits open-notifications on top-left swipe down", () => {
    const notifHandler = vi.fn();
    window.addEventListener("sitalos:open-notifications", notifHandler);

    document.dispatchEvent(new TouchEvent("touchstart", {
      touches: [{ clientX: 50, clientY: 20 }]
    }));
    document.dispatchEvent(new TouchEvent("touchmove", {
      touches: [{ clientX: 50, clientY: 120 }]
    }));
    document.dispatchEvent(new TouchEvent("touchend"));

    expect(notifHandler).toHaveBeenCalled();
    window.removeEventListener("sitalos:open-notifications", notifHandler);
  });

  it("emits quick settings on two-finger swipe down", () => {
    const qsHandler = vi.fn();
    window.addEventListener("sitalos:open-quick-settings", qsHandler);

    document.dispatchEvent(new TouchEvent("touchstart", {
      touches: [
        { clientX: 100, clientY: 50 },
        { clientX: 200, clientY: 50 }
      ]
    }));
    document.dispatchEvent(new TouchEvent("touchmove", {
      touches: [
        { clientX: 100, clientY: 120 },
        { clientX: 200, clientY: 120 }
      ]
    }));
    document.dispatchEvent(new TouchEvent("touchend"));

    expect(qsHandler).toHaveBeenCalled();
    window.removeEventListener("sitalos:open-quick-settings", qsHandler);
  });
});

describe("tabletManager", () => {
  let leftWin = null;
  let rightWin = null;
  let mockOs = null;

  beforeEach(() => {
    window.innerWidth = 800;
    window.innerHeight = 600;

    leftWin = document.createElement("div");
    leftWin.id = "win-left";
    leftWin.className = "window";
    document.body.appendChild(leftWin);

    rightWin = document.createElement("div");
    rightWin.id = "win-right";
    rightWin.className = "window";
    document.body.appendChild(rightWin);

    mockOs = {
      window: {
        applySnap: vi.fn((win, zone) => {
          win.dataset.snapZone = zone;
        }),
        maximize: vi.fn(),
        unsnap: vi.fn()
      }
    };
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("identifies tablet mode correctly", () => {
    window.innerWidth = 599;
    expect(isTabletMode()).toBe(false);

    window.innerWidth = 600;
    expect(isTabletMode()).toBe(true);

    window.innerWidth = 1024;
    expect(isTabletMode()).toBe(true);

    window.innerWidth = 1025;
    expect(isTabletMode()).toBe(false);
  });

  it("splits view into side by side windows", () => {
    initTabletManager(mockOs);
    const result = splitView("win-left", "win-right");

    expect(result).toBe(true);
    expect(mockOs.window.applySnap).toHaveBeenCalledWith(leftWin, "left");
    expect(mockOs.window.applySnap).toHaveBeenCalledWith(rightWin, "right");
    expect(leftWin.dataset.snapZone).toBe("left");
    expect(rightWin.dataset.snapZone).toBe("right");
  });

  it("provides touch snap helpers", () => {
    initTabletManager(mockOs);
    expect(snapToLeft("win-left")).toBe(true);
    expect(snapToRight("win-right")).toBe(true);
    expect(snapToMaximize("win-left")).toBe(true);
    expect(mockOs.tablet).toBeDefined();
    expect(typeof mockOs.tablet.splitView).toBe("function");
  });
});

describe("MobileShellRouter", () => {
  let mockOs = null;
  let router = null;

  beforeEach(() => {
    document.documentElement.className = "";
    delete document.documentElement.dataset.deviceType;
    document.body.innerHTML = "";

    mockOs = {
      modes: {
        getActive: vi.fn(() => "default")
      },
      window: {
        getOpenWindows: vi.fn(() => new Map()),
        minimize: vi.fn(),
        close: vi.fn(),
        closeAll: vi.fn(),
        focus: vi.fn(),
        getTitle: vi.fn(() => "App")
      },
      app: {
        launch: vi.fn()
      }
    };
  });

  afterEach(() => {
    if (router) {
      router.destroy();
      router = null;
    }
    document.documentElement.className = "";
    delete document.documentElement.dataset.deviceType;
    document.body.innerHTML = "";
  });

  it("resolves active mode correctly", () => {
    expect(getActiveSessionMode(mockOs)).toBe("default");

    mockOs.modes.getActive = vi.fn(() => "mac");
    expect(getActiveSessionMode(mockOs)).toBe("mac");

    mockOs.modes.getActive = vi.fn(() => null);
    document.documentElement.classList.add("chromeos-mode");
    expect(getActiveSessionMode(mockOs)).toBe("chromeos");

    document.documentElement.className = "kali-mode";
    expect(getActiveSessionMode(mockOs)).toBe("kali");
  });

  it("mounts default shell on phone mode and unmounts on desktop", () => {
    document.documentElement.classList.add("device-phone");
    router = initMobileShellRouter(mockOs);

    expect(router.isMobile()).toBe(true);
    expect(document.getElementById("mobile-status-bar")).not.toBeNull();
    expect(document.getElementById("mobile-home-screen")).not.toBeNull();
    expect(router.getCurrentShell()?.name).toBe("sitalos");

    document.documentElement.classList.remove("device-phone");
    router.sync();

    expect(document.getElementById("mobile-status-bar")).toBeNull();
    expect(document.getElementById("mobile-home-screen")).toBeNull();
    expect(router.getCurrentShell()).toBeNull();
  });

  it("transitions between shells on mode change", () => {
    document.documentElement.classList.add("device-phone");
    router = initMobileShellRouter(mockOs);

    expect(router.getCurrentShell()?.name).toBe("sitalos");

    mockOs.modes.getActive = vi.fn(() => "mac");
    bus.emit(BusEvents.MODE_ENTERED, { mode: "mac" });

    expect(router.getCurrentShell()?.name).toBe("mac");

    mockOs.modes.getActive = vi.fn(() => "kali");
    bus.emit(BusEvents.MODE_ENTERED, { mode: "kali" });

    expect(router.getCurrentShell()?.name).toBe("kali");
  });

  it("facade initializes mobile shell properly", () => {
    document.documentElement.classList.add("device-tablet");
    const facadeRouter = initMobileShell(mockOs);

    expect(facadeRouter).toBeDefined();
    expect(typeof facadeRouter.getActiveMode).toBe("function");
    expect(document.getElementById("mobile-status-bar")).not.toBeNull();

    facadeRouter.destroy();
  });
});
