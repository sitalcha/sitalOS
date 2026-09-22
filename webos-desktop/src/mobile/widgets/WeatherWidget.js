import { createElement, setText, bindEvent } from "../../shared/domUtils.js";

export function createWeatherWidget(os, options = {}) {
  const element = createElement("div", {
    className: "mobile-widget mobile-weather-widget",
    attributes: { "role": "button", "aria-label": "Weather Widget" }
  });

  const left = createElement("div", { className: "mobile-weather-left" });
  const tempEl = createElement("div", {
    className: "mobile-weather-temp",
    text: options.temperature || options.temp || "24°C"
  });
  const conditionEl = createElement("div", {
    className: "mobile-weather-condition",
    text: options.condition || "Partly Cloudy"
  });
  const locationEl = createElement("div", { className: "mobile-weather-location" });
  const locIcon = createElement("i", { className: "fas fa-location-dot" });
  const locText = createElement("span", { text: options.location || options.city || "Kathmandu" });

  locationEl.appendChild(locIcon);
  locationEl.appendChild(locText);
  left.appendChild(tempEl);
  left.appendChild(conditionEl);
  left.appendChild(locationEl);

  const right = createElement("div", { className: "mobile-weather-right" });
  const iconClass = options.icon || "fas fa-cloud-sun";
  const weatherIcon = createElement("i", { className: `${iconClass} mobile-weather-icon` });
  right.appendChild(weatherIcon);

  element.appendChild(left);
  element.appendChild(right);

  bindEvent(element, "click", () => {
    if (!os || !os.app || typeof os.app.launch !== "function") return;
    os.app.launch("weatherApp").catch(() => {
      if (typeof os.app.launch === "function") {
        os.app.launch("browserApp").catch(() => {});
      }
    });
  });

  const updateWeather = () => {
    const currentHour = new Date().getHours();
    if (!options.condition) {
      if (currentHour >= 6 && currentHour < 18) {
        setText(conditionEl, "Partly Cloudy");
        weatherIcon.className = "fas fa-cloud-sun mobile-weather-icon";
      } else {
        setText(conditionEl, "Clear Night");
        weatherIcon.className = "fas fa-moon mobile-weather-icon";
      }
    }
  };

  updateWeather();
  const timer = setInterval(updateWeather, 60000);

  const destroy = () => {
    clearInterval(timer);
  };

  return { element, destroy };
}
