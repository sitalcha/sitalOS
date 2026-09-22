import { createElement, setHTML, bindEvent, toggleClass } from "../../shared/domUtils.js";
import { APP_MANIFESTS } from "../../registry/AppManifest.js";
import { createAppItem } from "./commonMobileUI.js";

const SYSTEM_DRAWER_ITEMS = [
  {
    serviceKey: "modeSwitcherApp",
    title: "Switch OS Mode",
    description: "Switch desktop and mobile operating system modes",
    icon: "papirus:apps/utilities-tweak-tool",
    action: (os) => {
      if (os?.app?.launch) {
        os.app.launch("modeSwitcherApp");
      }
    }
  },
  {
    serviceKey: "lockScreen",
    title: "Lock Screen",
    description: "Lock device session and display lock screen",
    icon: "papirus:actions/object-locked",
    action: (os) => {
      if (os?.app?.lockSession) {
        os.app.lockSession();
      }
    }
  }
];

export const createAppDrawer = (os, extraItems = []) => {
  const drawer = createElement("div", { id: "mobile-app-drawer" });
  const handle = createElement("div", { className: "mobile-drawer-handle" });
  const searchBar = createElement("div", { className: "mobile-drawer-search-bar" });
  const searchIcon = createElement("i", { className: "fas fa-search" });
  const searchInput = createElement("input", {
    className: "mobile-drawer-search-input",
    attributes: { type: "search", placeholder: "Search installed apps..." }
  });
  const closeBtn = createElement("button", {
    className: "mobile-drawer-close-btn",
    html: '<i class="fas fa-times"></i>',
    attributes: { "aria-label": "Close" }
  });

  searchBar.appendChild(searchIcon);
  searchBar.appendChild(searchInput);
  searchBar.appendChild(closeBtn);

  const grid = createElement("div", { className: "mobile-drawer-grid" });
  drawer.appendChild(handle);
  drawer.appendChild(searchBar);
  drawer.appendChild(grid);

  const allApps = [
    ...SYSTEM_DRAWER_ITEMS,
    ...(Array.isArray(extraItems) ? extraItems : []),
    ...APP_MANIFESTS
  ];

  const filterApps = (query) => {
    setHTML(grid, "");
    const cleanQuery = query.toLowerCase().trim();
    const seenKeys = new Set();
    const matches = allApps.filter((app) => {
      if (!app || !app.title) return false;
      const dedupeKey = app.serviceKey || app.title;
      if (seenKeys.has(dedupeKey)) return false;
      seenKeys.add(dedupeKey);
      if (!cleanQuery) return true;
      const matchTitle = app.title.toLowerCase().includes(cleanQuery);
      const matchDesc = app.description && app.description.toLowerCase().includes(cleanQuery);
      return matchTitle || matchDesc;
    });

    matches.forEach((app) => {
      const item = createAppItem(app, () => {
        if (typeof app.action === "function") {
          app.action(os);
        } else {
          os?.app?.launch?.(app.serviceKey);
        }
        close();
      });
      grid.appendChild(item);
    });
  };

  const close = () => {
    toggleClass(drawer, "active", false);
    drawer.style.transform = "";
    searchInput.value = "";
    filterApps("");
  };

  const open = () => {
    toggleClass(drawer, "active", true);
    drawer.style.transform = "";
    searchInput.focus();
  };

  bindEvent(handle, "click", close);
  bindEvent(closeBtn, "click", close);

  let drawerTouchStartY = 0;
  let drawerTouchStartX = 0;
  let isSwipingDrawerDown = false;
  let drawerTouchDeltaY = 0;

  const attachDrawerDownSwipe = (targetElement) => {
    bindEvent(targetElement, "touchstart", (event) => {
      if (event.touches.length !== 1) return;
      drawerTouchStartY = event.touches[0].clientY;
      drawerTouchStartX = event.touches[0].clientX;
      drawerTouchDeltaY = 0;
      isSwipingDrawerDown = true;
    }, { passive: true });

    bindEvent(targetElement, "touchmove", (event) => {
      if (!isSwipingDrawerDown || event.touches.length !== 1) return;
      const currentY = event.touches[0].clientY;
      const currentX = event.touches[0].clientX;
      drawerTouchDeltaY = currentY - drawerTouchStartY;
      const deltaX = currentX - drawerTouchStartX;
      if (drawerTouchDeltaY > 0 && Math.abs(drawerTouchDeltaY) > Math.abs(deltaX)) {
        drawer.style.transition = "none";
        drawer.style.transform = `translateY(${drawerTouchDeltaY}px)`;
      }
    }, { passive: true });

    bindEvent(targetElement, "touchend", () => {
      if (!isSwipingDrawerDown) return;
      drawer.style.transition = "";
      if (drawerTouchDeltaY > 60) {
        close();
      } else {
        drawer.style.transform = "";
      }
      isSwipingDrawerDown = false;
      drawerTouchDeltaY = 0;
    });
  };

  attachDrawerDownSwipe(handle);
  attachDrawerDownSwipe(searchBar);

  filterApps("");
  bindEvent(searchInput, "input", () => filterApps(searchInput.value));

  return { element: drawer, open, close };
};
