import "./macWidgets.css";
import widgetStorage from "./widgetStorage.js";
import { StorageKeys, os } from "../../framework.js";
import { $, $$, createElement, setText, setHTML, bindEvent, toggleClass } from "../../shared/domUtils.js";

const DEFAULT_WIDGETS = ["music-player", "analog-clock", "calendar", "weather", "location"];

const SPAN_2_WIDGETS = ["music-player", "calendar", "digital-clock", "weather", "quick-info"];

const AVAILABLE_WIDGETS = [
  {
    id: "music-player",
    title: "Music Player",
    icon: "fa-solid fa-music",
    description: "Compact Spotify-like music player with album art and playback controls"
  },
  {
    id: "analog-clock",
    title: "Analog Clock",
    icon: "fa-solid fa-clock",
    description: "Analog clock with ticking hands, date badge, and local city"
  },
  {
    id: "digital-clock",
    title: "Digital Clock",
    icon: "fa-solid fa-stopwatch",
    description: "Large digital clock with live seconds and timezone"
  },
  {
    id: "calendar",
    title: "Calendar",
    icon: "fa-regular fa-calendar-days",
    description: "Current month and year grid highlighting today in glowing blue"
  },
  {
    id: "weather",
    title: "Weather",
    icon: "fa-solid fa-cloud-sun",
    description: "Current weather conditions and three day forecast pills"
  },
  {
    id: "location",
    title: "Location",
    icon: "fa-solid fa-location-dot",
    description: "Map snippet card showing current city, coordinates, and pin"
  },
  {
    id: "quick-info",
    title: "System Telemetry",
    icon: "fa-solid fa-gauge-high",
    description: "Telemetry statistics for CPU cores, uptime, and memory"
  }
];

export class MacWidgets {
  constructor() {
    this.shelf = null;
    this.widgetsContainer = null;
    this.actionBar = null;
    this.activeWidgets = [];
    this.isEditMode = false;
    this.timerId = null;
    this.draggedWidgetId = null;
    this.modalOverlay = null;
    this.galleryContainer = null;
    this.boundMusicState = this.handleMusicStateChanged.bind(this);
    this.boundMusicTrack = this.handleMusicTrackChanged.bind(this);
  }

  async mount() {
    if ($("#mac-widgets-shelf")) return;

    this.shelf = createElement("div", { id: "mac-widgets-shelf" });
    document.body.appendChild(this.shelf);

    await this.loadWidgets();

    if (!this.shelf) return;

    this.widgetsContainer = createElement("div", { className: "mac-widgets-container" });
    this.shelf.appendChild(this.widgetsContainer);

    this.actionBar = createElement("div", { className: "mac-widgets-action-bar" });
    this.shelf.appendChild(this.actionBar);

    this.renderWidgets();
    this.renderActionBar();
    this.startTimers();
    os.events.on("music:state-changed", this.boundMusicState);
    os.events.on("music:track-changed", this.boundMusicTrack);
  }

  unmount() {
    os.events.off("music:state-changed", this.boundMusicState);
    os.events.off("music:track-changed", this.boundMusicTrack);
    this.stopTimers();
    this.closeAddWidgetModal();
    if (this.shelf && this.shelf.parentNode) {
      this.shelf.remove();
      this.shelf = null;
    }
    const existing = $("#mac-widgets-shelf");
    if (existing && existing.parentNode) {
      existing.remove();
    }
  }

  async loadWidgets() {
    try {
      const state = await widgetStorage.loadWidgetState();
      if (state && Array.isArray(state.activeWidgets) && state.activeWidgets.length > 0) {
        this.activeWidgets = [...state.activeWidgets];
        return;
      }
    } catch {
      this.activeWidgets = [...DEFAULT_WIDGETS];
      return;
    }
    this.activeWidgets = [...DEFAULT_WIDGETS];
  }

  async save() {
    try {
      await widgetStorage.saveWidgetState({ activeWidgets: this.activeWidgets });
    } catch {}
  }

