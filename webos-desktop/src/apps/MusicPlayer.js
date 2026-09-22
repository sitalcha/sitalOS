import "../styles/musicPlayer.css";
import { BaseApp, os } from "../framework.js";
import { $, $$, createElement, bindEvent, toggleClass, setText, setHTML } from "../shared/domUtils.js";
import { loadMusicState, saveMusicState } from "../services/musicStorage.js";

export const MUSIC_TRACKS = [
  {
    title: "Lofi Study Beats",
    artist: "sital Beats",
    album: "Lo-Fi Sessions",
    artwork: "/music/cover1.jpg",
    fallbackArtwork: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop",
    url: "/music/track1.mp3",
    fallbackUrl: "https://actions.google.com/sounds/v1/water/rain_heavy_loud.ogg",
    duration: 180
  },
  {
    title: "Cyber City Lights",
    artist: "Neon Dreamer",
    album: "Future City",
    artwork: "/music/cover2.jpg",
    fallbackArtwork: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
    url: "/music/track2.mp3",
    fallbackUrl: "https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg",
    duration: 154
  },
  {
    title: "Midnight Stroll",
    artist: "Sital Melody",
    album: "Nightfall",
    artwork: "/music/cover3.jpg",
    fallbackArtwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    url: "/music/track3.mp3",
    fallbackUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    duration: 212
  },
  {
    title: "Solar Wind",
    artist: "Astral Echo",
    album: "Cosmos",
    artwork: "/music/cover4.jpg",
    fallbackArtwork: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=300&fit=crop",
    url: "/music/track4.mp3",
    fallbackUrl: "https://actions.google.com/sounds/v1/weather/thunderstorm.ogg",
    duration: 195
  },
  {
    title: "Tokyo Neon",
    artist: "Synthwave 84",
    album: "Retro Grid",
    artwork: "/music/cover5.jpg",
    fallbackArtwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
    url: "/music/track5.mp3",
    fallbackUrl: "https://actions.google.com/sounds/v1/transportation/subway_interior.ogg",
    duration: 168
  }
];

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

class SynthFallback {
  constructor() {
    this.audioContext = null;
    this.timerId = null;
    this.noteIndex = 0;
  }

