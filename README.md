# Climora 🌤️

**Climora** is a sleek, modern, and lightweight real-time weather application built to deliver precise forecasts, atmospheric metrics, and intuitive weather insights with a clean, responsive interface.

---

## 📌 Project Overview

Climora is designed to be fast, reliable, and accessible across all devices. By relying on native web standards without bulky external dependencies, Climora offers optimal load times, zero build overhead, and a transparent, modular architecture.

---

## 🛠️ Technology Stack

- **Markup:** HTML5 (Semantic, accessible document structure)
- **Styling:** CSS3 (Custom properties/tokens, Flexbox, CSS Grid, media queries for responsive layouts)
- **Scripting:** Vanilla JavaScript (ES6+ modular code structure, Fetch API, async/await)

---

## 🗂️ Project Structure

```text
Climora/
│
├── index.html            # Main HTML entry point linking styles and scripts
│
├── css/
│   ├── variables.css     # Central design tokens (palette, typography, spacing, shadows)
│   ├── style.css         # Global resets, typography, layout, and component styling
│   └── responsive.css    # Responsive breakpoints and mobile-first adjustments
│
├── js/
│   ├── app.js            # Main application bootstrap and event orchestration
│   ├── api.js            # Weather API communication and data fetching
│   ├── ui.js             # UI rendering, DOM updates, and display states
│   └── utils.js          # Pure helper functions (conversions, formatting, debouncing)
│
├── assets/
│   ├── icons/            # Weather condition icons and UI glyphs
│   ├── images/           # Application graphics, backgrounds, and illustrations
│   └── fonts/            # Custom web fonts (if needed)
│
├── .gitignore            # Clean git configuration excluding OS/IDE clutter
└── README.md             # Project documentation and roadmap
```

---

## 🚀 Upcoming Features

- **Real-Time Weather Metrics:** Current temperature, humidity, wind speed, pressure, UV index, and visibility.
- **Dynamic City Search & Geolocation:** Instant city lookup with debounced autocomplete and optional browser geolocation detection.
- **Hourly & 5-Day Forecasts:** Visual temperature curves and daily condition summaries.
- **Unit Switching:** Seamless toggle between Celsius (°C) and Fahrenheit (°F).
- **Adaptive Visual Themes:** Dynamic background transitions or themes matching current weather conditions and time of day (day/night).
- **Offline / Caching Resilience:** Graceful error handling and cached data fallbacks for intermittent connectivity.

---

## 💻 Getting Started

Because Climora is built entirely with standard vanilla web technologies, no installation or compilation step is needed:

1. Clone or download the repository.
2. Open `index.html` directly in any modern web browser, or launch it with a local development server (such as VS Code *Live Server*).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
