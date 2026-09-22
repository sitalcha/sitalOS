import { createElement, setText, bindEvent } from "../../shared/domUtils.js";

export function createCalendarWidget(os, options = {}) {
  const element = createElement("div", {
    className: "mobile-widget mobile-calendar-widget",
    attributes: { "role": "button", "aria-label": "Calendar Widget" }
  });

  const badge = createElement("div", { className: "mobile-calendar-badge" });
  const dayNameEl = createElement("span", { className: "mobile-calendar-badge-day" });
  const dateNumEl = createElement("span", { className: "mobile-calendar-badge-date" });
  badge.appendChild(dayNameEl);
  badge.appendChild(dateNumEl);

  const details = createElement("div", { className: "mobile-calendar-details" });
  const titleEl = createElement("div", {
    className: "mobile-calendar-title",
    text: options.reminder || options.note || "No upcoming events"
  });
  const subtitleEl = createElement("div", { className: "mobile-calendar-subtitle" });
  details.appendChild(titleEl);
  details.appendChild(subtitleEl);

  element.appendChild(badge);
  element.appendChild(details);

  const updateCalendar = () => {
    const now = new Date();
    const dayShort = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(now);
    const dayFull = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now);
    const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" }).format(now);
    const dateNum = String(now.getDate());

    setText(dayNameEl, dayShort);
    setText(dateNumEl, dateNum);
    setText(subtitleEl, `${dayFull}, ${monthShort} ${dateNum}`);
  };

  updateCalendar();
  const timer = setInterval(updateCalendar, 60000);

  bindEvent(element, "click", () => {
    if (os && os.app && typeof os.app.launch === "function") {
      os.app.launch("calendarApp").catch(() => {});
    }
  });

  const destroy = () => {
    clearInterval(timer);
  };

  return { element, destroy };
}
