import { os, ServiceKeys } from "../../framework.js";
import { BusEvents } from "../../core/EventBus.js";
import { createElement, $, setText } from "../../shared/domUtils.js";
import { resolveIconUrl, resolvePapirusUrl } from "../../shared/assetResolver.js";
import { getEffectiveIcon } from "../../shared/iconPack.js";

const PINNED_APPS = [
  { appId: "terminalApp", title: "Terminal", icon: "static/icons/terminal.webp" },
  { appId: "explorerApp", title: "Files", icon: "static/icons/file.webp" },
  { appId: "browserApp", title: "Browser", icon: "static/icons/firefox.webp" },
  { appId: "monacoApp", title: "Code", icon: "static/icons/monaco.webp" },
  { appId: "settingsApp", title: "Settings", icon: "papirus:actions/configure" }
];

const KALI_CATEGORIES = [
  "Favorites",
  "01 - Information Gathering",
  "02 - Vulnerability Analysis",
  "03 - Web Application Analysis",
  "04 - Database Assessment",
  "05 - Password Attacks",
  "06 - Wireless Attacks",
  "07 - Reverse Engineering",
  "08 - Exploitation Tools",
  "09 - Sniffing & Spoofing",
  "10 - Post Exploitation",
  "11 - Forensics",
  "12 - System Tools"
];

const KALI_TOOLS = [
  {
    id: "nmap",
    name: "Nmap",
    subtitle: "Network exploration and port scanner",
    categories: ["Favorites", "01 - Information Gathering", "02 - Vulnerability Analysis"],
    icon: "papirus:apps/nmap",
    fallbackIcon: "fas fa-network-wired",
    cmd: "nmap"
  },
  {
    id: "nikto",
    name: "Nikto",
    subtitle: "Web vulnerability scanner",
    categories: ["02 - Vulnerability Analysis", "03 - Web Application Analysis"],
    icon: "papirus:apps/nikto",
    fallbackIcon: "fas fa-shield-virus",
    cmd: "nikto"
  },
  {
    id: "burpsuite",
    name: "Burp Suite",
    subtitle: "Web application security testing",
    categories: ["Favorites", "03 - Web Application Analysis"],
    icon: "papirus:apps/burp-suite",
    fallbackIcon: "fas fa-spider",
    cmd: "burpsuite"
  },
  {
    id: "sqlmap",
    name: "SQLMap",
    subtitle: "Automatic SQL injection tool",
    categories: ["03 - Web Application Analysis", "04 - Database Assessment", "08 - Exploitation Tools"],
    icon: "papirus:apps/sqlmap",
    fallbackIcon: "fas fa-database",
    cmd: "sqlmap"
  },
  {
    id: "john",
    name: "John the Ripper",
    subtitle: "Password cracker",
    categories: ["05 - Password Attacks"],
    icon: "papirus:apps/john",
    fallbackIcon: "fas fa-key",
    cmd: "john"
  },
  {
    id: "hydra",
    name: "Hydra",
    subtitle: "Network login cracker",
    categories: ["05 - Password Attacks"],
    icon: "papirus:apps/hydra",
    fallbackIcon: "fas fa-unlock-alt",
    cmd: "hydra"
  },
  {
    id: "aircrack",
    name: "Aircrack-ng",
    subtitle: "WiFi security assessment suite",
    categories: ["06 - Wireless Attacks"],
    icon: "papirus:apps/aircrack-ng",
    fallbackIcon: "fas fa-wifi",
    cmd: "aircrack-ng"
  },
  {
    id: "ghidra",
    name: "Ghidra",
    subtitle: "Software reverse engineering suite",
    categories: ["07 - Reverse Engineering", "11 - Forensics"],
    icon: "papirus:apps/ghidra",
    fallbackIcon: "fas fa-microchip",
    cmd: "ghidra"
  },
  {
    id: "metasploit",
    name: "Metasploit Framework",
    subtitle: "Penetration testing platform",
    categories: ["Favorites", "08 - Exploitation Tools", "10 - Post Exploitation"],
    icon: "papirus:apps/metasploit",
    fallbackIcon: "fas fa-skull",
    cmd: "msfconsole"
  },
  {
    id: "wireshark",
    name: "Wireshark",
    subtitle: "Network traffic protocol analyzer",
    categories: ["Favorites", "01 - Information Gathering", "09 - Sniffing & Spoofing", "11 - Forensics"],
    icon: "papirus:apps/wireshark",
    fallbackIcon: "fas fa-water",
    cmd: "wireshark"
  },
  {
    id: "terminal",
    name: "Terminal",
    subtitle: "Kali command line interface",
    categories: ["Favorites", "12 - System Tools"],
    icon: "static/icons/terminal.webp",
    fallbackIcon: "fas fa-terminal",
    appId: "terminalApp"
  },
  {
    id: "files",
    name: "File Manager",
    subtitle: "Files and directories",
    categories: ["Favorites", "12 - System Tools"],
    icon: "static/icons/file.webp",
    fallbackIcon: "fas fa-folder",
    appId: "explorerApp"
  },
  {
    id: "browser",
    name: "Web Browser",
    subtitle: "Firefox web browser",
    categories: ["Favorites", "12 - System Tools"],
    icon: "static/icons/firefox.webp",
    fallbackIcon: "fas fa-globe",
    appId: "browserApp"
  },
  {
    id: "code",
    name: "Code Editor",
    subtitle: "Monaco code and script editor",
    categories: ["Favorites", "12 - System Tools"],
    icon: "static/icons/monaco.webp",
    fallbackIcon: "fas fa-code",
    appId: "monacoApp"
  },
  {
    id: "taskmanager",
    name: "Task Manager",
    subtitle: "System activity and process monitor",
    categories: ["12 - System Tools"],
    icon: "papirus:apps/gnome-system-monitor",
    fallbackIcon: "fas fa-tasks",
    appId: "taskManagerApp"
  },
  {
    id: "settings",
    name: "Settings",
    subtitle: "Kali Linux system settings",
    categories: ["12 - System Tools"],
    icon: "papirus:actions/configure",
    fallbackIcon: "fas fa-cog",
    appId: "settingsApp"
  }
];

