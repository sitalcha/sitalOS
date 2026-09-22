import { createElement, setText, setHTML, bindEvent } from "../../shared/domUtils.js";

const KALI_TOOLS = [
  { name: "Nmap", icon: "fas fa-network-wired", command: "nmap -sV localhost" },
  { name: "Wireshark", icon: "fas fa-wave-square", command: "wireshark" },
  { name: "Metasploit", icon: "fas fa-skull-crossbones", command: "msfconsole" },
  { name: "Burp Suite", icon: "fas fa-spider", command: "burpsuite" },
  { name: "Hydra", icon: "fas fa-key", command: "hydra -h" },
  { name: "Aircrack", icon: "fas fa-wifi", command: "aircrack-ng --help" }
];

export function createKaliTerminalWidget(os, options = {}) {
  const element = createElement("div", {
    className: "mobile-widget mobile-kali-widget",
    attributes: { "role": "region", "aria-label": "Kali NetHunter Terminal Widget" }
  });

  const header = createElement("div", { className: "mobile-kali-header" });
  const title = createElement("div", {
    className: "mobile-kali-header-title",
    html: '<i class="fas fa-terminal"></i><span>root@kali:~#</span>'
  });
  const launchBtn = createElement("button", {
    className: "mobile-kali-launch-btn",
    html: '<i class="fas fa-play"></i><span>Launch Terminal</span>',
    attributes: { "aria-label": "Launch Terminal" }
  });
  header.appendChild(title);
  header.appendChild(launchBtn);

  const preview = createElement("div", { className: "mobile-kali-preview" });
  preview.innerHTML = '<span class="mobile-kali-prompt">root@kali:~# </span><span class="mobile-kali-cmd">nmap -sS -O 192.168.1.1</span><div class="mobile-kali-output">Host is up (0.0021s latency).<br>rtt var: 1.2ms, status: active</div>';

  const grid = createElement("div", { className: "mobile-kali-tools-grid" });
  KALI_TOOLS.forEach((tool) => {
    const card = createElement("div", {
      className: "mobile-kali-tool-card",
      attributes: { "role": "button", "aria-label": tool.name }
    });
    const iconEl = createElement("i", { className: `${tool.icon} mobile-kali-tool-icon` });
    const nameEl = createElement("span", { className: "mobile-kali-tool-name", text: tool.name });
    card.appendChild(iconEl);
    card.appendChild(nameEl);

    bindEvent(card, "click", (event) => {
      event.stopPropagation();
      if (os && os.app && typeof os.app.launch === "function") {
        os.app.launch("terminalApp", { initialCommand: tool.command, tool: tool.name }).catch(() => {
          os.app.launch("terminalApp").catch(() => {});
        });
      }
    });

    grid.appendChild(card);
  });

  element.appendChild(header);
  element.appendChild(preview);
  element.appendChild(grid);

  bindEvent(launchBtn, "click", (event) => {
    event.stopPropagation();
    if (os && os.app && typeof os.app.launch === "function") {
      os.app.launch("terminalApp").catch(() => {});
    }
  });

  bindEvent(preview, "click", () => {
    if (os && os.app && typeof os.app.launch === "function") {
      os.app.launch("terminalApp").catch(() => {});
    }
  });

  const destroy = () => {};

  return { element, destroy };
}
