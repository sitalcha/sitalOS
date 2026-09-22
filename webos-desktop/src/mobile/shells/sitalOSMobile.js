import { $, $$, createElement, setText, setHTML, bindEvent, toggleClass } from "../../shared/domUtils.js";
import { APP_MANIFESTS } from "../../registry/AppManifest.js";
import {
  createStatusBar,
  createDock,
  createMusicWidget,
  createAppItem,
  adaptWindow,
  openQuickModeSwitcher
} from "./commonMobileUI.js";
import { createAppDrawer } from "./appDrawer.js";
import { createAppSwitcher } from "./appSwitcher.js";
import { createControlCenter } from "./controlCenter.js";

export const createSitalOSMobile = (os) => {
  let statusBar = null;
  let controlCenter = null;
  let appDrawer = null;
  let appSwitcher = null;
  let homeScreenEl = null;
  let activeMusicWidget = null;
  let homeClockInterval = null;
  let isMounted = false;

  const createHome = (onOpenDrawer) => {
    const screen = createElement("div", {
      id: "mobile-home-screen",
      className: "mobile-home-screen mobile-mode-default"
    });

    const topWidget = createElement("div", { className: "mobile-home-top-widget" });
    const glance = createElement("div", {
      className: "pixel-at-a-glance",
      attributes: { "role": "button", "aria-label": "At-a-Glance" }
    });
    const glanceDate = createElement("div", {
      className: "pixel-glance-date",
      text: new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date())
    });
    const glanceSub = createElement("div", {
      className: "pixel-glance-sub",
      html: '<span>24°C</span> <span>⛅</span>'
    });
    glance.appendChild(glanceDate);
    glance.appendChild(glanceSub);

    bindEvent(glance, "click", (event) => {
      if (event.target.closest(".pixel-glance-sub")) {
        if (os?.app?.launch) {
          os.app.launch("weatherApp").catch(() => {
            os.app.launch("browserApp").catch(() => {});
          });
        }
      } else {
        if (os?.app?.launch) {
          os.app.launch("calendarApp").catch(() => {
            os.app.launch("weatherApp").catch(() => {});
          });
        }
      }
    });

    const quickActions = createElement("div", { className: "mobile-quick-actions" });
    const switchBtn = createElement("button", {
      className: "mobile-quick-btn mobile-quick-switch-btn",
      html: '<i class="fas fa-layer-group"></i><span>Switch OS</span>',
      attributes: { "aria-label": "Switch OS Mode" }
    });
    bindEvent(switchBtn, "click", () => {
      if (os?.app?.launch) {
        const promise = os.app.launch("modeSwitcherApp");
        if (promise && typeof promise.catch === "function") {
          promise.catch(() => openQuickModeSwitcher(os));
        }
      } else {
        openQuickModeSwitcher(os);
      }
    });

    const powerBtn = createElement("button", {
      className: "mobile-quick-btn mobile-quick-power-btn",
      html: '<i class="fas fa-power-off"></i>',
      attributes: { "aria-label": "Lock Screen" }
    });
    bindEvent(powerBtn, "click", () => {
      if (os?.app?.lockSession) {
        os.app.lockSession();
      }
    });

    quickActions.appendChild(switchBtn);
    quickActions.appendChild(powerBtn);

    topWidget.appendChild(glance);
    topWidget.appendChild(quickActions);
    screen.appendChild(topWidget);

    const updateHomeClock = () => {
      const now = new Date();
      setText(glanceDate, new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(now));
    };
    updateHomeClock();
    homeClockInterval = setInterval(updateHomeClock, 1000);

    activeMusicWidget = createMusicWidget(os);
    screen.appendChild(activeMusicWidget.element);

    const installedApps = APP_MANIFESTS.filter((app) => app && app.serviceKey && app.title);
    const pageSize = 20;
    const pages = [];
    for (let index = 0; index < installedApps.length; index += pageSize) {
      pages.push(installedApps.slice(index, index + pageSize));
    }
    if (pages.length === 0) {
      pages.push([]);
    }

    const pagesContainer = createElement("div", { className: "mobile-pages-container" });
    const pagesTrack = createElement("div", { className: "mobile-pages-track" });
    pagesContainer.appendChild(pagesTrack);

    let currentPage = 0;
    const totalPages = pages.length;

    pages.forEach((pageApps) => {
      const pageElement = createElement("div", { className: "mobile-apps-page" });
      const gridElement = createElement("div", { className: "mobile-apps-grid" });
      pageApps.forEach((app) => {
        const item = createAppItem(app, () => os?.app?.launch?.(app.serviceKey), true);
        item.classList.add("mobile-app-item-pixel");
        gridElement.appendChild(item);
      });
      pageElement.appendChild(gridElement);
      pagesTrack.appendChild(pageElement);
    });

    screen.appendChild(pagesContainer);

    const dotsContainer = createElement("div", { className: "mobile-home-page-dots" });
    const dotElements = [];

    const updateDots = () => {
      dotElements.forEach((dot, index) => {
        toggleClass(dot, "active", index === currentPage);
      });
    };

    const goToPage = (pageIndex) => {
      currentPage = Math.max(0, Math.min(pageIndex, totalPages - 1));
      pagesTrack.style.transition = "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
      pagesTrack.style.transform = `translateX(-${currentPage * 100}%)`;
      updateDots();
    };

    for (let index = 0; index < totalPages; index++) {
      const dot = createElement("button", {
        className: `mobile-page-dot ${index === 0 ? "active" : ""}`,
        attributes: { "aria-label": `Page ${index + 1}` }
      });
      const pageIdx = index;
      bindEvent(dot, "click", () => goToPage(pageIdx));
      dotsContainer.appendChild(dot);
      dotElements.push(dot);
    }

    screen.appendChild(dotsContainer);

    let pageTouchStartX = 0;
    let pageTouchStartY = 0;
    let pageTouchDeltaX = 0;
    let isHorizontalPaging = false;

    bindEvent(pagesContainer, "touchstart", (event) => {
      if (event.touches.length !== 1) return;
      pageTouchStartX = event.touches[0].clientX;
      pageTouchStartY = event.touches[0].clientY;
      pageTouchDeltaX = 0;
      isHorizontalPaging = false;
    }, { passive: true });

    bindEvent(pagesContainer, "touchmove", (event) => {
      if (event.touches.length !== 1) return;
      const currentX = event.touches[0].clientX;
      const currentY = event.touches[0].clientY;
      pageTouchDeltaX = currentX - pageTouchStartX;
      const deltaY = currentY - pageTouchStartY;

      if (!isHorizontalPaging && Math.abs(pageTouchDeltaX) > 10 && Math.abs(pageTouchDeltaX) > Math.abs(deltaY)) {
        isHorizontalPaging = true;
      }

      if (isHorizontalPaging) {
        pagesTrack.style.transition = "none";
        const baseOffset = -currentPage * 100;
        const containerWidth = pagesContainer.clientWidth || 360;
        const dragOffsetPercent = (pageTouchDeltaX / containerWidth) * 100;
        pagesTrack.style.transform = `translateX(${baseOffset + dragOffsetPercent}%)`;
      }
    }, { passive: true });

    bindEvent(pagesContainer, "touchend", () => {
      if (isHorizontalPaging) {
        pagesTrack.style.transition = "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
        if (pageTouchDeltaX < -50 && currentPage < totalPages - 1) {
          goToPage(currentPage + 1);
        } else if (pageTouchDeltaX > 50 && currentPage > 0) {
          goToPage(currentPage - 1);
        } else {
          goToPage(currentPage);
        }
      }
      isHorizontalPaging = false;
      pageTouchDeltaX = 0;
    });

    const bottomArea = createElement("div", { className: "mobile-home-bottom" });

    const searchPill = createElement("div", {
      className: "pixel-search-pill",
      attributes: { "role": "button", "aria-label": "Search apps and web" }
    });
    const gLogo = createElement("span", {
      className: "pixel-search-g",
      html: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>'
    });
    const searchText = createElement("span", {
      className: "pixel-search-text",
      text: "Search apps & web..."
    });
    const searchIcons = createElement("div", { className: "pixel-search-pill-icons" });
    const micIcon = createElement("i", {
      className: "fas fa-microphone pixel-search-mic",
      attributes: { "aria-label": "Voice Search" }
    });
    const lensIcon = createElement("i", {
      className: "fas fa-camera pixel-search-lens",
      attributes: { "aria-label": "Google Lens Search" }
    });
    searchIcons.appendChild(micIcon);
    searchIcons.appendChild(lensIcon);
    searchPill.appendChild(gLogo);
    searchPill.appendChild(searchText);
    searchPill.appendChild(searchIcons);

    bindEvent(searchPill, "click", (event) => {
      if (event.target.closest(".pixel-search-mic") || event.target.closest(".pixel-search-lens")) {
        if (os?.app?.launch) {
          os.app.launch("browserApp").catch(() => onOpenDrawer());
        } else {
          onOpenDrawer();
        }
      } else {
        onOpenDrawer();
      }
    });
    bottomArea.appendChild(searchPill);

    const dock = createDock(os, ["browserApp", "notepadApp", "contactApp", "settingsApp", "terminalApp"]);
    dock.classList.add("mobile-dock-pixel");
    bottomArea.appendChild(dock);

    const gestureBar = createElement("div", { className: "mobile-gesture-bar" });
    bindEvent(gestureBar, "click", () => goHome());
    let barTouchStartY = 0;
    bindEvent(gestureBar, "touchstart", (event) => {
      if (event.touches.length === 1) {
        barTouchStartY = event.touches[0].clientY;
      }
    }, { passive: true });
    bindEvent(gestureBar, "touchend", (event) => {
      if (event.changedTouches.length === 1) {
        const barTouchEndY = event.changedTouches[0].clientY;
        if (barTouchStartY - barTouchEndY > 30) {
          openAppSwitcher();
        }
      }
    });
    bottomArea.appendChild(gestureBar);

    screen.appendChild(bottomArea);

    let homeTouchStartY = 0;
    let homeTouchStartX = 0;
    let isSwipeUpFromBottom = false;
    let homeTouchDeltaY = 0;

    bindEvent(screen, "touchstart", (event) => {
      if (event.touches.length !== 1) return;
      homeTouchStartY = event.touches[0].clientY;
      homeTouchStartX = event.touches[0].clientX;
      homeTouchDeltaY = 0;
      const screenHeight = window.innerHeight;
      const isNearBottom = homeTouchStartY >= screenHeight - 160;
      const targetBottomArea = event.target.closest(".mobile-home-bottom") || event.target.closest(".mobile-dock");
      isSwipeUpFromBottom = Boolean(isNearBottom || targetBottomArea);
    }, { passive: true });

    bindEvent(screen, "touchmove", (event) => {
      if (!isSwipeUpFromBottom || event.touches.length !== 1) return;
      const currentY = event.touches[0].clientY;
      const currentX = event.touches[0].clientX;
      homeTouchDeltaY = currentY - homeTouchStartY;
      const deltaX = currentX - homeTouchStartX;
      if (homeTouchDeltaY < 0 && Math.abs(homeTouchDeltaY) > Math.abs(deltaX)) {
        const drawerEl = $("#mobile-app-drawer");
        if (drawerEl) {
          const windowHeight = window.innerHeight;
          const translateY = Math.max(0, windowHeight + homeTouchDeltaY);
          drawerEl.style.transition = "none";
          drawerEl.style.transform = `translateY(${translateY}px)`;
        }
      }
    }, { passive: true });

    bindEvent(screen, "touchend", () => {
      if (!isSwipeUpFromBottom) return;
      const drawerEl = $("#mobile-app-drawer");
      if (drawerEl) {
        drawerEl.style.transition = "";
        if (homeTouchDeltaY < -60) {
          drawerEl.style.transform = "";
          onOpenDrawer();
        } else {
          drawerEl.style.transform = "";
        }
      }
      isSwipeUpFromBottom = false;
      homeTouchDeltaY = 0;
    });

    return screen;
  };

  const mount = () => {
    if (isMounted) return;
    isMounted = true;

    controlCenter = createControlCenter((enabled) => {
      if (statusBar) statusBar.setWifiEnabled(enabled);
    }, os);
    appDrawer = createAppDrawer(os);
    appSwitcher = createAppSwitcher(os);
    homeScreenEl = createHome(() => appDrawer.open());
    statusBar = createStatusBar({
      isMac: false,
      onToggleControlCenter: () => controlCenter.toggle(),
      os
    });

    document.body.appendChild(statusBar.element);
    document.body.appendChild(homeScreenEl);
    document.body.appendChild(appDrawer.element);
    document.body.appendChild(appSwitcher.element);
    document.body.appendChild(controlCenter.element);

    const openWins = os?.window?.getOpenWindows?.() || os?.windowManager?.openWindows;
    if (openWins) {
      openWins.forEach((winRecord, winId) => {
        adaptWindow(winId, null, os);
      });
    }
  };

  const unmount = () => {
    if (!isMounted) return;
    isMounted = false;

    if (homeClockInterval) {
      clearInterval(homeClockInterval);
      homeClockInterval = null;
    }
    if (activeMusicWidget) {
      activeMusicWidget.destroy();
      activeMusicWidget = null;
    }
    if (statusBar) {
      statusBar.destroy();
      statusBar.element.remove();
      statusBar = null;
    }
    if (homeScreenEl) {
      homeScreenEl.remove();
      homeScreenEl = null;
    }
    if (appDrawer) {
      appDrawer.element.remove();
      appDrawer = null;
    }
    if (appSwitcher) {
      appSwitcher.element.remove();
      appSwitcher = null;
    }
    if (controlCenter) {
      if (typeof controlCenter.destroy === "function") {
        controlCenter.destroy();
      }
      controlCenter.element.remove();
      controlCenter = null;
    }

    $$(".mobile-nav-header").forEach((el) => el.remove());
    $$(".mobile-home-indicator").forEach((el) => el.remove());
    $$(".mobile-gesture-bar").forEach((el) => el.remove());
  };

  const goHome = () => {
    const openWins = os?.window?.getOpenWindows?.() || os?.windowManager?.openWindows;
    if (openWins) {
      openWins.forEach((winRecord, winId) => {
        const win = $(`#${winId}`);
        if (win && win.style.display !== "none") {
          os?.window?.minimize?.(win);
        }
      });
    }
    if (appDrawer) appDrawer.close();
    if (appSwitcher) appSwitcher.close();
    if (controlCenter) controlCenter.close();
  };

  const openAppSwitcher = () => {
    if (appDrawer) appDrawer.close();
    if (controlCenter) controlCenter.close();
    if (appSwitcher) appSwitcher.open();
  };

  const openControlCenter = () => {
    if (appDrawer) appDrawer.close();
    if (appSwitcher) appSwitcher.close();
    if (controlCenter) controlCenter.toggle();
  };

  const openDrawer = () => {
    if (appSwitcher) appSwitcher.close();
    if (controlCenter) controlCenter.close();
    if (appDrawer) appDrawer.open();
  };

  return {
    name: "sitalos",
    mount,
    unmount,
    goHome,
    openAppSwitcher,
    openControlCenter,
    openDrawer
  };
};