const TOOL_BANNERS = {
  nmap: "Starting Nmap 7.94 ( https://nmap.org ) at 2026-09-21\nNmap scan report for localhost (127.0.0.1)\nHost is up (0.00012s latency).\nPORT     STATE SERVICE\n21/tcp   open  ftp\n22/tcp   open  ssh\n80/tcp   open  http\n443/tcp  open  https\n8080/tcp open  http-proxy\n\nNmap done: 1 IP address (1 host up) scanned in 0.42 seconds",
  nikto: "- Nikto v2.5.0\n+ Target IP:          127.0.0.1\n+ Target Hostname:    localhost\n+ Target Port:        80\n+ Server: Apache/2.4.58 (Kali Linux) OpenSSL/3.1.4\n+ The anti-clickjacking X-Frame-Options header is not present.\n+ The X-Content-Type-Options header is not set.\n+ Root page / redirects to /index.html\n+ 1 host(s) tested",
  burpsuite: "Burp Suite Community Edition v2024.2.1\n[+] Proxy service started on 127.0.0.1:8080\n[+] Intercept: ON\n[+] Target Scope: http://* https://*\n[+] Spider and Scanner engine initialized\n[+] Ready for traffic interception",
  sqlmap: "        ___\n       __H__\n ___ ___[,]_____ ___ ___  {1.8#stable}\n|_ -| . [,]     | .'| . |\n|___|_  [\"]_|_|_|__,|  _|\n      |_|[...]      |_|   https://sqlmap.org\n\n[*] starting @ 23:22:00\n[INFO] testing connection to the target URL\n[INFO] checking if the target is protected by WAF/IPS\n[INFO] testing if the target URL content is stable\n[INFO] target URL content is stable\n[INFO] testing if GET parameter 'id' is dynamic\n[INFO] GET parameter 'id' appears to be dynamic",
  john: "John the Ripper 1.9.0-jumbo-1 OMP [linux-gnu 64-bit x86_64 AVX2 AC]\nLoaded 1 password hash (bcrypt [Blowfish 32/64 X3])\nCost 1 (iteration count) is 1024 for all loaded hashes\nWill run 8 OpenMP threads\nPress 'q' or Ctrl-C to abort\npassword123      (admin)\n1g 0:00:00:01 DONE 2/3 0.8849g/s 452.2p/s 452.2c/s 452.2C/s\nSession completed",
  hydra: "Hydra v9.5 (c) 2023 by van Hauser / THC & David Maciejak\n[DATA] max 16 tasks per 1 server, overall 16 tasks, 64 login tries\n[DATA] attacking ssh://127.0.0.1:22/\n[22][ssh] host: 127.0.0.1   login: root   password: toor\n[STATUS] attack finished for 127.0.0.1 (valid pair found)\n1 of 1 target successfully completed, 1 valid password found",
  "aircrack-ng": "                                 Aircrack-ng 1.7\n                  [00:00:03] Tested 42100 keys (got 14033.33 k/s)\n   KB    depth        byte(not q)\n    0    0/  1  (  0) 0F 12 A3 4D 5E 6F 70 81 92 B3 C4 D5 E6 F7 08 19\n    1    0/  1  (  0) 2A 3B 4C 5D 6E 7F 80 91 A2 B3 C4 D5 E6 F7 08 19\n                     KEY FOUND! [ KALI-WIFI-PASS-2024 ]\n      Decrypted correctly: 100%",
  ghidra: "========================================================================\n             GHIDRA Software Reverse Engineering Framework\n             National Security Agency - Cybersecurity Division\n========================================================================\n[+] Headless Analyzer initialized\n[+] Architecture: x86:LE:64:default\n[+] Disassembling entry point at 0x00401000\n[+] Decompiling function 'main' (AST generated)\n[+] 14 functions analyzed, 0 warnings",
  msfconsole: "       =[ metasploit v6.3.55-dev                          ]\n+ -- --=[ 2394 exploits - 1234 auxiliary - 418 post       ]\n+ -- --=[ 964 payloads - 46 encoders - 11 nops            ]\n+ -- --=[ 9 evasion                                       ]\n\nmsf6 > search type:exploit platform:linux\nMatching Modules\n================\n   #  Name                                 Disclosure Date  Rank    Check  Description\n   0  exploit/linux/local/cve_2024_dirty   2024-03-12       great   Yes    Linux Kernel Local Privilege Escalation\n   1  exploit/multi/http/apache_activemq   2023-10-25       excellent Yes  Apache ActiveMQ Remote Code Execution",
  wireshark: "Wireshark 4.2.3 (Git v4.2.3 packaged as 4.2.3-1)\nCapturing on 'eth0'\n  1 0.000000 192.168.1.105 -> 1.1.1.1 DNS Standard query 0xa1b2 A kali.org\n  2 0.014210 1.1.1.1 -> 192.168.1.105 DNS Standard query response 0xa1b2 A 192.0.78.24\n  3 0.014890 192.168.1.105 -> 192.0.78.24 TCP 58214 -> 443 [SYN] Seq=0 Win=64240\n  4 0.028910 192.0.78.24 -> 192.168.1.105 TCP 443 -> 58214 [SYN, ACK] Seq=0 Ack=1\n  5 0.029012 192.168.1.105 -> 192.0.78.24 TCP 58214 -> 443 [ACK] Seq=1 Ack=1\n5 packets captured"
};

