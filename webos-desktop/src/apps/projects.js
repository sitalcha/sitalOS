import { BaseApp, os } from "../framework.js";
import { SITAL_PROFILE } from "../config/profile.js";

/**
 * ==============================================================================
 *  सिटल चौधरीका प्रोजेक्टहरू (PROJECTS LIST)
 * ==============================================================================
 * प्रोजेक्टहरू 'src/config/profile.js' बाट लोड हुन्छन्।
 * नयाँ प्रोजेक्ट थप्न वा परिवर्तन गर्न तपाईं 'src/config/profile.js' फाइल खोल्न सक्नुहुन्छ।
 */
export const PROJECTS = SITAL_PROFILE.projects;

export class ProjectsApp extends BaseApp {
  constructor(services) {
    super(services);
  }

  open(opts = {}) {
    const win = os.window.create("projects-app", "Projects - Sital Bahadur Chaudhari", "850px", "80vh", {
      icon: "fa-solid fa-folder-open"
    });

    win.innerHTML = `
      <div class="projects-container" style="padding: 24px; font-family: sans-serif; background: var(--bg-base, #1e1e2e); color: var(--text-primary, #fff); height: 100%; overflow-y: auto;">
        <div class="projects-header" style="text-align: center; margin-bottom: 28px;">
          <h1 style="font-size: 26px; font-weight: 700; margin-bottom: 6px; color: #ffffff;">Featured Projects</h1>
          <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">Featured data analytics, web applications, and digital platforms by Sital Bahadur Chaudhari</p>
        </div>

        <div class="projects-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
          ${PROJECTS.map(
            (p) => `
            <div class="project-card" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, box-shadow 0.2s; backdrop-filter: blur(10px);">
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    ${
                      p.icon.startsWith("/")
                        ? `<img src="${p.icon}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" alt="${p.title}" />`
                        : `<i class="${p.icon}" style="font-size: 28px; color: #7c3aed;"></i>`
                    }
                    <div>
                      <h3 style="font-size: 17px; font-weight: 700; margin: 0; color: #ffffff;">${p.title}</h3>
                      <span style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">${p.subtitle}</span>
                    </div>
                  </div>
                  <span style="font-size: 11px; background: rgba(124, 58, 237, 0.25); color: #a78bfa; padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(167, 139, 250, 0.3);">${p.badge}</span>
                </div>
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.8); line-height: 1.5; margin-bottom: 18px;">${p.desc}</p>
              </div>

              <div style="display: flex; gap: 8px;">
                <button class="open-iframe-btn" data-url="${p.url}" data-title="${p.title}" style="flex: 1; padding: 9px 14px; border-radius: 10px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border: none; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <i class="fa-solid fa-window-maximize"></i> Open in OS
                </button>
                <a href="${p.url}" target="_blank" rel="noopener noreferrer" style="padding: 9px 14px; border-radius: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; font-size: 12px; text-decoration: none; display: flex; align-items: center; justify-content: center;" title="Open in new tab">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </div>
            </div>
          `
          ).join("")}
        </div>
      </div>
    `;

    win.querySelectorAll(".open-iframe-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-url");
        const title = btn.getAttribute("data-title");
        this.openWebWindow(title, url);
      });
    });
  }

  openWebWindow(title, url) {
    const frameId = "webwin-" + title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const win = os.window.create(frameId, title, "85vw", "85vh", {
      icon: "fa-solid fa-globe"
    });
    win.innerHTML = `<iframe src="${url}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; clipboard-write; encrypted-media"></iframe>`;
  }
}
