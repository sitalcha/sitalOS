import { $, createElement, setText, bindEvent, toggleClass } from "../../shared/domUtils.js";
import { audioMixer } from "../../audioMixer.js";

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

export const createControlCenter = (onWifiChange) => {
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
    if (typeof onWifiChange === "function") onWifiChange(active);
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

  tilesGrid.appendChild(wifiTile);
  tilesGrid.appendChild(btTile);
  tilesGrid.appendChild(torchTile);
  tilesGrid.appendChild(saverTile);

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

  const close = () => toggleClass(center, "active", false);
  const open = () => toggleClass(center, "active", true);
  const toggle = () => toggleClass(center, "active");

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
    }
  };
};