  detectCity(fallback = "Cupertino") {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone) {
        const parts = timeZone.split("/");
        if (parts.length >= 2) {
          return parts[parts.length - 1].replace(/_/g, " ");
        }
      }
    } catch {}
    return fallback;
  }

  toggleEditMode(enable) {
    this.isEditMode = enable !== undefined ? enable : !this.isEditMode;
    if (this.shelf) {
      toggleClass(this.shelf, "edit-mode", this.isEditMode);
    }
    this.renderWidgets();
    this.renderActionBar();
  }

  renderActionBar() {
    if (!this.actionBar) return;
    setHTML(this.actionBar, "");

    if (this.isEditMode) {
      const addBtn = createElement("button", {
        className: "mac-widget-btn mac-widget-add-btn",
        html: `<i class="fa-solid fa-plus"></i> Add Widget`
      });
      bindEvent(addBtn, "click", () => this.openAddWidgetModal());
      this.actionBar.appendChild(addBtn);

      const doneBtn = createElement("button", {
        className: "mac-widget-btn mac-widget-done-btn",
        html: `<i class="fa-solid fa-check"></i> Done`
      });
      bindEvent(doneBtn, "click", () => this.toggleEditMode(false));
      this.actionBar.appendChild(doneBtn);
    } else {
      const editBtn = createElement("button", {
        className: "mac-widget-btn mac-widget-edit-btn",
        html: `<i class="fa-solid fa-pencil"></i> Edit Widgets`
      });
      bindEvent(editBtn, "click", () => this.toggleEditMode(true));
      this.actionBar.appendChild(editBtn);
    }
  }

  renderWidgets() {
    if (!this.widgetsContainer) return;
    setHTML(this.widgetsContainer, "");

    this.activeWidgets.forEach((widgetId) => {
      const isSpan2 = SPAN_2_WIDGETS.includes(widgetId);
      const card = createElement("div", {
        className: isSpan2 ? "mac-widget-card span-2" : "mac-widget-card",
        attributes: { "data-widget-id": widgetId, "data-widget": widgetId }
      });
      card.draggable = true;

      bindEvent(card, "dragstart", (event) => this.handleDragStart(event, widgetId, card));
      bindEvent(card, "dragover", (event) => this.handleDragOver(event, card));
      bindEvent(card, "dragleave", () => this.handleDragLeave(card));
      bindEvent(card, "drop", (event) => this.handleDrop(event, widgetId, card));
      bindEvent(card, "dragend", () => this.handleDragEnd(card));

      if (this.isEditMode) {
        const deleteBtn = createElement("button", {
          className: "mac-widget-delete-badge",
          text: "−",
          attributes: { "aria-label": "Remove widget", title: "Remove widget" }
        });
        bindEvent(deleteBtn, "click", (event) => {
          event.stopPropagation();
          this.removeWidget(widgetId);
        });
        card.appendChild(deleteBtn);
      }

      const content = this.createWidgetContent(widgetId);
      if (content) {
        card.appendChild(content);
      }

      this.widgetsContainer.appendChild(card);
    });

    this.updateClockTick();
  }

  renderWidget(id) {
    return this.createWidgetContent(id);
  }

  createWidgetContent(widgetId) {
    switch (widgetId) {
      case "music-player":
        return this.createMusicPlayer();
      case "analog-clock":
        return this.createAnalogClock();
      case "digital-clock":
        return this.createDigitalClock();
      case "calendar":
        return this.createCalendar();
      case "weather":
        return this.createWeather();
      case "location":
        return this.createLocation();
      case "quick-info":
        return this.createQuickInfo();
      default:
        return null;
    }
  }

  createMusicPlayer() {
    const container = createElement("div", { className: "mac-music-widget" });

    let currentTitle = "No Track Playing";
    let currentArtist = "sitalOS Music";
    let currentCover = "";
    let isPlaying = false;
    let currentProgress = 0;

    const service = window.__sitalMusicService;
    if (service) {
      if (typeof service.isPlaying === "function") {
        isPlaying = service.isPlaying();
      } else if (typeof service.isPlaying === "boolean") {
        isPlaying = service.isPlaying;
      }
      const track = service.currentTrack || (service.getCurrentTrack ? service.getCurrentTrack() : null);
      if (track) {
        currentTitle = track.title || currentTitle;
        currentArtist = track.artist || currentArtist;
        currentCover = track.cover || track.art || track.albumArt || track.artwork || "";
      }
      if (service.currentTime && service.duration) {
        currentProgress = Math.min(100, Math.max(0, (service.currentTime / service.duration) * 100));
      }
    }

    const topRow = createElement("div", { className: "mac-music-top" });
    const artWrap = createElement("div", { className: "mac-music-art-wrap", attributes: { title: "Open Music App" } });
    const artImg = createElement("img", {
      className: "mac-music-art-img",
      attributes: { src: currentCover, alt: "Album Art" }
    });
    artImg.onerror = () => {
      const track = service?.currentTrack || (service?.getCurrentTrack ? service.getCurrentTrack() : null);
      if (track?.fallbackArtwork && artImg.src !== track.fallbackArtwork) {
        artImg.src = track.fallbackArtwork;
      } else {
        artImg.style.display = "none";
        fallbackIcon.style.display = "flex";
      }
    };
    if (!currentCover) {
      artImg.style.display = "none";
    }
    const fallbackIcon = createElement("div", {
      className: "mac-music-art-fallback",
      html: `<i class="fa-solid fa-music"></i>`
    });
    if (currentCover) {
      fallbackIcon.style.display = "none";
    }
    artWrap.appendChild(artImg);
    artWrap.appendChild(fallbackIcon);

    const infoWrap = createElement("div", { className: "mac-music-info" });
    const titleEl = createElement("div", {
      className: "mac-music-title",
      text: currentTitle,
      attributes: { title: "Open Music App" }
    });
    const artistEl = createElement("div", {
      className: "mac-music-artist",
      text: currentArtist
    });
    infoWrap.appendChild(titleEl);
    infoWrap.appendChild(artistEl);

    topRow.appendChild(artWrap);
    topRow.appendChild(infoWrap);

    const openMusicApp = (event) => {
      event.stopPropagation();
      os.app.launch("musicPlayerApp").catch(() => {});
    };
    bindEvent(artWrap, "click", openMusicApp);
    bindEvent(titleEl, "click", openMusicApp);

    const progressWrap = createElement("div", { className: "mac-music-progress-wrap" });
    const progressBar = createElement("div", { className: "mac-music-progress-bar" });
    const progressFill = createElement("div", { className: "mac-music-progress-fill" });
    progressFill.style.width = `${currentProgress}%`;
    progressBar.appendChild(progressFill);
    progressWrap.appendChild(progressBar);

    bindEvent(progressBar, "click", (event) => {
      event.stopPropagation();
      const rect = progressBar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      progressFill.style.width = `${pct * 100}%`;
      const musicService = window.__sitalMusicService;
      if (musicService?.seekTo) {
        musicService.seekTo(pct);
      } else if (musicService?.seek && musicService?.duration) {
        musicService.seek(pct * musicService.duration);
      } else {
        os.events.emit("music:seek", pct);
      }
    });

    const controlsRow = createElement("div", { className: "mac-music-controls-row" });
    const buttonsWrap = createElement("div", { className: "mac-music-buttons" });

    const prevBtn = createElement("button", {
      className: "mac-music-ctrl-btn mac-music-prev",
      html: `<i class="fa-solid fa-backward-step"></i>`,
      attributes: { "aria-label": "Previous track", title: "Previous" }
    });
    bindEvent(prevBtn, "click", (event) => {
      event.stopPropagation();
      const musicService = window.__sitalMusicService;
      if (musicService?.prev) {
        musicService.prev();
      } else {
        os.events.emit("music:prev");
      }
    });

    const playBtn = createElement("button", {
      className: "mac-music-ctrl-btn mac-music-play",
      html: `<i class="fa-solid ${isPlaying ? "fa-pause" : "fa-play"}"></i>`,
      attributes: { "aria-label": isPlaying ? "Pause" : "Play", title: isPlaying ? "Pause" : "Play" }
    });
    bindEvent(playBtn, "click", (event) => {
      event.stopPropagation();
      const musicService = window.__sitalMusicService;
      if (musicService?.togglePlay) {
        musicService.togglePlay();
      } else {
        os.events.emit("music:toggle-play");
      }
    });

    const nextBtn = createElement("button", {
      className: "mac-music-ctrl-btn mac-music-next",
      html: `<i class="fa-solid fa-forward-step"></i>`,
      attributes: { "aria-label": "Next track", title: "Next" }
    });
    bindEvent(nextBtn, "click", (event) => {
      event.stopPropagation();
      const musicService = window.__sitalMusicService;
      if (musicService?.next) {
        musicService.next();
      } else {
        os.events.emit("music:next");
      }
    });

    buttonsWrap.appendChild(prevBtn);
    buttonsWrap.appendChild(playBtn);
    buttonsWrap.appendChild(nextBtn);

    const volWrap = createElement("div", {
      className: "mac-music-vol-wrap",
      html: `<i class="fa-solid fa-volume-high"></i>`,
      attributes: { title: "Volume" }
    });

    controlsRow.appendChild(buttonsWrap);
    controlsRow.appendChild(volWrap);

    container.appendChild(topRow);
    container.appendChild(progressWrap);
    container.appendChild(controlsRow);

    return container;
  }

  handleMusicStateChanged(data) {
    this.updateMusicPlayerWidget(data);
  }

  handleMusicTrackChanged(data) {
    this.updateMusicPlayerWidget(data);
  }

  updateMusicPlayerWidget(data) {
    if (!this.shelf) return;
    const widget = $(".mac-music-widget", this.shelf);
    if (!widget) return;

    const service = window.__sitalMusicService;
    let isPlaying = false;
    if (data && typeof data.isPlaying === "boolean") {
      isPlaying = data.isPlaying;
    } else if (service) {
      if (typeof service.isPlaying === "function") {
        isPlaying = service.isPlaying();
      } else if (typeof service.isPlaying === "boolean") {
        isPlaying = service.isPlaying;
      }
    }

    const track = data?.track || (data?.title ? data : null) || service?.currentTrack || (service?.getCurrentTrack ? service.getCurrentTrack() : null);

    if (track) {
      const titleEl = $(".mac-music-title", widget);
      const artistEl = $(".mac-music-artist", widget);
      const artImg = $(".mac-music-art-img", widget);
      const fallbackIcon = $(".mac-music-art-fallback", widget);

      if (titleEl && track.title) {
        setText(titleEl, track.title);
      }
      if (artistEl && track.artist) {
        setText(artistEl, track.artist);
      }
      const cover = track.cover || track.art || track.albumArt || track.artwork;
      if (artImg && fallbackIcon) {
        if (cover) {
          artImg.src = cover;
          artImg.onerror = () => {
            if (track.fallbackArtwork && artImg.src !== track.fallbackArtwork) {
              artImg.src = track.fallbackArtwork;
            } else {
              artImg.style.display = "none";
              fallbackIcon.style.display = "flex";
            }
          };
          artImg.style.display = "block";
          fallbackIcon.style.display = "none";
        } else {
          artImg.style.display = "none";
          fallbackIcon.style.display = "flex";
        }
      }
    }

    const playBtn = $(".mac-music-play", widget);
    if (playBtn) {
      setHTML(playBtn, `<i class="fa-solid ${isPlaying ? "fa-pause" : "fa-play"}"></i>`);
      playBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
      playBtn.setAttribute("title", isPlaying ? "Pause" : "Play");
    }

    let progress = null;
    if (data && typeof data.progress === "number") {
      progress = data.progress;
    } else if (data && typeof data.currentTime === "number" && typeof data.duration === "number" && data.duration > 0) {
      progress = (data.currentTime / data.duration) * 100;
    } else if (service && service.currentTime && service.duration) {
      progress = (service.currentTime / service.duration) * 100;
    }
    if (progress !== null) {
      const fill = $(".mac-music-progress-fill", widget);
      if (fill) {
        fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      }
    }
  }

  createAnalogClock() {
    const container = createElement("div", { className: "mac-analog-widget" });
    const now = new Date();
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const dayText = dayNames[now.getDay()];
    const dateNum = now.getDate();
    const cityName = this.detectCity("Cupertino");

    let ticksHtml = "";
    for (let index = 0; index < 12; index++) {
      const angle = (index * 30 * Math.PI) / 180;
      const x1 = 53 + 40 * Math.sin(angle);
      const y1 = 53 - 40 * Math.cos(angle);
      const x2 = 53 + 46 * Math.sin(angle);
      const y2 = 53 - 46 * Math.cos(angle);
      const isMajor = index % 3 === 0;
      const strokeWidth = isMajor ? "2.5" : "1.2";
      const strokeColor = isMajor ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)";
      ticksHtml += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" />`;
    }

    const svgHtml = `
      <svg class="mac-analog-clock-svg" viewBox="0 0 106 106">
        <circle cx="53" cy="53" r="50" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.14)" stroke-width="1.5" />
        ${ticksHtml}
        <line class="mac-clock-hour-hand" x1="53" y1="53" x2="53" y2="30" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
        <line class="mac-clock-minute-hand" x1="53" y1="53" x2="53" y2="18" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2.2" stroke-linecap="round" />
        <line class="mac-clock-second-hand" x1="53" y1="62" x2="53" y2="12" stroke="#ff453a" stroke-width="1.2" stroke-linecap="round" />
        <circle cx="53" cy="53" r="3.5" fill="#ff453a" />
        <circle cx="53" cy="53" r="1.5" fill="#ffffff" />
      </svg>
      <div class="mac-analog-info">
        <div class="mac-analog-city">${cityName}</div>
        <div class="mac-analog-badge">
          <span class="mac-analog-day-name">${dayText}</span>
          <span class="mac-analog-day-num">${dateNum}</span>
        </div>
        <div class="mac-analog-sub">Today</div>
      </div>
    `;

    setHTML(container, svgHtml);
    return container;
  }

  createDigitalClock() {
    const container = createElement("div", { className: "mac-digital-widget" });
    const now = new Date();
    const hours24 = now.getHours();
    const hours12 = hours24 % 12 || 12;
    const ampm = hours24 >= 12 ? "PM" : "AM";
    const padMin = String(now.getMinutes()).padStart(2, "0");
    const padSec = String(now.getSeconds()).padStart(2, "0");
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

    let tzString = "PST";
    try {
      const parts = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/");
      tzString = parts[parts.length - 1].replace(/_/g, " ");
    } catch {
      tzString = "Local";
    }

    const html = `
      <div class="mac-digital-header">
        <span class="mac-digital-city">CURRENT TIME</span>
        <span class="mac-digital-tz">${tzString}</span>
      </div>
      <div class="mac-digital-time-row">
        <span class="mac-digital-time">${String(hours12).padStart(2, "0")}:${padMin}</span>
        <span class="mac-digital-ampm">${ampm}</span>
        <span class="mac-digital-seconds">:${padSec}</span>
      </div>
      <div class="mac-digital-date">${dateStr}</div>
    `;

    setHTML(container, html);
    return container;
  }

  createCalendar() {
    const container = createElement("div", { className: "mac-cal-widget" });
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const monthTitle = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];
    const weekdaysHtml = weekdayLabels.map((lbl) => `<div>${lbl}</div>`).join("");

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    let gridHtml = "";
    for (let pad = 0; pad < firstDayIndex; pad++) {
      gridHtml += `<div class="mac-cal-day empty"></div>`;
    }
    for (let day = 1; day <= totalDays; day++) {
      const isToday = day === today;
      gridHtml += `<div class="mac-cal-day${isToday ? " today" : ""}">${day}</div>`;
    }

    const html = `
      <div class="mac-cal-header">
        <span class="mac-cal-month">${monthTitle}</span>
        <span class="mac-cal-badge">Today</span>
      </div>
      <div class="mac-cal-weekdays">${weekdaysHtml}</div>
      <div class="mac-cal-grid">${gridHtml}</div>
    `;

    setHTML(container, html);
    return container;
  }

  createWeather() {
    const container = createElement("div", { className: "mac-weather-widget" });
    const cityName = this.detectCity("Cupertino");
    const html = `
      <div class="mac-weather-top">
        <div>
          <div class="mac-weather-location">${cityName}</div>
          <div class="mac-weather-temp">21°</div>
        </div>
        <i class="fa-solid fa-sun mac-weather-icon-main"></i>
      </div>
      <div class="mac-weather-condition-row">
        <span>Sunny</span>
        <span>H: 24° L: 14°</span>
      </div>
      <div class="mac-weather-forecast-row">
        <div class="mac-weather-pill">
          <span class="mac-weather-pill-day">Today</span>
          <i class="fa-solid fa-sun mac-weather-pill-icon"></i>
          <span class="mac-weather-pill-temp">21°</span>
        </div>
        <div class="mac-weather-pill">
          <span class="mac-weather-pill-day">Wed</span>
          <i class="fa-solid fa-cloud-sun mac-weather-pill-icon"></i>
          <span class="mac-weather-pill-temp">23°</span>
        </div>
        <div class="mac-weather-pill">
          <span class="mac-weather-pill-day">Thu</span>
          <i class="fa-solid fa-cloud-rain mac-weather-pill-icon"></i>
          <span class="mac-weather-pill-temp">19°</span>
        </div>
      </div>
    `;

    setHTML(container, html);
    return container;
  }

  createLocation() {
    const container = createElement("div", { className: "mac-location-widget" });
    const cityName = this.detectCity("Cupertino");
    let regionName = "California, United States";
    let coordsText = "37.3230° N, 122.0322° W";
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone) {
        const parts = timeZone.split("/");
        if (parts.length >= 2) {
          regionName = `${parts[0].replace(/_/g, " ")}, Region`;
        }
      }
    } catch {}

    const mapSvgHtml = `
      <svg class="mac-location-map-bg" viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="macMapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(35, 45, 65, 0.6)" />
            <stop offset="100%" stop-color="rgba(20, 25, 40, 0.8)" />
          </linearGradient>
        </defs>
        <rect width="160" height="120" rx="12" fill="url(#macMapGrad)" />
        <path class="mac-map-river" d="M -10 30 Q 40 80 80 50 T 170 90" fill="none" stroke="rgba(0, 122, 255, 0.45)" stroke-width="8" stroke-linecap="round" />
        <path class="mac-map-road-major" d="M 0 60 Q 60 40 100 70 T 160 30" fill="none" stroke="rgba(255, 255, 255, 0.25)" stroke-width="4" stroke-linecap="round" />
        <path class="mac-map-road-secondary" d="M 50 0 Q 70 50 80 120" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2.5" />
        <path class="mac-map-road-secondary" d="M 120 0 Q 110 60 130 120" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2" />
        <path class="mac-map-road-minor" d="M 20 120 Q 50 80 90 90" fill="none" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1.5" />
      </svg>
    `;

    const html = `
      ${mapSvgHtml}
      <div class="mac-location-pin-wrap">
        <div class="mac-location-pulse"></div>
        <i class="fa-solid fa-location-dot"></i>
      </div>
      <div class="mac-location-info">
        <div class="mac-location-city">${cityName}</div>
        <div class="mac-location-region">${regionName}</div>
        <div class="mac-location-coords">${coordsText}</div>
      </div>
    `;

    setHTML(container, html);
    return container;
  }

  createQuickInfo() {
    const container = createElement("div", { className: "mac-quick-widget" });
    const cores = navigator.hardwareConcurrency || 8;

    let memText = "4.2 GB / 16 GB";
    let memPct = 26;
    if (performance.memory && performance.memory.usedJSHeapSize) {
      const usedMb = Math.round(performance.memory.usedJSHeapSize / 1048576);
      const totalMb = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
      memText = `${usedMb} MB / ${totalMb} MB`;
      memPct = Math.min(100, Math.round((usedMb / totalMb) * 100));
    }

    const html = `
      <div class="mac-quick-header">
        <span class="mac-quick-title">sitalOS Sonoma</span>
        <span class="mac-quick-status"><span class="mac-status-dot"></span>Nominal</span>
      </div>
      <div class="mac-quick-metric">
        <div class="mac-metric-label-row">
          <span><i class="fa-solid fa-battery-three-quarters"></i> Battery</span>
          <span class="mac-battery-val">94%</span>
        </div>
        <div class="mac-metric-bar">
          <div class="mac-metric-fill mac-battery-fill" style="width: 94%;"></div>
        </div>
      </div>
      <div class="mac-quick-metric">
        <div class="mac-metric-label-row">
          <span><i class="fa-solid fa-microchip"></i> Memory</span>
          <span class="mac-memory-val">${memText}</span>
        </div>
        <div class="mac-metric-bar">
          <div class="mac-metric-fill mac-metric-fill-mem" style="width: ${memPct}%;"></div>
        </div>
      </div>
      <div class="mac-quick-grid">
        <div class="mac-quick-stat-box">
          <div class="mac-quick-stat-num">${cores}</div>
          <div class="mac-quick-stat-lbl">Cores</div>
        </div>
        <div class="mac-quick-stat-box">
          <div class="mac-quick-stat-num mac-uptime-val">3h 24m</div>
          <div class="mac-quick-stat-lbl">Uptime</div>
        </div>
        <div class="mac-quick-stat-box">
          <div class="mac-quick-stat-num">Fast</div>
          <div class="mac-quick-stat-lbl">SSD</div>
        </div>
      </div>
    `;

    setHTML(container, html);

    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        const pct = Math.round(battery.level * 100);
        const valEl = $(".mac-battery-val", container);
        const fillEl = $(".mac-battery-fill", container);
        if (valEl) setText(valEl, `${pct}%`);
        if (fillEl) fillEl.style.width = `${pct}%`;
      }).catch(() => {});
    }

    return container;
  }

  handleDragStart(event, widgetId, card) {
    this.draggedWidgetId = widgetId;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", widgetId);
    card.classList.add("dragging");
  }

  handleDragOver(event, card) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    card.classList.add("drag-over");
  }

  handleDragLeave(card) {
    card.classList.remove("drag-over");
  }

  async handleDrop(event, targetWidgetId, card) {
    event.preventDefault();
    card.classList.remove("drag-over");

    const sourceId = this.draggedWidgetId || event.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetWidgetId) return;

    const sourceIndex = this.activeWidgets.indexOf(sourceId);
    const targetIndex = this.activeWidgets.indexOf(targetWidgetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      this.activeWidgets.splice(sourceIndex, 1);
      this.activeWidgets.splice(targetIndex, 0, sourceId);
      await this.save();
      this.renderWidgets();
    }
  }

  handleDragEnd(card) {
    this.draggedWidgetId = null;
    card.classList.remove("dragging");
    if (!this.shelf) return;
    const allCards = $$(".mac-widget-card", this.shelf);
    allCards.forEach((item) => {
      item.classList.remove("dragging");
      item.classList.remove("drag-over");
    });
  }

  async removeWidget(widgetId) {
    const index = this.activeWidgets.indexOf(widgetId);
    if (index !== -1) {
      this.activeWidgets.splice(index, 1);
      await this.save();
      this.renderWidgets();
      if (this.modalOverlay) {
        this.renderGalleryCards();
      }
    }
  }

  async addWidget(widgetId) {
    if (!this.activeWidgets.includes(widgetId)) {
      this.activeWidgets.push(widgetId);
      await this.save();
      this.renderWidgets();
      if (this.modalOverlay) {
        this.renderGalleryCards();
      }
    }
  }

  openAddWidgetModal() {
    if (this.modalOverlay) return;

    this.modalOverlay = createElement("div", { className: "mac-widgets-modal-overlay" });
    const modal = createElement("div", { className: "mac-widgets-modal" });

    const header = createElement("div", { className: "mac-widgets-modal-header" });
    const title = createElement("div", { className: "mac-widgets-modal-title", text: "Add Widgets" });
    const closeBtn = createElement("button", {
      className: "mac-widgets-modal-close",
      html: `<i class="fa-solid fa-xmark"></i>`,
      attributes: { "aria-label": "Close" }
    });

    bindEvent(closeBtn, "click", () => this.closeAddWidgetModal());
    bindEvent(this.modalOverlay, "click", (event) => {
      if (event.target === this.modalOverlay) {
        this.closeAddWidgetModal();
      }
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    this.galleryContainer = createElement("div", { className: "mac-widgets-gallery" });
    modal.appendChild(this.galleryContainer);

    this.modalOverlay.appendChild(modal);
    document.body.appendChild(this.modalOverlay);

    this.renderGalleryCards();
  }

  renderGalleryCards() {
    if (!this.galleryContainer) return;
    setHTML(this.galleryContainer, "");

    AVAILABLE_WIDGETS.forEach((item) => {
      const card = createElement("div", { className: "mac-widgets-gallery-card" });
      const isAdded = this.activeWidgets.includes(item.id);

      const info = createElement("div", { className: "mac-gallery-info" });
      const icon = createElement("div", {
        className: "mac-gallery-icon",
        html: `<i class="${item.icon}"></i>`
      });
      const texts = createElement("div", { className: "mac-gallery-texts" });
      const itemTitle = createElement("div", { className: "mac-gallery-title", text: item.title });
      const itemDesc = createElement("div", { className: "mac-gallery-desc", text: item.description });

      texts.appendChild(itemTitle);
      texts.appendChild(itemDesc);
      info.appendChild(icon);
      info.appendChild(texts);
      card.appendChild(info);

      const actionBtn = createElement("button", {
        className: `mac-gallery-add-btn${isAdded ? " added" : ""}`,
        text: isAdded ? "Added" : "+ Add"
      });

      if (!isAdded) {
        bindEvent(actionBtn, "click", () => {
          this.addWidget(item.id);
        });
      }

      card.appendChild(actionBtn);
      this.galleryContainer.appendChild(card);
    });
  }

  closeAddWidgetModal() {
    if (this.modalOverlay && this.modalOverlay.parentNode) {
      this.modalOverlay.remove();
      this.modalOverlay = null;
      this.galleryContainer = null;
    }
  }

  startTimers() {
    this.stopTimers();
    this.timerId = setInterval(() => this.updateClockTick(), 1000);
    this.updateClockTick();
  }

  stopTimers() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  updateClockTick() {
    if (!this.shelf) return;
    const now = new Date();

    const hourHand = $(".mac-clock-hour-hand", this.shelf);
    const minuteHand = $(".mac-clock-minute-hand", this.shelf);
    const secondHand = $(".mac-clock-second-hand", this.shelf);

    if (hourHand && minuteHand && secondHand) {
      const sec = now.getSeconds();
      const min = now.getMinutes() + sec / 60;
      const hr = (now.getHours() % 12) + min / 60;

      hourHand.setAttribute("transform", `rotate(${hr * 30} 53 53)`);
      minuteHand.setAttribute("transform", `rotate(${min * 6} 53 53)`);
      secondHand.setAttribute("transform", `rotate(${sec * 6} 53 53)`);
    }

    const digitalTime = $(".mac-digital-time", this.shelf);
    const digitalAmpm = $(".mac-digital-ampm", this.shelf);
    const digitalSeconds = $(".mac-digital-seconds", this.shelf);

    if (digitalTime && digitalAmpm && digitalSeconds) {
      const hours24 = now.getHours();
      const hours12 = hours24 % 12 || 12;
      const ampm = hours24 >= 12 ? "PM" : "AM";
      const padMin = String(now.getMinutes()).padStart(2, "0");
      const padSec = String(now.getSeconds()).padStart(2, "0");

      setText(digitalTime, `${String(hours12).padStart(2, "0")}:${padMin}`);
      setText(digitalAmpm, ampm);
      setText(digitalSeconds, `:${padSec}`);
    }

    const uptimeEl = $(".mac-uptime-val", this.shelf);
    if (uptimeEl) {
      const launch = Number(os.storage.get(StorageKeys.lastLaunchTime)) || Date.now();
      const diffMinutes = Math.floor((Date.now() - launch) / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      setText(uptimeEl, `${hours}h ${mins}m`);
    }

    if (window.__sitalMusicService) {
      const service = window.__sitalMusicService;
      let isPlaying = false;
      if (typeof service.isPlaying === "function") {
        isPlaying = service.isPlaying();
      } else if (typeof service.isPlaying === "boolean") {
        isPlaying = service.isPlaying;
      }
      if (isPlaying) {
        this.updateMusicPlayerWidget({ isPlaying: true });
      }
    }
  }
}

export const macWidgets = new MacWidgets();
