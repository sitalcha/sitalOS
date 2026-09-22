import "./chromeOSMobile.css";
import { $, $$, createElement, setText, setHTML, bindEvent, toggleClass } from "../../shared/domUtils.js";
import { resolveIconUrl } from "../../shared/assetResolver.js";
import { APP_MANIFESTS } from "../../registry/AppManifest.js";
import { bus, BusEvents } from "../../core/EventBus.js";
import { audioMixer } from "../../audioMixer.js";

const PINNED_KEYS = ["browserApp", "explorerApp", "settingsApp", "terminalApp", "monacoApp"];

const getAppManifest = (serviceKey) => {
  return APP_MANIFESTS.find((entry) => entry.serviceKey === serviceKey) || null;
};

export const createChromeOSMobile = (os) => {
  let rootElement = null;
  let shelfElement = null;
  let quickSettingsPanel = null;
  let notificationPanel = null;
  let launcherOverlay = null;
  let overviewScreen = null;
  let clockIntervalId = null;
  let batteryHandler = null;
  let windowObserver = null;
  let touchStartY = 0;
  let touchStartX = 0;
  let isSwipingUpFromBottom = false;
  let currentLauncherPage = 0;

  const wifiState = { enabled: true };
  const bluetoothState = { enabled: true };
  const dndState = { enabled: false };
  const nightLightState = { enabled: false };

  const formatClock = () => {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const adaptWindow = (winId, winElement) => {
    const win = winElement || $(`#${winId}`);
    if (!win) return;

    let header = $(".chromeos-top-window-bar", win);
    if (!header) {
      header = createElement("div", { className: "chromeos-top-window-bar" });
      const backButton = createElement("button", {
        className: "chromeos-window-back-btn",
        html: '<i class="fas fa-arrow-left"></i>',
        attributes: { "aria-label": "Back" }
      });
      const titleString = os.window.getTitle(win.id) || $(".window-title", win)?.textContent || "Application";
      const titleNode = createElement("div", {
        className: "chromeos-window-title-text",
        text: titleString
      });

      const actionsWrap = createElement("div", { className: "chromeos-window-actions" });
      const splitButton = createElement("button", {
        className: "chromeos-window-split-btn",
        html: '<i class="fas fa-columns"></i>',
        attributes: { "aria-label": "Split Window" }
      });
      const closeButton = createElement("button", {
        className: "chromeos-window-close-btn",
        html: '<i class="fas fa-times"></i>',
        attributes: { "aria-label": "Close" }
      });

      actionsWrap.appendChild(splitButton);
      actionsWrap.appendChild(closeButton);

      header.appendChild(backButton);
      header.appendChild(titleNode);
      header.appendChild(actionsWrap);

      bindEvent(backButton, "click", (event) => {
        event.stopPropagation();
        os.window.minimize(win);
      });

      bindEvent(splitButton, "click", (event) => {
        event.stopPropagation();
        const isLeft = win.dataset.snapZone === "left";
        if (isLeft) {
          if (os.tablet?.snapToRight) {
            os.tablet.snapToRight(win);
          } else if (os.window.applySnap) {
            os.window.applySnap(win, "right");
          }
        } else {
          if (os.tablet?.snapToLeft) {
            os.tablet.snapToLeft(win);
          } else if (os.window.applySnap) {
            os.window.applySnap(win, "left");
          }
        }
      });

      bindEvent(closeButton, "click", (event) => {
        event.stopPropagation();
        os.window.close(win);
      });

      win.prepend(header);
    }

    let homeBar = $(".mobile-home-indicator", win);
    if (!homeBar) {
      homeBar = createElement("div", { className: "mobile-home-indicator" });
      bindEvent(homeBar, "click", () => os.window.minimize(win));
      win.appendChild(homeBar);
    }
  };

  const createStatusPill = () => {
    const pill = createElement("div", { className: "chromeos-status-pill" });
    const timeText = createElement("span", { className: "chromeos-status-time", text: formatClock() });
    const iconsGroup = createElement("div", { className: "chromeos-status-icons" });
    const wifiIcon = createElement("i", { className: "fas fa-wifi" });
    const batteryIcon = createElement("i", { className: "fas fa-battery-full" });
    const badge = createElement("span", { className: "chromeos-status-pill-badge" });

    iconsGroup.appendChild(wifiIcon);
    iconsGroup.appendChild(batteryIcon);

    pill.appendChild(timeText);
    pill.appendChild(badge);
    pill.appendChild(iconsGroup);

    const updateBadge = () => {
      const count = os.notify?.getCount ? os.notify.getCount() : 0;
      if (count > 0) {
        setText(badge, String(count));
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    };
    updateBadge();

    bindEvent(pill, "click", (event) => {
      event.stopPropagation();
      closePanelsExcept(quickSettingsPanel);
      toggleClass(quickSettingsPanel, "open");
    });

    bindEvent(badge, "click", (event) => {
      event.stopPropagation();
      closePanelsExcept(notificationPanel);
      renderNotifications();
      toggleClass(notificationPanel, "open");
    });

    return {
      element: pill,
      timeText,
      wifiIcon,
      batteryIcon,
      updateBadge
    };
  };

  const createQuickSettings = (statusComponents) => {
    const panel = createElement("div", { className: "chromeos-quick-settings-panel" });

    const header = createElement("div", { className: "chromeos-qs-header" });
    const userWrap = createElement("div", { className: "chromeos-qs-user-wrap" });
    const avatar = createElement("div", { className: "chromeos-qs-user-avatar", text: "U" });
    const userName = createElement("div", { className: "chromeos-qs-user-name", text: "Owner" });
    userWrap.appendChild(avatar);
    userWrap.appendChild(userName);

    const headerActions = createElement("div", { className: "chromeos-qs-header-actions" });
    const lockBtn = createElement("button", {
      className: "chromeos-qs-action-btn",
      html: '<i class="fas fa-lock"></i>',
      attributes: { "aria-label": "Lock Session" }
    });
    const settingsBtn = createElement("button", {
      className: "chromeos-qs-action-btn",
      html: '<i class="fas fa-cog"></i>',
      attributes: { "aria-label": "Settings" }
    });
    headerActions.appendChild(lockBtn);
    headerActions.appendChild(settingsBtn);

    header.appendChild(userWrap);
    header.appendChild(headerActions);

    bindEvent(lockBtn, "click", () => {
      if (os.app?.lockSession) os.app.lockSession();
      toggleClass(panel, "open", false);
    });

    bindEvent(settingsBtn, "click", () => {
      os.app.launch("settingsApp");
      toggleClass(panel, "open", false);
    });

    const tilesGrid = createElement("div", { className: "chromeos-qs-tiles-grid" });

    const createTile = (iconClass, labelText, initialState, onToggle) => {
      const tile = createElement("div", { className: `chromeos-qs-tile ${initialState ? "active" : ""}` });
      const icon = createElement("i", { className: `chromeos-qs-tile-icon ${iconClass}` });
      const info = createElement("div", { className: "chromeos-qs-tile-info" });
      const label = createElement("span", { className: "chromeos-qs-tile-label", text: labelText });
      const stateLabel = createElement("span", {
        className: "chromeos-qs-tile-state",
        text: initialState ? "On" : "Off"
      });

      info.appendChild(label);
      info.appendChild(stateLabel);
      tile.appendChild(icon);
      tile.appendChild(info);

      bindEvent(tile, "click", () => {
        const nextState = !tile.classList.contains("active");
        toggleClass(tile, "active", nextState);
        setText(stateLabel, nextState ? "On" : "Off");
        onToggle(nextState);
      });

      return tile;
    };

    const wifiTile = createTile("fas fa-wifi", "Wi-Fi", wifiState.enabled, (active) => {
      wifiState.enabled = active;
      toggleClass(statusComponents.wifiIcon, "fa-wifi", active);
      toggleClass(statusComponents.wifiIcon, "fa-wifi-slash", !active);
    });

    const btTile = createTile("fab fa-bluetooth-b", "Bluetooth", bluetoothState.enabled, (active) => {
      bluetoothState.enabled = active;
    });

    const dndTile = createTile("fas fa-moon", "Do Not Disturb", dndState.enabled, (active) => {
      dndState.enabled = active;
      if (os.notify?.setDoNotDisturb) os.notify.setDoNotDisturb(active);
    });

    const nightTile = createTile("fas fa-eye", "Night Light", nightLightState.enabled, (active) => {
      nightLightState.enabled = active;
      if (active) {
        document.documentElement.style.filter = "sepia(0.25)";
      } else {
        document.documentElement.style.filter = "";
      }
    });

    tilesGrid.appendChild(wifiTile);
    tilesGrid.appendChild(btTile);
    tilesGrid.appendChild(dndTile);
    tilesGrid.appendChild(nightTile);

    const slidersBox = createElement("div", { className: "chromeos-qs-sliders-box" });

    const brightRow = createElement("div", { className: "chromeos-qs-slider-row" });
    const brightIcon = createElement("i", { className: "fas fa-sun chromeos-qs-slider-icon" });
    const brightSlider = createElement("input", {
      className: "chromeos-qs-slider-input",
      attributes: { type: "range", min: "30", max: "100", value: "100", "aria-label": "Brightness" }
    });
    brightRow.appendChild(brightIcon);
    brightRow.appendChild(brightSlider);

    bindEvent(brightSlider, "input", () => {
      const brightnessVal = Number(brightSlider.value) / 100;
      const sepiaPart = nightLightState.enabled ? " sepia(0.25)" : "";
      document.documentElement.style.filter = `brightness(${brightnessVal})${sepiaPart}`;
    });

    const volumeRow = createElement("div", { className: "chromeos-qs-slider-row" });
    const volumeIcon = createElement("i", { className: "fas fa-volume-up chromeos-qs-slider-icon" });
    const volumeSlider = createElement("input", {
      className: "chromeos-qs-slider-input",
      attributes: { type: "range", min: "0", max: "100", value: "80", "aria-label": "Volume" }
    });
    volumeRow.appendChild(volumeIcon);
    volumeRow.appendChild(volumeSlider);

    bindEvent(volumeSlider, "input", () => {
      const mixer = typeof audioMixer === "function" ? audioMixer() : null;
      if (mixer) {
        mixer.masterVolume = Number(volumeSlider.value) / 100;
        if (typeof mixer.save === "function") mixer.save();
      }
    });

    slidersBox.appendChild(brightRow);
    slidersBox.appendChild(volumeRow);

    const footer = createElement("div", { className: "chromeos-qs-footer" });
    const batteryText = createElement("span", { text: "Battery: 100%" });
    const osVer = createElement("span", { text: "ChromeOS Tablet 120" });
    footer.appendChild(batteryText);
    footer.appendChild(osVer);

    panel.appendChild(header);
    panel.appendChild(tilesGrid);
    panel.appendChild(slidersBox);
    panel.appendChild(footer);

    return {
      element: panel,
      batteryText
    };
  };

  const createNotificationCenter = (statusComponents) => {
    const panel = createElement("div", { className: "chromeos-notification-panel" });

    const header = createElement("div", { className: "chromeos-ntf-header" });
    const title = createElement("span", { className: "chromeos-ntf-title", text: "Notifications" });
    const clearBtn = createElement("button", {
      className: "chromeos-ntf-clear-btn",
      text: "Clear all",
      attributes: { "aria-label": "Clear all notifications" }
    });

    header.appendChild(title);
    header.appendChild(clearBtn);

    const list = createElement("div", { className: "chromeos-ntf-list" });
    panel.appendChild(header);
    panel.appendChild(list);

    const render = () => {
      setHTML(list, "");
      const items = os.notify?.getAll ? os.notify.getAll() : [];
      if (!items || items.length === 0) {
        list.appendChild(createElement("div", { className: "chromeos-ntf-empty", text: "No new notifications" }));
        statusComponents.updateBadge();
        return;
      }

      items.forEach((item) => {
        const itemNode = createElement("div", { className: "chromeos-ntf-item" });
        const iconImg = createElement("img", {
          className: "chromeos-ntf-icon",
          attributes: { src: resolveIconUrl(item.icon || "static/icons/file.webp"), alt: "" }
        });

        const content = createElement("div", { className: "chromeos-ntf-content" });
        const itemTitle = createElement("span", { className: "chromeos-ntf-item-title", text: item.title || "Alert" });
        const itemMsg = createElement("span", { className: "chromeos-ntf-item-msg", text: item.message || "" });
        content.appendChild(itemTitle);
        content.appendChild(itemMsg);

        const closeBtn = createElement("button", {
          className: "chromeos-ntf-item-close",
          html: '<i class="fas fa-times"></i>',
          attributes: { "aria-label": "Dismiss notification" }
        });

        itemNode.appendChild(iconImg);
        itemNode.appendChild(content);
        itemNode.appendChild(closeBtn);

        bindEvent(closeBtn, "click", (event) => {
          event.stopPropagation();
          if (os.notify?.clear) os.notify.clear(item.id);
          render();
        });

        list.appendChild(itemNode);
      });

      statusComponents.updateBadge();
    };

    bindEvent(clearBtn, "click", (event) => {
      event.stopPropagation();
      if (os.notify?.clearAll) os.notify.clearAll();
      render();
    });

    return {
      element: panel,
      render
    };
  };

  const renderNotifications = () => {
    if (notificationPanel && notificationPanel.render) {
      notificationPanel.render();
    }
  };

  const createOverview = () => {
    const overlay = createElement("div", { className: "chromeos-overview-screen" });
    const header = createElement("div", { className: "chromeos-overview-header" });
    header.appendChild(createElement("span", { text: "Recent Windows" }));

    const cardsTrack = createElement("div", { className: "chromeos-overview-cards-container" });
    overlay.appendChild(header);
    overlay.appendChild(cardsTrack);

    const renderCards = () => {
      setHTML(cardsTrack, "");
      const openWindows = os.window.getOpenWindows ? os.window.getOpenWindows() : new Map();
      if (!openWindows || openWindows.size === 0) {
        cardsTrack.appendChild(createElement("div", {
          className: "chromeos-ntf-empty",
          text: "No active application windows"
        }));
        return;
      }

      openWindows.forEach((entry, winId) => {
        const card = createElement("div", { className: "chromeos-overview-card" });
        const cardHeader = createElement("div", { className: "chromeos-overview-card-header" });
        const info = createElement("div", { className: "chromeos-overview-card-info" });
        const iconImg = createElement("img", {
          className: "chromeos-overview-card-icon",
          attributes: { src: resolveIconUrl(entry.iconValue || "static/icons/file.webp"), alt: "" }
        });
        const titleSpan = createElement("span", {
          className: "chromeos-overview-card-title",
          text: entry.title || "Window"
        });
        info.appendChild(iconImg);
        info.appendChild(titleSpan);

        const closeBtn = createElement("button", {
          className: "chromeos-overview-card-close",
          html: '<i class="fas fa-times"></i>',
          attributes: { "aria-label": "Close" }
        });
        cardHeader.appendChild(info);
        cardHeader.appendChild(closeBtn);

        const body = createElement("div", { className: "chromeos-overview-card-body" });
        const bigIcon = createElement("img", {
          className: "chromeos-overview-card-big-icon",
          attributes: { src: resolveIconUrl(entry.iconValue || "static/icons/file.webp"), alt: "" }
        });
        body.appendChild(bigIcon);

        const actions = createElement("div", { className: "chromeos-overview-card-actions" });
        const leftSnap = createElement("button", {
          className: "chromeos-overview-snap-btn",
          html: '<i class="fas fa-arrow-left"></i><span>Snap Left</span>'
        });
        const rightSnap = createElement("button", {
          className: "chromeos-overview-snap-btn",
          html: '<i class="fas fa-arrow-right"></i><span>Snap Right</span>'
        });
        actions.appendChild(leftSnap);
        actions.appendChild(rightSnap);

        card.appendChild(cardHeader);
        card.appendChild(body);
        card.appendChild(actions);

        bindEvent(card, "click", () => {
          toggleClass(overlay, "open", false);
          os.window.focus(winId);
          const win = $(`#${winId}`);
          if (win && win.style.display === "none") win.style.display = "";
        });

        bindEvent(closeBtn, "click", (event) => {
          event.stopPropagation();
          os.window.close(winId);
          card.remove();
          if (cardsTrack.children.length === 0) renderCards();
        });

        bindEvent(leftSnap, "click", (event) => {
          event.stopPropagation();
          toggleClass(overlay, "open", false);
          const win = $(`#${winId}`);
          if (win) {
            win.style.display = "";
            if (os.tablet?.snapToLeft) {
              os.tablet.snapToLeft(win);
            } else if (os.window.applySnap) {
              os.window.applySnap(win, "left");
            }
          }
        });

        bindEvent(rightSnap, "click", (event) => {
          event.stopPropagation();
          toggleClass(overlay, "open", false);
          const win = $(`#${winId}`);
          if (win) {
            win.style.display = "";
            if (os.tablet?.snapToRight) {
              os.tablet.snapToRight(win);
            } else if (os.window.applySnap) {
              os.window.applySnap(win, "right");
            }
          }
        });

        cardsTrack.appendChild(card);
      });
    };

    bindEvent(overlay, "click", (event) => {
      if (event.target === overlay) {
        toggleClass(overlay, "open", false);
      }
    });

    return {
      element: overlay,
      open: () => {
        renderCards();
        toggleClass(overlay, "open", true);
      },
      close: () => toggleClass(overlay, "open", false),
      toggle: () => {
        if (overlay.classList.contains("open")) {
          toggleClass(overlay, "open", false);
        } else {
          renderCards();
          toggleClass(overlay, "open", true);
        }
      }
    };
  };

  const createLauncher = () => {
    const overlay = createElement("div", { className: "chromeos-tablet-launcher-overlay" });

    const searchBox = createElement("div", { className: "chromeos-launcher-search-box" });
    const googleIcon = createElement("div", {
      className: "chromeos-google-icon",
      html: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>'
    });
    const searchInput = createElement("input", {
      className: "chromeos-search-input",
      attributes: { type: "text", placeholder: "Search your device and the web..." }
    });
    const micBtn = createElement("button", {
      className: "chromeos-search-mic-btn",
      html: '<i class="fas fa-microphone"></i>',
      attributes: { "aria-label": "Voice Search" }
    });

    searchBox.appendChild(googleIcon);
    searchBox.appendChild(searchInput);
    searchBox.appendChild(micBtn);

    const recentRow = createElement("div", { className: "chromeos-recent-row" });
    recentRow.appendChild(createElement("span", { className: "chromeos-recent-label", text: "Recent Apps" }));
    const recentGrid = createElement("div", { className: "chromeos-recent-grid" });
    recentRow.appendChild(recentGrid);

    PINNED_KEYS.forEach((key) => {
      const app = getAppManifest(key);
      if (!app) return;
      const recentBtn = createElement("button", { className: "chromeos-recent-item" });
      const img = createElement("img", {
        className: "chromeos-recent-icon",
        attributes: { src: resolveIconUrl(app.icon || "static/icons/file.webp"), alt: app.title || "" }
      });
      const label = createElement("span", { className: "chromeos-recent-name", text: app.title || "" });
      recentBtn.appendChild(img);
      recentBtn.appendChild(label);

      bindEvent(recentBtn, "click", () => {
        os.app.launch(app.serviceKey);
        close();
      });

      recentGrid.appendChild(recentBtn);
    });

    const viewport = createElement("div", { className: "chromeos-pages-viewport" });
    const track = createElement("div", { className: "chromeos-pages-track" });
    viewport.appendChild(track);

    const dotsWrap = createElement("div", { className: "chromeos-launcher-dots" });

    overlay.appendChild(searchBox);
    overlay.appendChild(recentRow);
    overlay.appendChild(viewport);
    overlay.appendChild(dotsWrap);

    const PAGE_SIZE = 16;
    let pagesCount = 1;

    const renderGrid = (filterQuery = "") => {
      setHTML(track, "");
      setHTML(dotsWrap, "");
      const query = filterQuery.toLowerCase().trim();
      const filteredApps = APP_MANIFESTS.filter((app) => {
        if (!app.title) return false;
        if (!query) return true;
        return app.title.toLowerCase().includes(query) || (app.description && app.description.toLowerCase().includes(query));
      });

      const pages = [];
      for (let index = 0; index < filteredApps.length; index += PAGE_SIZE) {
        pages.push(filteredApps.slice(index, index + PAGE_SIZE));
      }
      if (pages.length === 0) pages.push([]);

      pagesCount = pages.length;
      currentLauncherPage = Math.min(currentLauncherPage, pagesCount - 1);

      pages.forEach((pageList) => {
        const pageGrid = createElement("div", { className: "chromeos-page-grid" });
        pageList.forEach((app) => {
          const btn = createElement("button", { className: "chromeos-grid-app-item" });
          const icon = createElement("img", {
            className: "chromeos-grid-app-icon",
            attributes: { src: resolveIconUrl(app.icon || "static/icons/file.webp"), alt: app.title || "" }
          });
          const title = createElement("span", { className: "chromeos-grid-app-label", text: app.title || "" });
          btn.appendChild(icon);
          btn.appendChild(title);

          bindEvent(btn, "click", () => {
            os.app.launch(app.serviceKey);
            close();
          });

          pageGrid.appendChild(btn);
        });
        track.appendChild(pageGrid);
      });

      for (let index = 0; index < pagesCount; index++) {
        const dot = createElement("button", {
          className: `chromeos-launcher-dot ${index === currentLauncherPage ? "active" : ""}`,
          attributes: { "aria-label": `Page ${index + 1}` }
        });
        const targetPage = index;
        bindEvent(dot, "click", () => setPage(targetPage));
        dotsWrap.appendChild(dot);
      }

      setPage(currentLauncherPage);
    };

    const setPage = (pageIdx) => {
      currentLauncherPage = Math.max(0, Math.min(pageIdx, pagesCount - 1));
      track.style.transform = `translateX(-${currentLauncherPage * 100}%)`;
      const allDots = $$(".chromeos-launcher-dot", dotsWrap);
      allDots.forEach((dot, index) => {
        toggleClass(dot, "active", index === currentLauncherPage);
      });
    };

    bindEvent(searchInput, "input", () => {
      currentLauncherPage = 0;
      renderGrid(searchInput.value);
    });

    let launcherTouchStartX = 0;
    let launcherTouchDeltaX = 0;
    bindEvent(viewport, "touchstart", (event) => {
      if (event.touches.length !== 1) return;
      launcherTouchStartX = event.touches[0].clientX;
      launcherTouchDeltaX = 0;
    }, { passive: true });

    bindEvent(viewport, "touchmove", (event) => {
      if (event.touches.length !== 1) return;
      launcherTouchDeltaX = event.touches[0].clientX - launcherTouchStartX;
    }, { passive: true });

    bindEvent(viewport, "touchend", () => {
      if (launcherTouchDeltaX < -40 && currentLauncherPage < pagesCount - 1) {
        setPage(currentLauncherPage + 1);
      } else if (launcherTouchDeltaX > 40 && currentLauncherPage > 0) {
        setPage(currentLauncherPage - 1);
      }
      launcherTouchDeltaX = 0;
    });

    const open = () => {
      renderGrid();
      searchInput.value = "";
      toggleClass(overlay, "open", true);
      searchInput.focus();
    };

    const close = () => {
      toggleClass(overlay, "open", false);
      searchInput.value = "";
    };

    const toggle = () => {
      if (overlay.classList.contains("open")) {
        close();
      } else {
        open();
      }
    };

    bindEvent(overlay, "click", (event) => {
      if (event.target === overlay) close();
    });

    return {
      element: overlay,
      open,
      close,
      toggle
    };
  };

  const closePanelsExcept = (targetPanel) => {
    if (quickSettingsPanel && quickSettingsPanel !== targetPanel) {
      toggleClass(quickSettingsPanel, "open", false);
    }
    if (notificationPanel && notificationPanel.element !== targetPanel) {
      toggleClass(notificationPanel.element, "open", false);
    }
  };

  const buildShelf = () => {
    const shelf = createElement("div", { className: "chromeos-tablet-shelf" });

    const launcherBtn = createElement("button", {
      className: "chromeos-shelf-launcher-btn",
      attributes: { "aria-label": "Launcher" }
    });
    const dotRing = createElement("div", { className: "chromeos-launcher-dot-ring" });
    const dotInner = createElement("div", { className: "chromeos-launcher-dot-inner" });
    dotRing.appendChild(dotInner);
    launcherBtn.appendChild(dotRing);

    bindEvent(launcherBtn, "click", (event) => {
      event.stopPropagation();
      closePanelsExcept(null);
      if (launcherOverlay) launcherOverlay.toggle();
    });

    const appsContainer = createElement("div", { className: "chromeos-shelf-apps" });

    const renderShelfApps = () => {
      setHTML(appsContainer, "");
      const runningWins = os.window.getOpenWindows ? os.window.getOpenWindows() : new Map();

      PINNED_KEYS.forEach((key) => {
        const app = getAppManifest(key);
        if (!app) return;
        const btn = createElement("button", {
          className: "chromeos-shelf-app-btn",
          attributes: { "aria-label": app.title || "" }
        });
        const iconImg = createElement("img", {
          className: "chromeos-shelf-app-icon",
          attributes: { src: resolveIconUrl(app.icon || "static/icons/file.webp"), alt: "" }
        });
        btn.appendChild(iconImg);

        let isRunning = false;
        runningWins.forEach((winRecord) => {
          if (winRecord.appId === key) isRunning = true;
        });
        if (isRunning) {
          btn.appendChild(createElement("span", { className: "chromeos-shelf-app-indicator" }));
        }

        bindEvent(btn, "click", (event) => {
          event.stopPropagation();
          os.app.launch(key);
        });

        appsContainer.appendChild(btn);
      });
    };

    const rightArea = createElement("div", { className: "chromeos-shelf-right" });
    const status = createStatusPill();
    const overviewBtn = createElement("button", {
      className: "chromeos-overview-toggle-btn",
      html: '<i class="far fa-window-restore"></i>',
      attributes: { "aria-label": "Overview" }
    });

    bindEvent(overviewBtn, "click", (event) => {
      event.stopPropagation();
      closePanelsExcept(null);
      if (overviewScreen) overviewScreen.toggle();
    });

    rightArea.appendChild(overviewBtn);
    rightArea.appendChild(status.element);

    shelf.appendChild(launcherBtn);
    shelf.appendChild(appsContainer);
    shelf.appendChild(rightArea);

    return {
      element: shelf,
      status,
      renderShelfApps
    };
  };

  const handleGlobalTouchStart = (event) => {
    if (event.touches.length !== 1) return;
    touchStartY = event.touches[0].clientY;
    touchStartX = event.touches[0].clientX;
    const isNearBottom = touchStartY >= window.innerHeight - 70;
    isSwipingUpFromBottom = isNearBottom;
  };

  const handleGlobalTouchEnd = (event) => {
    if (event.changedTouches.length !== 1) return;
    const endY = event.changedTouches[0].clientY;
    const endX = event.changedTouches[0].clientX;
    const deltaY = endY - touchStartY;
    const deltaX = endX - touchStartX;

    if (isSwipingUpFromBottom && deltaY < -60 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (launcherOverlay) launcherOverlay.open();
      isSwipingUpFromBottom = false;
      return;
    }

    if (touchStartY < 50 && deltaY > 70 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (touchStartX < window.innerWidth / 2) {
        closePanelsExcept(notificationPanel.element);
        renderNotifications();
        toggleClass(notificationPanel.element, "open", true);
      } else {
        closePanelsExcept(quickSettingsPanel);
        toggleClass(quickSettingsPanel, "open", true);
      }
    }
    isSwipingUpFromBottom = false;
  };

  const handleOutsideClick = (event) => {
    if (quickSettingsPanel && quickSettingsPanel.classList.contains("open")) {
      if (!quickSettingsPanel.contains(event.target) && !shelfElement.contains(event.target)) {
        toggleClass(quickSettingsPanel, "open", false);
      }
    }
    if (notificationPanel && notificationPanel.element.classList.contains("open")) {
      if (!notificationPanel.element.contains(event.target) && !shelfElement.contains(event.target)) {
        toggleClass(notificationPanel.element, "open", false);
      }
    }
  };

  const mount = () => {
    if ($("#chromeos-mobile-root")) return;

    rootElement = createElement("div", { id: "chromeos-mobile-root", className: "chromeos-mobile-root" });

    const shelfData = buildShelf();
    shelfElement = shelfData.element;

    const quickSettingsData = createQuickSettings(shelfData.status);
    quickSettingsPanel = quickSettingsData.element;

    notificationPanel = createNotificationCenter(shelfData.status);
    overviewScreen = createOverview();
    launcherOverlay = createLauncher();

    rootElement.appendChild(shelfElement);
    rootElement.appendChild(quickSettingsPanel);
    rootElement.appendChild(notificationPanel.element);
    rootElement.appendChild(overviewScreen.element);
    rootElement.appendChild(launcherOverlay.element);

    document.body.appendChild(rootElement);

    clockIntervalId = setInterval(() => {
      const current = formatClock();
      setText(shelfData.status.timeText, current);
    }, 1000);

    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        batteryHandler = () => {
          const levelPercent = Math.round(battery.level * 100);
          setText(quickSettingsData.batteryText, `Battery: ${levelPercent}%`);
          let iconClass = "fas fa-battery-full";
          if (battery.charging) {
            iconClass = "fas fa-bolt";
          } else if (levelPercent < 20) {
            iconClass = "fas fa-battery-quarter";
          } else if (levelPercent < 50) {
            iconClass = "fas fa-battery-half";
          } else if (levelPercent < 80) {
            iconClass = "fas fa-battery-three-quarters";
          }
          shelfData.status.batteryIcon.className = iconClass;
        };
        batteryHandler();
        bindEvent(battery, "levelchange", batteryHandler);
        bindEvent(battery, "chargingchange", batteryHandler);
      }).catch(() => {});
    }

    const openWins = os.window.getOpenWindows ? os.window.getOpenWindows() : null;
    if (openWins) {
      openWins.forEach((record, winId) => {
        adaptWindow(winId, null);
      });
    }

    windowObserver = new MutationObserver(() => {
      $$(".window").forEach((win) => adaptWindow(win.id, win));
      shelfData.renderShelfApps();
    });
    windowObserver.observe($("#desktop") || document.body, { childList: true, subtree: true });

    bindEvent(document, "touchstart", handleGlobalTouchStart, { passive: true });
    bindEvent(document, "touchend", handleGlobalTouchEnd, { passive: true });
    bindEvent(document, "click", handleOutsideClick);

    bus.on(BusEvents.WINDOW_CREATED, ({ winId, win }) => {
      adaptWindow(winId, win);
      shelfData.renderShelfApps();
    });
    bus.on(BusEvents.WINDOW_CLOSED, () => shelfData.renderShelfApps());
    bus.on(BusEvents.NOTIFY, () => {
      shelfData.status.updateBadge();
      renderNotifications();
    });
  };

  const unmount = () => {
    if (clockIntervalId) {
      clearInterval(clockIntervalId);
      clockIntervalId = null;
    }
    if (windowObserver) {
      windowObserver.disconnect();
      windowObserver = null;
    }
    document.removeEventListener("touchstart", handleGlobalTouchStart);
    document.removeEventListener("touchend", handleGlobalTouchEnd);
    document.removeEventListener("click", handleOutsideClick);

    if (rootElement) {
      rootElement.remove();
      rootElement = null;
    }

    $$(".chromeos-top-window-bar").forEach((el) => el.remove());
  };

  const refresh = () => {
    renderNotifications();
    const shelfApps = $(".chromeos-shelf-apps");
    if (shelfApps && shelfElement) {
      const runningWins = os.window.getOpenWindows ? os.window.getOpenWindows() : new Map();
      const items = $$(".chromeos-shelf-app-btn", shelfApps);
      items.forEach((btn, index) => {
        const key = PINNED_KEYS[index];
        const ind = $(".chromeos-shelf-app-indicator", btn);
        let isRunning = false;
        runningWins.forEach((winRecord) => {
          if (winRecord.appId === key) isRunning = true;
        });
        if (isRunning && !ind) {
          btn.appendChild(createElement("span", { className: "chromeos-shelf-app-indicator" }));
        } else if (!isRunning && ind) {
          ind.remove();
        }
      });
    }
  };

  return {
    mount,
    unmount,
    refresh
  };
};
