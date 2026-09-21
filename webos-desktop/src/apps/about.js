import "../styles/about.css";
import { resolveIconUrl, resolveGhUrl } from "../shared/assetResolver.js";
import { BaseApp, os, StorageKeys } from "../framework.js";
import { bindEvent, $ } from "../shared/domUtils.js";
import versionTxt from "../../version.txt?raw";
import sitalPhoto from "../assets/sital-photo.jpg";
import { SITAL_PROFILE } from "../config/profile.js";
export const YUKIOS_VERSION = versionTxt.trim();

const capabilities = [
  {
    tag: "WM",
    title: "Windowed Multitasking",
    desc: "Drag, resize, snap, minimize, maximize, and layer apps like a real desktop with window animations."
  },
  {
    tag: "VFS",
    title: "Virtual Filesystem",
    desc: "Your files live in the browser. Close the tab and they're still there when you come back."
  },
  {
    tag: "PLAY",
    title: "Games Library",
    desc: "3000+ games via Yuki Steam integration, Flash (Ruffle), DOS (JS-DOS), and console emulation."
  },
  {
    tag: "APPS",
    title: "80 Built-in Apps",
    desc: "Terminal, browser, editors (Notepad, Markdown, Monaco), paint, calculator, office viewer, and more."
  },
  {
    tag: "RUN",
    title: "Multi-Runtime Engine",
    desc: "HTML5, WebAssembly, emulation (JS-DOS, V86, Azahar 3DS), Flash (Ruffle) in one place."
  },
  {
    tag: "WORK",
    title: "Virtual Workspaces",
    desc: "Multiple virtual desktops for organizing different tasks and contexts with window assignment."
  }
];

const privacyText = `
  sitalOS collects limited anonymous analytics to help improve stability and usage insights.

  Analytics providers:
  • Anonymous usage analytics
  • Cloudflare Web Analytics for privacy-first traffic and performance insights

  Collected data:
  • App launches and feature usage
  • Session activity and timestamps
  • Anonymous analytics identifiers

  Not collected:
  • Files, documents, or personal content
  • Passwords or account credentials

  Data use:
  • Improving performance and reliability
  • Understanding feature usage
  • Diagnosing issues and errors

  sitalOS does not sell user data or share it with advertisers.
`;

const copyrightText = `
  Copyright & Takedown Requests

  sitalOS doesn't host any copyrighted content. Games and apps are loaded from their original sources or CDNs.

  If you believe something here violates your rights, contact us at:

  <a href="mailto:yukios-os@proton.me">yukios-os@proton.me</a>

  Include enough information to identify the content and your connection to it. Requests will be reviewed and processed.
`;
export class AboutApp extends BaseApp {
  constructor(services) {
    super(services);
  }

  open(opts = {}) {
    const win = os.window.create("about-sitalcOS", "About sitalOS", "720px", "85vh", {
      icon: SITAL_PROFILE.avatar || "/sital-photo.jpg"
    });

    win.innerHTML = `
      <div class="abx">
        <div class="abx-shell">

          <div class="abx-top" style="text-align: center;">
            <div class="abx-mark">
              <img class="abx-avatar" src="${SITAL_PROFILE.avatar || sitalPhoto}" alt="${SITAL_PROFILE.name}" style="width: 110px; height: 110px; border-radius: 50%; border: 3px solid #7c3aed; object-fit: cover; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);" />
              <h1 class="abx-title" style="font-size: 26px; font-weight: 700;">${SITAL_PROFILE.name}</h1>
              <p class="abx-sub" style="font-size: 16px; font-weight: 600; color: #7c3aed; margin: 4px 0 10px;">${SITAL_PROFILE.role}</p>
              <p class="abx-bio" style="font-size: 14px; max-width: 520px; margin: 0 auto; color: var(--text-secondary, #999); line-height: 1.6;">
                ${SITAL_PROFILE.bio}
              </p>
            </div>

            <div class="abx-meta" style="margin-top: 20px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
              <div class="abx-pill"><i class="fas fa-location-dot"></i> ${SITAL_PROFILE.location}</div>
              <a class="abx-meta-link" target="_blank" rel="noopener noreferrer" href="${SITAL_PROFILE.links.website}">
                <i class="fas fa-globe"></i> sitalc.com.np
              </a>
              <a class="abx-meta-link" href="${SITAL_PROFILE.links.email}" title="Email">
                <i class="fas fa-envelope"></i> ${SITAL_PROFILE.links.emailDisplay}
              </a>
              <a class="abx-meta-link" target="_blank" rel="noopener noreferrer" href="${SITAL_PROFILE.links.github}" title="GitHub">
                <i class="fab fa-github"></i> GitHub
              </a>
              <a class="abx-meta-link" target="_blank" rel="noopener noreferrer" href="${SITAL_PROFILE.links.linkedin}" title="LinkedIn">
                <i class="fab fa-linkedin"></i> LinkedIn
              </a>
            </div>
          </div>

          <div class="abx-foot" style="margin-top: 24px; text-align: center; font-size: 13px; color: var(--text-secondary, #888);">
            <span>sitalcOS — Built by ${SITAL_PROFILE.name}</span>
          </div>

        </div>
      </div>
    `;
  }

  onClose(winId) {}
}
