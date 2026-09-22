import { $, createElement, setText, bindEvent, toggleClass } from "../../shared/domUtils.js";
import { audioMixer } from "../../audioMixer.js";
import { openQuickModeSwitcher } from "./commonMobileUI.js";

const createTile = (iconClass, label, initialActive, onToggle) => {
  let active = initialActive;
  const tile = createElement("div", {
    className: `mobile-cc-tile ${active ? "active" : ""}`,
    html: `<i class="${iconClass} mobile-cc-tile-icon"></i><div class="mobile-cc-tile-info"><span class="mobile-cc-tile-label">${label}</span><span class="mobile-cc-tile-status">${active ? "On" : "Off"}</span></div>`
  });
  bindEvent(tile, "click", () => {
    active = !active;
    toggleClass(tile, "active", active);
    const statusText = $(".mobile-cc-tile-status", tile);
    if (statusText) setText(statusText, active ? "On" : "Off");
    onToggle(active);
  });
  return tile;
};

const createActionTile = (iconClass, label, status, onClick) => {
  const tile = createElement("div", {
    className: "mobile-cc-tile mobile-cc-tile-action",
    html: `<i class="${iconClass} mobile-cc-tile-icon"></i><div class="mobile-cc-tile-info"><span class="mobile-cc-tile-label">${label}</span><span class="mobile-cc-tile-status">${status}</span></div>`
  });
  bindEvent(tile, "click", onClick);
  return tile;
};

