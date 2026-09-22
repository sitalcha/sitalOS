const DB_NAME = "sitalos_music_db";
const DB_VERSION = 1;
const STORE_NAME = "music_state";
const STATE_KEY = "playback_state";

const DEFAULT_STATE = {
  trackIndex: 0,
  currentTime: 0,
  isPlaying: false,
  volume: 80,
  shuffle: false,
  repeat: "off"
};

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function loadMusicState() {
  try {
    const db = await openDatabase();
    return await new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STATE_KEY);
      request.onsuccess = () => {
        const result = request.result;
        if (!result || typeof result !== "object") {
          resolve({ ...DEFAULT_STATE });
          return;
        }
        resolve({
          trackIndex: typeof result.trackIndex === "number" ? result.trackIndex : DEFAULT_STATE.trackIndex,
          currentTime: typeof result.currentTime === "number" ? result.currentTime : DEFAULT_STATE.currentTime,
          isPlaying: Boolean(result.isPlaying),
          volume: typeof result.volume === "number" ? result.volume : DEFAULT_STATE.volume,
          shuffle: Boolean(result.shuffle),
          repeat: typeof result.repeat === "string" ? result.repeat : DEFAULT_STATE.repeat
        });
      };
      request.onerror = () => {
        resolve({ ...DEFAULT_STATE });
      };
    });
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveMusicState(state) {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const payload = {
        trackIndex: typeof state?.trackIndex === "number" ? state.trackIndex : DEFAULT_STATE.trackIndex,
        currentTime: typeof state?.currentTime === "number" ? state.currentTime : DEFAULT_STATE.currentTime,
        isPlaying: Boolean(state?.isPlaying),
        volume: typeof state?.volume === "number" ? state.volume : DEFAULT_STATE.volume,
        shuffle: Boolean(state?.shuffle),
        repeat: typeof state?.repeat === "string" ? state.repeat : DEFAULT_STATE.repeat
      };
      const request = store.put(payload, STATE_KEY);
      request.onsuccess = () => resolve(payload);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch {
    return null;
  }
}
