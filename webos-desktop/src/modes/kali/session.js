import { MODES } from "../../modeManager.js";
import { os, StorageKeys } from "../../framework.js";
import { SystemUtilities } from "../../system.js";
import { SessionMode } from "../shared/sessionBase.js";
import { kaliShell } from "./KaliShell.js";
import "./style.css";

const kaliSession = new SessionMode(MODES.KALI);

export function applyKaliSettings() {
  kaliSession.enter();
  kaliShell.init(os.window);
  SystemUtilities.setWallpaper("/static/wallpapers/kali-wallpaper.svg");
}

export function disableKaliSettings() {
  kaliShell.destroy();
  kaliSession.exit();
}

export { kaliSession };