  ensureContext() {
    if (!this.audioContext && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
  }

  start(trackIndex, volume) {
    this.ensureContext();
    if (!this.audioContext) return;
    this.stop();
    const chords = [
      [261.63, 329.63, 392.0, 523.25],
      [220.0, 261.63, 329.63, 440.0],
      [174.61, 220.0, 261.63, 349.23],
      [196.0, 246.94, 293.66, 392.0],
      [146.83, 174.61, 220.0, 293.66]
    ];
    const notes = chords[trackIndex % chords.length];
    this.noteIndex = 0;
    this.timerId = setInterval(() => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const freq = notes[this.noteIndex % notes.length];
      this.noteIndex += 1;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      const targetGain = (volume / 100) * 0.15;
      gain.gain.setValueAtTime(0.01, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.01, targetGain), this.audioContext.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + 1.3);
    }, 650);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export class MusicService {
  constructor() {
    this.tracks = MUSIC_TRACKS;
    this.trackIndex = 0;
    this.currentTime = 0;
    this.duration = this.tracks[0].duration;
    this.isPlaying = false;
    this.volume = 80;
    this.previousVolume = 80;
    this.shuffle = false;
    this.repeat = "off";
    this.synth = new SynthFallback();
    this.usingSynth = false;
    this.audio = typeof Audio !== "undefined" ? new Audio() : null;
    this.saveTimer = null;
    this.setupAudio();
    this.restoreSavedState();
  }

  setupAudio() {
    if (!this.audio) return;
    this.audio.preload = "metadata";
    this.audio.volume = this.volume / 100;
    this.audio.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
        this.duration = this.audio.duration;
        this.notifyState();
      }
    });
    this.audio.addEventListener("timeupdate", () => {
      this.currentTime = this.audio.currentTime;
      this.notifyState();
      this.debouncedSave();
    });
    this.audio.addEventListener("ended", () => {
      this.handleTrackEnded();
    });
    this.audio.addEventListener("error", () => {
      const currentTrack = this.tracks[this.trackIndex];
      if (currentTrack?.fallbackUrl && this.audio.src !== currentTrack.fallbackUrl && !this.audio.src.endsWith(currentTrack.fallbackUrl)) {
        this.audio.src = currentTrack.fallbackUrl;
        if (this.isPlaying) {
          this.audio.play().catch(() => {
            this.usingSynth = true;
            this.synth.start(this.trackIndex, this.volume);
          });
        }
        return;
      }
      if (this.isPlaying) {
        this.usingSynth = true;
        this.synth.start(this.trackIndex, this.volume);
      }
    });
  }

  async restoreSavedState() {
    const saved = await loadMusicState();
    if (saved) {
      if (typeof saved.trackIndex === "number" && saved.trackIndex >= 0 && saved.trackIndex < this.tracks.length) {
        this.trackIndex = saved.trackIndex;
      }
      if (typeof saved.volume === "number") {
        this.setVolume(saved.volume, false);
      }
      if (typeof saved.shuffle === "boolean") {
        this.shuffle = saved.shuffle;
      }
      if (typeof saved.repeat === "string") {
        this.repeat = saved.repeat;
      }
      this.duration = this.tracks[this.trackIndex].duration;
      if (this.audio) {
        this.audio.src = this.tracks[this.trackIndex].url;
        if (typeof saved.currentTime === "number" && saved.currentTime > 0) {
          this.currentTime = saved.currentTime;
          this.audio.currentTime = saved.currentTime;
        }
      }
      if (saved.isPlaying) {
        this.play();
      } else {
        this.updateMediaSession();
        this.notifyTrack();
        this.notifyState();
      }
    }
  }

  saveCurrentState() {
    saveMusicState({
      trackIndex: this.trackIndex,
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
      volume: this.volume,
      shuffle: this.shuffle,
      repeat: this.repeat
    });
  }

  debouncedSave() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveCurrentState();
    }, 1000);
  }

  getState() {
    return {
      trackIndex: this.trackIndex,
      currentTime: this.currentTime,
      duration: this.duration,
      isPlaying: this.isPlaying,
      volume: this.volume,
      shuffle: this.shuffle,
      repeat: this.repeat,
      track: this.tracks[this.trackIndex]
    };
  }

  notifyState() {
    os.events.emit("music:state-changed", this.getState());
  }

  notifyTrack() {
    os.events.emit("music:track-changed", {
      trackIndex: this.trackIndex,
      track: this.tracks[this.trackIndex],
      isPlaying: this.isPlaying
    });
  }

  handleTrackEnded() {
    if (this.repeat === "one") {
      this.seek(0);
      this.play();
      return;
    }
    if (this.shuffle) {
      this.playRandomTrack();
      return;
    }
    if (this.trackIndex < this.tracks.length - 1) {
      this.nextTrack();
      return;
    }
    if (this.repeat === "all") {
      this.trackIndex = 0;
      this.loadAndPlayCurrent();
      return;
    }
    this.pause();
    this.seek(0);
  }

  async play() {
    this.isPlaying = true;
    this.usingSynth = false;
    this.synth.stop();
    const currentTrack = this.tracks[this.trackIndex];
    if (this.audio) {
      if (!this.audio.src || (!this.audio.src.includes(currentTrack.url) && !this.audio.src.includes(currentTrack.fallbackUrl))) {
        this.audio.src = currentTrack.url;
      }
      try {
        await this.audio.play();
      } catch {
        if (currentTrack?.fallbackUrl && this.audio.src !== currentTrack.fallbackUrl && !this.audio.src.endsWith(currentTrack.fallbackUrl)) {
          try {
            this.audio.src = currentTrack.fallbackUrl;
            await this.audio.play();
          } catch {
            this.usingSynth = true;
            this.synth.start(this.trackIndex, this.volume);
          }
        } else {
          this.usingSynth = true;
          this.synth.start(this.trackIndex, this.volume);
        }
      }
    } else {
      this.usingSynth = true;
      this.synth.start(this.trackIndex, this.volume);
    }
    this.updateMediaSession();
    this.notifyState();
    this.notifyTrack();
    this.saveCurrentState();
  }

  pause() {
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause();
    }
    if (this.usingSynth) {
      this.synth.stop();
    }
    this.updateMediaSession();
    this.notifyState();
    this.saveCurrentState();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  nextTrack() {
    if (this.shuffle) {
      this.playRandomTrack();
      return;
    }
    this.trackIndex = (this.trackIndex + 1) % this.tracks.length;
    this.loadAndPlayCurrent();
  }

  prevTrack() {
    if (this.currentTime > 3) {
      this.seek(0);
      return;
    }
    this.trackIndex = (this.trackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.loadAndPlayCurrent();
  }

  playRandomTrack() {
    if (this.tracks.length <= 1) {
      this.loadAndPlayCurrent();
      return;
    }
    let nextIdx = this.trackIndex;
    while (nextIdx === this.trackIndex) {
      nextIdx = Math.floor(Math.random() * this.tracks.length);
    }
    this.trackIndex = nextIdx;
    this.loadAndPlayCurrent();
  }

  loadAndPlayCurrent() {
    const track = this.tracks[this.trackIndex];
    this.currentTime = 0;
    this.duration = track.duration;
    if (this.audio) {
      this.audio.src = track.url;
      this.audio.currentTime = 0;
    }
    if (this.isPlaying) {
      this.play();
    } else {
      this.updateMediaSession();
      this.notifyTrack();
      this.notifyState();
      this.saveCurrentState();
    }
  }

  selectTrack(index) {
    if (index >= 0 && index < this.tracks.length) {
      this.trackIndex = index;
      this.loadAndPlayCurrent();
      if (!this.isPlaying) {
        this.play();
      }
    }
  }

  seek(time) {
    const target = Math.max(0, Math.min(time, this.duration || 180));
    this.currentTime = target;
    if (this.audio && Number.isFinite(this.audio.duration)) {
      this.audio.currentTime = target;
    }
    this.notifyState();
    this.saveCurrentState();
  }

  setVolume(val, persist = true) {
    const clamped = Math.max(0, Math.min(100, Number(val) || 0));
    this.volume = clamped;
    if (clamped > 0) {
      this.previousVolume = clamped;
    }
    if (this.audio) {
      this.audio.volume = clamped / 100;
    }
    this.notifyState();
    if (persist) {
      this.saveCurrentState();
    }
  }

  toggleMute() {
    if (this.volume > 0) {
      this.setVolume(0);
    } else {
      this.setVolume(this.previousVolume || 80);
    }
  }

  setShuffle(val) {
    this.shuffle = Boolean(val);
    this.notifyState();
    this.saveCurrentState();
  }

  toggleShuffle() {
    this.setShuffle(!this.shuffle);
  }

  setRepeat(mode) {
    if (["off", "all", "one"].includes(mode)) {
      this.repeat = mode;
      this.notifyState();
      this.saveCurrentState();
    }
  }

  cycleRepeat() {
    const sequence = ["off", "all", "one"];
    const nextIndex = (sequence.indexOf(this.repeat) + 1) % sequence.length;
    this.setRepeat(sequence[nextIndex]);
  }

  updateMediaSession() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const track = this.tracks[this.trackIndex];
    if (!track) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: [
          { src: track.artwork, sizes: "300x300", type: "image/jpeg" }
        ]
      });
      navigator.mediaSession.playbackState = this.isPlaying ? "playing" : "paused";
      const actions = [
        ["play", () => this.play()],
        ["pause", () => this.pause()],
        ["previoustrack", () => this.prevTrack()],
        ["nexttrack", () => this.nextTrack()],
        ["seekto", (details) => {
          if (details && typeof details.seekTime === "number") {
            this.seek(details.seekTime);
          }
        }]
      ];
      for (const [action, handler] of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {}
      }
    } catch {}
  }
}

