import { BaseApp, os } from "../framework.js";
import { SITAL_PROFILE } from "../config/profile.js";

export class PortfolioApp extends BaseApp {
  constructor(services) {
    super(services);
  }

  open(opts = {}) {
    const win = os.window.create("portfolio-app", `Portfolio - ${SITAL_PROFILE.name}`, "960px", "85vh", {
      icon: SITAL_PROFILE.avatar || "/sital-photo.jpg"
    });

    win.innerHTML = `
      <div class="portfolio-container" style="display: flex; flex-direction: column; height: 100%; background: #0b0d14; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(124, 58, 237, 0.3) 50%, rgba(236, 72, 153, 0.2) 100%), #141724; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; box-shadow: 0 4px 25px rgba(0,0,0,0.4);">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="position: relative;">
              <img src="${SITAL_PROFILE.avatar || "/sital-photo.jpg"}" alt="${SITAL_PROFILE.name}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 3px solid #8b5cf6; box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);" />
              <span style="position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px; background: #10b981; border: 2px solid #141724; border-radius: 50%;" title="Available"></span>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <h1 style="font-size: 22px; font-weight: 700; margin: 0; color: #ffffff; letter-spacing: -0.5px;">${SITAL_PROFILE.name}</h1>
                <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 600;">Available for Work</span>
              </div>
              <p style="font-size: 13px; color: #a78bfa; margin: 3px 0 6px; font-weight: 500;">${SITAL_PROFILE.role} • 📍 ${SITAL_PROFILE.location}</p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <a href="${SITAL_PROFILE.links.github}" target="_blank" rel="noopener noreferrer" style="color: #cbd5e1; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; background: rgba(255, 255, 255, 0.08); padding: 3px 9px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s;">
                  <i class="fa-brands fa-github"></i> GitHub
                </a>
                <a href="${SITAL_PROFILE.links.youtube}" target="_blank" rel="noopener noreferrer" style="color: #cbd5e1; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; background: rgba(239, 68, 68, 0.15); color: #fca5a5; padding: 3px 9px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); transition: all 0.2s;">
                  <i class="fa-brands fa-youtube"></i> YouTube
                </a>
                <a href="${SITAL_PROFILE.links.facebook}" target="_blank" rel="noopener noreferrer" style="color: #cbd5e1; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; background: rgba(59, 130, 246, 0.15); color: #93c5fd; padding: 3px 9px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.3); transition: all 0.2s;">
                  <i class="fa-brands fa-facebook"></i> Facebook
                </a>
                <a href="${SITAL_PROFILE.links.linkedin}" target="_blank" rel="noopener noreferrer" style="color: #cbd5e1; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; background: rgba(255, 255, 255, 0.08); padding: 3px 9px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s;">
                  <i class="fa-brands fa-linkedin"></i> LinkedIn
                </a>
                <a href="${SITAL_PROFILE.links.email}" style="color: #cbd5e1; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; background: rgba(255, 255, 255, 0.08); padding: 3px 9px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s;">
                  <i class="fa-solid fa-envelope"></i> Email
                </a>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <a href="${SITAL_PROFILE.links.website}" target="_blank" rel="noopener noreferrer" style="padding: 9px 16px; border-radius: 10px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border: none; color: #fff; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 7px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); cursor: pointer;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Live Site (sitalc.com.np)
            </a>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 24px; padding: 0 24px; background: #11131c; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
          <button class="pf-tab-btn active" data-tab="live-site" style="padding: 13px 4px; background: none; border: none; border-bottom: 2px solid #8b5cf6; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-globe"></i> Live Interactive Portfolio
          </button>
          <button class="pf-tab-btn" data-tab="overview" style="padding: 13px 4px; background: none; border: none; border-bottom: 2px solid transparent; color: #94a3b8; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-rocket"></i> Projects & Skills
          </button>
          <button class="pf-tab-btn" data-tab="experience" style="padding: 13px 4px; background: none; border: none; border-bottom: 2px solid transparent; color: #94a3b8; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-briefcase"></i> Experience & Education
          </button>
          <button class="pf-tab-btn" data-tab="contact" style="padding: 13px 4px; background: none; border: none; border-bottom: 2px solid transparent; color: #94a3b8; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-address-card"></i> Contact & Info
          </button>
        </div>

        <!-- Tab Contents -->
        <div style="flex: 1; overflow-y: auto; padding: 20px 24px;">
          
          <!-- TAB 1: LIVE PORTFOLIO WEBSITE (From well-known) -->
          <div id="pf-tab-live-site" class="pf-tab-panel" style="display: flex; height: 100%; flex-direction: column;">
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 10px 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px;">
              <span style="color: #94a3b8;">
                <i class="fa-solid fa-circle-check" style="color: #10b981; margin-right: 6px;"></i>
                Portfolio Website Loaded: <strong style="color: #fff;">Sital Bahadur Chaudhari</strong> (5+ Years Experience)
              </span>
              <div style="display: flex; gap: 8px;">
                <a href="/portfolio/index.html" target="_blank" rel="noopener noreferrer" style="padding: 6px 12px; border-radius: 6px; background: rgba(255, 255, 255, 0.1); color: #fff; font-size: 12px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                  <i class="fa-solid fa-up-right-from-square"></i> Open Fullscreen
                </a>
                <a href="${SITAL_PROFILE.links.website}" target="_blank" rel="noopener noreferrer" style="padding: 6px 12px; border-radius: 6px; background: #8b5cf6; color: #fff; font-size: 12px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                  <i class="fa-solid fa-globe"></i> Open sitalc.com.np
                </a>
              </div>
            </div>
            <div style="flex: 1; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); background: #000; min-height: 520px; position: relative;">
              <iframe src="/portfolio/index.html" style="width: 100%; height: 100%; border: none;" allow="autoplay; fullscreen; clipboard-write; encrypted-media"></iframe>
            </div>
          </div>

          <!-- TAB 2: PROJECTS & SKILLS -->
          <div id="pf-tab-overview" class="pf-tab-panel" style="display: none;">
            
            <!-- About Section -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 20px; margin-bottom: 24px;">
              <h2 style="font-size: 16px; font-weight: 700; margin: 0 0 10px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-id-badge" style="color: #8b5cf6;"></i> About Sital
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0;">
                ${SITAL_PROFILE.bio}
              </p>
            </div>

            <!-- Skills Section -->
            <div style="margin-bottom: 28px;">
              <h2 style="font-size: 16px; font-weight: 700; margin: 0 0 14px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-code" style="color: #8b5cf6;"></i> Core Technical Skills
              </h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                ${SITAL_PROFILE.skills.map(s => `
                  <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <i class="${s.icon}" style="font-size: 20px; color: #8b5cf6;"></i>
                      <span style="font-size: 13px; font-weight: 500; color: #e2e8f0;">${s.name}</span>
                    </div>
                    <span style="font-size: 11px; background: rgba(139, 92, 246, 0.2); color: #c4b5fd; padding: 2px 7px; border-radius: 6px; font-weight: 600;">${s.level}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Projects Grid -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <h2 style="font-size: 16px; font-weight: 700; margin: 0; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-rocket" style="color: #8b5cf6;"></i> Featured Projects (${SITAL_PROFILE.projects.length})
                </h2>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 18px;">
                ${SITAL_PROFILE.projects.map(p => `
                  <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, border-color 0.2s;">
                    <div>
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          ${p.icon.startsWith('/') 
                            ? `<img src="${p.icon}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="${p.title}" />`
                            : `<i class="${p.icon}" style="font-size: 24px; color: #8b5cf6;"></i>`
                          }
                          <div>
                            <h3 style="font-size: 15px; font-weight: 700; margin: 0; color: #f8fafc;">${p.title}</h3>
                            <span style="font-size: 11px; color: #94a3b8;">${p.subtitle}</span>
                          </div>
                        </div>
                        <span style="font-size: 10px; background: rgba(139, 92, 246, 0.2); color: #c4b5fd; padding: 3px 8px; border-radius: 10px; border: 1px solid rgba(139, 92, 246, 0.3); font-weight: 600;">${p.badge}</span>
                      </div>
                      <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 16px;">${p.desc}</p>
                    </div>

                    <div style="display: flex; gap: 8px;">
                      <a href="${p.url}" target="_blank" rel="noopener noreferrer" style="flex: 1; padding: 8px 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; font-size: 12px; font-weight: 600; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Link
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>

          <!-- TAB 3: EXPERIENCE & EDUCATION -->
          <div id="pf-tab-experience" class="pf-tab-panel" style="display: none;">
            
            <div style="margin-bottom: 28px;">
              <h2 style="font-size: 17px; font-weight: 700; margin: 0 0 16px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-briefcase" style="color: #8b5cf6;"></i> Professional Experience
              </h2>
              <div style="display: flex; flex-direction: column; gap: 14px;">
                ${SITAL_PROFILE.experience.map(exp => `
                  <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                      <div>
                        <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: #fff;">${exp.role}</h3>
                        <span style="font-size: 13px; color: #a78bfa; font-weight: 500;">${exp.company}</span>
                      </div>
                      <span style="font-size: 12px; background: rgba(139, 92, 246, 0.2); color: #c4b5fd; padding: 4px 10px; border-radius: 8px; font-weight: 600;">${exp.period}</span>
                    </div>
                    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0;">${exp.desc}</p>
                  </div>
                `).join('')}
              </div>
            </div>

            <div>
              <h2 style="font-size: 17px; font-weight: 700; margin: 0 0 16px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-graduation-cap" style="color: #8b5cf6;"></i> Education Background
              </h2>
              <div style="display: flex; flex-direction: column; gap: 14px;">
                ${SITAL_PROFILE.education.map(edu => `
                  <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                      <div>
                        <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: #fff;">${edu.degree}</h3>
                        <span style="font-size: 13px; color: #a78bfa; font-weight: 500;">${edu.institution}</span>
                      </div>
                      <span style="font-size: 12px; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; padding: 4px 10px; border-radius: 8px; font-weight: 600;">${edu.period}</span>
                    </div>
                    <p style="font-size: 13px; color: #94a3b8; margin: 0;">${edu.grade}</p>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>

          <!-- TAB 4: CONTACT & INFO -->
          <div id="pf-tab-contact" class="pf-tab-panel" style="display: none;">
            <div style="max-width: 580px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px;">
              <div style="text-align: center; margin-bottom: 10px;">
                <h2 style="font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 6px;">Contact Sital Bahadur Chaudhari</h2>
                <p style="font-size: 13px; color: #94a3b8; margin: 0;">Reach out directly via Phone, Email, Social Channels, or Google Form.</p>
              </div>

              <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
                <i class="fa-solid fa-phone" style="font-size: 22px; color: #10b981;"></i>
                <div>
                  <span style="font-size: 11px; color: #94a3b8; display: block;">Contact Number</span>
                  <a href="tel:${SITAL_PROFILE.links.phone}" style="font-size: 14px; color: #fff; font-weight: 600; text-decoration: none;">${SITAL_PROFILE.links.phoneDisplay}</a>
                </div>
              </div>

              <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
                <i class="fa-solid fa-envelope" style="font-size: 22px; color: #8b5cf6;"></i>
                <div>
                  <span style="font-size: 11px; color: #94a3b8; display: block;">Email Address</span>
                  <a href="${SITAL_PROFILE.links.email}" style="font-size: 14px; color: #fff; text-decoration: none; font-weight: 600;">${SITAL_PROFILE.links.emailDisplay}</a>
                </div>
              </div>

              <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
                <i class="fa-solid fa-map-location-dot" style="font-size: 22px; color: #f59e0b;"></i>
                <div>
                  <span style="font-size: 11px; color: #94a3b8; display: block;">Address / Location</span>
                  <span style="font-size: 14px; color: #fff; font-weight: 600;">${SITAL_PROFILE.location}</span>
                </div>
              </div>

              <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
                <i class="fa-brands fa-github" style="font-size: 22px; color: #e2e8f0;"></i>
                <div>
                  <span style="font-size: 11px; color: #94a3b8; display: block;">GitHub Profile</span>
                  <a href="${SITAL_PROFILE.links.github}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #fff; text-decoration: none; font-weight: 600;">${SITAL_PROFILE.links.github}</a>
                </div>
              </div>

              <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
                <i class="fa-brands fa-youtube" style="font-size: 22px; color: #ef4444;"></i>
                <div>
                  <span style="font-size: 11px; color: #94a3b8; display: block;">YouTube Channel</span>
                  <a href="${SITAL_PROFILE.links.youtube}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #fff; text-decoration: none; font-weight: 600;">${SITAL_PROFILE.links.youtube}</a>
                </div>
              </div>

              <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
                <i class="fa-brands fa-facebook" style="font-size: 22px; color: #3b82f6;"></i>
                <div>
                  <span style="font-size: 11px; color: #94a3b8; display: block;">Facebook Profile</span>
                  <a href="${SITAL_PROFILE.links.facebook}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #fff; text-decoration: none; font-weight: 600;">${SITAL_PROFILE.links.facebook}</a>
                </div>
              </div>

              <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
                <i class="fa-solid fa-clipboard-question" style="font-size: 22px; color: #ec4899;"></i>
                <div>
                  <span style="font-size: 11px; color: #94a3b8; display: block;">Have a Question / Inquiry?</span>
                  <a href="${SITAL_PROFILE.links.questionForm}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #fff; text-decoration: none; font-weight: 600;">Submit Google Form ↗</a>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    `;

    // Tab Switching Logic
    const tabs = win.querySelectorAll(".pf-tab-btn");
    const panels = win.querySelectorAll(".pf-tab-panel");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        tabs.forEach((t) => {
          t.style.borderBottomColor = "transparent";
          t.style.color = "#94a3b8";
        });
        tab.style.borderBottomColor = "#8b5cf6";
        tab.style.color = "#fff";

        panels.forEach((p) => {
          if (p.id === `pf-tab-${target}`) {
            p.style.display = target === "live-site" ? "flex" : "block";
          } else {
            p.style.display = "none";
          }
        });
      });
    });
  }

  onClose(winId) {}
}
