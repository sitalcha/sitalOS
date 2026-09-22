import { $, $$, bindEvent } from "../shared/domUtils.js";

export const GESTURE_SPRING_CURVE = "cubic-bezier(0.175, 0.885, 0.32, 1.275)";

let activeGestureCleanup = null;

export const initGestureManager = (os) => {
  if (activeGestureCleanup) {
    activeGestureCleanup();
    activeGestureCleanup = null;
  }

  let touchCount = 0;
  let startX = 0;
  let startY = 0;
  let startTouch2Y = 0;
  let currentX = 0;
  let currentY = 0;
  let currentTouch2Y = 0;
  let startTime = 0;
  let isFromLeftEdge = false;
  let isFromRightEdge = false;
  let isFromBottomEdge = false;
  let isFromTopEdge = false;
  let isTopLeft = false;
  let isTopRight = false;
  let isTwoFinger = false;
  let pauseTimeout = null;
  let isPaused = false;
  let appSwitcherEmitted = false;
  let gestureCompleted = false;

  const resetState = () => {
    touchCount = 0;
    startX = 0;
    startY = 0;
    startTouch2Y = 0;
    currentX = 0;
    currentY = 0;
    currentTouch2Y = 0;
    startTime = 0;
    isFromLeftEdge = false;
    isFromRightEdge = false;
    isFromBottomEdge = false;
    isFromTopEdge = false;
    isTopLeft = false;
    isTopRight = false;
    isTwoFinger = false;
    isPaused = false;
    appSwitcherEmitted = false;
    gestureCompleted = false;
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      pauseTimeout = null;
    }
  };

  const emitCustomEvent = (name, detail = {}) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
    if (os?.events && typeof os.events.emit === "function") {
      os.events.emit(name, detail);
    } else if (os?.eventBus && typeof os.eventBus.emit === "function") {
      os.eventBus.emit(name, detail);
    }
  };

  const getActiveWindow = () => {
    const openWindows = os?.window?.getOpenWindows?.() || os?.windowManager?.openWindows;
    if (openWindows && typeof openWindows.keys === "function") {
      const windows = Array.from(openWindows.keys())
        .map((id) => $(`#${id}`))
        .filter((win) => win && win.style.display !== "none" && !win.classList.contains("minimized"));
      if (windows.length > 0) {
        windows.sort((a, b) => (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0));
        return windows[0];
      }
    }

    const domWindows = $$(".window").filter(
      (win) => win.style.display !== "none" && !win.classList.contains("minimized")
    );
    if (domWindows.length > 0) {
      domWindows.sort((a, b) => (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0));
      return domWindows[0];
    }

    return null;
  };

  const closeOpenDrawerOrSwitcher = () => {
    const openSwitcher =
      $("#window-switcher-overlay") ||
      $(".app-switcher.open") ||
      $(".window-switcher.open") ||
      $("#mobile-app-switcher.active");

    if (openSwitcher) {
      if (openSwitcher.id === "window-switcher-overlay") {
        os?.windowManager?.inputHandler?.endWindowSwitcher?.();
      }
      openSwitcher.classList.remove("open");
      openSwitcher.classList.remove("active");
      return true;
    }

    const openDrawer =
      $(".mobile-drawer.open") ||
      $(".drawer.open") ||
      $(".quick-settings.open") ||
      $("#mobile-app-drawer.active");

    if (openDrawer) {
      openDrawer.classList.remove("open");
      openDrawer.classList.remove("active");
      return true;
    }

    const startMenu = $("#start-menu.open") || $(".start-menu.open");
    if (startMenu) {
      startMenu.classList.remove("open");
      return true;
    }

    const controlCenter =
      $("#mac-control-center-popup:not(.closing)") ||
      $(".control-center.open") ||
      $("#mobile-control-center.active");

    if (controlCenter) {
      controlCenter.classList.remove("active");
      controlCenter.classList.add("closing");
      setTimeout(() => {
        controlCenter.classList.remove("closing");
        if (controlCenter.id === "mac-control-center-popup") {
          controlCenter.remove();
        }
      }, 200);
      return true;
    }

    return false;
  };

  const minimizeOrCloseWindow = (win) => {
    if (!win) return;
    if (os?.window?.minimize) {
      os.window.minimize(win);
    } else if (os?.windowManager?.minimizeWindow) {
      os.windowManager.minimizeWindow(win);
    } else {
      win.style.display = "none";
      win.classList.add("minimized");
    }
  };

  const triggerBackAction = () => {
    const closedDrawerOrSwitcher = closeOpenDrawerOrSwitcher();
    if (!closedDrawerOrSwitcher) {
      const activeWin = getActiveWindow();
      if (activeWin) {
        minimizeOrCloseWindow(activeWin);
      }
    }
    emitCustomEvent("sitalos:back", { closedDrawerOrSwitcher });
  };

  const triggerForwardBackAction = () => {
    const closedDrawerOrSwitcher = closeOpenDrawerOrSwitcher();
    if (!closedDrawerOrSwitcher) {
      const activeWin = getActiveWindow();
      if (activeWin) {
        minimizeOrCloseWindow(activeWin);
      }
    }
    emitCustomEvent("sitalos:forward", { closedDrawerOrSwitcher });
    emitCustomEvent("sitalos:back", { direction: "forward", closedDrawerOrSwitcher });
  };

  const triggerGoHome = () => {
    const activeWin = getActiveWindow();
    if (activeWin) {
      minimizeOrCloseWindow(activeWin);
    }
    emitCustomEvent("sitalos:go-home", { windowId: activeWin?.id || null });
  };

  const handleTouchStart = (event) => {
    touchCount = event.touches.length;
    if (touchCount === 2) {
      isTwoFinger = true;
      startY = event.touches[0].clientY;
      startTouch2Y = event.touches[1].clientY;
      currentY = startY;
      currentTouch2Y = startTouch2Y;
      startTime = Date.now();
      return;
    }

    if (touchCount !== 1) return;
    const touch = event.touches[0];
    resetState();
    touchCount = 1;
    startX = touch.clientX;
    startY = touch.clientY;
    currentX = startX;
    currentY = startY;
    startTime = Date.now();

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    isFromLeftEdge = startX <= 30;
    isFromRightEdge = startX >= screenWidth - 30;
    isFromBottomEdge = (screenHeight - startY) <= 30;
    isFromTopEdge = startY <= 40;
    isTopLeft = isFromTopEdge && startX < screenWidth / 2;
    isTopRight = isFromTopEdge && startX >= screenWidth / 2;
  };

  const handleTouchMove = (event) => {
    if (gestureCompleted) return;

    if (event.touches.length === 2 && isTwoFinger) {
      currentY = event.touches[0].clientY;
      currentTouch2Y = event.touches[1].clientY;
      const delta1 = currentY - startY;
      const delta2 = currentTouch2Y - startTouch2Y;
      if (delta1 > 40 && delta2 > 40) {
        gestureCompleted = true;
        emitCustomEvent("sitalos:open-quick-settings");
        emitCustomEvent("sitalos:open-control-center");
      }
      return;
    }

    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    currentX = touch.clientX;
    currentY = touch.clientY;

    if (isFromBottomEdge && !appSwitcherEmitted) {
      const movedUp = startY - currentY;
      if (movedUp > 40) {
        if (!pauseTimeout && !isPaused) {
          pauseTimeout = setTimeout(() => {
            if (isFromBottomEdge && !appSwitcherEmitted && !gestureCompleted) {
              isPaused = true;
              appSwitcherEmitted = true;
              gestureCompleted = true;
              emitCustomEvent("sitalos:open-app-switcher");
            }
          }, 250);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      pauseTimeout = null;
    }

    if (gestureCompleted) {
      resetState();
      return;
    }

    if (isTwoFinger) {
      const delta1 = currentY - startY;
      const delta2 = currentTouch2Y - startTouch2Y;
      if (delta1 > 40 && delta2 > 40) {
        gestureCompleted = true;
        emitCustomEvent("sitalos:open-quick-settings");
        emitCustomEvent("sitalos:open-control-center");
      }
      resetState();
      return;
    }

    const duration = Date.now() - startTime;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (isFromLeftEdge && deltaX > 50 && absDeltaY < 60) {
      gestureCompleted = true;
      triggerBackAction();
      resetState();
      return;
    }

    if (isFromRightEdge && deltaX < -50 && absDeltaY < 60) {
      gestureCompleted = true;
      triggerForwardBackAction();
      resetState();
      return;
    }

    if (isFromBottomEdge) {
      const movedUp = startY - currentY;
      if (movedUp > 30) {
        gestureCompleted = true;
        if (duration > 250 || isPaused || appSwitcherEmitted) {
          emitCustomEvent("sitalos:open-app-switcher");
        } else {
          triggerGoHome();
        }
        resetState();
        return;
      }
    }

    if (isFromTopEdge && deltaY > 50 && deltaY > absDeltaX) {
      gestureCompleted = true;
      if (isTopRight) {
        emitCustomEvent("sitalos:open-quick-settings");
        emitCustomEvent("sitalos:open-control-center");
      } else if (isTopLeft) {
        emitCustomEvent("sitalos:open-notifications");
      }
      resetState();
      return;
    }

    resetState();
  };

  const handleTouchCancel = () => {
    resetState();
  };

  bindEvent(document, "touchstart", handleTouchStart, { passive: true });
  bindEvent(document, "touchmove", handleTouchMove, { passive: true });
  bindEvent(document, "touchend", handleTouchEnd, { passive: true });
  bindEvent(document, "touchcancel", handleTouchCancel, { passive: true });

  const cleanup = () => {
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      pauseTimeout = null;
    }
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    document.removeEventListener("touchcancel", handleTouchCancel);
    if (activeGestureCleanup === cleanup) {
      activeGestureCleanup = null;
    }
  };

  activeGestureCleanup = cleanup;
  return cleanup;
};
