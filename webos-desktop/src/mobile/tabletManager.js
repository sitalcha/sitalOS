import { $, bindEvent } from "../shared/domUtils.js";

let activeOs = null;

export const isTabletMode = () => {
  return window.innerWidth >= 600 && window.innerWidth <= 1024;
};

const resolveTargetWindow = (win) => {
  if (typeof win === "string") {
    return $(`#${win}`);
  }
  return win || null;
};

export const snapToLeft = (win) => {
  const target = resolveTargetWindow(win);
  if (!target) return false;
  target.style.display = "block";
  target.classList.remove("minimized");

  if (activeOs?.window?.applySnap) {
    activeOs.window.applySnap(target, "left");
  } else if (activeOs?.windowManager?.applySnap) {
    activeOs.windowManager.applySnap(target, "left");
  } else {
    const taskbar = $("#taskbar");
    const root = document.documentElement;
    const taskbarH = taskbar
      ? `${taskbar.getBoundingClientRect().height}px`
      : getComputedStyle(root).getPropertyValue("--taskbar-h").trim() || "3.2em";
    const isTaskbarTop = taskbar?.classList.contains("position-top");
    const topOffset = isTaskbarTop ? taskbarH : "0px";
    const height = `calc(100vh - ${taskbarH})`;

    Object.assign(target.style, {
      top: topOffset,
      left: "0px",
      width: "50vw",
      height
    });
  }
  target.dataset.snapZone = "left";
  return true;
};

export const snapToRight = (win) => {
  const target = resolveTargetWindow(win);
  if (!target) return false;
  target.style.display = "block";
  target.classList.remove("minimized");

  if (activeOs?.window?.applySnap) {
    activeOs.window.applySnap(target, "right");
  } else if (activeOs?.windowManager?.applySnap) {
    activeOs.windowManager.applySnap(target, "right");
  } else {
    const taskbar = $("#taskbar");
    const root = document.documentElement;
    const taskbarH = taskbar
      ? `${taskbar.getBoundingClientRect().height}px`
      : getComputedStyle(root).getPropertyValue("--taskbar-h").trim() || "3.2em";
    const isTaskbarTop = taskbar?.classList.contains("position-top");
    const topOffset = isTaskbarTop ? taskbarH : "0px";
    const height = `calc(100vh - ${taskbarH})`;

    Object.assign(target.style, {
      top: topOffset,
      left: "50vw",
      width: "50vw",
      height
    });
  }
  target.dataset.snapZone = "right";
  return true;
};

export const snapToMaximize = (win) => {
  const target = resolveTargetWindow(win);
  if (!target) return false;
  target.style.display = "block";
  target.classList.remove("minimized");

  if (activeOs?.window?.maximize) {
    activeOs.window.maximize(target);
  } else if (activeOs?.windowManager?.toggleFullscreen) {
    activeOs.windowManager.toggleFullscreen(target);
  } else {
    const taskbar = $("#taskbar");
    const root = document.documentElement;
    const taskbarH = taskbar
      ? `${taskbar.getBoundingClientRect().height}px`
      : getComputedStyle(root).getPropertyValue("--taskbar-h").trim() || "3.2em";
    const isTaskbarTop = taskbar?.classList.contains("position-top");
    const topOffset = isTaskbarTop ? taskbarH : "0px";
    const height = `calc(100vh - ${taskbarH})`;

    Object.assign(target.style, {
      top: topOffset,
      left: "0px",
      width: "100vw",
      height
    });
  }
  target.dataset.snapZone = "maximize";
  return true;
};

export const unsnapWindow = (win) => {
  const target = resolveTargetWindow(win);
  if (!target) return false;
  if (activeOs?.window?.unsnap) {
    activeOs.window.unsnap(target);
  } else if (activeOs?.windowManager?.unsnap) {
    activeOs.windowManager.unsnap(target);
  } else if (target.dataset.oldStyle) {
    target.setAttribute("style", target.dataset.oldStyle);
    delete target.dataset.snapZone;
  }
  return true;
};

export const splitView = (winIdLeft, winIdRight) => {
  const leftWin = resolveTargetWindow(winIdLeft);
  const rightWin = resolveTargetWindow(winIdRight);

  if (!leftWin || !rightWin) return false;

  const leftSnapped = snapToLeft(leftWin);
  const rightSnapped = snapToRight(rightWin);

  return leftSnapped && rightSnapped;
};

export const initTabletManager = (os) => {
  activeOs = os;

  let lastHeaderTapTime = 0;
  let lastHeaderTapTarget = null;
  let headerTouchStartX = 0;
  let headerTouchStartY = 0;
  let headerTouchCurrentX = 0;
  let headerTouchCurrentY = 0;
  let activeTouchHeader = null;

  const handleTouchStart = (event) => {
    if (!isTabletMode() || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const header = touch.target.closest(".window-header");
    if (!header) return;

    activeTouchHeader = header;
    headerTouchStartX = touch.clientX;
    headerTouchStartY = touch.clientY;
    headerTouchCurrentX = touch.clientX;
    headerTouchCurrentY = touch.clientY;
  };

  const handleTouchMove = (event) => {
    if (!activeTouchHeader || event.touches.length !== 1) return;
    const touch = event.touches[0];
    headerTouchCurrentX = touch.clientX;
    headerTouchCurrentY = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (!activeTouchHeader) return;
    const win = activeTouchHeader.closest(".window");
    const header = activeTouchHeader;
    activeTouchHeader = null;

    if (!win || !isTabletMode()) return;

    const dragDeltaX = Math.abs(headerTouchCurrentX - headerTouchStartX);
    const dragDeltaY = Math.abs(headerTouchCurrentY - headerTouchStartY);

    if (dragDeltaX < 10 && dragDeltaY < 10) {
      const now = Date.now();
      if (lastHeaderTapTarget === header && now - lastHeaderTapTime < 300) {
        lastHeaderTapTime = 0;
        lastHeaderTapTarget = null;
        if (win.dataset.snapZone) {
          unsnapWindow(win);
        } else {
          snapToMaximize(win);
        }
        return;
      }
      lastHeaderTapTime = now;
      lastHeaderTapTarget = header;
      return;
    }

    if (headerTouchCurrentX < 50) {
      snapToLeft(win);
    } else if (headerTouchCurrentX > window.innerWidth - 50) {
      snapToRight(win);
    } else if (headerTouchCurrentY < 50) {
      snapToMaximize(win);
    }
  };

  const handleTouchCancel = () => {
    activeTouchHeader = null;
  };

  bindEvent(document, "touchstart", handleTouchStart, { passive: true });
  bindEvent(document, "touchmove", handleTouchMove, { passive: true });
  bindEvent(document, "touchend", handleTouchEnd, { passive: true });
  bindEvent(document, "touchcancel", handleTouchCancel, { passive: true });

  const manager = {
    splitView,
    isTabletMode,
    snapToLeft,
    snapToRight,
    snapToMaximize,
    unsnapWindow,
    destroy: () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
      if (activeOs?.tablet === manager) {
        delete activeOs.tablet;
      }
    }
  };

  if (activeOs) {
    activeOs.tablet = manager;
  }

  return manager;
};
