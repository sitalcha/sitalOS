import "./style.css";
import { os, ServiceKeys } from "../../framework.js";
import { modeManager, MODES } from "../../modeManager.js";
import { createElement, $ } from "../../shared/domUtils.js";
import { resolveIconUrl } from "../../shared/assetResolver.js";
import { BusEvents } from "../../core/EventBus.js";
import { getSetting } from "../../utils/utils.js";
import { showStartStyleMenu } from "../../shared/contextMenu.js";
import { StorageKeys } from "../../StorageKeys.js";
import { KeybindManager } from "../../keybindManager.js";
import { getEffectiveIcon } from "../../shared/iconPack.js";

const DEFAULT_DOCK_APPS = [
  { appId: "launchpadApp", title: "Launchpad", icon: "papirus:actions/view-grid", color: "#888" },
  { appId: "commandPalette", title: "Finder", icon: "papirus:places/folder-blue", color: "#6ea8fe", isFinder: true },
  { appId: "explorerApp", title: "Explorer", icon: `static/icons/file.webp`, color: "#fff" },
  { appId: "browserApp", title: "Yuki Browser", icon: "static/icons/firefox.webp", color: "#fff" },
  { appId: "terminalApp", title: "Terminal", icon: `static/icons/terminal.webp`, color: "#fff" },
  { appId: "musicPlayerApp", title: "Music", icon: "papirus:apps/multimedia-audio-player", color: "#1db954" },
  { appId: "settingsApp", title: "Settings", icon: "papirus:actions/configure", color: "#adb5bd" },
  { appId: "calculatorApp", title: "Calculator", icon: "papirus:apps/accessories-calculator", color: "#20c997" },
  { appId: "notepadApp", title: "Notes", icon: "static/icons/notepad.webp", color: "#ffc107" },
  { appId: "discordApp", title: "Discord", icon: "papirus:apps/discord", color: "#5865f2" },
  { appId: "trashApp", title: "Trash", icon: "papirus:places/user-trash", color: "#888", isTrash: true }
];

export class MacDock {
  constructor(manager) {
    this.manager = manager;
    this.container = null;
    this.runningItems = new Map();
    this.pinnedItems = [];
    this.boundHover = this.handleHover.bind(this);
    this.boundFocus = this.handleFocus.bind(this);
    this.boundClosed = this.handleClosed.bind(this);
    this.boundSettings = this.onSettingsChanged.bind(this);
    this.boundAutoHide = this.onAutoHideMove.bind(this);
    this.boundKeydown = this.handleKeydown.bind(this);
    this.lastClientX = null;
    this.lastClientY = null;
    this.dragState = null;
    this.autoHideVisible = false;
    this.showHideTimer = null;
    this.lastActiveWinId = null;
    this.settings = this.getDefaultSettings();
  }

  getDefaultSettings() {
    return {
      dockEnabled: false,
      dockPosition: "bottom",
      dockAutoHide: false,
      dockMagnification: true,
      dockMagnifyAmount: 1.8,
      dockMagnifyRange: 3,
      dockIconSize: 43,
      dockScale: 100,
      dockAnimationSpeed: 0.2
    };
  }

  readSettings() {
    this.settings = {
      dockEnabled: getSetting("dockEnabled", false) === true,
      dockPosition: os.storage.get(StorageKeys.dockPosition) || "bottom",
      dockAutoHide: os.storage.get(StorageKeys.dockAutoHide) === "true",
      dockMagnification: os.storage.get(StorageKeys.dockMagnification) !== "false",
      dockMagnifyAmount: Number(os.storage.get(StorageKeys.dockMagnifyAmount)) || 1.8,
      dockMagnifyRange: Number(os.storage.get(StorageKeys.dockMagnifyRange)) || 3,
      dockIconSize: Number(os.storage.get(StorageKeys.dockIconSize)) || 43,
      dockScale: Number(os.storage.get(StorageKeys.dockScale)) || 100,
      dockAnimationSpeed: Number(os.storage.get(StorageKeys.dockAnimationSpeed)) || 0.2
    };
  }