const SHELL_STYLES = `
#kali-whisker-menu {
  position: fixed;
  top: 38px;
  left: 10px;
  width: 620px;
  max-width: calc(100vw - 20px);
  height: 520px;
  max-height: calc(100vh - 50px);
  background: rgba(13, 17, 23, 0.96);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 229, 255, 0.15);
  z-index: 9999;
  display: none;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  font-family: var(--font-sans, "JetBrains Mono", system-ui, sans-serif);
  color: #e6edf3;
  animation: kaliWhiskerFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
#kali-whisker-menu.open {
  display: flex;
}
@keyframes kaliWhiskerFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.whisker-search-bar {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.18);
  background: rgba(22, 27, 34, 0.7);
  display: flex;
  align-items: center;
  gap: 10px;
}
.whisker-search-bar i {
  color: #00e5ff;
  font-size: 14px;
}
.whisker-search-input {
  flex: 1;
  background: rgba(13, 17, 23, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 6px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  transition: all 0.15s ease;
}
.whisker-search-input:focus {
  border-color: #00e5ff;
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.3);
}
.whisker-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.whisker-categories {
  width: 230px;
  border-right: 1px solid rgba(0, 229, 255, 0.15);
  overflow-y: auto;
  padding: 8px 6px;
  background: rgba(13, 17, 23, 0.4);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.whisker-category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: #8b949e;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.12s ease;
  outline: none;
}
.whisker-category-btn:hover {
  color: #e6edf3;
  background: rgba(0, 229, 255, 0.08);
}
.whisker-category-btn.active {
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.16);
  border-color: rgba(0, 229, 255, 0.3);
  font-weight: 600;
}
.whisker-tools {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.whisker-tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: rgba(22, 27, 34, 0.5);
  color: #c9d1d9;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
  text-align: left;
}
.whisker-tool-item:hover {
  background: rgba(0, 229, 255, 0.12);
  border-color: rgba(0, 229, 255, 0.3);
  color: #ffffff;
  transform: translateX(3px);
}
.whisker-tool-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #00e5ff;
  flex-shrink: 0;
}
.whisker-tool-icon img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}
.whisker-tool-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.whisker-tool-name {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.whisker-tool-desc {
  font-size: 11px;
  color: #8b949e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.whisker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-top: 1px solid rgba(0, 229, 255, 0.18);
  background: rgba(22, 27, 34, 0.75);
}
.whisker-user {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #00e5ff;
  font-family: monospace;
}
.whisker-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.whisker-action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #c9d1d9;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
  font-size: 12px;
}
.whisker-action-btn:hover {
  background: rgba(0, 229, 255, 0.2);
  border-color: #00e5ff;
  color: #ffffff;
}
.whisker-action-btn.whisker-power-btn:hover {
  background: rgba(255, 77, 109, 0.25);
  border-color: #ff4d6d;
  color: #ff4d6d;
}
.kali-ws-switcher {
  display: flex;
  align-items: center;
  gap: 3px;
  margin: 0 4px;
}
.kali-ws-pill {
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  background: rgba(22, 27, 34, 0.6);
  color: #8b949e;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
}
.kali-ws-pill:hover {
  color: #ffffff;
  border-color: rgba(0, 229, 255, 0.4);
}
.kali-ws-pill.active {
  background: #00e5ff;
  color: #0d1117;
  border-color: #00e5ff;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
}
.kali-panel-tasks {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  overflow-x: auto;
  max-width: 480px;
}
.kali-panel-task-tab {
  height: 26px;
  min-width: 90px;
  max-width: 160px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 6px 0 8px;
  background: rgba(22, 27, 34, 0.7);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 4px;
  color: #c9d1d9;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
  font-size: 11px;
  font-weight: 500;
}
.kali-panel-task-tab:hover {
  background: rgba(0, 229, 255, 0.12);
  border-color: rgba(0, 229, 255, 0.35);
  color: #ffffff;
}
.kali-panel-task-tab.active {
  background: rgba(0, 229, 255, 0.18);
  border-color: #00e5ff;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.2);
}
.kali-panel-task-tab.minimized {
  opacity: 0.6;
}
.kali-tab-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}
.kali-tab-close {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #8b949e;
  border-radius: 3px;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: all 0.12s ease;
}
.kali-tab-close:hover {
  background: rgba(255, 77, 109, 0.3);
  color: #ff4d6d;
}
.kali-telemetry {
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: #00e5ff;
  letter-spacing: 0.3px;
  font-family: monospace;
  cursor: default;
}
.kali-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  height: 22px;
  border-radius: 11px;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.25);
  font-size: 11px;
  font-weight: 600;
  color: #00e5ff;
  cursor: default;
}
.kali-tray-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.kali-battery-text {
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
}
`;

