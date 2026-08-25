# 🕒 TokiLink for Seiko

<a href="https://midnightlogic.github.io/tokilink/" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/Live%20PWA-midnightlogic.github.io%2Ftokilink-4f46e5?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Web App"></a>
<a href="https://opensource.org/licenses/Apache-2.0" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge" alt="License: Apache 2.0"></a>

> 🚀 **Live Web App:** <a href="https://midnightlogic.github.io/tokilink/" target="_blank" rel="noopener noreferrer">**https://midnightlogic.github.io/tokilink/**</a>

<p align="center">
  <a href="https://midnightlogic.github.io/tokilink/" target="_blank" rel="noopener noreferrer">
    <img src="src/demo.gif" alt="TokiLink for Seiko Live Demo" width="680" style="max-width: 100%; border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,0.35);">
  </a>
</p>

**TokiLink for Seiko** is an unofficial, high-precision **Progressive Web App (PWA)** that unifies and controls **all Bluetooth-enabled Seiko digital, multi-sound, and NexTime clocks** directly from your web browser. 

Using modern **Web Bluetooth**, TokiLink replaces multiple proprietary, region-locked mobile apps with a single, elegant, privacy-first web application that runs on **Android, Windows, macOS, ChromeOS, Linux, and iOS**.

> [!NOTE]
> **Legal Disclaimer:** **TokiLink for Seiko** is an independent, open-source community project. It is **not affiliated with, endorsed by, or sponsored by Seiko Group Corporation, Seiko Clock Inc., or any of their subsidiaries**. All product names, trademarks, and model identifiers belong to their respective owners and are used strictly for hardware compatibility and identification under nominative fair use.

---

## 🏷️ Supported Seiko Clock Models

TokiLink unifies models across all official Seiko clock apps into one universal application:

| Series | Supported Models | Key Capabilities & Features |
| :--- | :--- | :--- |
| **Multi-Sound Clocks** *(Onkyo Speaker Series)* | **SS501A / SS501K** *(Wide)*<br>**SS201W / SS201K** *(Upright)* | • Atomic Time Sync<br>• Multi-Schedule Dual Alarms (Melody / FM Radio, Volume, Snooze)<br>• FM Radio Tuner (76.0–108.0 MHz) & 5 Customizable Station Presets<br>• 5-Level Display Brightness & 4-Level Bass Boost<br>• Sleep Relaxation Timer & Auto Power-Off |
| **Series C3** *(Gradient Color LED Series)* | **DL308K** *(DL308 Series)* | • Atomic NTP Time Synchronization<br>• World Timezone Offset Slider (UTC−12 to UTC+14)<br>• Custom Datetime Calibration |
| **Standard Digital** *(SQ Series)* | **SQ820W / SQ820K**<br>**SQ821W / SQ821K** | • Atomic NTP Time Synchronization<br>• World Timezone Offset Slider (UTC−12 to UTC+14)<br>• Custom Datetime Calibration |
| **NexTime Series** *(Hybrid Multi-Sync Clocks)* | **ZS450S** *(Digital Wall/Desk)*<br>**ZS451S** *(Wall + Calendar/Temp/Humidity)*<br>**ZS250S / ZS250W**<br>**ZS251S / ZS251W**<br>**ZS252S / ZS252W / ZS252B**<br>**ZS253S / ZS253W**<br>**ZS254S**, **ZS255W**, **ZS256B**<br>**QHB201SM / QHB201WM** | • Atomic NTP Time Synchronization<br>• World Timezone Offset Slider (UTC−12 to UTC+14)<br>• Custom Datetime Calibration |

---

## 🌟 Comprehensive Feature Guide

### ⚡ 1. Zero-Install Atomic Time Synchronization
- **One-Click Instant Sync**: Calibrate your clock to the exact millisecond in seconds.
- **NTP Network Latency Compensation**: Pre-fetches atomic UTC time and calculates round-trip time (RTT) offsets before transmitting to the clock for laboratory-grade precision.
- **Adaptive UI**: Automatically focuses on the clean **Time** sync screen for digital clocks while seamlessly revealing audio and radio controls when a Multi-Sound model is connected.

### 🌍 2. World Timezone & Custom Datetime Mode
- **Interactive Global Slider**: Smoothly adjust your clock's time across **UTC−12:00 to UTC+14:00** with live city landmarks (e.g., Tokyo, London, New York, Sydney).
- **Stepper Buttons & Home Reset**: Quick `+` and `−` stepping for rapid timezone jumps with a single-tap reset to your local home time.
- **Custom Datetime Input**: Manually specify exact dates and times for testing, daylight saving verification, or custom offsets.

### ⏰ 3. Multi-Schedule Alarms *(Multi-Sound Series: SS501 / SS201)*
- **Dual Independent Alarms**: Configure Alarm 1 and Alarm 2 with distinct wake-up times and recurrence.
- **Day-of-Week Scheduling**: Select specific active days (Monday through Sunday) with quick presets for *Weekdays* or *Weekends*.
- **Wake-Up Sound Selection**: Choose between pleasant onboard chime melodies or wake up to your favorite FM radio preset.
- **Volume & Snooze Controls**: Customize wake-up volume (levels 1–30) and toggle 5-minute snooze repetition.

### 📻 4. FM Radio Tuner & 5 Station Presets *(Multi-Sound Series: SS501 / SS201)*
- **Full Band Coverage**: Tune across the entire **76.0 MHz to 108.0 MHz** FM band.
- **Precision Stepper & Seek**: Step up/down by 0.1 MHz or use auto-seek to find local broadcasting channels.
- **5 Customizable Station Presets**: Store your favorite radio stations with personalized station names and instant one-tap recall.
- **Master Volume Control**: Adjust radio listening volume smoothly from 0 to 30.

