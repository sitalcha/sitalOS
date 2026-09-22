# sitalOS

> **sitalOS: Personal Web Desktop Operating System**  
> Developed by Sital Bahadur Chaudhari ([sitalc.com.np](https://sitalc.com.np/))  
> Licensed under BSD-3-Clause (Based on YukiOS by Reeyuki)

---

<div align="center">

[![License](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop%20%7C%20Mobile-blueviolet.svg)](#)
[![Built With](https://img.shields.io/badge/Built%20With-Vanilla%20JS%20%2B%20Vite-orange.svg)](#)

**Live Demo:** [https://sitalc.com.np](https://sitalc.com.np)

</div>

sitalOS is a next-generation, browser-native multi-environment operating system. Switch seamlessly between floating desktops (macOS, Kali Linux, ChromeOS), dynamic BSP tiling (Hyprland), mobile phone interfaces (Android 14 Pixel, Kali NetHunter), game consoles (sitalOS Deck), and interactive 3D virtual workspaces, all running on a single persistent client-side core built in vanilla JavaScript with zero heavy UI frameworks.

---

## What Is New in sitalOS

### 1. Kagaj AI (कागज AI) Document Intelligence
- **Native Document Assistant:** Extract text, handwritten notes, structured tables, invoices, and receipts from images and PDF documents directly inside sitalOS.
- **Custom Gemini Model Support:** Visitors can use the pre-configured high-speed API or provide their own custom Gemini model name (such as `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-2.5-pro`) and personal API key directly from the UI.
- **Persistent Storage:** Keys and model selections are automatically saved in local storage.
- **Nepali Handwriting Recognition:** Accurately recognizes and transcribes handwritten Devanagari (Nepali) scripts as well as English text.
- **Direct Export:** Save extracted documents as Word (`.doc`), plain text (`.txt`), copy to clipboard, or store directly into `/home/Documents/` in the virtual filesystem.

### 2. cPanel-Ready Music Player & macOS Desktop Widget
- **Local cPanel Hosting:** Built-in support for uploading your own songs directly to your server (`public_html/music/`).
- **Standard Track Mapping:** Pre-configured paths for `/music/track1.mp3` through `/music/track5.mp3` and cover art `/music/cover1.jpg` through `/music/cover5.jpg`.
- **Smart Online Fallback:** If custom files are not yet uploaded, the player automatically streams high-quality royalty-free audio without crashing or interrupting playback.
- **macOS Desktop Widget:** Interactive widget with live album art, track titles, scrubbing progress bar, volume controls, and play/pause toggles.
- **Rich Vinyl Animation:** Animated vinyl turntable playback with full media session API integration.

### 3. Mobile Multi-Shell & Android 14 Experience
- **Material You Pixel Shell:** Adaptive squircles, dynamic color theming, Google search pill, and authentic Android status bar.
- **Kali NetHunter Mobile Shell:** Cyber offensive security tools, live terminal card, network status indicators, and tactical quick toggles.
- **ChromeOS Tablet Mode:** Fullscreen touch app drawer, touch-friendly shelf, and quick settings menu.
- **Mobile Lock Screen:** Swipe-up unlocking with real-time clock, battery percentage, and notification preview.
- **Slide-Up App Drawer:** Smooth pull-up gesture to search and launch any installed application.
- **Android Gesture Navigation:** Interactive back arrow edge gestures and swipe-up home navigation bar.

### 4. Modern Kali Linux (2024/2025) Shell
- **Authentic XFCE Top Panel:** Complete with official Kali dragon application menu, workspace switcher buttons, live running window tabs, telemetry monitors, and power controls.
- **Live System Telemetry:** Real-time dynamic CPU and RAM usage badge (`⚡ CPU XX%  RAM X.X GB`) updating live.
- **Categorized Whisker Menu:** 12 offensive security tool suites including Information Gathering, Vulnerability Analysis, Web Applications, Database Assessment, Password Attacks, Wireless Attacks, Reverse Engineering, Exploitation, and Forensics.
- **Quick Security Launchers:** Direct terminal access for Nmap, Nikto, Burp Suite, SQLMap, John the Ripper, Hydra, Aircrack-ng, Ghidra, Metasploit, and Wireshark.
- **Geometric Cyber Dragon Wallpaper:** 3D polygonal Kali dragon artwork on deep carbon fiber texture.

### 5. macOS Sonoma Shell
- **Fisheye Dock:** Smooth spring-scale icon enlargement on hover with dynamic running indicators.
- **Natural Window Animations:** Realistic dock minimization curves and spring scale app opening animations.
- **Control Center:** Quick sliders for display brightness, system volume, Dark Mode, Night Light, Do Not Disturb, and accent colors.
- **Launchpad (F4):** Fullscreen application grid with live search and glassmorphic backdrop.

### 6. Dynamic BSP Tiling Mode (Hyprland)
- Real-time binary tree tiling with per-workspace layouts.
- Keyboard navigation (Alt+Arrow), split resizing (Ctrl+Alt+Arrow), and drag-to-swap window positions.
- Live configuration reloading via Settings or `Config/yukiOs/tiling.conf`.
- Built-in `hyprctl` CLI command in terminal.

### 7. sitalOS Deck & 3D Interactive Room
- Fullscreen console navigation designed for gamepad and keyboard controls.
- Game library manager with sorting, favorite pinning, and playtime stats.
- 3D interactive virtual room with interactive computer monitor and physical game cartridges.

### 8. Electron Desktop Packaging
- Standalone Windows installer: `sitalOS.Setup.exe` built via NSIS.
- Native system tray integration, global shortcuts, and offline application support.

---

## 60+ Built-in Applications

sitalOS includes a complete ecosystem of desktop applications:

- **Productivity & Office:** Kagaj AI Document Assistant, Text Editor, Markdown Viewer, PDF Reader, Calculator, Sticky Notes, Calendar.
- **Development & Tools:** Terminal (WASM shell with Python, Node, C tools), Monaco Code Editor, Git Manager, Process Manager, Port Manager, Storage Inspector.
- **Files & Media:** File Explorer with archive support (ZIP, 7Z, TAR, RAR), Music Player, Video Player, Photo Gallery, Screen Recorder, Canvas Paint.
- **Games & Emulators:** Subway Surfers, Flash Player emulator, DOSBox emulator, Retro console emulators, Steam social feed.
- **System Settings:** Desktop Mode Switcher, Theme Customizer (25+ themes), Wallpaper Engine, Audio Mixer, Keybind Manager.

---

## System Architecture

sitalOS uses a shared-state architecture. Switching desktop environments (such as switching from macOS to Kali Linux or Hyprland tiling) does not close your running applications or reset your virtual filesystem.

```
                      ┌───────────────────────────────────────┐
                      │          sitalOS Core Engine          │
                      │  (App Registry, EventBus, VFS Layer)  │
                      └──────────────────┬────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼                                ▼                                ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│   macOS Shell   │            │   Kali Linux    │            │ Hyprland Tiling │
│ (Dock & TopBar) │            │  (XFCE Panel)   │            │   (BSP Engine)  │
└───────┬─────────┘            └────────┬────────┘            └────────┬────────┘
        │                               │                              │
        ├───────────────────────────────┼──────────────────────────────┤
        │                               │                              │
        ▼                               ▼                              ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│  Mobile Shells  │            │ sitalOS Deck UI │            │  3D Room Mode   │
│(Pixel/NetHunter)│            │(Gamepad Console)│            │(Three.js Scene) │
└───────┬─────────┘            └────────┬────────┘            └────────┬────────┘
        │                               │                              │
        └───────────────────────────────┼──────────────────────────────┘
                                        │
                                        ▼
                     ┌───────────────────────────────────────┐
                     │            Window Manager             │
                     │  (Snap, Minimize, Z-Index, Workspaces)│
                     ├───────────────────────────────────────┤
                     │   IndexedDB / Blob Storage VFS Layer  │
                     └───────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- pnpm or npm

### Installation
```bash
git clone https://github.com/sitalcha/sitalOS.git
cd sitalOS/webos-desktop
pnpm install
```

### Run in Development Mode
```bash
pnpm dev
```
Open your browser and navigate to `http://localhost:5173`.

### Build for Production
```bash
pnpm build
```
The optimized build artifacts will be generated in `webos-desktop/dist/`.

---

## cPanel & Web Hosting Deployment

1. Run `pnpm build` inside the `webos-desktop/` folder.
2. Open your cPanel File Manager and navigate to `public_html/`.
3. Upload all contents from the `webos-desktop/dist/` directory into `public_html/`.
4. To add your own custom songs to the Music Player:
   - Navigate to `public_html/music/`.
   - Upload your MP3 files named `track1.mp3`, `track2.mp3`, `track3.mp3`, `track4.mp3`, `track5.mp3`.
   - Optionally upload cover images named `cover1.jpg`, `cover2.jpg`, `cover3.jpg`, `cover4.jpg`, `cover5.jpg`.
5. Access your website at your domain (e.g. `https://sitalc.com.np`).

---

## Building the Desktop Application

To package sitalOS as a native desktop application for Windows:

```bash
cd webos-desktop
pnpm build:electron:win
```

The output executable will be created at `webos-desktop/dist-electron/sitalOS.Setup.1.0.0.exe`.

---

## Global Shortcuts

| Key Combination | Action |
| :--- | :--- |
| `Ctrl + K` / `F1` | Command Palette (search apps, commands, files) |
| `Ctrl + Alt + R` | Quick Run Dialog |
| `Ctrl + D` | Show or Hide Desktop |
| `Alt + Q` | Cycle active window focus |
| `Ctrl + Shift + S` | Fullscreen screenshot capture |
| `Ctrl + Alt + S` | Area screenshot capture |
| `Ctrl + Arrow` | Window edge snapping (left, right, top, bottom) |
| `F4` | Open macOS Launchpad |
| `Alt + Space` | Toggle Hyprland tiling layout |

---

## Author & Credits

- **Creator & Maintainer:** Sital Bahadur Chaudhari ([Website](https://sitalc.com.np/) | [GitHub](https://github.com/sitalcha))
- **Base Project:** Based on YukiOS by Reeyuki ([GitHub](https://github.com/Reeyuki/YukiOS))
- **License:** Distributed under the BSD 3-Clause License. See [LICENSE](LICENSE) for details.