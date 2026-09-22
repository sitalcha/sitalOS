import "./kaliMobile.css";
import { $, $$, createElement, setText, setHTML, bindEvent, toggleClass } from "../../shared/domUtils.js";
import { resolveIconUrl } from "../../shared/assetResolver.js";
import { APP_MANIFESTS } from "../../registry/AppManifest.js";
import { bus, BusEvents } from "../../core/EventBus.js";

const KALI_CATEGORIES = [
  "01 - Info Gathering",
  "02 - Vulnerability",
  "03 - Web Apps",
  "04 - Password Attacks",
  "05 - Wireless",
  "06 - Exploitation",
  "07 - Forensics",
  "08 - System"
];

const KALI_TOOLS_DATA = {
  "01 - Info Gathering": [
    { name: "Nmap", desc: "Network exploration and port scanner", icon: "fas fa-crosshairs", cmd: "nmap" },
    { name: "Whois", desc: "Domain and IP intelligence lookup", icon: "fas fa-search", cmd: "whois" },
    { name: "TheHarvester", desc: "E-mail and subdomain harvester", icon: "fas fa-envelope-open-text", cmd: "theHarvester" },
    { name: "Recon-ng", desc: "Web reconnaissance framework", icon: "fas fa-globe", cmd: "recon-ng" },
    { name: "Amass", desc: "Attack surface asset discovery", icon: "fas fa-radar", cmd: "amass" }
  ],
  "02 - Vulnerability": [
    { name: "Nikto", desc: "Web server vulnerability scanner", icon: "fas fa-shield-virus", cmd: "nikto" },
    { name: "OpenVAS", desc: "Vulnerability assessment manager", icon: "fas fa-file-medical-alt", cmd: "openvas" },
    { name: "Nuclei", desc: "Targeted template vulnerability scanner", icon: "fas fa-bolt", cmd: "nuclei" },
    { name: "Searchsploit", desc: "Offline exploit database archive", icon: "fas fa-database", cmd: "searchsploit" },
    { name: "Lynis", desc: "Security auditing and hardening", icon: "fas fa-check-double", cmd: "lynis" }
  ],
  "03 - Web Apps": [
    { name: "Burp Suite", desc: "Web application security test suite", icon: "fas fa-spider", cmd: "burpsuite" },
    { name: "SQLmap", desc: "Automatic SQL injection detector", icon: "fas fa-server", cmd: "sqlmap" },
    { name: "OWASP ZAP", desc: "Web attack interception proxy", icon: "fas fa-project-diagram", cmd: "zaproxy" },
    { name: "Gobuster", desc: "High-speed URL and DNS buster", icon: "fas fa-folder-tree", cmd: "gobuster" },
    { name: "Wfuzz", desc: "Web application fuzzer utility", icon: "fas fa-code", cmd: "wfuzz" }
  ],
  "04 - Password Attacks": [
    { name: "John the Ripper", desc: "Fast password hash cracker", icon: "fas fa-key", cmd: "john" },
    { name: "Hydra", desc: "Parallel network login brute-forcer", icon: "fas fa-unlock-alt", cmd: "hydra" },
    { name: "Hashcat", desc: "GPU accelerated rule-based cracker", icon: "fas fa-microchip", cmd: "hashcat" },
    { name: "Medusa", desc: "Modular login credential auditor", icon: "fas fa-user-lock", cmd: "medusa" },
    { name: "Ophcrack", desc: "Rainbow table password recovery", icon: "fas fa-table", cmd: "ophcrack" }
  ],
  "05 - Wireless": [
    { name: "Wi-Fi Scanner", desc: "Monitor mode airodump auditor", icon: "fas fa-wifi", cmd: "airodump-ng" },
    { name: "Aircrack-ng", desc: "802.11 WEP and WPA key recovery", icon: "fas fa-broadcast-tower", cmd: "aircrack-ng" },
    { name: "Wifite", desc: "Automated wireless network auditor", icon: "fas fa-satellite-dish", cmd: "wifite" },
    { name: "Kismet", desc: "Wireless sniffer and IDS engine", icon: "fas fa-wave-square", cmd: "kismet" },
    { name: "Reaver", desc: "Brute force WPS attacks", icon: "fas fa-plug", cmd: "reaver" }
  ],
  "06 - Exploitation": [
    { name: "Metasploit Console", desc: "Modular exploit execution suite", icon: "fas fa-skull-crossbones", cmd: "msfconsole" },
    { name: "ExploitDB", desc: "Curated exploit verification archive", icon: "fas fa-bug", cmd: "exploitdb" },
    { name: "MSFvenom", desc: "Payload generator and shell encoder", icon: "fas fa-vial", cmd: "msfvenom" },
    { name: "BeEF", desc: "Browser exploitation framework", icon: "fas fa-crosshairs", cmd: "beef" },
    { name: "Armitage", desc: "Graphical team offensive dashboard", icon: "fas fa-network-wired", cmd: "armitage" }
  ],
  "07 - Forensics": [
    { name: "Autopsy", desc: "Digital forensics evidence browser", icon: "fas fa-microscope", cmd: "autopsy" },
    { name: "Binwalk", desc: "Firmware extraction and analysis", icon: "fas fa-box-open", cmd: "binwalk" },
    { name: "Foremost", desc: "File carving based on data headers", icon: "fas fa-file-invoice", cmd: "foremost" },
    { name: "Volatility", desc: "RAM memory forensics framework", icon: "fas fa-memory", cmd: "volatility" },
    { name: "Sleuthkit", desc: "Volume and file system tools", icon: "fas fa-hdd", cmd: "tsk_recover" }
  ],
  "08 - System": [
    { name: "NetHunter Terminal", desc: "Interactive root kali console", icon: "fas fa-terminal", cmd: "nethunter" },
    { name: "Macchanger", desc: "Hardware MAC address spoofer", icon: "fas fa-random", cmd: "macchanger -r wlan0" },
    { name: "Tor Service", desc: "Onion proxy anonymity routing", icon: "fas fa-user-secret", cmd: "systemctl restart tor" },
    { name: "Chroot Manager", desc: "ARM64 container shell control", icon: "fas fa-cube", cmd: "bootkali" },
    { name: "System Monitor", desc: "Process and thread inspector", icon: "fas fa-chart-line", cmd: "htop" }
  ]
};