  applyCSSSettings() {
    if (!this.container) return;
    const s = this.settings;
    const scaleVal = Math.max(50, Math.min(200, s.dockScale)) / 100;
    const iconSize = Math.max(28, Math.min(80, s.dockIconSize));
    const animSpeed = Math.max(0.05, Math.min(0.5, s.dockAnimationSpeed));
    this.container.style.setProperty("--dock-icon-size", `${iconSize}px`);
    this.container.style.setProperty("--dock-scale", scaleVal);
    this.container.style.setProperty("--dock-anim-speed", `${animSpeed}s`);
    this.container.classList.toggle("dock-auto-hide", s.dockAutoHide);
    this.container.classList.toggle("dock-magnify", s.dockMagnification);
    this.container.dataset.position = s.dockPosition;
  }

  init() {
    if (this.container) return;
    this.readSettings();
    this.container = createElement("div", { id: "mac-dock", className: "mac-dock" });
    document.body.appendChild(this.container);
    this.applyCSSSettings();
    this.loadPinnedItems();
    this.renderPinnedItems();
    this.container.addEventListener("mousemove", this.boundHover);
    this.container.addEventListener("mouseleave", this.boundHover);
    if (this.settings.dockAutoHide) {
      document.addEventListener("mousemove", this.boundAutoHide);
    }
    document.addEventListener("keydown", this.boundKeydown);
    os.events.on(BusEvents.WINDOW_FOCUSED, this.boundFocus);
    os.events.on(BusEvents.WINDOW_CLOSED, this.boundClosed);
    os.events.on(BusEvents.SETTINGS_CHANGED, this.boundSettings);
    this.syncMacSetting(true);
    if (this.manager && this.manager.openWindows) {
      this.manager.openWindows.forEach((rec, winId) => {
        this.addItem(winId, rec.icon || rec.iconValue, rec.title, rec.color);
      });
    }
  }

  destroy() {
    if (!this.container) return;
    this.syncMacSetting(false);
    document.removeEventListener("keydown", this.boundKeydown);
    this.container.removeEventListener("mousemove", this.boundHover);
    this.container.removeEventListener("mouseleave", this.boundHover);
    document.removeEventListener("mousemove", this.boundAutoHide);
    this.container.remove();
    this.container = null;
    this.runningItems.clear();
    this.pinnedItems = [];
    os.events.off(BusEvents.WINDOW_FOCUSED, this.boundFocus);
    os.events.off(BusEvents.WINDOW_CLOSED, this.boundClosed);
    os.events.off(BusEvents.SETTINGS_CHANGED, this.boundSettings);
  }

  syncMacSetting(enabled) {
    if (enabled) {
      modeManager.enter(MODES.MAC);
    } else {
      modeManager.exit(MODES.MAC);
    }
  }

  onSettingsChanged() {
    this.readSettings();
    if (!this.container) return;
    this.applyCSSSettings();
    if (this.settings.dockAutoHide) {
      document.addEventListener("mousemove", this.boundAutoHide);
    } else {
      document.removeEventListener("mousemove", this.boundAutoHide);
      if (this.container) this.container.classList.remove("dock-hidden");
    }
  }

  isActive() {
    this.readSettings();
    return this.settings.dockEnabled === true;
  }

  triggerBounce(item) {
    const wrap = item.querySelector(".dock-icon-wrap") || item;
    wrap.classList.remove("dock-bouncing");
    void wrap.offsetWidth;
    wrap.classList.add("dock-bouncing");
    setTimeout(() => {
      wrap.classList.remove("dock-bouncing");
    }, 600);
  }

