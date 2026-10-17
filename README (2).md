# SUNBANK — Grid-Adaptive BESS & Solar Forecasting System

> **SIH 2026 Initiative** — Next-Generation Predictive Solar Irradiance Forecasting & Grid-Adaptive Battery Energy Storage Optimization for the Indian National Power Grid (NLDC/POSOCO compliance).

---

## 📋 Overview

**SUNBANK** is an industrial-grade Solar Energy Management & Battery Energy Storage System (BESS) SCADA dashboard. It integrates real-time telemetry, probabilistic irradiance forecasting with weather satellites (INSAT-3DR/3DS), AI dispatch algorithms, climate stress sandbox testing, and digital twin health monitoring across major Indian solar parks (Bhadla, Pavagada, Rewa, Dholera, Kurnool).

---

## 🗂️ Project Directory Structure

```text
├── index.html                  # HTML5 entry point with Inter & JetBrains Mono typography
├── package.json                # Project dependencies, scripts, and build metadata
├── tsconfig.json               # TypeScript compiler configuration (strict mode)
├── vite.config.ts              # Vite 6 bundler config with Tailwind CSS v4 & React plugin
├── metadata.json               # Application capabilities & platform metadata
├── .env.example                # Sample environment variables
│
├── public/                     # Static public assets
│   ├── assets/
│   │   └── images/             # High-resolution satellite, solar park, and atmospheric assets
│   │       ├── dramatic_storm_rain_1790175207087.jpg
│   │       ├── hero_solar_sunrise_1790173377713.jpg
│   │       ├── india_solar_space_1790184146516.jpg
│   │       └── lush_solar_hills_1790175187133.jpg
│   ├── sunbank-qr.png          # App QR code (PNG)
│   ├── sunbank-qr.svg          # App QR code (Vector SVG)
│   └── sunbank-project.zip     # Downloadable complete project ZIP bundle
│
└── src/                        # Application source code
    ├── main.tsx                # React DOM root bootstrapping
    ├── App.tsx                 # Core application shell & navigation router
    ├── types.ts                # TypeScript domain models (Telemetry, Plants, Scenarios, BESS)
    ├── index.css               # Tailwind CSS v4 styles & custom SCADA utilities
    │
    ├── assets/                 # Code-bundled assets & local image imports
    │   ├── images.ts           # Central image asset dictionary & fallback resolver
    │   └── images/             # Atmospheric & weather scenario imagery
    │       ├── dramatic_storm_rain_1790175207087.jpg
    │       ├── hero_solar_sunrise_1790173377713.jpg
    │       ├── india_solar_space_1790184146516.jpg
    │       ├── lush_solar_hills_1790175187133.jpg
    │       ├── sandbox_monsoon_sky_1790173431075.jpg
    │       ├── sandbox_stubble_haze_1790173523436.jpg
    │       ├── sandbox_summer_heat_1790173499588.jpg
    │       ├── sandbox_winter_fog_1790173458764.jpg
    │       └── solar_sunburst_panels_1790176243916.jpg
    │
    ├── components/             # Modular dashboard views & navigational UI
    │   ├── Header.tsx          # Top bar with live grid status, active park selector & quick nav
    │   ├── HeroPage.tsx        # High-impact mission landing page with national KPI badges
    │   ├── ControlRoomPage.tsx # Master SCADA telemetry, live BESS flow, & ramp-rate monitoring
    │   ├── ProbabilisticPage.tsx# P10/P50/P90 quantile irradiance forecast & INSAT satellite layer
    │   ├── DigitalTwinPage.tsx # 3D cell-level BESS degradation, thermal map & string health
    │   ├── ClimateSandboxPage.tsx # Monsoon/dust/fog/heatwave stress testing simulation
    │   └── Footer.tsx          # Footer with system telemetry timestamps & links
    │
    └── data/                   # Simulation datasets & botanical/weather fixtures
        └── mockData.ts         # High-resolution telemetry fixtures, plant metrics & stress presets
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** >= 18.0.0 (or Bun / pnpm / yarn)
- **npm** >= 9.0.0

### Installation

1. **Extract the ZIP file** to your preferred workspace folder:
   ```bash
   unzip sunbank-project.zip -d sunbank-app
   cd sunbank-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000` to interact with the dashboard.

4. **Build for production**:
   ```bash
   npm run build
   ```
   The compiled distribution bundle will be created inside the `dist/` directory.

5. **Typecheck & Lint**:
   ```bash
   npm run lint
   ```

---

## ⚡ Tech Stack

- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Motion
- **QR / Asset Utilities**: qrcode

---

## 🇮🇳 Target Solar Parks Included

- **Bhadla Solar Park** (Rajasthan) — 2,245 MW
- **Pavagada Solar Park** (Karnataka) — 2,050 MW
- **Rewa Ultra Mega Solar** (Madhya Pradesh) — 750 MW
- **Dholera Solar Park Phase-I** (Gujarat) — 1,000 MW
- **Kurnool Ultra Mega Solar** (Andhra Pradesh) — 1,000 MW
