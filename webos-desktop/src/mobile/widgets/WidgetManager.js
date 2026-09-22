import "./mobileWidgets.css";
import { createClockWidget } from "./ClockWidget.js";
import { createWeatherWidget } from "./WeatherWidget.js";
import { createMusicWidget } from "./MusicWidget.js";
import { createCalendarWidget } from "./CalendarWidget.js";
import { createKaliTerminalWidget } from "./KaliTerminalWidget.js";

const DB_NAME = "sitalos_mobile_widgets_db";
const DB_VERSION = 1;
const STORE_NAME = "widgets";

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export class WidgetManager {
  constructor() {
    this.instances = new Map();
  }

  async getLayout(shellMode) {
    const key = shellMode || "default";
    try {
      const database = await openDatabase();
      return await new Promise((resolve) => {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => {
          if (Array.isArray(request.result) && request.result.length > 0) {
            resolve(request.result);
          } else {
            resolve(["clock", "weather", "music"]);
          }
        };
        request.onerror = () => resolve(["clock", "weather", "music"]);
      });
    } catch {
      return ["clock", "weather", "music"];
    }
  }

  async saveLayout(shellMode, layout) {
    const key = shellMode || "default";
    try {
      const database = await openDatabase();
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(layout, key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  createWidget(widgetId, os, options = {}) {
    let widgetInstance = null;
    switch (widgetId) {
      case "clock":
        widgetInstance = createClockWidget(os, options);
        break;
      case "weather":
        widgetInstance = createWeatherWidget(os, options);
        break;
      case "music":
        widgetInstance = createMusicWidget(os, options);
        break;
      case "calendar":
        widgetInstance = createCalendarWidget(os, options);
        break;
      case "kali":
      case "terminal":
      case "kali-terminal":
        widgetInstance = createKaliTerminalWidget(os, options);
        break;
      default:
        return null;
    }

    if (!widgetInstance || !widgetInstance.element) {
      return null;
    }

    const widgetElement = widgetInstance.element;
    widgetElement.dataset.widgetId = widgetId;
    this.instances.set(widgetElement, widgetInstance);

    return widgetElement;
  }

  destroyWidget(target) {
    if (!target) return false;
    let targetElement = null;
    let targetInstance = null;

    if (typeof target === "string") {
      for (const [element, instance] of this.instances.entries()) {
        if (element.dataset.widgetId === target) {
          targetElement = element;
          targetInstance = instance;
          break;
        }
      }
    } else if (this.instances.has(target)) {
      targetElement = target;
      targetInstance = this.instances.get(target);
    }

    if (targetInstance) {
      if (typeof targetInstance.destroy === "function") {
        targetInstance.destroy();
      }
      if (targetElement && targetElement.parentNode) {
        targetElement.remove();
      }
      this.instances.delete(targetElement);
      return true;
    }
    return false;
  }

  destroyAll() {
    for (const [element, instance] of this.instances.entries()) {
      if (instance && typeof instance.destroy === "function") {
        instance.destroy();
      }
      if (element && element.parentNode) {
        element.remove();
      }
    }
    this.instances.clear();
  }

  getWidgetInstance(element) {
    return this.instances.get(element) || null;
  }

  getActiveWidgets() {
    return Array.from(this.instances.values());
  }
}

export const widgetManager = new WidgetManager();
export default widgetManager;