function createIconNode(iconValue, defaultClass = "fas fa-window-maximize") {
  if (!iconValue) {
    return createElement("i", { className: defaultClass });
  }
  if (typeof iconValue === "string" && (iconValue.startsWith("fa-") || iconValue.startsWith("fas ") || iconValue.startsWith("fab ") || iconValue.startsWith("far "))) {
    return createElement("i", { className: iconValue });
  }
  const effective = getEffectiveIcon(iconValue);
  if (typeof effective === "string" && (effective.startsWith("fa-") || effective.startsWith("fas ") || effective.startsWith("fab ") || effective.startsWith("far "))) {
    return createElement("i", { className: effective });
  }
  const resolved = resolveIconUrl(effective || iconValue);
  if (typeof resolved === "string" && (resolved.startsWith("http") || resolved.startsWith("/") || resolved.startsWith("data:") || resolved.startsWith("static/"))) {
    const img = createElement("img", {
      className: "kali-app-icon",
      attributes: { src: resolved, alt: "" }
    });
    img.onerror = () => {
      const fallback = createElement("i", { className: defaultClass });
      img.replaceWith(fallback);
    };
    return img;
  }
  return createElement("i", { className: defaultClass });
}

export class KaliShell {
  constructor() {
    this.topPanel = null;
    this.dock = null;
    this.whiskerMenu = null;
    this.styleElement = null;
    this.wm = null;
    this.workspaceContainer = null;
    this.tasksContainer = null;
    this.telemetryElement = null;
    this.clockElement = null;
    this.searchInput = null;
    this.categoriesContainer = null;
    this.toolsContainer = null;
    this.selectedCategory = "Favorites";
    this.searchQuery = "";
    this.clockInterval = null;
    this.telemetryInterval = null;
    this.boundRenderTasks = null;
    this.boundRenderWorkspaces = null;
    this.boundDocClick = null;
    this.boundDocKeydown = null;
  }

  init(wm) {
    this.wm = wm;
    this.injectStyles();
    if (!this.topPanel) {
      this.createTopPanel();
    }
    if (!this.dock) {
      this.createDock();
    }
    if (!this.whiskerMenu) {
      this.createWhiskerMenu();
    }
    this.startClock();
    this.startTelemetry();
    this.attachEventListeners();
    this.renderWorkspaces();
    this.renderTasks();
  }

  injectStyles() {
    if (this.styleElement || $("#kali-shell-style")) return;
    this.styleElement = createElement("style", {
      id: "kali-shell-style"
    });
    setText(this.styleElement, SHELL_STYLES);
    document.head.appendChild(this.styleElement);
  }

