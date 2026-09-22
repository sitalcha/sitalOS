import { $, $$, createElement, setText, setHTML, bindEvent, toggleClass } from "../../shared/domUtils.js";
import { APP_MANIFESTS } from "../../registry/AppManifest.js";
import {
  createStatusBar,
  createDock,
  createMusicWidget,
  createAppItem,
  adaptWindow
} from "./commonMobileUI.js";
import { createAppDrawer } from "./appDrawer.js";
import { createAppSwitcher } from "./appSwitcher.js";
import { createControlCenter } from "./controlCenter.js";

export const createMacOSMobile = (os) => {
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
      className: "mobile-home-screen mobile-mode-mac"
    });

    const topWidget = createElement("div", { className: "mobile-home-top-widget" });
    const clockEl = createElement("div", { className: "mobile-home-clock", text: "12:00" });
    const dateEl = createElement("div", {
      className: "mobile-home-date",
      text: new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date())
    });
    topWidget.appendChild(clockEl);
    topWidget.appendChild(dateEl);
    screen.appendChild(topWidget);

    const updateHomeClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setText(clockEl, `${hours}:${minutes}`);
    };
    updateHomeClock();
    homeClockInterval = setInterval(updateHomeClock, 1000);

    const spotBtn = createElement("button", {
      className: "mobile-spotlight-btn",
      html: '<i class="fas fa-search"></i><span>Search</span>',
      attributes: { "aria-label": "Search" }
    });
    bindEvent(spotBtn, "click", onOpenDrawer);
    screen.appendChild(spotBtn);

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
    const dock = createDock(os, ["browserApp", "contactApp", "notepadApp", "settingsApp"]);
    bottomArea.appendChild(dock);
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
    });
    appDrawer = createAppDrawer(os);
    appSwitcher = createAppSwitcher(os);
    homeScreenEl = createHome(() => appDrawer.open());
    statusBar = createStatusBar(() => controlCenter.toggle());

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
    name: "mac",
    mount,
    unmount,
    goHome,
    openAppSwitcher,
    openControlCenter,
    openDrawer
  };
};
