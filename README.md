
# Climora 🌤️

A modern, responsive weather application built with HTML5, CSS3, and Vanilla JavaScript. Climora provides real-time weather information, forecasts, atmospheric insights, and location-based weather updates through a clean and interactive interface.

<p align="center">
  <a href="https://climora-kappa.vercel.app/">
    <strong>🌐 Explore Climora — Live Demo</strong>
  </a>
</p>

---

## 📌 Project Overview

Climora is a frontend weather application designed to make weather information accessible through an intuitive and visually engaging experience.

The application retrieves weather data from Open-Meteo APIs and presents it through interactive weather cards, forecasts, charts, and atmospheric insights.

Built using native web technologies, Climora follows a modular JavaScript architecture with centralized CSS design variables, responsive layouts, and browser-based storage.

## ✨ Features

- **Real-Time Weather:** Displays current temperature, weather conditions, humidity, wind speed, atmospheric pressure, UV index, and visibility.
- **City Search:** Search for cities and retrieve their corresponding weather information.
- **Geolocation:** Get weather information based on your current location using browser geolocation.
- **Hourly Forecast:** Explore upcoming hourly weather conditions and temperature changes.
- **5-Day Forecast:** View upcoming weather conditions and daily temperature summaries.
- **Interactive Temperature Charts:** Visualize temperature trends using Chart.js.
- **Multi-City Comparison:** Compare weather conditions across different cities.
- **Favourite Locations:** Save and access favourite cities.
- **Weather Insights:** View additional atmospheric information and weather-based recommendations.
- **Dynamic Interface:** Atmospheric visuals and backgrounds that respond to weather conditions.
- **Responsive Design:** Adaptable interface for desktop, tablet, and mobile devices.
- **Error Handling:** Handles unsuccessful API requests, unavailable location services, and network issues.
- **Local Storage:** Retains supported user preferences and saved information between visits.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic application structure |
| CSS3 | Styling, layouts, animations, and responsive design |
| Vanilla JavaScript (ES6+) | Application logic and interactivity |
| Open-Meteo API | Weather forecasts and geocoding data |
| Chart.js | Interactive temperature visualizations |
| Browser Geolocation API | Current location detection |
| Local Storage | Client-side data persistence |
| Vercel | Hosting and deployment |
| Git & GitHub | Version control and project management |

## 🗂️ Project Structure

```text
Climora/
│
├── index.html
│
├── css/
│   ├── variables.css
│   ├── style.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── api.js
│   ├── ui.js
│   ├── utils.js
│   ├── location.js
│   └── storage.js
│
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
│
├── .gitignore
└── README.md
```

### Architecture Overview

The application follows a modular structure to keep responsibilities separated:

- **app.js:** Main application entry point, event handling, and coordination between modules.
- **api.js:** Handles external API requests and weather data retrieval.
- **ui.js:** Manages DOM updates, weather rendering, and interface interactions.
- **utils.js:** Contains reusable helper functions and data formatting utilities.
- **location.js:** Handles browser geolocation and location-related functionality.
- **storage.js:** Manages browser local storage and persistent application data.
- **variables.css:** Centralized design tokens, including colors, spacing, and other visual properties.
- **style.css:** Main application styling and component layouts.
- **responsive.css:** Responsive styling for different screen sizes.

## 🌐 APIs & Data Sources

Climora uses the following Open-Meteo services:

- **Weather Forecast API:** Retrieves current weather conditions, hourly forecasts, daily forecasts, and atmospheric measurements.
- **Geocoding API:** Converts city names into geographical coordinates.
- **Air Quality API:** Retrieves atmospheric air quality information.

Additional location functionality uses browser geolocation and reverse-geocoding services.

Weather data is provided by [Open-Meteo](https://open-meteo.com/).

Weather data attribution: [Open-Meteo — CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## 💻 Getting Started

You can run Climora locally without installing additional dependencies or configuring a backend.

### 1. Clone the repository

```bash
git clone https://github.com/AimenIkram/Climora.git
```

### 2. Navigate to the project directory

```bash
cd Climora
```

### 3. Run the application

Open the project using VS Code and launch `index.html` with the Live Server extension.

Alternatively, use any local static development server.

**Note:** Running through a local server is recommended for browser features such as geolocation and JavaScript modules.

## 🚀 Deployment

Climora is deployed using Vercel.

The application is hosted as a static website and does not require a backend server.

**Live Application:**  
https://climora-kappa.vercel.app/

## 📚 Learning Outcomes

This project was developed as a hands-on learning experience to strengthen practical frontend development skills.

Throughout its development, I worked on:

- Structuring applications using modular JavaScript.
- Working with external REST APIs and asynchronous JavaScript.
- Handling API responses, errors, and loading states.
- Building responsive layouts using CSS Grid and Flexbox.
- Managing application state and browser local storage.
- Implementing browser geolocation.
- Visualizing weather data using Chart.js.
- Creating reusable utility functions and centralized design variables.
- Debugging and testing application functionality.
- Using Git and GitHub for version control.
- Deploying a static web application using Vercel.

## 👩‍💻 Developer

**Aimen Ikram**

BS Computer Science Student | Frontend Development Enthusiast

- GitHub: [AimenIkram](https://github.com/AimenIkram)
- Project Repository: [Climora](https://github.com/AimenIkram/Climora)
- Live Project: [Climora Weather App](https://climora-kappa.vercel.app/)

---

*Built as a learning project to explore frontend development, API integration, and real-world web application deployment.*
