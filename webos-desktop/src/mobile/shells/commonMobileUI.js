import { $, $$, createElement, setText, setHTML, bindEvent, toggleClass } from "../../shared/domUtils.js";
import { resolveIconUrl } from "../../shared/assetResolver.js";
import { APP_MANIFESTS } from "../../registry/AppManifest.js";
import { audioMixer } from "../../audioMixer.js";

export const KALI_TOOL_ITEMS = [
  { name: "Nmap", subtitle: "Port Scanner", icon: "fas fa-network-wired" },
  { name: "Metasploit", subtitle: "Exploit Framework", icon: "fas fa-skull-crossbones" },
  { name: "Burp Suite", subtitle: "Web Security", icon: "fas fa-spider" },
  { name: "Wireshark", subtitle: "Packet Sniffer", icon: "fas fa-wave-square" },
  { name: "SQLmap", subtitle: "DB Injection", icon: "fas fa-database" },
  { name: "Aircrack", subtitle: "Wireless Audit", icon: "fas fa-wifi" }
];

export const getAppManifest = (serviceKey) => {
  return APP_MANIFESTS.find((item) => item.serviceKey === serviceKey) || null;
};

export const createAppItem = (manifest, onClick, withTitle = true) => {
  const item = createElement("button", { className: "mobile-app-item" });
  const iconWrap = createElement("div", { className: "mobile-app-icon-wrapper" });
  const iconImg = createElement("img", {
    className: "mobile-app-icon-img",
    attributes: { src: resolveIconUrl(manifest.icon || "static/icons/file.webp"), alt: manifest.title || "App" }
  });
  iconWrap.appendChild(iconImg);
  item.appendChild(iconWrap);
  if (withTitle && manifest.title) {
    item.appendChild(createElement("span", { className: "mobile-app-title", text: manifest.title }));
  }
  bindEvent(item, "click", onClick);
  return item;
};

export const createStatusBar = (onToggleControlCenter) => {
  const bar = createElement("div", { id: "mobile-status-bar" });
  const left = createElement("div", { className: "mobile-status-left" });
  const timeEl = createElement("span", { className: "mobile-status-time", text: "12:00" });
  left.appendChild(timeEl);

  const right = createElement("div", { className: "mobile-status-right" });
  const wifiIcon = createElement("i", { className: "fas fa-wifi mobile-status-wifi" });
  const batteryBox = createElement("div", { className: "mobile-status-battery" });
  const batteryLevel = createElement("span", { className: "mobile-battery-level", text: "100%" });
  const batteryIcon = createElement("i", { className: "fas fa-battery-full mobile-battery-icon" });
  batteryBox.appendChild(batteryLevel);
  batteryBox.appendChild(batteryIcon);
  right.appendChild(wifiIcon);
  right.appendChild(batteryBox);

  bar.appendChild(left);
  bar.appendChild(right);

  bindEvent(right, "click", onToggleControlCenter);

  const updateClock = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setText(timeEl, `${hours}:${minutes}`);
  };
  updateClock();
  const clockInterval = setInterval(updateClock, 1000);

  if (navigator.getBattery) {
    navigator.getBattery().then((battery) => {
      const renderBattery = () => {
        const percent = Math.round(battery.level * 100);
        setText(batteryLevel, `${percent}%`);
        let iconName = "fas fa-battery-full";
        if (battery.charging) {
          iconName = "fas fa-bolt";
        } else if (percent < 20) {
          iconName = "fas fa-battery-quarter";
        } else if (percent < 50) {
          iconName = "fas fa-battery-half";
        } else if (percent < 80) {
          iconName = "fas fa-battery-three-quarters";
        }
        batteryIcon.className = `${iconName} mobile-battery-icon`;
      };
      renderBattery();
      bindEvent(battery, "levelchange", renderBattery);
      bindEvent(battery, "chargingchange", renderBattery);
    }).catch(() => {});
  }

  return {
    element: bar,
    destroy: () => clearInterval(clockInterval),
    setWifiEnabled: (enabled) => {
      toggleClass(wifiIcon, "fa-wifi-slash", !enabled);
      toggleClass(wifiIcon, "fa-wifi", enabled);
    }
  };
};