const QUICK_TOOLS = [
  { name: "Wi-Fi Scanner", sub: "Monitor mode", icon: "fas fa-wifi", cmd: "airodump-ng" },
  { name: "Packet Capture", sub: "tcpdump / raw", icon: "fas fa-network-wired", cmd: "tcpdump" },
  { name: "Network Mapper", sub: "Nmap port audit", icon: "fas fa-crosshairs", cmd: "nmap -sS -A" },
  { name: "Metasploit Console", sub: "msfconsole v6", icon: "fas fa-skull-crossbones", cmd: "msfconsole" },
  { name: "Hydra", sub: "Fast auth auditor", icon: "fas fa-unlock-alt", cmd: "hydra -l admin" },
  { name: "Burp Suite", sub: "Proxy scanner", icon: "fas fa-spider", cmd: "burpsuite" }
];

const INITIAL_LOG_ENTRIES = [
  "kernel: wlan0 entered promiscuous mode",
  "nethunter: HID attack interface initialized",
  "tor: socks proxy listening on 127.0.0.1:9050",
  "iptables: default drop policy active for input",
  "chroot: kali arm64 container healthy and ready"
];

const PERIODIC_LOG_CANDIDATES = [
  "airodump-ng: captured WPA2 handshake on ESSID [GuestNet]",
  "arp-scan: detected 12 active hosts on 192.168.1.0/24",
  "nmap: scan completed on target host with 4 open ports",
  "tor: refreshed circuit via guard relay node",
  "auditd: process memory verification completed cleanly"
];