export const createControlCenter = (onWifiChange, os) => {
  const actualOs = (typeof onWifiChange === "object" && onWifiChange !== null && onWifiChange.os) ? onWifiChange.os : os;
  const wifiCallback = (typeof onWifiChange === "object" && onWifiChange !== null && typeof onWifiChange.onWifiChange === "function")
    ? onWifiChange.onWifiChange
    : onWifiChange;

  const center = createElement("div", { id: "mobile-control-center" });
  const header = createElement("div", { className: "mobile-cc-header" });
  const title = createElement("span", { className: "mobile-cc-title", text: "Control Center" });
  const closeBtn = createElement("button", {
    className: "mobile-cc-close-btn",
    html: '<i class="fas fa-chevron-up"></i>',
    attributes: { "aria-label": "Close Control Center" }
  });
  header.appendChild(title);
  header.appendChild(closeBtn);

  const tilesGrid = createElement("div", { className: "mobile-cc-tiles-grid" });

  const wifiTile = createTile("fas fa-wifi", "Wi-Fi", true, (active) => {
    const statusText = $(".mobile-cc-tile-status", wifiTile);
    if (statusText) setText(statusText, active ? "Connected" : "Off");
    if (typeof wifiCallback === "function") wifiCallback(active);
  });
  const wifiStatus = $(".mobile-cc-tile-status", wifiTile);
  if (wifiStatus) setText(wifiStatus, "Connected");

  const btTile = createTile("fab fa-bluetooth-b", "Bluetooth", true, () => {});

  let flashlightOverlay = null;
  const torchTile = createTile("fas fa-lightbulb", "Flashlight", false, (active) => {
    if (active) {
      if (!flashlightOverlay) {
        flashlightOverlay = createElement("div", { id: "mobile-flashlight-overlay" });
        bindEvent(flashlightOverlay, "click", () => {
          toggleClass(torchTile, "active", false);
          const statusEl = $(".mobile-cc-tile-status", torchTile);
          if (statusEl) setText(statusEl, "Off");
          flashlightOverlay.remove();
          flashlightOverlay = null;
        });
        document.body.appendChild(flashlightOverlay);
      }
    } else if (flashlightOverlay) {
      flashlightOverlay.remove();
      flashlightOverlay = null;
    }
  });

  const isSaver = document.documentElement.classList.contains("battery-saver");
  const saverTile = createTile("fas fa-leaf", "Battery Saver", isSaver, (active) => {
    toggleClass(document.documentElement, "battery-saver", active);
  });

  const close = () => toggleClass(center, "active", false);
  const open = () => toggleClass(center, "active", true);
  const toggle = () => toggleClass(center, "active");

  const handleSwitchOS = () => {
    close();
    if (actualOs?.app?.launch) {
      actualOs.app.launch("modeSwitcherApp");
    } else {
      openQuickModeSwitcher(actualOs);
    }
  };

  let sessionModalOverlay = null;
  const showSessionModal = () => {
    if (sessionModalOverlay) {
      sessionModalOverlay.remove();
      sessionModalOverlay = null;
    }
    const overlay = createElement("div", { className: "mobile-modal-overlay" });
    sessionModalOverlay = overlay;

    const modal = createElement("div", { className: "mobile-session-modal" });
    const modalHeader = createElement("div", { className: "mobile-modal-header" });
    const modalTitle = createElement("span", { className: "mobile-modal-title", text: "Session" });
    const modalCloseBtn = createElement("button", {
      className: "mobile-modal-close",
      html: '<i class="fas fa-times"></i>',
      attributes: { "aria-label": "Close" }
    });
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalCloseBtn);

    const actions = createElement("div", { className: "mobile-modal-actions" });

    const switchBtn = createElement("button", {
      className: "mobile-modal-btn",
      html: '<i class="fas fa-layer-group"></i><span>Switch Mode</span>'
    });
    bindEvent(switchBtn, "click", () => {
      overlay.remove();
      sessionModalOverlay = null;
      close();
      if (actualOs?.app?.launch) {
        actualOs.app.launch("modeSwitcherApp");
      } else {
        openQuickModeSwitcher(actualOs);
      }
    });

    const lockBtn = createElement("button", {
      className: "mobile-modal-btn",
      html: '<i class="fas fa-lock"></i><span>Lock Screen</span>'
    });
    bindEvent(lockBtn, "click", () => {
      overlay.remove();
      sessionModalOverlay = null;
      close();
      if (typeof actualOs?.lockSession === "function") {
        actualOs.lockSession();
      } else if (typeof actualOs?.app?.getInstance === "function" && actualOs.app.getInstance("sessionManager")?.lockSession) {
        actualOs.app.getInstance("sessionManager").lockSession();
      }
      document.dispatchEvent(new CustomEvent("os:lock"));
      window.dispatchEvent(new CustomEvent("os:lock"));
      if (actualOs?.events && typeof actualOs.events.emit === "function") {
        actualOs.events.emit("os:lock");
      }
    });

    const signOutBtn = createElement("button", {
      className: "mobile-modal-btn mobile-modal-btn-danger",
      html: '<i class="fas fa-sign-out-alt"></i><span>Sign Out</span>'
    });
    bindEvent(signOutBtn, "click", () => {
      overlay.remove();
      sessionModalOverlay = null;
      close();
      if (actualOs?.app?.launch) {
        actualOs.app.launch("sessionManager");
      } else {
        const sessionManager = typeof actualOs?.app?.getInstance === "function" ? actualOs.app.getInstance("sessionManager") : null;
        if (sessionManager && typeof sessionManager.restart === "function") {
          sessionManager.restart();
        } else {
          window.location.reload();
        }
      }
    });

    actions.appendChild(switchBtn);
    actions.appendChild(lockBtn);
    actions.appendChild(signOutBtn);

    modal.appendChild(modalHeader);
    modal.appendChild(actions);
    overlay.appendChild(modal);

    bindEvent(modalCloseBtn, "click", () => {
      overlay.remove();
      sessionModalOverlay = null;
    });
    bindEvent(overlay, "click", (event) => {
      if (event.target === overlay) {
        overlay.remove();
        sessionModalOverlay = null;
      }
    });

    document.body.appendChild(overlay);
  };

  const switchTile = createActionTile("fas fa-layer-group", "Switch OS", "Select Mode", handleSwitchOS);
  const powerTile = createActionTile("fas fa-power-off", "Session", "Power Options", showSessionModal);

  tilesGrid.appendChild(wifiTile);
  tilesGrid.appendChild(btTile);
  tilesGrid.appendChild(torchTile);
  tilesGrid.appendChild(saverTile);
  tilesGrid.appendChild(switchTile);
  tilesGrid.appendChild(powerTile);

  const sliders = createElement("div", { className: "mobile-cc-sliders" });
  const brightnessRow = createElement("div", { className: "mobile-cc-slider-row" });
  brightnessRow.innerHTML = '<i class="fas fa-sun mobile-cc-slider-icon"></i><input type="range" class="mobile-cc-slider-input" min="20" max="100" value="100" aria-label="Brightness" />';
  const brightInput = $("input", brightnessRow);
  bindEvent(brightInput, "input", () => {
    const val = Number(brightInput.value) / 100;
    document.documentElement.style.filter = `brightness(${val})`;
  });

  const volumeRow = createElement("div", { className: "mobile-cc-slider-row" });
  volumeRow.innerHTML = '<i class="fas fa-volume-up mobile-cc-slider-icon"></i><input type="range" class="mobile-cc-slider-input" min="0" max="100" value="80" aria-label="Volume" />';
  const volInput = $("input", volumeRow);
  bindEvent(volInput, "input", () => {
    const mixer = typeof audioMixer === "function" ? audioMixer() : null;
    if (mixer) {
      mixer.masterVolume = Number(volInput.value) / 100;
      if (typeof mixer.save === "function") mixer.save();
    }
  });

  sliders.appendChild(brightnessRow);
  sliders.appendChild(volumeRow);

  center.appendChild(header);
  center.appendChild(tilesGrid);
  center.appendChild(sliders);

  bindEvent(closeBtn, "click", close);

  return {
    element: center,
    open,
    close,
    toggle,
    destroy: () => {
      if (flashlightOverlay) {
        flashlightOverlay.remove();
        flashlightOverlay = null;
      }
      if (sessionModalOverlay) {
        sessionModalOverlay.remove();
        sessionModalOverlay = null;
      }
    }
  };
};
