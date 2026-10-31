/**
 * Climora - UI Controller Module
 * Manages DOM updates, renders live meteorological data,
 * controls atmospheric visual themes, and manages loading and error states.
 */

const UIController = {
  // Weather background theme classes supported by CSS
  WEATHER_CLASSES: [
    'weather-clear',
    'weather-cloudy',
    'weather-rainy',
    'weather-stormy',
    'weather-snowy',
    'weather-foggy'
  ],

  /**
   * Caches and returns all DOM elements targeted by the dashboard.
   */
  getElements() {
    return {
      searchForm: document.getElementById('search-form'),
      searchInput: document.getElementById('search-input'),
      searchSubmitBtn: document.getElementById('btn-search-submit'),
      searchStatus: document.getElementById('search-status'),
      recentSearchesList: document.getElementById('recent-searches-list'),

      // Current Weather Hero
      cityHeading: document.getElementById('current-city'),
      countryBadge: document.getElementById('current-country'),
      currentDateTime: document.getElementById('current-datetime'),
      temperature: document.getElementById('current-temperature'),
      weatherCondition: document.getElementById('weather-condition'),
      weatherDescription: document.getElementById('weather-description'),
      weatherIcon: document.getElementById('current-weather-icon'),
      feelsLike: document.getElementById('feels-like-temp'),
      tempHigh: document.getElementById('temp-high'),
      tempLow: document.getElementById('temp-low'),

      // Weather Insights
      humidity: document.getElementById('metric-humidity'),
      humidityCaption: document.getElementById('metric-humidity-caption'),
      windSpeed: document.getElementById('metric-wind-speed'),
      windDirection: document.getElementById('metric-wind-direction'),
      pressure: document.getElementById('metric-pressure'),
      pressureStatus: document.getElementById('metric-pressure-status'),
      sunriseTime: document.getElementById('metric-sunrise-time'),
      sunsetTime: document.getElementById('metric-sunset-time')
    };
  },

  /**
   * Updates the visual loading state during network requests.
   * Disables the search submit button and displays a progress status message.
   *
   * @param {boolean} isLoading - Whether a request is currently active
   * @param {string} [message='Loading weather data...'] - Accessible feedback text
   */
  setLoading(isLoading, message = 'Loading weather data...') {
    const { searchSubmitBtn, searchStatus } = this.getElements();

    if (searchSubmitBtn) {
      searchSubmitBtn.disabled = isLoading;
      const btnLabel = searchSubmitBtn.querySelector('.btn-label');
      if (btnLabel) {
        btnLabel.textContent = isLoading ? 'Searching...' : 'Search';
      }
    }

    if (searchStatus) {
      if (isLoading) {
        searchStatus.hidden = false;
        searchStatus.className = 'search-status status-loading';
        searchStatus.textContent = message;
      } else if (searchStatus.classList.contains('status-loading')) {
        searchStatus.hidden = true;
        searchStatus.textContent = '';
      }
    }
  },

  /**
   * Displays an accessible, styled error message to the user.
   *
   * @param {string} message - Descriptive error explanation
   */
  showError(message) {
    const { searchStatus } = this.getElements();
    if (!searchStatus) return;

    searchStatus.hidden = false;
    searchStatus.className = 'search-status status-error';
    searchStatus.textContent = message;
  },

  /**
   * Clears any active error or loading messages.
   */
  clearStatus() {
    const { searchStatus } = this.getElements();
    if (!searchStatus) return;

    searchStatus.hidden = true;
    searchStatus.className = 'search-status';
    searchStatus.textContent = '';
  },

  /**
   * Sets the atmospheric background class on <body> matching the current weather condition.
   *
   * @param {string} newClass - The active weather theme class (e.g., 'weather-rainy')
   */
  setAtmosphericTheme(newClass) {
    this.WEATHER_CLASSES.forEach((cls) => document.body.classList.remove(cls));
    if (newClass) {
      document.body.classList.add(newClass);
    }
  },

  /**
   * Populates the dashboard elements with live meteorological data from Open-Meteo.
   *
   * @param {Object} location - { name, country, admin1 } from Geocoding API
   * @param {Object} weather - Raw Open-Meteo payload containing `current` and `daily`
   */
  updateWeather(location, weather) {
    const el = this.getElements();
    const current = weather.current || {};
    const daily = weather.daily || {};

    // 1. Location and Time Metadata
    if (el.cityHeading) {
      el.cityHeading.textContent = location.name;
    }

    if (el.countryBadge) {
      el.countryBadge.textContent = location.country || 'GLOBAL';
    }

    if (el.currentDateTime) {
      el.currentDateTime.textContent = Utils.formatCurrentDate();
    }

    // 2. Weather Condition & Theme Mapping
    const weatherCode = typeof current.weather_code === 'number' ? current.weather_code : 0;
    const isDay = typeof current.is_day === 'number' ? current.is_day : 1;
    const condition = Utils.getWeatherCondition(weatherCode, isDay);

    if (el.weatherCondition) {
      el.weatherCondition.textContent = condition.description;
    }

    if (el.weatherDescription) {
      el.weatherDescription.textContent = condition.summary;
    }

    if (el.weatherIcon) {
      el.weatherIcon.innerHTML = condition.iconSvg;
    }

    // Switch atmospheric lighting & animation layer on <body>
    this.setAtmosphericTheme(condition.weatherClass);

    // 3. Hero Temperature & Extremes
    if (el.temperature) {
      el.temperature.textContent = Utils.round(current.temperature_2m);
    }

    if (el.feelsLike) {
      el.feelsLike.textContent = `${Utils.round(current.apparent_temperature)}°`;
    }

    // Daily High and Low
    if (daily.temperature_2m_max && daily.temperature_2m_max[0] !== undefined && el.tempHigh) {
      el.tempHigh.textContent = `${Utils.round(daily.temperature_2m_max[0])}°`;
    }

    if (daily.temperature_2m_min && daily.temperature_2m_min[0] !== undefined && el.tempLow) {
      el.tempLow.textContent = `${Utils.round(daily.temperature_2m_min[0])}°`;
    }

    // 4. Weather Insights Cards
    // Humidity & Cloud Cover
    if (el.humidity) {
      el.humidity.textContent = `${Utils.round(current.relative_humidity_2m)}%`;
    }

    if (el.humidityCaption) {
      const cloudCover = typeof current.cloud_cover === 'number' ? current.cloud_cover : 0;
      el.humidityCaption.textContent = `Cloud cover: ${cloudCover}%`;
    }

    // Wind Speed & Direction
    if (el.windSpeed) {
      el.windSpeed.textContent = `${Utils.round(current.wind_speed_10m)} km/h`;
    }

    if (el.windDirection) {
      const direction = Utils.getCompassDirection(current.wind_direction_10m);
      el.windDirection.textContent = `Direction: ${direction} (${Utils.round(current.wind_direction_10m)}°)`;
    }

    // Atmospheric Pressure
    if (el.pressure) {
      el.pressure.textContent = `${Utils.round(current.pressure_msl)} hPa`;
    }

    if (el.pressureStatus) {
      const p = current.pressure_msl;
      const trend = p > 1013.25 ? 'High pressure system' : 'Low pressure system';
      el.pressureStatus.textContent = trend;
    }

    // Sunrise & Sunset (from today's daily record)
    if (daily.sunrise && daily.sunrise[0] && el.sunriseTime) {
      el.sunriseTime.textContent = Utils.formatTime(daily.sunrise[0]);
    }

    if (daily.sunset && daily.sunset[0] && el.sunsetTime) {
      el.sunsetTime.textContent = Utils.formatTime(daily.sunset[0]);
    }
  },

  /**
   * Renders the interactive Recent Searches list in the DOM.
   *
   * @param {Array<string>} recentSearches - Array of recently searched city names
   * @param {Function} onSelectCity - Callback invoked when a city pill is clicked
   */
  renderRecentSearches(recentSearches, onSelectCity) {
    const { recentSearchesList } = this.getElements();
    if (!recentSearchesList) return;

    recentSearchesList.innerHTML = '';

    if (!recentSearches || recentSearches.length === 0) {
      const emptyState = document.createElement('span');
      emptyState.className = 'recent-searches-empty';
      emptyState.textContent = 'No recent searches';
      recentSearchesList.appendChild(emptyState);
      return;
    }

    recentSearches.forEach((city) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'recent-search-chip';
      chip.textContent = city;
      chip.setAttribute('aria-label', `Search weather for ${city}`);

      chip.addEventListener('click', () => {
        if (typeof onSelectCity === 'function') {
          onSelectCity(city);
        }
      });

      recentSearchesList.appendChild(chip);
    });
  }
};