export const createKaliMobile = (os) => {
  let rootElement = null;
  let statusBarElement = null;
  let homeElement = null;
  let dockElement = null;
  let drawerElement = null;
  let logsElement = null;
  let quickSettingsElement = null;
  let statsIntervalId = null;
  let windowObserver = null;
  let touchStartY = 0;
  let touchStartX = 0;
  let isSwipingUpFromBottom = false;

  const cyberState = {
    tor: false,
    macSpoof: true,
    vpn: true,
    wifi: true,
    bluetooth: false,
    performanceGov: true,
    brightness: 100
  };

  const logsList = [...INITIAL_LOG_ENTRIES];

  const formatClock24 = () => {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const launchToolInTerminal = (cmd) => {
    os.app.launch("terminalApp");
    if (os.app.executeCommand && cmd) {
      setTimeout(() => {
        os.app.executeCommand(cmd);
      }, 250);
    }
  };

  const adaptWindow = (winId, winElement) => {
    const win = winElement || $(`#${winId}`);
    if (!win) return;

    toggleClass(win, "kali-window-cyan-frame", true);

    let header = $(".kali-top-window-bar", win);
    if (!header) {
      header = createElement("div", { className: "kali-top-window-bar" });
      const backButton = createElement("button", {
        className: "kali-window-back-btn",
        text: "[<] Back",
        attributes: { "aria-label": "Back" }
      });

      const titleString = os.window.getTitle(win.id) || $(".window-title", win)?.textContent || "Terminal Process";
      const titleNode = createElement("div", {
        className: "kali-window-title-text",
        text: `[root@kali] ${titleString}`
      });

      const closeButton = createElement("button", {
        className: "kali-window-close-btn",
        text: "[X] Close",
        attributes: { "aria-label": "Close" }
      });

      header.appendChild(backButton);
      header.appendChild(titleNode);
      header.appendChild(closeButton);

      bindEvent(backButton, "click", (event) => {
        event.stopPropagation();
        os.window.minimize(win);
      });

      bindEvent(closeButton, "click", (event) => {
        event.stopPropagation();
        os.window.close(win);
      });

      win.prepend(header);
    }

    let homeBar = $(".mobile-home-indicator", win);
    if (!homeBar) {
      homeBar = createElement("div", { className: "mobile-home-indicator" });
      homeBar.style.background = "#00f0ff";
      homeBar.style.boxShadow = "0 0 8px #00f0ff";
      bindEvent(homeBar, "click", () => os.window.minimize(win));
      win.appendChild(homeBar);
    }
  };

  const createHackerStatusBar = () => {
    const bar = createElement("div", { className: "kali-hacker-status-bar" });

    const left = createElement("div", { className: "kali-status-left" });
    const prompt = createElement("span", { className: "kali-status-prompt", text: "root@kali" });
    const clock = createElement("span", { className: "kali-status-time", text: formatClock24() });
    left.appendChild(prompt);
    left.appendChild(clock);

    const center = createElement("div", { className: "kali-status-center" });
    const telemetry = createElement("div", { className: "kali-status-telemetry" });

    const cpuItem = createElement("div", { className: "kali-telemetry-item" });
    const cpuLabel = createElement("span", { className: "kali-telemetry-label", text: "CPU:" });
    const cpuVal = createElement("span", { className: "kali-telemetry-val", text: "21%" });
    cpuItem.appendChild(cpuLabel);
    cpuItem.appendChild(cpuVal);

    const ramItem = createElement("div", { className: "kali-telemetry-item" });
    const ramLabel = createElement("span", { className: "kali-telemetry-label", text: "RAM:" });
    const ramVal = createElement("span", { className: "kali-telemetry-val", text: "2.1GB" });
    ramItem.appendChild(ramLabel);
    ramItem.appendChild(ramVal);

    telemetry.appendChild(cpuItem);
    telemetry.appendChild(ramItem);
    center.appendChild(telemetry);

    const right = createElement("div", { className: "kali-status-right" });
    const net = createElement("span", { className: "kali-status-net", text: "wlan0: 192.168.1.105" });
    const batt = createElement("div", { className: "kali-status-batt" });
    const battVal = createElement("span", { text: "98%" });
    const battIcon = createElement("i", { className: "fas fa-battery-full" });
    batt.appendChild(battVal);
    batt.appendChild(battIcon);
    right.appendChild(net);
    right.appendChild(batt);

    bar.appendChild(left);
    bar.appendChild(center);
    bar.appendChild(right);

    bindEvent(left, "click", (event) => {
      event.stopPropagation();
      closeAllDrawersExcept(logsElement);
      renderLogs();
      toggleClass(logsElement, "open");
    });

    bindEvent(right, "click", (event) => {
      event.stopPropagation();
      closeAllDrawersExcept(quickSettingsElement);
      toggleClass(quickSettingsElement, "open");
    });

    return {
      element: bar,
      clock,
      cpuVal,
      ramVal,
      battVal,
      battIcon
    };
  };

  const createLogsDrawer = () => {
    const drawer = createElement("div", { className: "kali-logs-drawer" });

    const header = createElement("div", { className: "kali-logs-header" });
    const title = createElement("div", { className: "kali-logs-title" });
    title.innerHTML = '<i class="fas fa-terminal"></i><span>SECURITY AUDIT FEED</span>';
    const clearBtn = createElement("button", {
      className: "kali-logs-clear-btn",
      text: "[CLR]",
      attributes: { "aria-label": "Clear logs" }
    });
    header.appendChild(title);
    header.appendChild(clearBtn);

    const content = createElement("div", { className: "kali-logs-content" });
    drawer.appendChild(header);
    drawer.appendChild(content);

    bindEvent(clearBtn, "click", (event) => {
      event.stopPropagation();
      logsList.length = 0;
      renderLogs();
    });

    return {
      element: drawer,
      content
    };
  };

  const renderLogs = () => {
    if (!logsElement || !logsElement.content) return;
    setHTML(logsElement.content, "");
    if (logsList.length === 0) {
      const empty = createElement("div", {
        className: "kali-log-entry",
        text: "[*] Log stream empty. Ready for events."
      });
      logsElement.content.appendChild(empty);
      return;
    }

    logsList.slice(-20).forEach((entry) => {
      const line = createElement("div", { className: "kali-log-entry" });
      const ts = createElement("span", { className: "kali-log-ts", text: "[AUDIT]" });
      const msg = createElement("span", { text: entry });
      line.appendChild(ts);
      line.appendChild(msg);
      logsElement.content.appendChild(line);
    });
  };

  const createQuickSettingsDrawer = () => {
    const drawer = createElement("div", { className: "kali-qs-drawer" });

    const title = createElement("div", { className: "kali-qs-title" });
    title.innerHTML = '<span>NETHUNTER CYBER TOGGLES</span><i class="fas fa-shield-alt"></i>';
    drawer.appendChild(title);

    const grid = createElement("div", { className: "kali-qs-grid" });

    const createToggle = (name, iconClass, activeInit, onToggle) => {
      const tile = createElement("div", { className: `kali-qs-toggle ${activeInit ? "active" : ""}` });
      const topRow = createElement("div", { className: "kali-qs-toggle-top" });
      const nameEl = createElement("span", { className: "kali-qs-toggle-name", text: name });
      const iconEl = createElement("i", { className: `kali-qs-toggle-icon ${iconClass}` });
      topRow.appendChild(nameEl);
      topRow.appendChild(iconEl);

      const status = createElement("span", {
        className: "kali-qs-toggle-status",
        text: activeInit ? "ENABLED" : "DISABLED"
      });

      tile.appendChild(topRow);
      tile.appendChild(status);

      bindEvent(tile, "click", () => {
        const nextState = !tile.classList.contains("active");
        toggleClass(tile, "active", nextState);
        setText(status, nextState ? "ENABLED" : "DISABLED");
        onToggle(nextState);
      });

      return tile;
    };

    const torToggle = createToggle("Tor Onion", "fas fa-user-secret", cyberState.tor, (active) => {
      cyberState.tor = active;
      if (os.tor) {
        if (active) {
          os.tor.start().catch(() => {});
        } else {
          os.tor.stop().catch(() => {});
        }
      }
      logsList.push(`tor: anonymity circuit status changed to ${active ? "ACTIVE" : "STANDBY"}`);
    });

    const macToggle = createToggle("MAC Spoof", "fas fa-mask", cyberState.macSpoof, (active) => {
      cyberState.macSpoof = active;
      logsList.push(`macchanger: virtual interface spoofing set to ${active ? "ENABLED" : "DISABLED"}`);
    });

    const vpnToggle = createToggle("Cyber VPN", "fas fa-shield-virus", cyberState.vpn, (active) => {
      cyberState.vpn = active;
      logsList.push(`vpn: tun0 secure gateway set to ${active ? "CONNECTED" : "OFFLINE"}`);
    });

    const wifiToggle = createToggle("Wi-Fi Radio", "fas fa-wifi", cyberState.wifi, (active) => {
      cyberState.wifi = active;
    });

    const btToggle = createToggle("Bluetooth", "fab fa-bluetooth-b", cyberState.bluetooth, (active) => {
      cyberState.bluetooth = active;
    });

    const govToggle = createToggle("CPU Gov", "fas fa-tachometer-alt", cyberState.performanceGov, (active) => {
      cyberState.performanceGov = active;
      logsList.push(`governor: clock scaling switched to ${active ? "PERFORMANCE" : "POWERSAVE"}`);
    });

    grid.appendChild(torToggle);
    grid.appendChild(macToggle);
    grid.appendChild(vpnToggle);
    grid.appendChild(wifiToggle);
    grid.appendChild(btToggle);
    grid.appendChild(govToggle);

    drawer.appendChild(grid);

    const sliderBox = createElement("div", { className: "kali-qs-slider-wrap" });
    const sliderTop = createElement("div", { className: "kali-qs-slider-top" });
    sliderTop.innerHTML = '<span>DISPLAY BRIGHTNESS</span><i class="fas fa-sun"></i>';
    const sliderInput = createElement("input", {
      className: "kali-qs-slider-bar",
      attributes: { type: "range", min: "30", max: "100", value: "100", "aria-label": "Brightness" }
    });

    bindEvent(sliderInput, "input", () => {
      const val = Number(sliderInput.value) / 100;
      document.documentElement.style.filter = `brightness(${val})`;
    });

    sliderBox.appendChild(sliderTop);
    sliderBox.appendChild(sliderInput);
    drawer.appendChild(sliderBox);

    return drawer;
  };

  const createHomeScreen = (onOpenDrawer) => {
    const screen = createElement("div", { className: "kali-home-screen" });

    const terminalWidget = createElement("div", { className: "kali-terminal-widget" });
    const widgetHeader = createElement("div", { className: "kali-term-widget-header" });
    const widgetTitle = createElement("div", {
      className: "kali-term-widget-title",
      html: '<i class="fas fa-terminal"></i><span>root@kali:~# NetHunter Terminal</span>'
    });
    const widgetActions = createElement("div", { className: "kali-term-widget-actions" });
    const openTermBtn = createElement("button", {
      className: "kali-term-open-btn",
      text: "[Open Terminal]",
      attributes: { "aria-label": "Open Terminal" }
    });
    widgetActions.appendChild(openTermBtn);
    widgetHeader.appendChild(widgetTitle);
    widgetHeader.appendChild(widgetActions);

    const widgetBody = createElement("div", { className: "kali-term-widget-body" });
    widgetBody.innerHTML = '<div class="kali-term-line"><span class="kali-term-cyan">[+]</span><span class="kali-term-white">Kali NetHunter v2026.4 [arm64]</span></div><div class="kali-term-line"><span class="kali-term-cyan">[+]</span><span>Interface: wlan0 (MONITOR MODE READY)</span></div><div class="kali-term-line"><span class="kali-term-cyan">[+]</span><span>System: Linux kali 6.12.0-nethunter</span></div><div class="kali-term-line" style="margin-top:4px;"><span class="kali-term-cyan">root@kali:~#</span><span class="kali-term-cursor"></span></div>';

    terminalWidget.appendChild(widgetHeader);
    terminalWidget.appendChild(widgetBody);

    bindEvent(openTermBtn, "click", (event) => {
      event.stopPropagation();
      launchToolInTerminal();
    });

    bindEvent(widgetBody, "click", () => launchToolInTerminal());

    const toolsTitle = createElement("div", {
      className: "kali-section-title",
      html: '<i class="fas fa-crosshairs"></i><span>Quick Offensive Tools</span>'
    });

    const quickGrid = createElement("div", { className: "kali-quick-tools-grid" });
    QUICK_TOOLS.forEach((tool) => {
      const card = createElement("div", { className: "kali-quick-tool-card" });
      const iconNode = createElement("i", { className: `kali-quick-tool-icon ${tool.icon}` });
      const infoNode = createElement("div", { className: "kali-quick-tool-info" });
      const nameNode = createElement("span", { className: "kali-quick-tool-name", text: tool.name });
      const subNode = createElement("span", { className: "kali-quick-tool-sub", text: tool.sub });
      infoNode.appendChild(nameNode);
      infoNode.appendChild(subNode);

      card.appendChild(iconNode);
      card.appendChild(infoNode);

      bindEvent(card, "click", () => {
        launchToolInTerminal(tool.cmd);
      });

      quickGrid.appendChild(card);
    });

    const appsTitle = createElement("div", {
      className: "kali-section-title",
      html: '<i class="fas fa-boxes"></i><span>Installed Systems</span>'
    });

    const appsGrid = createElement("div", { className: "kali-apps-container" });
    const candidateApps = APP_MANIFESTS.filter((app) => app && app.title && app.serviceKey);
    candidateApps.slice(0, 12).forEach((app) => {
      const appCard = createElement("button", { className: "kali-app-card" });
      const appIcon = createElement("img", {
        className: "kali-app-icon",
        attributes: { src: resolveIconUrl(app.icon || "static/icons/file.webp"), alt: "" }
      });
      const appTitle = createElement("span", { className: "kali-app-title", text: app.title });
      appCard.appendChild(appIcon);
      appCard.appendChild(appTitle);

      bindEvent(appCard, "click", () => {
        os.app.launch(app.serviceKey);
      });

      appsGrid.appendChild(appCard);
    });

    screen.appendChild(terminalWidget);
    screen.appendChild(toolsTitle);
    screen.appendChild(quickGrid);
    screen.appendChild(appsTitle);
    screen.appendChild(appsGrid);

    return screen;
  };

  const createToolsDrawer = () => {
    const drawer = createElement("div", { className: "kali-tools-drawer" });

    const handleBar = createElement("div", { className: "kali-drawer-handle-bar" });
    const pill = createElement("div", { className: "kali-drawer-drag-pill" });
    const closeBtn = createElement("button", {
      className: "kali-drawer-close-btn",
      html: '<i class="fas fa-times"></i>',
      attributes: { "aria-label": "Close" }
    });
    handleBar.appendChild(pill);
    handleBar.appendChild(closeBtn);

    const searchBar = createElement("div", { className: "kali-drawer-search-bar" });
    const prompt = createElement("span", { className: "kali-drawer-search-prompt", text: "root@kali:~# search_" });
    const searchInput = createElement("input", {
      className: "kali-drawer-search-input",
      attributes: { type: "text", placeholder: "filter arsenal..." }
    });
    searchBar.appendChild(prompt);
    searchBar.appendChild(searchInput);

    const tabsBar = createElement("div", { className: "kali-category-tabs-bar" });
    const toolsList = createElement("div", { className: "kali-category-tools-list" });

    drawer.appendChild(handleBar);
    drawer.appendChild(searchBar);
    drawer.appendChild(tabsBar);
    drawer.appendChild(toolsList);

    let activeCategory = KALI_CATEGORIES[0];

    const renderTools = (filterQuery = "") => {
      setHTML(toolsList, "");
      const query = filterQuery.toLowerCase().trim();

      let toolsToShow = [];
      if (query) {
        Object.values(KALI_TOOLS_DATA).forEach((categoryList) => {
          categoryList.forEach((tool) => {
            if (tool.name.toLowerCase().includes(query) || tool.desc.toLowerCase().includes(query) || tool.cmd.toLowerCase().includes(query)) {
              if (!toolsToShow.some((existing) => existing.name === tool.name)) {
                toolsToShow.push(tool);
              }
            }
          });
        });
      } else {
        toolsToShow = KALI_TOOLS_DATA[activeCategory] || [];
      }

      if (toolsToShow.length === 0) {
        const noTools = createElement("div", {
          className: "kali-log-entry",
          text: `[*] No cyber utilities match "${query}".`
        });
        toolsList.appendChild(noTools);
        return;
      }

      toolsToShow.forEach((tool) => {
        const card = createElement("div", { className: "kali-tool-entry-card" });
        const left = createElement("div", { className: "kali-tool-entry-left" });
        const icon = createElement("i", { className: `kali-tool-entry-icon ${tool.icon}` });
        const meta = createElement("div", { className: "kali-tool-entry-meta" });
        const name = createElement("span", { className: "kali-tool-entry-name", text: tool.name });
        const desc = createElement("span", { className: "kali-tool-entry-desc", text: tool.desc });
        meta.appendChild(name);
        meta.appendChild(desc);
        left.appendChild(icon);
        left.appendChild(meta);

        const cmdBadge = createElement("span", { className: "kali-tool-entry-cmd", text: tool.cmd });

        card.appendChild(left);
        card.appendChild(cmdBadge);

        bindEvent(card, "click", () => {
          close();
          launchToolInTerminal(tool.cmd);
        });

        toolsList.appendChild(card);
      });
    };

    KALI_CATEGORIES.forEach((cat) => {
      const tabBtn = createElement("button", {
        className: `kali-category-tab-btn ${cat === activeCategory ? "active" : ""}`,
        text: cat
      });
      bindEvent(tabBtn, "click", () => {
        activeCategory = cat;
        $$(".kali-category-tab-btn", tabsBar).forEach((btn) => {
          toggleClass(btn, "active", btn === tabBtn);
        });
        searchInput.value = "";
        renderTools();
      });
      tabsBar.appendChild(tabBtn);
    });

    bindEvent(searchInput, "input", () => {
      renderTools(searchInput.value);
    });

    const open = () => {
      searchInput.value = "";
      renderTools();
      toggleClass(drawer, "open", true);
      searchInput.focus();
    };

    const close = () => {
      toggleClass(drawer, "open", false);
      searchInput.value = "";
    };

    bindEvent(closeBtn, "click", close);

    return {
      element: drawer,
      open,
      close,
      toggle: () => {
        if (drawer.classList.contains("open")) {
          close();
        } else {
          open();
        }
      }
    };
  };

  const createBottomDock = (onOpenDrawer) => {
    const dock = createElement("div", { className: "kali-bottom-dock" });

    const createDockItem = (appKey, defaultIcon, defaultTitle) => {
      const btn = createElement("button", {
        className: "kali-dock-btn",
        attributes: { "aria-label": defaultTitle }
      });
      const app = APP_MANIFESTS.find((item) => item.serviceKey === appKey);
      if (app && app.icon) {
        const img = createElement("img", {
          className: "kali-dock-icon",
          attributes: { src: resolveIconUrl(app.icon), alt: defaultTitle }
        });
        btn.appendChild(img);
      } else {
        btn.innerHTML = `<i class="${defaultIcon}"></i>`;
      }

      bindEvent(btn, "click", () => {
        os.app.launch(appKey);
      });
      return btn;
    };

    const filesBtn = createDockItem("explorerApp", "fas fa-folder", "Files");
    const browserBtn = createDockItem("browserApp", "fas fa-globe", "Browser");

    const heroTerminalBtn = createElement("button", {
      className: "kali-dock-btn kali-dock-hero-btn",
      html: '<i class="fas fa-terminal"></i>',
      attributes: { "aria-label": "Hero Terminal" }
    });
    bindEvent(heroTerminalBtn, "click", () => launchToolInTerminal());

    const settingsBtn = createDockItem("settingsApp", "fas fa-cog", "Settings");

    const arsenalBtn = createElement("button", {
      className: "kali-dock-btn",
      html: '<i class="fas fa-dragon"></i>',
      attributes: { "aria-label": "NetHunter Tools" }
    });
    bindEvent(arsenalBtn, "click", onOpenDrawer);

    dock.appendChild(filesBtn);
    dock.appendChild(browserBtn);
    dock.appendChild(heroTerminalBtn);
    dock.appendChild(settingsBtn);
    dock.appendChild(arsenalBtn);

    return dock;
  };

  const closeAllDrawersExcept = (target) => {
    if (drawerElement && drawerElement.element !== target) {
      drawerElement.close();
    }
    if (logsElement && logsElement.element !== target) {
      toggleClass(logsElement.element, "open", false);
    }
    if (quickSettingsElement && quickSettingsElement !== target) {
      toggleClass(quickSettingsElement, "open", false);
    }
  };

  const handleGlobalTouchStart = (event) => {
    if (event.touches.length !== 1) return;
    touchStartY = event.touches[0].clientY;
    touchStartX = event.touches[0].clientX;
    const isNearBottom = touchStartY >= window.innerHeight - 70;
    isSwipingUpFromBottom = isNearBottom;
  };

  const handleGlobalTouchEnd = (event) => {
    if (event.changedTouches.length !== 1) return;
    const endY = event.changedTouches[0].clientY;
    const endX = event.changedTouches[0].clientX;
    const deltaY = endY - touchStartY;
    const deltaX = endX - touchStartX;

    if (isSwipingUpFromBottom && deltaY < -60 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (drawerElement) drawerElement.open();
      isSwipingUpFromBottom = false;
      return;
    }

    if (touchStartY < 50 && deltaY > 70 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (touchStartX < window.innerWidth / 2) {
        closeAllDrawersExcept(logsElement.element);
        renderLogs();
        toggleClass(logsElement.element, "open", true);
      } else {
        closeAllDrawersExcept(quickSettingsElement);
        toggleClass(quickSettingsElement, "open", true);
      }
    }
    isSwipingUpFromBottom = false;
  };

  const handleOutsideClick = (event) => {
    if (logsElement && logsElement.element.classList.contains("open")) {
      if (!logsElement.element.contains(event.target) && !statusBarElement.contains(event.target)) {
        toggleClass(logsElement.element, "open", false);
      }
    }
    if (quickSettingsElement && quickSettingsElement.classList.contains("open")) {
      if (!quickSettingsElement.contains(event.target) && !statusBarElement.contains(event.target)) {
        toggleClass(quickSettingsElement, "open", false);
      }
    }
  };

  const mount = () => {
    if ($("#kali-mobile-root")) return;

    rootElement = createElement("div", { id: "kali-mobile-root", className: "kali-mobile-root" });

    const statusBarData = createHackerStatusBar();
    statusBarElement = statusBarData.element;

    logsElement = createLogsDrawer();
    quickSettingsElement = createQuickSettingsDrawer();

    drawerElement = createToolsDrawer();
    homeElement = createHomeScreen(() => drawerElement.open());
    dockElement = createBottomDock(() => drawerElement.open());

    rootElement.appendChild(statusBarElement);
    rootElement.appendChild(homeElement);
    rootElement.appendChild(dockElement);
    rootElement.appendChild(drawerElement.element);
    rootElement.appendChild(logsElement.element);
    rootElement.appendChild(quickSettingsElement);

    document.body.appendChild(rootElement);

    statsIntervalId = setInterval(() => {
      setText(statusBarData.clock, formatClock24());
      const randomCpu = Math.floor(14 + Math.random() * 15);
      setText(statusBarData.cpuVal, `${randomCpu}%`);

      const randomRam = (1.8 + Math.random() * 0.5).toFixed(1);
      setText(statusBarData.ramVal, `${randomRam}GB`);

      if (Math.random() < 0.25) {
        const nextLog = PERIODIC_LOG_CANDIDATES[Math.floor(Math.random() * PERIODIC_LOG_CANDIDATES.length)];
        logsList.push(nextLog);
        renderLogs();
      }
    }, 2000);

    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        const updateBatt = () => {
          const percent = Math.round(battery.level * 100);
          setText(statusBarData.battVal, `${percent}%`);
        };
        updateBatt();
        bindEvent(battery, "levelchange", updateBatt);
      }).catch(() => {});
    }

    const openWins = os.window.getOpenWindows ? os.window.getOpenWindows() : null;
    if (openWins) {
      openWins.forEach((record, winId) => {
        adaptWindow(winId, null);
      });
    }

    windowObserver = new MutationObserver(() => {
      $$(".window").forEach((win) => adaptWindow(win.id, win));
    });
    windowObserver.observe($("#desktop") || document.body, { childList: true, subtree: true });

    bindEvent(document, "touchstart", handleGlobalTouchStart, { passive: true });
    bindEvent(document, "touchend", handleGlobalTouchEnd, { passive: true });
    bindEvent(document, "click", handleOutsideClick);

    bus.on(BusEvents.WINDOW_CREATED, ({ winId, win }) => adaptWindow(winId, win));
  };

  const unmount = () => {
    if (statsIntervalId) {
      clearInterval(statsIntervalId);
      statsIntervalId = null;
    }
    if (windowObserver) {
      windowObserver.disconnect();
      windowObserver = null;
    }

    document.removeEventListener("touchstart", handleGlobalTouchStart);
    document.removeEventListener("touchend", handleGlobalTouchEnd);
    document.removeEventListener("click", handleOutsideClick);

    if (rootElement) {
      rootElement.remove();
      rootElement = null;
    }

    $$(".kali-top-window-bar").forEach((el) => el.remove());
    $$(".kali-window-cyan-frame").forEach((win) => {
      toggleClass(win, "kali-window-cyan-frame", false);
    });
  };

  const refresh = () => {
    renderLogs();
  };

  return {
    mount,
    unmount,
    refresh
  };
};
