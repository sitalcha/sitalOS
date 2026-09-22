import { $, createElement, setHTML, bindEvent, toggleClass } from "../../shared/domUtils.js";
import { resolveIconUrl } from "../../shared/assetResolver.js";

export const createAppSwitcher = (os) => {
  const switcher = createElement("div", { id: "mobile-app-switcher" });
  const header = createElement("div", { className: "mobile-switcher-header" });
  const title = createElement("span", { className: "mobile-switcher-title", text: "Running Apps" });
  const clearBtn = createElement("button", {
    className: "mobile-switcher-clear-btn",
    text: "Clear All",
    attributes: { "aria-label": "Clear All" }
  });
  header.appendChild(title);
  header.appendChild(clearBtn);

  const track = createElement("div", { className: "mobile-switcher-track" });
  switcher.appendChild(header);
  switcher.appendChild(track);

  const close = () => toggleClass(switcher, "active", false);

  const renderCards = () => {
    setHTML(track, "");
    const openWindows = os?.window?.getOpenWindows?.() || os?.windowManager?.openWindows;
    if (!openWindows || openWindows.size === 0) {
      track.appendChild(createElement("div", { className: "mobile-switcher-empty", text: "No recent apps" }));
      return;
    }

    openWindows.forEach((entry, winId) => {
      const card = createElement("div", { className: "mobile-switcher-card" });
      const cardHeader = createElement("div", { className: "mobile-switcher-card-header" });
      const cardIcon = createElement("img", {
        className: "mobile-switcher-card-icon",
        attributes: { src: resolveIconUrl(entry.iconValue || "static/icons/file.webp"), alt: "" }
      });
      const cardTitle = createElement("span", {
        className: "mobile-switcher-card-title",
        text: entry.title || "App"
      });
      const cardClose = createElement("button", {
        className: "mobile-switcher-card-close",
        html: '<i class="fas fa-times"></i>',
        attributes: { "aria-label": "Close Window" }
      });
      cardHeader.appendChild(cardIcon);
      cardHeader.appendChild(cardTitle);
      cardHeader.appendChild(cardClose);

      const cardBody = createElement("div", { className: "mobile-switcher-card-preview" });
      const previewIcon = createElement("img", {
        className: "mobile-switcher-preview-icon",
        attributes: { src: resolveIconUrl(entry.iconValue || "static/icons/file.webp"), alt: "" }
      });
      cardBody.appendChild(previewIcon);
      card.appendChild(cardHeader);
      card.appendChild(cardBody);

      bindEvent(cardClose, "click", (event) => {
        event.stopPropagation();
        os?.window?.close?.(winId);
        card.remove();
        if (track.children.length === 0) renderCards();
      });

      bindEvent(card, "click", () => {
        close();
        os?.window?.focus?.(winId);
        const win = $(`#${winId}`);
        if (win && win.style.display === "none") win.style.display = "";
      });

      let startY = 0;
      let currentDistanceY = 0;
      bindEvent(card, "touchstart", (event) => {
        startY = event.touches[0].clientY;
        currentDistanceY = 0;
      }, { passive: true });

      bindEvent(card, "touchmove", (event) => {
        const clientY = event.touches[0].clientY;
        currentDistanceY = clientY - startY;
        if (currentDistanceY < 0) {
          card.style.transform = `translateY(${currentDistanceY}px)`;
          card.style.opacity = `${Math.max(0, 1 + currentDistanceY / 200)}`;
        }
      }, { passive: true });

      bindEvent(card, "touchend", () => {
        if (currentDistanceY < -75) {
          card.style.transition = "transform 0.2s ease, opacity 0.2s ease";
          card.style.transform = "translateY(-300px)";
          card.style.opacity = "0";
          setTimeout(() => {
            os?.window?.close?.(winId);
            card.remove();
            if (track.children.length === 0) renderCards();
          }, 200);
        } else {
          card.style.transform = "";
          card.style.opacity = "";
        }
      });

      track.appendChild(card);
    });
  };

  const open = () => {
    renderCards();
    toggleClass(switcher, "active", true);
  };

  bindEvent(clearBtn, "click", () => {
    os?.window?.closeAll?.();
    renderCards();
    close();
  });

  bindEvent(switcher, "click", (event) => {
    if (event.target === switcher || event.target === track) close();
  });

  return { element: switcher, open, close };
};