export const createDock = (os, dockKeys, customWrapperStyle) => {
  const dock = createElement("div", { className: "mobile-dock" });
  dockKeys.forEach((key) => {
    const manifest = getAppManifest(key);
    if (!manifest) return;
    const item = createAppItem(manifest, () => os?.app?.launch?.(key), false);
    if (customWrapperStyle) {
      const wrap = $(".mobile-app-icon-wrapper", item);
      if (wrap) Object.assign(wrap.style, customWrapperStyle);
    }
    dock.appendChild(item);
  });
  return dock;
};

export const createMusicWidget = (os) => {
  const card = createElement("div", { className: "mobile-music-widget" });

  const artWrapper = createElement("div", { className: "mobile-music-art" });
  const artImg = createElement("img", {
    className: "mobile-music-art-img",
    attributes: { src: "", alt: "Album Art" }
  });
  artImg.style.display = "none";
  const artFallback = createElement("div", {
    className: "mobile-music-art-fallback",
    html: '<i class="fas fa-music"></i>'
  });
  artWrapper.appendChild(artImg);
  artWrapper.appendChild(artFallback);

  const info = createElement("div", { className: "mobile-music-info" });
  const title = createElement("div", { className: "mobile-music-title", text: "No music playing" });
  const artist = createElement("div", { className: "mobile-music-artist", text: "" });
  info.appendChild(title);
  info.appendChild(artist);

  const controls = createElement("div", { className: "mobile-music-controls" });
  const playBtn = createElement("button", {
    className: "mobile-music-btn mobile-music-play-btn",
    html: '<i class="fas fa-play"></i>',
    attributes: { "aria-label": "Play or Pause" }
  });
  const nextBtn = createElement("button", {
    className: "mobile-music-btn mobile-music-next-btn",
    html: '<i class="fas fa-step-forward"></i>',
    attributes: { "aria-label": "Next Track" }
  });
  controls.appendChild(playBtn);
  controls.appendChild(nextBtn);

  card.appendChild(artWrapper);
  card.appendChild(info);
  card.appendChild(controls);

  const getActiveChannel = () => {
    const mixer = typeof audioMixer === "function" ? audioMixer() : null;
    if (!mixer || !mixer.channels || mixer.channels.size === 0) return null;
    for (const [winId, ch] of mixer.channels) {
      if (ch.nowPlaying && ch.nowPlaying.playbackState === "playing") {
        return { winId, ch };
      }
    }
    for (const [winId, ch] of mixer.channels) {
      if (ch.nowPlaying) {
        return { winId, ch };
      }
    }
    const firstEntry = Array.from(mixer.channels.entries())[0];
    if (firstEntry) {
      return { winId: firstEntry[0], ch: firstEntry[1] };
    }
    return null;
  };

  const update = () => {
    const active = getActiveChannel();
    if (active && active.ch && active.ch.nowPlaying) {
      const np = active.ch.nowPlaying;
      setText(title, np.track || active.ch.title || "Now Playing");
      setText(artist, np.artist || "");
      if (np.artwork) {
        artImg.src = np.artwork;
        artImg.style.display = "block";
        artFallback.style.display = "none";
      } else {
        artImg.style.display = "none";
        artFallback.style.display = "flex";
      }
      const isPlaying = np.playbackState === "playing";
      setHTML(playBtn, isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>');
    } else if (active && active.ch) {
      setText(title, active.ch.title || "Audio playing");
      setText(artist, "");
      artImg.style.display = "none";
      artFallback.style.display = "flex";
      setHTML(playBtn, '<i class="fas fa-play"></i>');
    } else {
      setText(title, "No music playing");
      setText(artist, "");
      artImg.style.display = "none";
      artFallback.style.display = "flex";
      setHTML(playBtn, '<i class="fas fa-play"></i>');
    }
  };

  bindEvent(card, "click", (event) => {
    if (event.target.closest(".mobile-music-controls") || event.target.closest(".mobile-music-btn")) {
      return;
    }
    if (os && os.app && typeof os.app.launch === "function") {
      os.app.launch("musicPlayerApp").catch(() => {});
    }
  });

  bindEvent(playBtn, "click", (event) => {
    event.stopPropagation();
    const active = getActiveChannel();
    if (active && active.ch && typeof active.ch.sendCommand === "function") {
      const isPlaying = active.ch.nowPlaying && active.ch.nowPlaying.playbackState === "playing";
      active.ch.sendCommand(isPlaying ? "pause" : "play");
    }
    const mediaElements = $$(".window audio, .window video");
    for (const element of mediaElements) {
      if (element.paused) {
        element.play().catch(() => {});
      } else {
        element.pause();
      }
    }
    if (os && os.events && typeof os.events.emit === "function") {
      os.events.emit("media:togglePlay");
    }
    setTimeout(update, 100);
  });

  bindEvent(nextBtn, "click", (event) => {
    event.stopPropagation();
    const active = getActiveChannel();
    if (active && active.ch && typeof active.ch.sendCommand === "function") {
      active.ch.sendCommand("nexttrack");
    }
    const mediaElements = $$(".window audio, .window video");
    if (mediaElements.length > 1) {
      for (let index = 0; index < mediaElements.length; index++) {
        const element = mediaElements[index];
        if (!element.paused) {
          element.pause();
          const nextElement = mediaElements[(index + 1) % mediaElements.length];
          nextElement.play().catch(() => {});
          break;
        }
      }
    }
    if (os && os.events && typeof os.events.emit === "function") {
      os.events.emit("media:nextTrack");
    }
    setTimeout(update, 150);
  });

  update();
  const timer = setInterval(update, 800);

  return {
    element: card,
    destroy: () => clearInterval(timer),
    update
  };
};

export const adaptWindow = (winId, winElement, os) => {
  const root = document.documentElement;
  if (!root.classList.contains("device-phone") &&
      !root.classList.contains("device-tablet") &&
      !root.classList.contains("is-phone")) {
    return;
  }
  const win = winElement || $(`#${winId}`);
  if (!win) return;

  if (!$(".mobile-nav-header", win)) {
    const navHeader = createElement("div", { className: "mobile-nav-header" });
    const backBtn = createElement("button", {
      className: "mobile-nav-back-btn",
      html: '<i class="fas fa-chevron-left"></i><span>Back</span>',
      attributes: { "aria-label": "Back" }
    });
    const titleString = os?.window?.getTitle?.(win.id) || $(".window-title", win)?.textContent || "App";
    const titleEl = createElement("div", {
      className: "mobile-nav-title",
      text: titleString
    });
    const closeBtn = createElement("button", {
      className: "mobile-nav-close-btn",
      html: '<i class="fas fa-times"></i>',
      attributes: { "aria-label": "Close" }
    });

    navHeader.appendChild(backBtn);
    navHeader.appendChild(titleEl);
    navHeader.appendChild(closeBtn);

    bindEvent(backBtn, "click", (event) => {
      event.stopPropagation();
      if (os?.window?.minimize) {
        os.window.minimize(win);
      }
    });

    bindEvent(closeBtn, "click", (event) => {
      event.stopPropagation();
      if (os?.window?.close) {
        os.window.close(win);
      }
    });

    win.prepend(navHeader);
  }

  if (!$(".mobile-home-indicator", win)) {
    const indicator = createElement("div", { className: "mobile-home-indicator" });
    bindEvent(indicator, "click", () => {
      if (os?.window?.minimize) {
        os.window.minimize(win);
      }
    });

    let touchStartY = 0;
    bindEvent(indicator, "touchstart", (event) => {
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    bindEvent(indicator, "touchend", (event) => {
      const endY = event.changedTouches[0].clientY;
      if (touchStartY - endY > 40) {
        if (os?.window?.minimize) {
          os.window.minimize(win);
        }
      }
    });

    win.appendChild(indicator);
  }
};