  createTopPanel() {
    this.topPanel = createElement("div", { id: "kali-top-panel" });

    const leftSection = createElement("div", { className: "kali-panel-left" });

    const appsBtn = createElement("button", {
      className: "kali-panel-btn kali-apps-btn",
      attributes: { id: "kali-apps-menu-btn", title: "Applications Menu" }
    });
    const logoUrl = resolvePapirusUrl("apps/distributor-logo-kali-linux", 22) || "https://cdn.jsdelivr.net/gh/PapirusDevelopmentTeam/papirus-icon-theme@master/Papirus/22x22/apps/distributor-logo-kali-linux.svg";
    const logoImg = createElement("img", {
      className: "kali-panel-icon",
      attributes: {
        src: logoUrl,
        alt: "Kali"
      }
    });
    const appsText = createElement("span");
    setText(appsText, "Applications");
    appsBtn.appendChild(logoImg);
    appsBtn.appendChild(appsText);
    appsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleWhiskerMenu();
    });
    leftSection.appendChild(appsBtn);

    this.workspaceContainer = createElement("div", { className: "kali-ws-switcher" });
    leftSection.appendChild(this.workspaceContainer);

    const dividerLaunchers = createElement("div", { className: "kali-panel-divider" });
    leftSection.appendChild(dividerLaunchers);

    const terminalBtn = createElement("button", {
      className: "kali-panel-btn kali-quick-btn",
      attributes: { title: "Kali Terminal" }
    });
    terminalBtn.appendChild(createElement("i", { className: "fas fa-terminal" }));
    terminalBtn.addEventListener("click", () => {
      os.app.launch("terminalApp").catch(() => {});
    });
    leftSection.appendChild(terminalBtn);

    const rootTerminalBtn = createElement("button", {
      className: "kali-panel-btn kali-quick-btn",
      attributes: { title: "Root Terminal" }
    });
    rootTerminalBtn.appendChild(createElement("i", { className: "fas fa-user-shield" }));
    rootTerminalBtn.addEventListener("click", () => {
      os.app.launch("terminalApp", {
        title: "Root Terminal (root@kali)",
        autoCommand: "whoami"
      }).catch(() => {});
    });
    leftSection.appendChild(rootTerminalBtn);

    const filesBtn = createElement("button", {
      className: "kali-panel-btn kali-quick-btn",
      attributes: { title: "File Manager" }
    });
    filesBtn.appendChild(createElement("i", { className: "fas fa-folder" }));
    filesBtn.addEventListener("click", () => {
      os.app.launch("explorerApp").catch(() => {});
    });
    leftSection.appendChild(filesBtn);

    const browserBtn = createElement("button", {
      className: "kali-panel-btn kali-quick-btn",
      attributes: { title: "Web Browser" }
    });
    browserBtn.appendChild(createElement("i", { className: "fas fa-globe" }));
    browserBtn.addEventListener("click", () => {
      os.app.launch("browserApp").catch(() => {});
    });
    leftSection.appendChild(browserBtn);

    const editorBtn = createElement("button", {
      className: "kali-panel-btn kali-quick-btn",
      attributes: { title: "Code Editor" }
    });
    editorBtn.appendChild(createElement("i", { className: "fas fa-code" }));
    editorBtn.addEventListener("click", () => {
      os.app.launch("monacoApp").catch(() => {});
    });
    leftSection.appendChild(editorBtn);

    const dividerTasks = createElement("div", { className: "kali-panel-divider" });
    leftSection.appendChild(dividerTasks);

    this.tasksContainer = createElement("div", { className: "kali-panel-tasks" });
    leftSection.appendChild(this.tasksContainer);

    const rightSection = createElement("div", { className: "kali-panel-right" });

    this.telemetryElement = createElement("div", { className: "kali-telemetry" });
    rightSection.appendChild(this.telemetryElement);

    const networkBtn = createElement("button", {
      className: "kali-panel-btn kali-tray-btn",
      attributes: { title: "eth0: 192.168.1.105 (Connected)" }
    });
    networkBtn.appendChild(createElement("i", { className: "fas fa-wifi" }));
    networkBtn.addEventListener("click", () => {
      os.app.launch("settingsApp", null, { section: "pane-network" }).catch(() => {});
    });
    rightSection.appendChild(networkBtn);

    const audioBtn = createElement("button", {
      className: "kali-panel-btn kali-tray-btn",
      attributes: { title: "Audio Mixer" }
    });
    audioBtn.appendChild(createElement("i", { className: "fas fa-volume-up" }));
    audioBtn.addEventListener("click", () => {
      this.toggleAudioMixer();
    });
    rightSection.appendChild(audioBtn);

    const batteryBtn = createElement("button", {
      className: "kali-panel-btn kali-tray-btn",
      attributes: { title: "Battery: 85%" }
    });
    batteryBtn.appendChild(createElement("i", { className: "fas fa-battery-three-quarters" }));
    const batteryText = createElement("span", { className: "kali-battery-text" });
    setText(batteryText, "85%");
    batteryBtn.appendChild(batteryText);
    batteryBtn.addEventListener("click", () => {
      os.app.launch("displayPerformanceApp").catch(() => {});
    });
    rightSection.appendChild(batteryBtn);

    this.clockElement = createElement("div", {
      id: "kali-clock",
      className: "kali-panel-clock"
    });
    rightSection.appendChild(this.clockElement);

    const userChip = createElement("div", { className: "kali-user-chip" });
    userChip.appendChild(createElement("i", { className: "fas fa-user-circle" }));
    const userName = createElement("span");
    setText(userName, "kali");
    userChip.appendChild(userName);
    rightSection.appendChild(userChip);

    const powerBtn = createElement("button", {
      className: "kali-panel-btn kali-tray-btn kali-power-btn",
      attributes: { title: "Power Options" }
    });
    powerBtn.appendChild(createElement("i", { className: "fas fa-power-off" }));
    powerBtn.addEventListener("click", () => {
      this.handlePowerClick();
    });
    rightSection.appendChild(powerBtn);

    this.topPanel.appendChild(leftSection);
    this.topPanel.appendChild(rightSection);
    document.body.appendChild(this.topPanel);
  }

  createDock() {
    this.dock = createElement("div", { id: "kali-dock" });

    const pinnedContainer = createElement("div", { className: "kali-dock-pinned" });
    PINNED_APPS.forEach((app) => {
      const item = createElement("button", {
        className: "kali-dock-item",
        attributes: { title: app.title }
      });
      item.appendChild(createIconNode(app.icon, "fas fa-cube"));
      item.addEventListener("click", () => {
        os.app.launch(app.appId).catch(() => {});
      });
      pinnedContainer.appendChild(item);
    });
    this.dock.appendChild(pinnedContainer);

    document.body.appendChild(this.dock);
  }

  createWhiskerMenu() {
    this.whiskerMenu = createElement("div", { id: "kali-whisker-menu" });

    const searchBar = createElement("div", { className: "whisker-search-bar" });
    searchBar.appendChild(createElement("i", { className: "fas fa-search" }));
    this.searchInput = createElement("input", {
      className: "whisker-search-input",
      attributes: {
        type: "text",
        placeholder: "Search Kali tools...",
        autocomplete: "off",
        spellcheck: "false"
      }
    });
    this.searchInput.addEventListener("input", () => {
      this.searchQuery = this.searchInput.value.trim().toLowerCase();
      this.renderToolList();
    });
    searchBar.appendChild(this.searchInput);
    this.whiskerMenu.appendChild(searchBar);

    const body = createElement("div", { className: "whisker-body" });

    this.categoriesContainer = createElement("div", { className: "whisker-categories" });
    body.appendChild(this.categoriesContainer);

    this.toolsContainer = createElement("div", { className: "whisker-tools" });
    body.appendChild(this.toolsContainer);

    this.whiskerMenu.appendChild(body);

    const footer = createElement("div", { className: "whisker-footer" });

    const userTag = createElement("div", { className: "whisker-user" });
    userTag.appendChild(createElement("i", { className: "fas fa-terminal" }));
    const userLabel = createElement("span");
    setText(userLabel, "kali@sital-os");
    userTag.appendChild(userLabel);
    footer.appendChild(userTag);

    const actions = createElement("div", { className: "whisker-actions" });

    const lockBtn = createElement("button", {
      className: "whisker-action-btn",
      attributes: { title: "Lock Screen" }
    });
    lockBtn.appendChild(createElement("i", { className: "fas fa-lock" }));
    lockBtn.addEventListener("click", () => {
      this.closeWhiskerMenu();
      os.events.emit(BusEvents.SYSTEM_LOCKED);
    });
    actions.appendChild(lockBtn);

    const restartBtn = createElement("button", {
      className: "whisker-action-btn",
      attributes: { title: "Restart" }
    });
    restartBtn.appendChild(createElement("i", { className: "fas fa-redo" }));
    restartBtn.addEventListener("click", async () => {
      this.closeWhiskerMenu();
      const confirmed = await os.dialog.confirm("Restart", "Shut down or restart sitalOS?");
      if (confirmed) {
        location.reload();
      }
    });
    actions.appendChild(restartBtn);

    const shutdownBtn = createElement("button", {
      className: "whisker-action-btn whisker-power-btn",
      attributes: { title: "Power Off" }
    });
    shutdownBtn.appendChild(createElement("i", { className: "fas fa-power-off" }));
    shutdownBtn.addEventListener("click", () => {
      this.closeWhiskerMenu();
      this.handlePowerClick();
    });
    actions.appendChild(shutdownBtn);

    footer.appendChild(actions);
    this.whiskerMenu.appendChild(footer);

    document.body.appendChild(this.whiskerMenu);
  }

  toggleWhiskerMenu() {
    if (!this.whiskerMenu) return;
    if (this.whiskerMenu.classList.contains("open")) {
      this.closeWhiskerMenu();
    } else {
      this.openWhiskerMenu();
    }
  }

  openWhiskerMenu() {
    if (!this.whiskerMenu) return;
    this.whiskerMenu.classList.add("open");
    this.selectedCategory = "Favorites";
    this.searchQuery = "";
    if (this.searchInput) {
      this.searchInput.value = "";
      this.searchInput.focus();
    }
    this.renderCategories();
    this.renderToolList();
  }

  closeWhiskerMenu() {
    if (!this.whiskerMenu) return;
    this.whiskerMenu.classList.remove("open");
  }

  renderCategories() {
    if (!this.categoriesContainer) return;
    this.categoriesContainer.innerHTML = "";

    KALI_CATEGORIES.forEach((category) => {
      const btn = createElement("button", { className: "whisker-category-btn" });
      if (this.selectedCategory === category && !this.searchQuery) {
        btn.classList.add("active");
      }
      btn.appendChild(createElement("i", { className: "fas fa-folder" }));
      const label = createElement("span");
      setText(label, category);
      btn.appendChild(label);
      btn.addEventListener("click", () => {
        this.selectedCategory = category;
        this.searchQuery = "";
        if (this.searchInput) {
          this.searchInput.value = "";
        }
        this.renderCategories();
        this.renderToolList();
      });
      this.categoriesContainer.appendChild(btn);
    });
  }

  renderToolList() {
    if (!this.toolsContainer) return;
    this.toolsContainer.innerHTML = "";

    let toolsToShow = [];
    if (this.searchQuery) {
      toolsToShow = KALI_TOOLS.filter((tool) => {
        const query = this.searchQuery;
        return (
          tool.name.toLowerCase().includes(query) ||
          tool.subtitle.toLowerCase().includes(query) ||
          (tool.cmd && tool.cmd.toLowerCase().includes(query))
        );
      });
    } else {
      toolsToShow = KALI_TOOLS.filter((tool) => tool.categories.includes(this.selectedCategory));
    }

    if (toolsToShow.length === 0) {
      const emptyMsg = createElement("div", {
        className: "whisker-tool-item",
        attributes: { style: "opacity: 0.6; cursor: default;" }
      });
      const emptyText = createElement("span");
      setText(emptyText, "No matching tools found");
      emptyMsg.appendChild(emptyText);
      this.toolsContainer.appendChild(emptyMsg);
      return;
    }

    toolsToShow.forEach((tool) => {
      const item = createElement("button", { className: "whisker-tool-item" });

      const iconBox = createElement("div", { className: "whisker-tool-icon" });
      iconBox.appendChild(createIconNode(tool.icon, tool.fallbackIcon));
      item.appendChild(iconBox);

      const infoBox = createElement("div", { className: "whisker-tool-info" });
      const nameSpan = createElement("span", { className: "whisker-tool-name" });
      setText(nameSpan, tool.name);
      infoBox.appendChild(nameSpan);

      const descSpan = createElement("span", { className: "whisker-tool-desc" });
      setText(descSpan, tool.subtitle);
      infoBox.appendChild(descSpan);

      item.appendChild(infoBox);

      item.addEventListener("click", () => {
        this.closeWhiskerMenu();
        if (tool.appId) {
          os.app.launch(tool.appId).catch(() => {});
        } else if (tool.cmd) {
          this.launchPentestTool(tool);
        }
      });

      this.toolsContainer.appendChild(item);
    });
  }

  registerKaliTerminalCommands() {
    const termApp = os.app.getInstance("terminalApp") || os.app.getInstance(ServiceKeys.TERMINAL);
    if (!termApp || typeof termApp.registerCommand !== "function") return;
    for (const [cmd, banner] of Object.entries(TOOL_BANNERS)) {
      termApp.registerCommand(cmd, () => {
        const lines = banner.split("\n");
        for (const line of lines) {
          termApp.print(line);
        }
      });
    }
  }

  launchPentestTool(tool) {
    this.registerKaliTerminalCommands();
    os.app.launch("terminalApp", {
      title: `${tool.name} (Kali Linux)`,
      autoCommand: tool.cmd
    }).catch(() => {});
  }

  renderWorkspaces() {
    if (!this.workspaceContainer) return;
    this.workspaceContainer.innerHTML = "";
    const ws = os.window.wm?.workspaceManager;
    const workspaces = ws?.workspaces && ws.workspaces.length > 0 ? ws.workspaces : [{ id: 0, name: "Workspace 1" }];
    const count = Math.max(workspaces.length, 2);
    const activeId = ws?.activeId ?? (workspaces[0]?.id ?? 0);

    for (let index = 0; index < count; index++) {
      const pill = createElement("button", {
        className: "kali-ws-pill",
        attributes: { title: `Workspace ${index + 1}` }
      });
      setText(pill, String(index + 1));
      const isCurrent = (workspaces[index] && workspaces[index].id === activeId) || (!ws && index === 0);
      if (isCurrent) {
        pill.classList.add("active");
      }
      pill.addEventListener("click", () => {
        const currentWs = os.window.wm?.workspaceManager;
        if (currentWs) {
          if (index === 1 && currentWs.workspaces.length < 2 && typeof currentWs.addWorkspace === "function") {
            currentWs.addWorkspace("Workspace 2");
          }
          if (currentWs.workspaces[index]) {
            currentWs.switchTo(currentWs.workspaces[index].id);
          }
        }
        this.renderWorkspaces();
      });
      this.workspaceContainer.appendChild(pill);
    }
  }

  renderTasks() {
    if (!this.tasksContainer) return;
    this.tasksContainer.innerHTML = "";

    const openWindows = os.window.getOpenWindows();
    if (!openWindows || typeof openWindows.forEach !== "function") return;

    openWindows.forEach((entry, winId) => {
      const win = $(`#${winId}`);
      if (!win) return;

      const taskBtn = createElement("button", { className: "kali-panel-task-tab" });
      taskBtn.dataset.winId = winId;

      const isVisible = win.style.display !== "none";
      const isActive = win.classList.contains("active") && isVisible;

      if (isActive) {
        taskBtn.classList.add("active");
      }
      if (!isVisible) {
        taskBtn.classList.add("minimized");
      }

      const iconVal = entry?.iconValue || entry?.icon || "fas fa-window-restore";
      taskBtn.appendChild(createIconNode(iconVal, "fas fa-window-restore"));

      const titleSpan = createElement("span", { className: "kali-tab-title" });
      const titleText = entry?.title || os.window.getTitle(winId) || winId;
      setText(titleSpan, titleText);
      taskBtn.appendChild(titleSpan);

      const closeBtn = createElement("button", {
        className: "kali-tab-close",
        attributes: { title: "Close" }
      });
      setText(closeBtn, "×");
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        os.window.close(winId);
      });
      taskBtn.appendChild(closeBtn);

      taskBtn.title = titleText;

      taskBtn.addEventListener("click", () => {
        const targetWin = $(`#${winId}`);
        if (!targetWin) return;
        if (targetWin.classList.contains("active") && targetWin.style.display !== "none") {
          os.window.minimize(targetWin);
        } else {
          if (targetWin.style.display === "none") {
            targetWin.style.display = "";
          }
          os.window.focus(targetWin);
        }
        setTimeout(() => this.renderTasks(), 50);
      });

      this.tasksContainer.appendChild(taskBtn);
    });
  }

  formatClock(date = new Date()) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = dayNames[date.getDay()];
    const month = monthNames[date.getMonth()];
    const dayNum = date.getDate();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${dayNum} ${month}, ${hours}:${minutes}`;
  }

  updateClock() {
    if (!this.clockElement) return;
    setText(this.clockElement, this.formatClock());
  }

  startClock() {
    this.updateClock();
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  updateTelemetry() {
    if (!this.telemetryElement) return;
    const cpu = Math.floor(12 + Math.random() * 17);
    const ram = (1.8 + Math.random() * 0.6).toFixed(1);
    setText(this.telemetryElement, `⚡ CPU ${cpu}%  RAM ${ram}GB`);
  }

  startTelemetry() {
    this.updateTelemetry();
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
    this.telemetryInterval = setInterval(() => {
      this.updateTelemetry();
    }, 2500);
  }

  toggleAudioMixer() {
    import("../../audioMixer.js")
      .then((module) => {
        const mixer = module.audioMixer?.();
        if (mixer && typeof mixer.toggle === "function") {
          mixer.toggle();
        }
      })
      .catch(() => {});
  }

  async handlePowerClick() {
    const confirmed = await os.dialog.confirm("Power Off", "Shut down or restart sitalOS?");
    if (confirmed) {
      location.reload();
    }
  }

  attachEventListeners() {
    this.boundRenderTasks = () => this.renderTasks();
    this.boundRenderWorkspaces = () => this.renderWorkspaces();

    os.events.on(BusEvents.WINDOW_CREATED, this.boundRenderTasks);
    os.events.on(BusEvents.WINDOW_FOCUSED, this.boundRenderTasks);
    os.events.on(BusEvents.WINDOW_MINIMIZED, this.boundRenderTasks);
    os.events.on(BusEvents.WINDOW_CLOSED, this.boundRenderTasks);
    os.events.on(BusEvents.WINDOW_FULLSCREEN, this.boundRenderTasks);
    os.events.on(BusEvents.WINDOW_SNAPPED, this.boundRenderTasks);

    os.events.on(BusEvents.WORKSPACE_SWITCHED, this.boundRenderWorkspaces);
    os.events.on(BusEvents.WORKSPACE_ADDED, this.boundRenderWorkspaces);
    os.events.on(BusEvents.WORKSPACE_REMOVED, this.boundRenderWorkspaces);

    this.boundDocClick = (e) => {
      if (!this.whiskerMenu || !this.whiskerMenu.classList.contains("open")) return;
      const menuBtn = $("#kali-apps-menu-btn");
      if (this.whiskerMenu.contains(e.target) || (menuBtn && menuBtn.contains(e.target))) {
        return;
      }
      this.closeWhiskerMenu();
    };
    this.boundDocKeydown = (e) => {
      if (e.key === "Escape" && this.whiskerMenu && this.whiskerMenu.classList.contains("open")) {
        this.closeWhiskerMenu();
      }
    };
    document.addEventListener("click", this.boundDocClick);
    document.addEventListener("keydown", this.boundDocKeydown);
  }

  detachEventListeners() {
    if (this.boundRenderTasks) {
      os.events.off(BusEvents.WINDOW_CREATED, this.boundRenderTasks);
      os.events.off(BusEvents.WINDOW_FOCUSED, this.boundRenderTasks);
      os.events.off(BusEvents.WINDOW_MINIMIZED, this.boundRenderTasks);
      os.events.off(BusEvents.WINDOW_CLOSED, this.boundRenderTasks);
      os.events.off(BusEvents.WINDOW_FULLSCREEN, this.boundRenderTasks);
      os.events.off(BusEvents.WINDOW_SNAPPED, this.boundRenderTasks);
      this.boundRenderTasks = null;
    }
    if (this.boundRenderWorkspaces) {
      os.events.off(BusEvents.WORKSPACE_SWITCHED, this.boundRenderWorkspaces);
      os.events.off(BusEvents.WORKSPACE_ADDED, this.boundRenderWorkspaces);
      os.events.off(BusEvents.WORKSPACE_REMOVED, this.boundRenderWorkspaces);
      this.boundRenderWorkspaces = null;
    }
    if (this.boundDocClick) {
      document.removeEventListener("click", this.boundDocClick);
      this.boundDocClick = null;
    }
    if (this.boundDocKeydown) {
      document.removeEventListener("keydown", this.boundDocKeydown);
      this.boundDocKeydown = null;
    }
  }

  destroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
    this.detachEventListeners();
    if (this.whiskerMenu) {
      this.whiskerMenu.remove();
      this.whiskerMenu = null;
    }
    if (this.topPanel) {
      this.topPanel.remove();
      this.topPanel = null;
    }
    if (this.dock) {
      this.dock.remove();
      this.dock = null;
    }
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    this.workspaceContainer = null;
    this.tasksContainer = null;
    this.telemetryElement = null;
    this.clockElement = null;
    this.searchInput = null;
    this.categoriesContainer = null;
    this.toolsContainer = null;
  }
}

export const kaliShell = new KaliShell();
