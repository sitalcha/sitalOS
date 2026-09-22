import { createElement, setText, setHTML, bindEvent } from "../../shared/domUtils.js";

export function createClockWidget(os, options = {}) {
  const element = createElement("div", {
    className: "mobile-widget mobile-pixel-clock-widget",
    attributes: { "role": "button", "aria-label": "Clock Widget" }
  });

  const timeEl = createElement("div", { className: "mobile-clock-time", text: "12:00" });
  const subinfoEl = createElement("div", { className: "mobile-clock-subinfo" });
  const dateEl = createElement("span", { className: "mobile-clock-date" });
  const tagEl = createElement("span", { className: "mobile-clock-tag" });
  const tagIcon = createElement("span", { className: "mobile-clock-tag-icon" });
  const tagText = createElement("span", { className: "mobile-clock-tag-text" });

  tagEl.appendChild(tagIcon);
  tagEl.appendChild(tagText);
  subinfoEl.appendChild(dateEl);
  subinfoEl.appendChild(tagEl);
  element.appendChild(timeEl);
  element.appendChild(subinfoEl);

  const updateTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setText(timeEl, `${hours}:${minutes}`);

    const formattedDate = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    }).format(now);
    setText(dateEl, formattedDate);
  };

  updateTime();
  const timer = setInterval(updateTime, 1000);

  let batteryRef = null;
  let levelChangeHandler = null;
  let chargingChangeHandler = null;

  const updateBattery = () => {
    if (!batteryRef) return;
    const level = Math.round(batteryRef.level * 100);
    let iconClass = "fas fa-battery-full";
    if (batteryRef.charging) {
      iconClass = "fas fa-bolt";
    } else if (level < 20) {
      iconClass = "fas fa-battery-quarter";
    } else if (level < 50) {
      iconClass = "fas fa-battery-half";
    } else if (level < 80) {
      iconClass = "fas fa-battery-three-quarters";
    }
    setHTML(tagIcon, `<i class="${iconClass}"></i>`);
    setText(tagText, `${level}%`);
  };

  if (typeof navigator !== "undefined" && navigator.getBattery) {
    navigator.getBattery().then((battery) => {
      batteryRef = battery;
      levelChangeHandler = () => updateBattery();
      chargingChangeHandler = () => updateBattery();
      bindEvent(batteryRef, "levelchange", levelChangeHandler);
      bindEvent(batteryRef, "chargingchange", chargingChangeHandler);
      updateBattery();
    }).catch(() => {
      setHTML(tagIcon, '<i class="fas fa-temperature-half"></i>');
      setText(tagText, options.temperature || "24°C");
    });
  } else {
    setHTML(tagIcon, '<i class="fas fa-temperature-half"></i>');
    setText(tagText, options.temperature || "24°C");
  }

  bindEvent(element, "click", () => {
    if (!os || !os.app || typeof os.app.launch !== "function") return;
    if (typeof os.app.isInstalled === "function" && os.app.isInstalled("clockApp")) {
      os.app.launch("clockApp").catch(() => {});
    } else if (typeof os.app.isInstalled === "function" && os.app.isInstalled("calendarApp")) {
      os.app.launch("calendarApp").catch(() => {});
    } else {
      os.app.launch("clockApp").catch(() => {
        os.app.launch("calendarApp").catch(() => {});
      });
    }
  });

  const destroy = () => {
    clearInterval(timer);
    if (batteryRef) {
      if (levelChangeHandler) {
        batteryRef.removeEventListener("levelchange", levelChangeHandler);
      }
      if (chargingChangeHandler) {
        batteryRef.removeEventListener("chargingchange", chargingChangeHandler);
      }
      batteryRef = null;
    }
  };

  return { element, destroy };
}