### 💡 5. Display & Sound Controls *(Multi-Sound Series: SS501 / SS201)*
- **5-Level Display Brightness**: Dim the clock display for night-time bedside use or brighten it for sunlit rooms.
- **4-Level Bass Boost**: Enhance audio richness and low-end depth for Onkyo speaker output.
- **Sleep & Relaxation Timer**: Set a countdown timer (15, 30, 60, 90, or 120 minutes) with soothing audio playback before automatic shutdown.
- **Auto Power-Off**: Save power with configurable inactivity standby timers.

### 📱 6. Progressive Web App (PWA) & Offline Capability
- **Installable Desktop & Mobile App**: Add TokiLink to your Home Screen or Desktop as a standalone app with full offline caching via Service Workers.
- **Automatic In-App Update Notifications**: Seamlessly alerts you when a new version or feature update is available with 1-click reload.

### 🎨 7. Modern Glassmorphic Design & Multi-Language Support
- **Vibrant Dark & Light Modes**: Beautiful frosted glass cards, glowing plasma sync button, and dynamic visual state indicators.
- **6 Supported Languages**: Fully localized in:
  - 🇺🇸 **English** (`en`)
  - 🇯🇵 **Japanese** (`ja`)
  - 🇫🇷 **French** (`fr`)
  - 🇪🇸 **Spanish** (`es`)
  - 🇩🇪 **German** (`de`)
  - 🇨🇳 **Simplified Chinese** (`zh`)

---

## 🌐 Browser & Platform Compatibility

Web Bluetooth (`navigator.bluetooth`) requires a secure HTTPS connection and browser support:

| Platform | Recommended Browsers | Compatibility | Notes |
| :--- | :--- | :---: | :--- |
| **Android** | **Chrome**, **Edge**, **Samsung Internet**, **Opera** | ✅ **Full Support** | Native Web Bluetooth & 1-click PWA install |
| **Android — Brave** | **Brave Browser** | ⚠️ **Flag Required** | Enable `brave://flags/#brave-web-bluetooth-api` and Relaunch |
| **Windows / macOS / Linux / ChromeOS** | **Chrome**, **Edge**, **Opera** | ✅ **Full Support** | Native Web Bluetooth *(Tip: enable `#enable-web-bluetooth-new-permissions-backend` for 1-click zero-dialog sync)* |
| **Windows / macOS / Linux — Brave** | **Brave Browser** | ⚠️ **Flag Required** | Enable `brave://flags/#brave-web-bluetooth-api` and Relaunch |
| **iOS (iPhone / iPad) — Native Safari** | **[Beacio Safari Extension](https://beacio.com/)** | ✅ **Supported in Safari + PWA** | Web Bluetooth extension for Safari. Supports **Share → Add to Home Screen** to install as a standalone PWA! |
| **iOS (iPhone / iPad) — Dedicated App** | **[Bluefy Browser](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055)** | ✅ **Supported via App** | Dedicated Web Bluetooth browser from the App Store. Ready out-of-the-box. |

> [!TIP]
> **Using on iPhone / iPad:**
> 1. **Option 1 (Fastest Setup — Dedicated Browser):** Install **[Bluefy Browser](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055)** from the App Store. TokiLink will launch and sync immediately.
> 2. **Option 2 (Home Screen PWA App):** Install the free **[Beacio Extension](https://beacio.com/)** from the App Store, enable it in *Settings → Safari → Extensions*, then open TokiLink in Safari and tap **Share → Add to Home Screen**!

> [!TIP]
> **Using on Brave Browser (Desktop & Android):**
> Brave blocks Web Bluetooth by default. To enable:
> 1. Paste `brave://flags/#brave-web-bluetooth-api` into the address bar and set to **Enabled**.
> 2. *(Recommended)* Set **Use the new permissions backend for Web Bluetooth** (`#enable-web-bluetooth-new-permissions-backend`) to **Enabled**.
> 3. Click **Relaunch**.

---

## 🚀 Getting Started for Developers

### Prerequisites
- Node.js (v18 or higher)
- A Web Bluetooth compatible browser (Google Chrome, Microsoft Edge, Opera, or Samsung Internet)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/midnightlogic/tokilink.git
cd tokilink

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

### Local HTTPS Tunnel for Mobile Device Testing

```bash
# Start Vite dev server with Cloudflare HTTPS Tunnel
npm run tunnel

# Start Production Bundle with Cloudflare Tunnel (for testing true offline PWA install)
npm run tunnel:prod
```

### Production Build

```bash
# Build optimized production bundle
npm run build:fast

# Preview production build locally
npm run preview
```

---

## 🔒 Privacy & Security

- **100% Client-Side Execution**: All Bluetooth communication and time computations take place entirely within your browser sandbox.
- **Zero Tracking / No Analytics**: No personal data, device identifiers, or MAC addresses are ever collected or sent to external servers.
- **Open-Source Transparency**: Complete source code is openly audited and available on GitHub under the Apache 2.0 License.

---

## 📄 License & Trademark Notice

- **Software License:** Apache License, Version 2.0. Copyright © 2026 MidnightLogic.
- **Trademark Notice:** Seiko®, Series C3, NexTime, and model designations (SS501, SS201, DL308, SQ820, SQ821, ZS450, ZS451, ZS250..ZS256) are registered trademarks of Seiko Group Corporation / Seiko Clock Inc. This software is an independent third-party implementation.