export const musicService = new MusicService();

if (typeof window !== "undefined") {
  window.sitalMusicService = musicService;
  window.__sitalMusicService = musicService;
}

export class MusicPlayerApp extends BaseApp {
  singletonWindowIds = ["music-player-window"];

  constructor(services) {
    super(services);
    this.service = musicService;
    this.winId = "music-player-window";
  }

  open(opts = {}) {
    const existing = $("#" + this.winId);
    if (existing) {
      os.window.focus(existing);
      return existing;
    }

    const win = os.window.create(this.winId, "Music", "760px", "540px", {
      icon: "papirus:apps/multimedia-audio-player",
      appId: "musicPlayerApp"
    });

    this.trackWindow(this.winId, win);
    this.render(win);
    return win;
  }

  render(win) {
    const container = createElement("div", { className: "music-player-window" });

    const layout = createElement("div", { className: "music-player-layout" });

    const left = createElement("div", { className: "music-player-left" });
    const vinylContainer = createElement("div", { className: "music-player-vinyl-container" });
    const vinyl = createElement("div", { className: "music-player-vinyl" });
    const vinylArt = createElement("img", {
      className: "music-player-vinyl-art",
      attributes: { alt: "Album artwork", src: this.service.tracks[this.service.trackIndex].artwork }
    });
    vinylArt.onerror = () => {
      const current = this.service.tracks[this.service.trackIndex];
      if (current?.fallbackArtwork && vinylArt.src !== current.fallbackArtwork) {
        vinylArt.src = current.fallbackArtwork;
      }
    };
    const vinylHole = createElement("div", { className: "music-player-vinyl-center-hole" });
    vinyl.appendChild(vinylArt);
    vinyl.appendChild(vinylHole);
    vinylContainer.appendChild(vinyl);

    const trackDetails = createElement("div", { className: "music-player-track-details" });
    const trackTitle = createElement("div", {
      className: "music-player-track-title",
      text: this.service.tracks[this.service.trackIndex].title
    });
    const artist = createElement("div", {
      className: "music-player-artist",
      text: this.service.tracks[this.service.trackIndex].artist
    });
    const album = createElement("div", {
      className: "music-player-album",
      text: this.service.tracks[this.service.trackIndex].album
    });
    trackDetails.appendChild(trackTitle);
    trackDetails.appendChild(artist);
    trackDetails.appendChild(album);

    left.appendChild(vinylContainer);
    left.appendChild(trackDetails);

    const right = createElement("div", { className: "music-player-right" });
    const queueHeader = createElement("div", {
      className: "music-player-queue-header",
      html: `<span>Playlist Queue</span><span>${this.service.tracks.length} Tracks</span>`
    });
    const trackList = createElement("div", { className: "music-player-track-list" });

    this.service.tracks.forEach((track, index) => {
      const item = createElement("div", {
        className: "music-player-track-item",
        attributes: { "data-index": String(index) }
      });
      if (index === this.service.trackIndex) {
        item.classList.add("active");
      }
      const thumb = createElement("img", {
        className: "music-player-track-thumb",
        attributes: { alt: track.title, src: track.artwork }
      });
      thumb.onerror = () => {
        if (track.fallbackArtwork && thumb.src !== track.fallbackArtwork) {
          thumb.src = track.fallbackArtwork;
        }
      };
      const meta = createElement("div", { className: "music-player-track-meta" });
      const name = createElement("div", { className: "music-player-track-name", text: track.title });
      const byline = createElement("div", {
        className: "music-player-track-byline",
        text: `${track.artist} \u00B7 ${track.album}`
      });
      meta.appendChild(name);
      meta.appendChild(byline);

      const duration = createElement("div", {
        className: "music-player-track-duration",
        text: formatTime(track.duration)
      });
      const indicator = createElement("div", {
        className: "music-player-track-indicator",
        html: index === this.service.trackIndex ? '<i class="fas fa-volume-high"></i>' : ""
      });

      item.appendChild(thumb);
      item.appendChild(meta);
      item.appendChild(duration);
      item.appendChild(indicator);

      bindEvent(item, "click", () => {
        this.service.selectTrack(index);
      });

      trackList.appendChild(item);
    });

    right.appendChild(queueHeader);
    right.appendChild(trackList);

    layout.appendChild(left);
    layout.appendChild(right);

    const footer = createElement("div", { className: "music-player-footer" });

    const seekRow = createElement("div", { className: "music-player-seek-row" });
    const timeCurrent = createElement("div", {
      className: "music-player-time",
      text: formatTime(this.service.currentTime)
    });
    const seekSlider = createElement("input", {
      className: "music-player-seek-slider",
      attributes: {
        type: "range",
        min: "0",
        max: String(Math.floor(this.service.duration || 180)),
        step: "1",
        value: String(Math.floor(this.service.currentTime))
      }
    });
    const timeTotal = createElement("div", {
      className: "music-player-time",
      text: formatTime(this.service.duration || 180)
    });
    seekRow.appendChild(timeCurrent);
    seekRow.appendChild(seekSlider);
    seekRow.appendChild(timeTotal);

    const controlsRow = createElement("div", { className: "music-player-controls-row" });

    const brand = createElement("div", {
      className: "music-player-brand",
      html: '<i class="fas fa-compact-disc"></i><span>sitalOS Music</span>'
    });

    const buttons = createElement("div", { className: "music-player-buttons" });

    const shuffleBtn = createElement("button", {
      className: "music-player-btn",
      attributes: { title: "Toggle Shuffle" },
      html: '<i class="fas fa-shuffle"></i>'
    });
    if (this.service.shuffle) shuffleBtn.classList.add("active");

    const prevBtn = createElement("button", {
      className: "music-player-btn",
      attributes: { title: "Previous Track" },
      html: '<i class="fas fa-backward-step"></i>'
    });

    const playBtn = createElement("button", {
      className: "music-player-play-btn",
      attributes: { title: "Play/Pause" },
      html: this.service.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>'
    });

    const nextBtn = createElement("button", {
      className: "music-player-btn",
      attributes: { title: "Next Track" },
      html: '<i class="fas fa-forward-step"></i>'
    });

    const repeatBtn = createElement("button", {
      className: "music-player-btn",
      attributes: { title: "Toggle Repeat" },
      html: this.service.repeat === "one" ? '<i class="fas fa-repeat"></i><span class="music-player-badge">1</span>' : '<i class="fas fa-repeat"></i>'
    });
    if (this.service.repeat !== "off") repeatBtn.classList.add("active");

    buttons.appendChild(shuffleBtn);
    buttons.appendChild(prevBtn);
    buttons.appendChild(playBtn);
    buttons.appendChild(nextBtn);
    buttons.appendChild(repeatBtn);

    const volumeGroup = createElement("div", { className: "music-player-volume-group" });
    const volumeBtn = createElement("button", {
      className: "music-player-btn",
      attributes: { title: "Mute/Unmute" },
      html: this.service.volume === 0 ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-high"></i>'
    });
    const volumeSlider = createElement("input", {
      className: "music-player-volume-slider",
      attributes: {
        type: "range",
        min: "0",
        max: "100",
        step: "1",
        value: String(this.service.volume)
      }
    });
    volumeGroup.appendChild(volumeBtn);
    volumeGroup.appendChild(volumeSlider);

    controlsRow.appendChild(brand);
    controlsRow.appendChild(buttons);
    controlsRow.appendChild(volumeGroup);

    footer.appendChild(seekRow);
    footer.appendChild(controlsRow);

    container.appendChild(layout);
    container.appendChild(footer);

    win.appendChild(container);

    bindEvent(playBtn, "click", () => this.service.togglePlay());
    bindEvent(prevBtn, "click", () => this.service.prevTrack());
    bindEvent(nextBtn, "click", () => this.service.nextTrack());
    bindEvent(shuffleBtn, "click", () => this.service.toggleShuffle());
    bindEvent(repeatBtn, "click", () => this.service.cycleRepeat());
    bindEvent(volumeBtn, "click", () => this.service.toggleMute());
    bindEvent(volumeSlider, "input", () => this.service.setVolume(Number(volumeSlider.value)));

    let isSeeking = false;
    bindEvent(seekSlider, "mousedown", () => { isSeeking = true; });
    bindEvent(seekSlider, "touchstart", () => { isSeeking = true; });
    bindEvent(seekSlider, "input", () => {
      setText(timeCurrent, formatTime(Number(seekSlider.value)));
    });
    bindEvent(seekSlider, "change", () => {
      this.service.seek(Number(seekSlider.value));
      isSeeking = false;
    });

    const updateState = (state) => {
      toggleClass(vinyl, "playing", state.isPlaying);
      setHTML(playBtn, state.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>');
      toggleClass(shuffleBtn, "active", state.shuffle);
      toggleClass(repeatBtn, "active", state.repeat !== "off");
      setHTML(
        repeatBtn,
        state.repeat === "one"
          ? '<i class="fas fa-repeat"></i><span class="music-player-badge">1</span>'
          : '<i class="fas fa-repeat"></i>'
      );

      setHTML(
        volumeBtn,
        state.volume === 0
          ? '<i class="fas fa-volume-mute"></i>'
          : state.volume < 50
            ? '<i class="fas fa-volume-low"></i>'
            : '<i class="fas fa-volume-high"></i>'
      );
      if (document.activeElement !== volumeSlider) {
        volumeSlider.value = String(state.volume);
      }

      if (!isSeeking) {
        setText(timeCurrent, formatTime(state.currentTime));
        seekSlider.value = String(Math.floor(state.currentTime));
      }
      setText(timeTotal, formatTime(state.duration));
      seekSlider.max = String(Math.floor(state.duration));
    };

    const updateTrack = (trackData) => {
      const track = trackData.track;
      vinylArt.src = track.artwork;
      vinylArt.onerror = () => {
        if (track.fallbackArtwork && vinylArt.src !== track.fallbackArtwork) {
          vinylArt.src = track.fallbackArtwork;
        }
      };
      setText(trackTitle, track.title);
      setText(artist, track.artist);
      setText(album, track.album);

      const items = $$(".music-player-track-item", trackList);
      items.forEach((item, idx) => {
        const isActive = idx === trackData.trackIndex;
        toggleClass(item, "active", isActive);
        const ind = $(".music-player-track-indicator", item);
        if (ind) {
          setHTML(ind, isActive ? '<i class="fas fa-volume-high"></i>' : "");
        }
      });
    };

    updateState(this.service.getState());
    updateTrack({ trackIndex: this.service.trackIndex, track: this.service.tracks[this.service.trackIndex] });

    const unsubscribeState = os.events.on("music:state-changed", updateState);
    const unsubscribeTrack = os.events.on("music:track-changed", updateTrack);

    bindEvent(win, "remove", () => {
      unsubscribeState();
      unsubscribeTrack();
    });
  }
}