  addItem(winId, iconValue, title, color = null) {
    if (!this.container) return;
    if (this.runningItems.has(winId)) return;

    const win = $("#" + winId);
    const appId = win?.dataset?.appId;
    const pinned = appId ? this.pinnedItems.find((p) => p.appId === appId) : null;

    if (pinned) {
      pinned.winId = winId;
      pinned.el.classList.add("has-running");
      pinned.el.classList.add("active");
      let dot = pinned.el.querySelector(".dock-running-dot");
      if (!dot) {
        dot = createElement("span", { className: "dock-running-dot" });
        const wrap = pinned.el.querySelector(".dock-icon-wrap") || pinned.el;
        wrap.appendChild(dot);
      }
      this.runningItems.set(winId, { isPinned: true, pinnedRef: pinned });
      this.updateActiveState(winId);
      return;
    }

    const effective = getEffectiveIcon(iconValue);
    iconValue = effective.startsWith("papirus:") ? effective : resolveIconUrl(effective);
    const iconEl = this.buildIcon(iconValue, title, color);
    const dot = createElement("span", { className: "dock-running-dot" });
    const iconWrap = createElement("div", { className: "dock-icon-wrap" });
    iconWrap.appendChild(iconEl);
    iconWrap.appendChild(dot);

    const label = createElement("span", { className: "dock-label" });
    label.textContent = title;

    const item = createElement("div", {
      className: "dock-item dock-running has-running active",
      attributes: { "data-win-id": winId }
    });
    item.appendChild(iconWrap);
    item.appendChild(label);
    item.addEventListener("click", () => {
      this.triggerBounce(item);
      this.handleItemClick(winId);
    });
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const targetWin = $("#" + winId);
      if (!targetWin) return;
      showStartStyleMenu(e, (addMenuItem, addSeparator) => {
        this.manager.buildContextMenuItems(addMenuItem, addSeparator, targetWin);
      });
    });

    this.container.appendChild(item);
    this.runningItems.set(winId, { el: item, isPinned: false, iconValue, title, color });
    this.updateActiveState(winId);
    this.triggerRecalc();
  }

  removeItem(winId) {
    const entry = this.runningItems.get(winId);
    if (!entry) return;
    this.runningItems.delete(winId);

    if (entry.isPinned && entry.pinnedRef) {
      const stillRunning = [...this.runningItems.values()].some(
        (r) => r.isPinned && r.pinnedRef === entry.pinnedRef
      );
      if (!stillRunning) {
        entry.pinnedRef.el.classList.remove("active");
        entry.pinnedRef.el.classList.remove("has-running");
        entry.pinnedRef.winId = null;
      }
    } else if (entry.el) {
      entry.el.remove();
      this.triggerRecalc();
    }

    if (this.lastActiveWinId === winId) {
      this.lastActiveWinId = null;
      this.updateActiveState(null);
    }
  }

  updateActiveState(winId) {
    this.lastActiveWinId = winId;
    const activeEntry = winId ? this.runningItems.get(winId) : null;
    const activePinned = activeEntry?.isPinned ? activeEntry.pinnedRef : null;

    this.pinnedItems.forEach((pinned) => {
      if (pinned.el) {
        pinned.el.classList.toggle("active", Boolean(activePinned && pinned === activePinned));
      }
    });

    this.runningItems.forEach((entry, id) => {
      if (!entry.isPinned && entry.el) {
        entry.el.classList.toggle("active", Boolean(winId && id === winId));
      }
    });
  }

  loadPinnedItems() {
    const saved = os.storage.get(StorageKeys.dockPinnedItems);
    if (saved && Array.isArray(saved)) {
      this.pinnedItems = saved;
    } else {
      this.pinnedItems = [...DEFAULT_DOCK_APPS];
    }
  }

  savePinnedItems() {
    const toSave = this.pinnedItems.map((item) => ({
      appId: item.appId,
      title: item.title,
      icon: item.icon,
      color: item.color,
      isFinder: item.isFinder,
      isAudioMixer: item.isAudioMixer,
      isTrash: item.isTrash
    }));
    os.storage.set(StorageKeys.dockPinnedItems, toSave);
  }

  unpinItem(appId) {
    const idx = this.pinnedItems.findIndex((p) => p.appId === appId);
    if (idx === -1) return;
    const pinned = this.pinnedItems[idx];
    this.pinnedItems.splice(idx, 1);
    if (pinned.el) pinned.el.remove();
    this.savePinnedItems();
  }

  renderPinnedItems() {
    this.pinnedItems.forEach((app, index) => {
      const effective = getEffectiveIcon(app.icon);
      const iconValue = effective.startsWith("papirus:") ? effective : resolveIconUrl(effective);
      const iconEl = this.buildIcon(iconValue, app.title, app.color);
      const dot = createElement("span", { className: "dock-running-dot" });
      const iconWrap = createElement("div", { className: "dock-icon-wrap" });
      iconWrap.appendChild(iconEl);
      iconWrap.appendChild(dot);

      const label = createElement("span", { className: "dock-label" });
      label.textContent = app.title;

      const item = createElement("div", {
        className: "dock-item dock-pinned",
        attributes: { "data-app-id": app.appId }
      });
      item.appendChild(iconWrap);
      item.appendChild(label);
      item.addEventListener("click", () => {
        this.triggerBounce(item);
        if (app.isFinder) {
          os.app.getInstance(ServiceKeys.COMMAND_PALETTE)?.open();
        } else if (app.isAudioMixer) {
          import("../../audioMixer.js").then((m) => m.audioMixer().toggle());
        } else if (app.isTrash) {
          os.app.getInstance(ServiceKeys.EXPLORER)?.openTrash();
        } else {
          os.app.launch(app.appId).catch(() => {});
        }
      });
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const openWinId = app.winId && this.manager.openWindows?.has(app.winId) ? app.winId : null;
        if (openWinId) {
          const targetWin = $("#" + openWinId);
          if (targetWin) {
            showStartStyleMenu(e, (addMenuItem, addSeparator) => {
              this.manager.buildContextMenuItems(addMenuItem, addSeparator, targetWin);
              addSeparator();
              addMenuItem("Unpin from Dock", () => this.unpinItem(app.appId), "papirus:actions/window-pin");
            });
            return;
          }
        }
        showStartStyleMenu(e, (addMenuItem, addSeparator) => {
          addMenuItem(
            "Launch App",
            () => {
              if (app.isFinder) os.app.getInstance(ServiceKeys.COMMAND_PALETTE)?.open();
              else if (app.isAudioMixer) import("../../audioMixer.js").then((m) => m.audioMixer().toggle());
              else if (app.isTrash) os.app.getInstance(ServiceKeys.EXPLORER)?.openTrash();
              else os.app.launch(app.appId);
            },
            "papirus:actions/media-playback-start"
          );
          addSeparator();
          addMenuItem("Unpin from Dock", () => this.unpinItem(app.appId), "papirus:actions/window-pin");
        });
      });

      this.container.appendChild(item);
      app.el = item;
      this.setupDraggable(item, index, true);
    });
  }

  buildIcon(iconValue, title, color) {
    const effective = getEffectiveIcon(iconValue);
    const inner = createElement("div", { className: "dock-icon-inner" });
    const isPapirusRaw = typeof effective === "string" && effective.startsWith("papirus:");
    if (isPapirusRaw) {
      const src = resolveIconUrl(effective);
      const img = createElement("img", { attributes: { src, alt: title } });
      img.className = "papirus-icon papirus-icon--32";
      img.onerror = () => {
        const fallbackEffective = getEffectiveIcon("papirus:apps/application-default-icon");
        const fallbackSrc = fallbackEffective.startsWith("papirus:")
          ? resolveIconUrl(fallbackEffective)
          : fallbackEffective;
        if (fallbackSrc.startsWith("papirus:") || fallbackSrc.startsWith("http") || fallbackSrc.startsWith("data:")) {
          const fallback = createElement("img", {
            attributes: {
              src: fallbackSrc.startsWith("papirus:") ? resolveIconUrl(fallbackSrc) : fallbackSrc,
              alt: title
            }
          });
          fallback.className = "papirus-icon papirus-icon--32";
          img.replaceWith(fallback);
        } else {
          const fallback = createElement("i", { attributes: { alt: title } });
          fallback.className = fallbackSrc;
          img.replaceWith(fallback);
        }
      };
      inner.appendChild(img);
      return inner;
    }
    const resolved = resolveIconUrl(effective);
    const { isImage, isDataUrl } = this.manager.resolveIconType(resolved);
    if (isImage || isDataUrl) {
      const img = createElement("img", { attributes: { src: resolved, alt: title } });
      img.onerror = () => {
        const fallbackEffective = getEffectiveIcon("papirus:apps/application-default-icon");
        const fallbackSrc = fallbackEffective.startsWith("papirus:")
          ? resolveIconUrl(fallbackEffective)
          : fallbackEffective;
        if (fallbackSrc.startsWith("http") || fallbackSrc.startsWith("data:") || fallbackSrc.startsWith("papirus:")) {
          const fallback = createElement("img", {
            attributes: {
              src: fallbackSrc.startsWith("papirus:") ? resolveIconUrl(fallbackSrc) : fallbackSrc,
              alt: title
            }
          });
          fallback.className = "papirus-icon papirus-icon--32";
          img.replaceWith(fallback);
        } else {
          const fallback = createElement("i", { attributes: { alt: title } });
          fallback.className = fallbackSrc;
          img.replaceWith(fallback);
        }
      };
      inner.appendChild(img);
    } else {
      if (typeof effective === "string" && effective.startsWith("papirus:")) {
        const img = createElement("img", { attributes: { src: resolveIconUrl(effective), alt: title } });
        img.className = "papirus-icon papirus-icon--32";
        inner.appendChild(img);
      } else {
        const icon = createElement("i", { attributes: { alt: title } });
        icon.className = typeof effective === "string" && effective.startsWith("fa") ? effective : `fa ${effective}`;
        icon.style.color = color ?? "var(--text-primary)";
        inner.appendChild(icon);
      }
    }
    return inner;
  }

  handleItemClick(winId) {
    const win = $("#" + winId);
    if (!win) return;
    if (win.style.display === "none") {
      win.style.display = "";
      const entry = this.runningItems.get(winId);
      if (entry && !entry.isPinned && entry.el) entry.el.classList.remove("minimized");
      if (entry && entry.isPinned && entry.pinnedRef) entry.pinnedRef.el.classList.remove("minimized");
    }
    this.manager.bringToFront(win);
  }

  triggerRecalc() {
    if (this.lastClientX != null) {
      this.processHover(this.lastClientX, this.lastClientY);
    }
  }

  onAutoHideMove(e) {
    if (!this.container) return;
    const s = this.settings;
    const dockRect = this.container.getBoundingClientRect();
    const edge = s.dockPosition;
    let show = false;
    const margin = 16;
    if (edge === "bottom") {
      show = e.clientY >= window.innerHeight - margin;
    } else if (edge === "left") {
      show = e.clientX <= margin;
    } else if (edge === "right") {
      show = e.clientX >= window.innerWidth - margin;
    }
    if (show) {
      this.container.classList.remove("dock-hidden");
      this.autoHideVisible = true;
    } else {
      const isOver =
        e.clientX >= dockRect.left &&
        e.clientX <= dockRect.right &&
        e.clientY >= dockRect.top &&
        e.clientY <= dockRect.bottom;
      if (!isOver) {
        this.container.classList.add("dock-hidden");
        this.autoHideVisible = false;
      }
    }
  }

  handleKeydown(e) {
    if (!this.container) return;
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable) return;

    for (let i = 1; i <= 10; i++) {
      const id = i === 10 ? "dock.launch10" : `dock.launch${i}`;
      if (KeybindManager.matches(e, id)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const items = this.container.querySelectorAll(".dock-item");
        const idx = i - 1;
        if (idx < items.length) {
          items[idx].click();
        }
        return;
      }
    }
  }

  handleHover(e) {
    if (!this.container) return;

    if (e.type === "mousemove") {
      this.hoverX = e.clientX;
      this.hoverY = e.clientY;
      if (this.hoverRafId) return;
      this.hoverRafId = requestAnimationFrame(() => {
        this.hoverRafId = null;
        this.processHover(this.hoverX, this.hoverY);
      });
      return;
    }

    if (e.type === "mouseleave") {
      if (this.hoverRafId) {
        cancelAnimationFrame(this.hoverRafId);
        this.hoverRafId = null;
      }
      const items = [...this.container.querySelectorAll(".dock-item")];
      items.forEach((el) => {
        el.style.transform = "";
        const wrap = el.querySelector(".dock-icon-wrap");
        if (wrap) wrap.style.transform = "";
      });
      this.container.style.paddingLeft = "";
      this.container.style.paddingRight = "";
      this.container.style.paddingTop = "";
      this.container.style.paddingBottom = "";
      this.lastClientX = null;
      this.lastClientY = null;
    }
  }

  processHover(clientX, clientY) {
    const s = this.settings;
    const items = [...this.container.querySelectorAll(".dock-item")];
    const magnifyEnabled = s.dockMagnification;

    if (!magnifyEnabled) {
      items.forEach((el) => {
        el.style.transform = "";
        const wrap = el.querySelector(".dock-icon-wrap");
        if (wrap) wrap.style.transform = "";
      });
      this.container.style.paddingLeft = "";
      this.container.style.paddingRight = "";
      this.container.style.paddingTop = "";
      this.container.style.paddingBottom = "";
      return;
    }

    this.lastClientX = clientX;
    this.lastClientY = clientY;

    const isHorizontal = s.dockPosition === "bottom";
    const origin = isHorizontal
      ? "bottom center"
      : s.dockPosition === "left"
        ? "center left"
        : "center right";
    const maxScale = Math.max(1.1, Math.min(3, s.dockMagnifyAmount || 1.8));
    const range = 150;

    items.forEach((el) => {
      el.style.transform = "";
      const wrap = el.querySelector(".dock-icon-wrap");
      if (!wrap) return;

      const itemRect = el.getBoundingClientRect();
      const itemCenter = isHorizontal
        ? itemRect.left + itemRect.width / 2
        : itemRect.top + itemRect.height / 2;
      const mousePos = isHorizontal ? clientX : clientY;
      const dist = Math.abs(mousePos - itemCenter);

      let scale = 1;
      if (dist < range) {
        const factor = Math.cos((dist / range) * (Math.PI / 2));
        scale = 1 + (maxScale - 1) * factor * factor;
      }

      wrap.style.transformOrigin = origin;
      wrap.style.transform = `scale(${scale})`;
    });

    this.container.style.paddingLeft = "";
    this.container.style.paddingRight = "";
    this.container.style.paddingTop = "";
    this.container.style.paddingBottom = "";
  }

  handleFocus({ winId }) {
    this.updateActiveState(winId);
  }

  setupDraggable(item, index, isPinned = false) {
    item.setAttribute("draggable", "true");

    item.addEventListener("dragstart", (e) => {
      this.dragState = {
        item,
        index,
        isPinned,
        startX: e.clientX,
        startY: e.clientY
      };
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    });

    item.addEventListener("dragend", () => {
      if (this.dragState) {
        this.dragState.item.classList.remove("dragging");
        this.dragState = null;
      }
      this.container.querySelectorAll(".dock-item.drag-over").forEach((el) => {
        el.classList.remove("drag-over");
      });
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!this.dragState || this.dragState.item === item) return;
      e.dataTransfer.dropEffect = "move";
      item.classList.add("drag-over");
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over");
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!this.dragState || this.dragState.item === item) return;

      const fromIndex = this.dragState.index;
      const toIndex = index;
      const fromIsPinned = this.dragState.isPinned;
      const toIsPinned = isPinned;

      if (fromIsPinned && toIsPinned) {
        this.reorderPinnedItems(fromIndex, toIndex);
      }

      item.classList.remove("drag-over");
    });
  }

  reorderPinnedItems(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const [moved] = this.pinnedItems.splice(fromIndex, 1);
    this.pinnedItems.splice(toIndex, 0, moved);

    this.container.innerHTML = "";
    this.renderPinnedItems();
    this.savePinnedItems();
  }

  handleClosed({ winId }) {
    this.removeItem(winId);
  }
}
