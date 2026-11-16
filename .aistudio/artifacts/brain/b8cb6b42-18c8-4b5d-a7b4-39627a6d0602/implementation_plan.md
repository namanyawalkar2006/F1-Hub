# Implementation Plan - F1 Hub Next-Gen Redesign

## Goal
Transform F1 Hub into the most stunning, immersive Formula 1 real-time experience with a carbon fibre & neon red motorsport aesthetic, centered speed-blur countdown animation upon entry, ultra-slick live telemetry updates, and removal of zero-cost tier badges in favor of a clean, premium broadcast-grade presentation.

## Proposed Changes

### 1. Visual Theme & Aesthetics
- **Carbon Fibre & Neon Red Styling**: Update tailwind styles and CSS variables in `/src/index.css` with carbon fibre subtle background patterns, glowing neon red (`#ff1801`) accents, glassmorphism telemetry panels, and high-contrast motorsport typography.
- **Header & Navigation**: Redesign navigation with glowing active indicators, subtle team color glows, and sleek motorsport branding.

### 2. Centered Hero & Speed-Blur Countdown Animation
- **Hero Section (`/src/components/home/HomeView.tsx`)**:
  - Center the next session countdown with an ultra-smooth Framer Motion speed-blur entry animation.
  - Add glowing radial gradients and live telemetry pulse rings around the timer.
  - Display verified next session details with circuit maps and track conditions.

### 3. Live Section & Telemetry Enhancement (`/src/components/live/`)
- **LiveView & LiveTimingTable**:
  - Remove any "zero-cost" or "free tier" disclaimer banners.
  - Implement fluid Framer Motion spring layout animations for driver position changes.
  - Add real-time telemetry pulse indicators, tyre compound badges with realistic degradation glow, and sector timing highlights.
  - Add live session switcher with instant replay capability.

### 4. Supporting Views
- **CalendarView**: Stunning race card grid with carbon fibre cards and countdown indicators.
- **StandingsView**: Interactive driver and constructor championship tables with neon red accent bars.
- **ResultsView**: Detailed race and qualifying classification tabs.

## Verification Plan
- **Automated Tests**: Run `npm test` to verify backend and state utilities.
- **Build Verification**: Run `compile_applet` to ensure TypeScript compilation and asset bundling succeed without errors.
