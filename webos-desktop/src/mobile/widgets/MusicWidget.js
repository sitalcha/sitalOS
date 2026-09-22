import { createElement, setText, setHTML, bindEvent, $$ } from "../../shared/domUtils.js";
import { audioMixer } from "../../audioMixer.js";

export function createMusicWidget(os, options = {}) {
  const card = createElement("div", {
    className: "mobile-widget mobile-music-widget",
    attributes: { "role": "region", "aria-label": "Music Player Widget" }
  });

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

  const getMediaState = () => {
    const musicService = typeof window !== "undefined" ? window["__sitalMusicService"] : null;
    if (musicService && musicService.currentTrack) {
      return {
        track: musicService.currentTrack.title || musicService.currentTrack.name || "Now Playing",
        artist: musicService.currentTrack.artist || musicService.currentTrack.author || "",
        artwork: musicService.currentTrack.cover || musicService.currentTrack.artwork || null,
        isPlaying: Boolean(musicService.isPlaying),
        service: musicService
      };
    }

    const mixer = typeof audioMixer === "function" ? audioMixer() : null;
    if (mixer && mixer.channels && mixer.channels.size > 0) {
      for (const [winId, ch] of mixer.channels) {
        if (ch.nowPlaying && ch.nowPlaying.playbackState === "playing") {
          return {
            track: ch.nowPlaying.track || ch.title || "Now Playing",
            artist: ch.nowPlaying.artist || "",
            artwork: ch.nowPlaying.artwork || null,
            isPlaying: true,
            channel: ch
          };
        }
      }
      for (const [winId, ch] of mixer.channels) {
        if (ch.nowPlaying) {
          return {
            track: ch.nowPlaying.track || ch.title || "Now Playing",
            artist: ch.nowPlaying.artist || "",
            artwork: ch.nowPlaying.artwork || null,
            isPlaying: ch.nowPlaying.playbackState === "playing",
            channel: ch
          };
        }
      }
      const firstEntry = Array.from(mixer.channels.entries())[0];
      if (firstEntry) {
        return {
          track: firstEntry[1].title || "Audio Playing",
          artist: "",
          artwork: null,
          isPlaying: true,
          channel: firstEntry[1]
        };
      }
    }

    return null;
  };

  const update = () => {
    const state = getMediaState();
    if (state) {
      setText(title, state.track);
      setText(artist, state.artist);
      if (state.artwork) {
        artImg.src = state.artwork;
        artImg.style.display = "block";
        artFallback.style.display = "none";
      } else {
        artImg.style.display = "none";
        artFallback.style.display = "flex";
      }
      setHTML(playBtn, state.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>');
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
    const state = getMediaState();
    if (state && state.service && typeof state.service.togglePlay === "function") {
      state.service.togglePlay();
    } else if (state && state.channel && typeof state.channel.sendCommand === "function") {
      state.channel.sendCommand(state.isPlaying ? "pause" : "play");
    } else {
      const mixer = typeof audioMixer === "function" ? audioMixer() : null;
      if (mixer && mixer.channels) {
        for (const [winId, ch] of mixer.channels) {
          if (typeof ch.sendCommand === "function") {
            const isPlaying = ch.nowPlaying && ch.nowPlaying.playbackState === "playing";
            ch.sendCommand(isPlaying ? "pause" : "play");
          }
        }
      }
    }

    const mediaElements = $$(".window audio, .window video");
    for (const mediaEl of mediaElements) {
      if (mediaEl.paused) {
        mediaEl.play().catch(() => {});
      } else {
        mediaEl.pause();
      }
    }

    if (os && os.events && typeof os.events.emit === "function") {
      os.events.emit("media:togglePlay");
    }
    setTimeout(update, 100);
  });

  bindEvent(nextBtn, "click", (event) => {
    event.stopPropagation();
    const state = getMediaState();
    if (state && state.service && typeof state.service.next === "function") {
      state.service.next();
    } else if (state && state.channel && typeof state.channel.sendCommand === "function") {
      state.channel.sendCommand("nexttrack");
    } else {
      const mixer = typeof audioMixer === "function" ? audioMixer() : null;
      if (mixer && mixer.channels) {
        for (const [winId, ch] of mixer.channels) {
          if (typeof ch.sendCommand === "function") {
            ch.sendCommand("nexttrack");
          }
        }
      }
    }

    const mediaElements = $$(".window audio, .window video");
    if (mediaElements.length > 1) {
      for (let index = 0; index < mediaElements.length; index++) {
        const mediaEl = mediaElements[index];
        if (!mediaEl.paused) {
          mediaEl.pause();
          const nextEl = mediaElements[(index + 1) % mediaElements.length];
          nextEl.play().catch(() => {});
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

  const destroy = () => {
    clearInterval(timer);
  };

  return {
    element: card,
    destroy,
    update
  };
}
