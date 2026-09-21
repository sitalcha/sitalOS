import { BaseApp, os } from "../framework.js";
import { SITAL_PROFILE } from "../config/profile.js";

export class ContactApp extends BaseApp {
  constructor(services) {
    super(services);
  }

  open(opts = {}) {
    const win = os.window.create("contact-app", `Contact - ${SITAL_PROFILE.name}`, "560px", "70vh", {
      icon: SITAL_PROFILE.avatar || "/sital-photo.jpg"
    });

    win.innerHTML = `
      <div class="contact-container" style="padding: 24px; font-family: sans-serif; background: var(--bg-base, #1e1e2e); color: var(--text-primary, #fff); height: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center;">
        <img src="${SITAL_PROFILE.avatar || "/sital-photo.jpg"}" alt="${SITAL_PROFILE.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #7c3aed; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3); margin-bottom: 12px;" />
        
        <h2 style="font-size: 22px; font-weight: 700; margin: 0; color: #ffffff;">${SITAL_PROFILE.name}</h2>
        <p style="font-size: 14px; color: #a78bfa; margin: 4px 0 20px;">${SITAL_PROFILE.role} | ${SITAL_PROFILE.location}</p>

        <div style="width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 12px;">
          
          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
            <i class="fa-solid fa-globe" style="font-size: 20px; color: #7c3aed;"></i>
            <div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.5); display: block;">Website</span>
              <a href="${SITAL_PROFILE.links.website}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">${SITAL_PROFILE.links.website}</a>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
            <i class="fa-solid fa-envelope" style="font-size: 20px; color: #7c3aed;"></i>
            <div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.5); display: block;">Email</span>
              <a href="${SITAL_PROFILE.links.email}" style="font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">${SITAL_PROFILE.links.emailDisplay}</a>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
            <i class="fa-solid fa-phone" style="font-size: 20px; color: #7c3aed;"></i>
            <div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.5); display: block;">Phone</span>
              <span style="font-size: 14px; color: rgba(255, 255, 255, 0.9);">${SITAL_PROFILE.links.phone}</span>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
            <i class="fa-brands fa-github" style="font-size: 20px; color: #7c3aed;"></i>
            <div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.5); display: block;">GitHub</span>
              <a href="${SITAL_PROFILE.links.github}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">${SITAL_PROFILE.links.github}</a>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
            <i class="fa-brands fa-linkedin" style="font-size: 20px; color: #7c3aed;"></i>
            <div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.5); display: block;">LinkedIn</span>
              <a href="${SITAL_PROFILE.links.linkedin}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">${SITAL_PROFILE.links.linkedin}</a>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
            <i class="fa-brands fa-youtube" style="font-size: 20px; color: #ef4444;"></i>
            <div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.5); display: block;">YouTube Channel</span>
              <a href="${SITAL_PROFILE.links.youtube}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">${SITAL_PROFILE.links.youtube}</a>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
            <i class="fa-brands fa-facebook" style="font-size: 20px; color: #3b82f6;"></i>
            <div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.5); display: block;">Facebook</span>
              <a href="${SITAL_PROFILE.links.facebook}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">${SITAL_PROFILE.links.facebook}</a>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 14px;">
            <i class="fa-solid fa-clipboard-question" style="font-size: 20px; color: #ec4899;"></i>
            <div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.5); display: block;">Inquiry & Questions</span>
              <a href="${SITAL_PROFILE.links.questionForm}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">Submit Google Form ↗</a>
            </div>
          </div>

        </div>
      </div>
    `;
  }
}
