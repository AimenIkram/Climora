/**
 * Climora - UI Controller Module
 * Manages DOM updates, renders live meteorological data,
 * controls atmospheric visual themes, displays hourly and 5-day forecasts,
 * renders weather insights, updates air quality metrics, orchestrates the temperature chart,
 * manages favourite cities, renders weather recommendations, and powers city comparisons.
 */

const UIController = {
  // Weather background theme classes supported by CSS
  // Weather background theme classes supported by CSS
  WEATHER_CLASSES: [
    'weather-clear',
    'weather-cloudy',
    'weather-rainy',
    'weather-stormy',
    'weather-snowy',
    'weather-foggy'
  ],

  // Real-time atmospheric sky environment classes
  ATMOSPHERE_CLASSES: [
    'atmosphere-sunny-day',
    'atmosphere-partly-cloudy-day',
    'atmosphere-overcast-day',
    'atmosphere-overcast-night',
    'atmosphere-rainy-day',
    'atmosphere-rainy-night',
    'atmosphere-stormy',
    'atmosphere-snowy-day',
    'atmosphere-snowy-night',
    'atmosphere-foggy-day',
    'atmosphere-foggy-night',
    'atmosphere-sunset',
    'atmosphere-clear-night',
    'atmosphere-cloudy-night'
  ],

  // Chart.js instance reference to avoid duplicate canvas instances
  chartInstance: null,

  /**
   * Caches and returns all DOM elements targeted by the dashboard.
   */
  getElements() {
    return {
      searchForm: document.getElementById('search-form'),
      searchInput: document.getElementById('search-input'),
      searchSubmitBtn: document.getElementById('btn-search-submit'),
      btnGeolocation: document.getElementById('btn-geolocation'),
      searchStatus: document.getElementById('search-status'),
      recentSearchesList: document.getElementById('recent-searches-list'),
      btnClearRecent: document.getElementById('btn-clear-recent'),

      // Controls & Atmospheric Indicator
      unitCelsius: document.getElementById('unit-celsius'),
      unitFahrenheit: document.getElementById('unit-fahrenheit'),
      themeToggle: document.getElementById('theme-toggle'),
      atmosphereBadge: document.getElementById('atmosphere-badge'),
      atmosphereIcon: document.getElementById('atmosphere-icon'),
      atmosphereName: document.getElementById('atmosphere-name'),

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
      btnFavouriteToggle: document.getElementById('btn-favourite-toggle'),

      // Smart Weather Recommendations
      recommendationsSection: document.getElementById('recommendations-section'),
      recommendationsList: document.getElementById('recommendations-list'),

      // Hourly Forecast
      hourlyList: document.getElementById('hourly-forecast-list'),

      // Temperature Chart
      tempChartCanvas: document.getElementById('temperature-chart'),

      // 5-Day Forecast
      weeklyList: document.getElementById('weekly-forecast-list'),

      // Weather Insights
      humidity: document.getElementById('metric-humidity'),
      humidityCaption: document.getElementById('metric-humidity-caption'),
      windSpeed: document.getElementById('metric-wind-speed'),
      windDirection: document.getElementById('metric-wind-direction'),
      uvIndex: document.getElementById('metric-uv-index'),
      uvStatus: document.getElementById('metric-uv-status'),
      visibility: document.getElementById('metric-visibility'),
      visibilityStatus: document.getElementById('metric-visibility-status'),
      pressure: document.getElementById('metric-pressure'),
      pressureStatus: document.getElementById('metric-pressure-status'),
      sunriseTime: document.getElementById('metric-sunrise-time'),
      sunsetTime: document.getElementById('metric-sunset-time'),

      // Air Quality Card
      aqiScale: document.getElementById('metric-aqi-scale'),
      aqiValue: document.getElementById('metric-aqi-value'),
      aqiStatus: document.getElementById('metric-aqi-status'),
      pm25: document.getElementById('metric-pm25'),
      pm10: document.getElementById('metric-pm10'),

      // Comparison Section
      comparisonForm: document.getElementById('comparison-form'),
      comparisonInput: document.getElementById('comparison-input'),
      btnAddComparison: document.getElementById('btn-add-comparison'),
      comparisonEmptyState: document.getElementById('comparison-empty-state'),
      comparisonGrid: document.getElementById('comparison-grid'),

      // Favourites Section
      btnAddCurrentFavourite: document.getElementById('btn-add-current-favourite'),
      favouritesEmptyState: document.getElementById('favourites-empty-state'),
      favouritesGrid: document.getElementById('favourites-grid')
    };
  },

  /**
   * Sets the visual theme ('dark' or 'light') on <body> and updates aria attributes.
   *
   * @param {string} theme - 'dark' or 'light'
   */
  setTheme(theme = 'dark') {
    // The visual atmosphere is fully automated based on real-time meteorological conditions
    // and local solar time. Conventional fixed theme overrides are retired.
  },

  /**
   * Synchronizes the temperature unit radio toggle in the header.
   *
   * @param {string} unit - 'celsius' or 'fahrenheit'
   */
  setTemperatureUnit(unit = 'celsius') {
    const el = this.getElements();
    if (unit === 'fahrenheit') {
      if (el.unitFahrenheit) el.unitFahrenheit.checked = true;
    } else {
      if (el.unitCelsius) el.unitCelsius.checked = true;
    }
  },

  /**
   * Updates the visual star button state for the currently active city.
   *
   * @param {boolean} isFavourite - Whether current city is saved in favourites
   */
  setFavouriteActive(isFavourite) {
    const { btnFavouriteToggle, btnAddCurrentFavourite } = this.getElements();

    if (btnFavouriteToggle) {
      btnFavouriteToggle.setAttribute('aria-pressed', isFavourite ? 'true' : 'false');
      btnFavouriteToggle.title = isFavourite ? 'Remove from favourites' : 'Save to favourites';
    }

    if (btnAddCurrentFavourite) {
      const btnText = btnAddCurrentFavourite.querySelector('.btn-text');
      if (btnText) {
        btnText.textContent = isFavourite ? 'Saved in Favourites ✓' : 'Save Current City';
      }
      if (isFavourite) {
        btnAddCurrentFavourite.classList.add('saved');
        btnAddCurrentFavourite.title = 'Current city is saved in favourites';
      } else {
        btnAddCurrentFavourite.classList.remove('saved');
        btnAddCurrentFavourite.title = 'Add current city to favourites';
      }
    }
  },

  /**
   * Determines the array index corresponding to the current local hour.
   * Matches either by YYYY-MM-DDTHH prefix or finds the nearest timestamp.
   *
   * @param {Array<string>} hourlyTimes - Array of ISO time strings
   * @param {string} currentTimeIso - Current local time string from API
   * @returns {number} Zero-based index
   */
  getCurrentHourIndex(hourlyTimes, currentTimeIso) {
    if (!Array.isArray(hourlyTimes) || hourlyTimes.length === 0) return 0;
    if (!currentTimeIso) return 0;

    // Direct prefix match: "YYYY-MM-DDTHH"
    const hourPrefix = currentTimeIso.slice(0, 13);
    const prefixIdx = hourlyTimes.findIndex((t) => typeof t === 'string' && t.startsWith(hourPrefix));
    if (prefixIdx !== -1) return prefixIdx;

    // Fallback: closest millisecond timestamp
    const targetMs = new Date(currentTimeIso).getTime();
    if (isNaN(targetMs)) return 0;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < hourlyTimes.length; i++) {
      const tMs = new Date(hourlyTimes[i]).getTime();
      if (!isNaN(tMs)) {
        const diff = Math.abs(tMs - targetMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
    }
    return closestIdx;
  },

  /**
   * Updates the visual loading state during network requests.
   * Disables the search submit button and displays a progress status message.
   *
   * @param {boolean} isLoading - Whether a request is currently active
   * @param {string} [message='Loading weather data...'] - Accessible feedback text
   */
  setLoading(isLoading, message = 'Loading weather data...') {
    const { searchSubmitBtn, searchStatus, btnGeolocation } = this.getElements();

    if (searchSubmitBtn) {
      searchSubmitBtn.disabled = isLoading;
      const btnLabel = searchSubmitBtn.querySelector('.btn-label');
      if (btnLabel) {
        btnLabel.textContent = isLoading ? 'Searching...' : 'Search';
      }
    }

    if (btnGeolocation) {
      btnGeolocation.disabled = isLoading;
      btnGeolocation.setAttribute('aria-busy', isLoading ? 'true' : 'false');
      const textSpan = btnGeolocation.querySelector('.btn-location-text');
      if (textSpan) {
        textSpan.textContent = isLoading ? 'Locating...' : 'Use My Location';
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
   * Sets the atmospheric sky environment on <body> matching the real-time weather and time of day.
   *
   * @param {Object|string} atmosphere - Output from Utils.determineAtmosphere(weather) or class name
   */
  setAtmosphericTheme(atmosphere) {
    const atmoObj = typeof atmosphere === 'string'
      ? { id: atmosphere, name: 'Live Sky', isDaylight: atmosphere.includes('day') }
      : (atmosphere || { id: 'atmosphere-sunny-day', name: 'Sunny Day', isDaylight: true });

    // Remove legacy and current atmosphere classes
    this.WEATHER_CLASSES.forEach((cls) => document.body.classList.remove(cls));
    this.ATMOSPHERE_CLASSES.forEach((cls) => document.body.classList.remove(cls));

    // Apply active atmosphere
    if (atmoObj.id) {
      document.body.classList.add(atmoObj.id);
    }

    // Toggle daylight contrast class so glass typography and charts maintain perfect contrast
    if (atmoObj.isDaylight) {
      document.body.classList.add('atmosphere-daylight');
      document.body.classList.remove('atmosphere-dark');
    } else {
      document.body.classList.add('atmosphere-dark');
      document.body.classList.remove('atmosphere-daylight');
    }

    // Update Live Atmosphere Indicator Badge in header
    const el = this.getElements();
    if (el.atmosphereName && atmoObj.name) {
      el.atmosphereName.textContent = atmoObj.name;
    }
    if (el.atmosphereIcon && atmoObj.iconSvg) {
      el.atmosphereIcon.innerHTML = atmoObj.iconSvg;
    }
    if (el.atmosphereBadge) {
      el.atmosphereBadge.title = `Live Sky Environment: ${atmoObj.name} — ${atmoObj.summary || ''}`;
      el.atmosphereBadge.setAttribute('aria-label', `Atmospheric Environment: ${atmoObj.name}`);
    }

    // Dynamically calibrate Chart.js colors to match active atmosphere
    if (this.chartInstance) {
      const isDay = atmoObj.isDaylight;
      const isSunset = atmoObj.id === 'atmosphere-sunset';
      const textColor = isDay ? '#0369a1' : isSunset ? '#fed7aa' : '#94a3b8';
      const gridColor = isDay ? 'rgba(12, 74, 110, 0.08)' : 'rgba(255, 255, 255, 0.06)';

      this.chartInstance.options.scales.x.ticks.color = textColor;
      this.chartInstance.options.scales.x.grid.color = gridColor;
      this.chartInstance.options.scales.y.ticks.color = textColor;
      this.chartInstance.options.scales.y.grid.color = gridColor;
      this.chartInstance.update();
    }
  },

  /**
   * Updates loading indicator state for the city comparison add button.
   *
   * @param {boolean} isLoading
   */
  setComparisonLoading(isLoading) {
    const { btnAddComparison } = this.getElements();
    if (!btnAddComparison) return;
    btnAddComparison.disabled = isLoading;
    btnAddComparison.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    const textSpan = btnAddComparison.querySelector('.btn-text');
    if (textSpan) {
      textSpan.textContent = isLoading ? 'Adding...' : '+ Add City';
    }
  },

  /**
   * Dynamically renders smart weather recommendations based on current atmospheric conditions.
   *
   * @param {Object} current - Current weather metrics
   * @param {Object} daily - Daily forecast metrics
   * @param {Object} hourly - Hourly forecast metrics
   * @param {string} [unit='celsius'] - Active temperature unit
   */
  renderRecommendations(current, daily, hourly, unit = 'celsius') {
    const { recommendationsList, recommendationsSection } = this.getElements();
    if (!recommendationsList) return;

    recommendationsList.innerHTML = '';
    const recs = Utils.getWeatherRecommendations(current, daily, hourly, unit);

    if (recs.length === 0) {
      if (recommendationsSection) recommendationsSection.hidden = true;
      return;
    }

    if (recommendationsSection) recommendationsSection.hidden = false;

    recs.forEach((rec) => {
      const card = document.createElement('div');
      card.className = `recommendation-card rec-${rec.type}`;
      card.innerHTML = `
        <div class="rec-icon-wrapper" aria-hidden="true">
          ${rec.iconSvg}
        </div>
        <div class="rec-content">
          <span class="rec-title">${rec.title}</span>
          <p class="rec-text">${rec.text}</p>
        </div>
      `;
      recommendationsList.appendChild(card);
    });
  },

  /**
   * Dynamically renders upcoming 24-hour forecast cards formatted according to the active unit.
   *
   * @param {Object} hourly - Hourly arrays from Open-Meteo
   * @param {Object} current - Current metrics from Open-Meteo
   * @param {string} [unit='celsius'] - Active temperature unit
   */
  renderHourlyForecast(hourly, current, unit = 'celsius') {
    const { hourlyList } = this.getElements();
    if (!hourlyList) return;

    hourlyList.innerHTML = '';

    if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
      hourlyList.innerHTML = '<li class="hourly-empty">Hourly forecast unavailable</li>';
      return;
    }

    const startIdx = this.getCurrentHourIndex(hourly.time, current?.time);
    const endIdx = Math.min(startIdx + 24, hourly.time.length);

    for (let i = startIdx; i < endIdx; i++) {
      const timeIso = hourly.time[i];
      const formattedTime = Utils.formatHourlyTime(timeIso);

      let isDay = 1;
      if (typeof timeIso === 'string' && timeIso.includes('T')) {
        const hour = parseInt(timeIso.split('T')[1].split(':')[0], 10);
        isDay = (hour >= 6 && hour < 19) ? 1 : 0;
      }

      const weatherCode = typeof hourly.weather_code?.[i] === 'number' ? hourly.weather_code[i] : 0;
      const condition = Utils.getWeatherCondition(weatherCode, isDay);
      const tempStr = Utils.formatTemp(hourly.temperature_2m?.[i], unit, true);
      const precipProb = Utils.round(hourly.precipitation_probability?.[i] ?? 0);
      const windSpeed = Utils.round(hourly.wind_speed_10m?.[i] ?? 0);

      const li = document.createElement('li');
      li.className = 'hourly-card';
      li.innerHTML = `
        <time class="hourly-time" datetime="${timeIso}">${formattedTime}</time>
        <div class="hourly-icon" aria-hidden="true" title="${condition.description}">
          ${condition.iconSvg}
        </div>
        <span class="hourly-temp">${tempStr}</span>
        <div class="hourly-meta">
          <div class="hourly-precip" title="Probability of precipitation">
            <svg class="precip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
            <span class="precip-value">${precipProb}%</span>
          </div>
          <div class="hourly-wind" title="Wind speed">
            <svg class="wind-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
            </svg>
            <span class="wind-value">${windSpeed} km/h</span>
          </div>
        </div>
      `;

      hourlyList.appendChild(li);
    }
  },

  /**
   * Dynamically renders the 5-day daily forecast cards with temperatures formatted in the active unit.
   *
   * @param {Object} daily - Daily arrays from Open-Meteo
   * @param {string} [unit='celsius'] - Active temperature unit
   */
  renderDailyForecast(daily, unit = 'celsius') {
    const { weeklyList } = this.getElements();
    if (!weeklyList) return;

    weeklyList.innerHTML = '';

    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      weeklyList.innerHTML = '<li class="daily-empty">Daily forecast unavailable</li>';
      return;
    }

    const totalDays = Math.min(daily.time.length, 5);

    for (let i = 0; i < totalDays; i++) {
      const dateStr = daily.time[i];
      const { dayName, calendarDate } = Utils.formatDailyDate(dateStr, i);
      const weatherCode = typeof daily.weather_code?.[i] === 'number' ? daily.weather_code[i] : 0;
      const condition = Utils.getWeatherCondition(weatherCode, 1);
      const maxTemp = Utils.formatTemp(daily.temperature_2m_max?.[i], unit, true);
      const minTemp = Utils.formatTemp(daily.temperature_2m_min?.[i], unit, true);
      const rainProb = Utils.round(daily.precipitation_probability_max?.[i] ?? 0);

      const li = document.createElement('li');
      li.className = 'daily-forecast-item';
      li.innerHTML = `
        <div class="daily-date-col">
          <span class="daily-day-label">${dayName}</span>
          <span class="daily-calendar-date">${calendarDate}</span>
        </div>
        <div class="daily-condition-group">
          <div class="daily-icon" aria-hidden="true" title="${condition.description}">
            ${condition.iconSvg}
          </div>
          <span class="daily-condition-name">${condition.description}</span>
        </div>
        <div class="daily-precip-indicator" title="Probability of rain">
          <svg class="precip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
          <span class="daily-precip-value">${rainProb}%</span>
        </div>
        <div class="daily-temp-range">
          <span class="temp-high" title="Expected High">${maxTemp}</span>
          <span class="temp-separator" aria-hidden="true">/</span>
          <span class="temp-low" title="Expected Low">${minTemp}</span>
        </div>
      `;

      weeklyList.appendChild(li);
    }
  },

  /**
   * Renders real-time weather insights cards including accurate UV Index,
   * Visibility in km, Atmospheric Pressure, Sunrise, and Sunset.
   *
   * @param {Object} current - Current weather metrics
   * @param {Object} daily - Daily forecast metrics
   * @param {Object} hourly - Hourly forecast metrics
   */
  renderWeatherInsights(current, daily, hourly) {
    const el = this.getElements();
    const curIdx = this.getCurrentHourIndex(hourly?.time, current?.time);

    // 1. Humidity & Cloud Cover
    if (el.humidity) {
      el.humidity.textContent = `${Utils.round(current?.relative_humidity_2m)}%`;
    }
    if (el.humidityCaption) {
      const cloudCover = typeof current?.cloud_cover === 'number' ? current.cloud_cover : 0;
      el.humidityCaption.textContent = `Cloud cover: ${cloudCover}%`;
    }

    // 2. Wind Speed & Direction
    if (el.windSpeed) {
      el.windSpeed.textContent = `${Utils.round(current?.wind_speed_10m)} km/h`;
    }
    if (el.windDirection) {
      const direction = Utils.getCompassDirection(current?.wind_direction_10m);
      el.windDirection.textContent = `Direction: ${direction} (${Utils.round(current?.wind_direction_10m)}°)`;
    }

    // 3. UV Index: Accurate current UV from hourly array & daily max label
    const hourlyUv = (hourly && Array.isArray(hourly.uv_index)) ? hourly.uv_index[curIdx] : null;
    const dailyMaxUv = (daily && Array.isArray(daily.uv_index_max)) ? daily.uv_index_max[0] : null;

    if (el.uvIndex) {
      if (typeof hourlyUv === 'number' && !isNaN(hourlyUv)) {
        el.uvIndex.textContent = Utils.round(hourlyUv, 1);
      } else if (typeof dailyMaxUv === 'number' && !isNaN(dailyMaxUv)) {
        el.uvIndex.textContent = Utils.round(dailyMaxUv, 1);
      } else {
        el.uvIndex.textContent = '--';
      }
    }

    if (el.uvStatus) {
      if (typeof hourlyUv === 'number' && !isNaN(hourlyUv)) {
        const risk = Utils.getUvCategory(hourlyUv);
        const maxStr = typeof dailyMaxUv === 'number' ? ` • Daily Max: ${Utils.round(dailyMaxUv, 1)}` : '';
        el.uvStatus.textContent = `${risk}${maxStr}`;
      } else if (typeof dailyMaxUv === 'number' && !isNaN(dailyMaxUv)) {
        el.uvStatus.textContent = `Daily Max • ${Utils.getUvCategory(dailyMaxUv)}`;
      } else {
        el.uvStatus.textContent = 'UV metrics unavailable';
      }
    }

    // 4. Visibility in Kilometers
    const rawVisMeters = (hourly && Array.isArray(hourly.visibility)) ? hourly.visibility[curIdx] : null;
    if (el.visibility) {
      if (typeof rawVisMeters === 'number' && !isNaN(rawVisMeters)) {
        const km = rawVisMeters / 1000;
        el.visibility.textContent = km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
      } else {
        el.visibility.textContent = '-- km';
      }
    }

    if (el.visibilityStatus) {
      if (typeof rawVisMeters === 'number' && !isNaN(rawVisMeters)) {
        const km = rawVisMeters / 1000;
        const clarity = km >= 10 ? 'Optimal clarity' : km >= 5 ? 'Moderate clarity' : 'Reduced visibility / haze';
        el.visibilityStatus.textContent = `Clarity: ${clarity}`;
      } else {
        el.visibilityStatus.textContent = 'Visibility data unavailable';
      }
    }

    // 5. Atmospheric Pressure
    if (el.pressure) {
      el.pressure.textContent = `${Utils.round(current?.pressure_msl)} hPa`;
    }
    if (el.pressureStatus) {
      const p = current?.pressure_msl;
      if (typeof p === 'number' && !isNaN(p)) {
        el.pressureStatus.textContent = p >= 1013.25 ? 'High pressure system' : 'Low pressure system';
      } else {
        el.pressureStatus.textContent = 'Barometric trend: Steady';
      }
    }

    // 6. Sunrise & Sunset
    if (el.sunriseTime) {
      el.sunriseTime.textContent = daily?.sunrise?.[0] ? Utils.formatTime(daily.sunrise[0]) : '--:--';
    }
    if (el.sunsetTime) {
      el.sunsetTime.textContent = daily?.sunset?.[0] ? Utils.formatTime(daily.sunset[0]) : '--:--';
    }
  },

  /**
   * Renders live air quality metrics from Open-Meteo Air Quality API.
   *
   * @param {Object|null} airQuality - Open-Meteo Air Quality payload
   * @param {Object} current - Current weather object to coordinate local time
   */
  renderAirQuality(airQuality, current) {
    const el = this.getElements();
    if (!el.aqiValue) return;

    if (!airQuality || !airQuality.hourly || !Array.isArray(airQuality.hourly.time)) {
      if (el.aqiValue) el.aqiValue.textContent = '--';
      if (el.aqiScale) el.aqiScale.textContent = 'AQI';
      if (el.aqiStatus) {
        el.aqiStatus.textContent = 'Data Unavailable';
        el.aqiStatus.className = 'aqi-status-pill status-unavailable';
      }
      if (el.pm25) el.pm25.textContent = '--';
      if (el.pm10) el.pm10.textContent = '--';
      return;
    }

    const curIdx = this.getCurrentHourIndex(airQuality.hourly.time, current?.time);
    const usAqi = airQuality.hourly.us_aqi?.[curIdx];
    const eaqi = airQuality.hourly.european_aqi?.[curIdx];
    const pm25 = airQuality.hourly.pm2_5?.[curIdx];
    const pm10 = airQuality.hourly.pm10?.[curIdx];

    let activeScale = 'US AQI';
    let aqiVal = null;
    let rating = { label: 'Unavailable', statusClass: 'status-unavailable' };

    if (typeof usAqi === 'number' && !isNaN(usAqi)) {
      activeScale = 'US AQI';
      aqiVal = Math.round(usAqi);
      rating = Utils.getAqiCategory(usAqi, 'us');
    } else if (typeof eaqi === 'number' && !isNaN(eaqi)) {
      activeScale = 'European AQI';
      aqiVal = Math.round(eaqi);
      rating = Utils.getAqiCategory(eaqi, 'european');
    }

    if (el.aqiScale) {
      el.aqiScale.textContent = activeScale;
      el.aqiScale.title = `Standard: ${activeScale}`;
    }

    if (el.aqiValue) {
      el.aqiValue.textContent = aqiVal !== null ? aqiVal : '--';
    }

    if (el.aqiStatus) {
      el.aqiStatus.textContent = rating.label;
      el.aqiStatus.className = `aqi-status-pill ${rating.statusClass}`;
    }

    if (el.pm25) {
      el.pm25.textContent = (typeof pm25 === 'number' && !isNaN(pm25)) ? Utils.round(pm25, 1) : '--';
    }

    if (el.pm10) {
      el.pm10.textContent = (typeof pm10 === 'number' && !isNaN(pm10)) ? Utils.round(pm10, 1) : '--';
    }
  },

  /**
   * Initializes or updates the responsive 24-hour temperature chart using Chart.js.
   * Converts data points dynamically based on the active unit.
   *
   * @param {Object} hourly - Hourly weather metrics
   * @param {Object} current - Current weather metrics
   * @param {string} [unit='celsius'] - Active temperature unit
   */
  renderTemperatureChart(hourly, current, unit = 'celsius') {
    const { tempChartCanvas } = this.getElements();
    if (!tempChartCanvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    if (typeof Chart === 'undefined') {
      console.warn('Climora: Chart.js library not loaded.');
      return;
    }

    if (!hourly || !Array.isArray(hourly.time) || !Array.isArray(hourly.temperature_2m)) {
      return;
    }

    const startIdx = this.getCurrentHourIndex(hourly.time, current?.time);
    const endIdx = Math.min(startIdx + 24, hourly.time.length);

    const labels = [];
    const temperatures = [];

    for (let i = startIdx; i < endIdx; i++) {
      labels.push(Utils.formatHourlyTime(hourly.time[i]));
      const rawC = hourly.temperature_2m[i];
      const val = unit === 'fahrenheit' ? Math.round(Utils.celsiusToFahrenheit(rawC)) : Math.round(rawC);
      temperatures.push(val);
    }

    if (temperatures.length === 0) return;

    const ctx = tempChartCanvas.getContext('2d');
    const isDaylight = document.body.classList.contains('atmosphere-daylight');
    const isSunset = document.body.classList.contains('atmosphere-sunset');
    const textColor = isDaylight ? '#0369a1' : isSunset ? '#fed7aa' : '#94a3b8';
    const gridColor = isDaylight ? 'rgba(12, 74, 110, 0.08)' : 'rgba(255, 255, 255, 0.06)';
    const chartLineColor = isSunset ? '#f97316' : (isDaylight ? '#0284c7' : '#38bdf8');

    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    if (isSunset) {
      gradient.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
      gradient.addColorStop(0.65, 'rgba(249, 115, 22, 0.08)');
      gradient.addColorStop(1, 'rgba(249, 115, 22, 0.00)');
    } else if (isDaylight) {
      gradient.addColorStop(0, 'rgba(2, 132, 199, 0.30)');
      gradient.addColorStop(0.65, 'rgba(2, 132, 199, 0.06)');
      gradient.addColorStop(1, 'rgba(2, 132, 199, 0.00)');
    } else {
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.32)');
      gradient.addColorStop(0.65, 'rgba(56, 189, 248, 0.08)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0.00)');
    }

    const unitLabel = unit === 'fahrenheit' ? '°F' : '°C';

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `Temperature (${unitLabel})`,
            data: temperatures,
            borderColor: chartLineColor,
            borderWidth: 2.5,
            pointBackgroundColor: chartLineColor,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: chartLineColor,
            pointHoverBorderWidth: 2,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 12, bottom: 6, left: 6, right: 12 }
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDaylight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.94)',
            titleColor: isDaylight ? '#0c4a6e' : '#f8fafc',
            bodyColor: chartLineColor,
            borderColor: isDaylight ? 'rgba(2, 132, 199, 0.35)' : 'rgba(56, 189, 248, 0.35)',
            borderWidth: 1,
            cornerRadius: 10,
            padding: 10,
            displayColors: false,
            titleFont: {
              size: 12,
              weight: 'bold'
            },
            bodyFont: {
              size: 14,
              weight: 'bold'
            },
            callbacks: {
              label: (context) => `${context.parsed.y}${unitLabel}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor,
              drawBorder: false
            },
            ticks: {
              color: textColor,
              font: {
                size: 11,
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
          },
          y: {
            grid: {
              color: gridColor,
              drawBorder: false
            },
            ticks: {
              color: textColor,
              font: {
                size: 11,
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              },
              callback: (value) => `${value}°`
            }
          }
        }
      }
    });
  },

  /**
   * Renders saved favourite cities list or displays the empty state.
   *
   * @param {Array<Object>} favourites - Array of favourite city objects
   * @param {Function} onSelectCity - Callback when clicking a favourite card
   * @param {Function} onRemoveFavourite - Callback when clicking the delete button
   */
  renderFavourites(favourites, onSelectCity, onRemoveFavourite, unit = 'celsius') {
    const { favouritesGrid, favouritesEmptyState } = this.getElements();
    if (!favouritesGrid || !favouritesEmptyState) return;

    favouritesGrid.innerHTML = '';

    if (!Array.isArray(favourites) || favourites.length === 0) {
      favouritesEmptyState.hidden = false;
      favouritesEmptyState.style.display = 'flex';
      favouritesGrid.hidden = true;
      favouritesGrid.style.display = 'none';
      return;
    }

    favouritesEmptyState.hidden = true;
    favouritesEmptyState.style.display = 'none';
    favouritesGrid.hidden = false;
    favouritesGrid.style.display = 'grid';

    favourites.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'favourite-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `View weather for ${item.name}`);

      let weatherBadgeHtml = '';
      let conditionLabel = 'Saved location';

      if (typeof item.tempC === 'number' && !isNaN(item.tempC)) {
        const tempFormatted = Utils.formatTemp(item.tempC, unit, true);
        const condition = Utils.getWeatherCondition(item.weatherCode || 0, item.isDay ?? 1);
        conditionLabel = condition.description;

        weatherBadgeHtml = `
          <div class="favourite-weather-badge" title="${condition.description}">
            <div class="favourite-weather-icon" aria-hidden="true">${condition.iconSvg}</div>
            <span class="favourite-weather-temp">${tempFormatted}</span>
          </div>
        `;
      } else {
        weatherBadgeHtml = `
          <div class="favourite-weather-badge favourite-weather-pending" title="Select to view live weather">
            <span class="favourite-hint">Tap to view</span>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="favourite-card-main">
          <span class="favourite-city-name">
            ${item.name}
            <span class="country-badge">${item.country || 'GLOBAL'}</span>
          </span>
          <span class="favourite-condition-label">${conditionLabel}</span>
        </div>
        <div class="favourite-card-side">
          ${weatherBadgeHtml}
          <button
            type="button"
            class="btn-favourite-remove"
            aria-label="Remove ${item.name} from favourites"
            title="Remove from favourites"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      // Select city on card click or Enter key
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-favourite-remove')) return;
        if (typeof onSelectCity === 'function') onSelectCity(item.name);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.btn-favourite-remove')) return;
          e.preventDefault();
          if (typeof onSelectCity === 'function') onSelectCity(item.name);
        }
      });

      // Remove city button
      const removeBtn = card.querySelector('.btn-favourite-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof onRemoveFavourite === 'function') onRemoveFavourite(item.name);
        });
      }

      favouritesGrid.appendChild(card);
    });
  },

  /**
   * Renders side-by-side comparison cards for multiple cities.
   *
   * @param {Array<Object>} comparisonData - Array of { location, weather, airQuality }
   * @param {Function} onRemoveCity - Callback to remove city from comparison
   * @param {string} [unit='celsius'] - Active temperature unit
   */
  renderComparison(comparisonData, onRemoveCity, unit = 'celsius') {
    const { comparisonGrid, comparisonEmptyState } = this.getElements();
    if (!comparisonGrid || !comparisonEmptyState) return;

    comparisonGrid.innerHTML = '';

    if (!Array.isArray(comparisonData) || comparisonData.length === 0) {
      comparisonEmptyState.hidden = false;
      comparisonEmptyState.style.display = 'flex';
      comparisonGrid.hidden = true;
      comparisonGrid.style.display = 'none';
      return;
    }

    comparisonEmptyState.hidden = true;
    comparisonEmptyState.style.display = 'none';
    comparisonGrid.hidden = false;
    comparisonGrid.style.display = 'grid';

    comparisonData.forEach((item) => {
      const { location, weather, airQuality } = item;
      const current = weather?.current || {};
      const daily = weather?.daily || {};
      const weatherCode = current.weather_code ?? 0;
      const condition = Utils.getWeatherCondition(weatherCode, current.is_day ?? 1);
      const tempFormatted = Utils.formatTemp(current.temperature_2m, unit, true);

      // AQI calculation
      let aqiDisplay = '--';
      if (airQuality?.hourly?.us_aqi?.[0] !== undefined) {
        aqiDisplay = `${Math.round(airQuality.hourly.us_aqi[0])} (US AQI)`;
      } else if (airQuality?.hourly?.european_aqi?.[0] !== undefined) {
        aqiDisplay = `${Math.round(airQuality.hourly.european_aqi[0])} (EAQI)`;
      }

      let uvVal = '--';
      if (daily?.uv_index_max?.[0] !== undefined) {
        uvVal = Utils.round(daily.uv_index_max[0], 1);
      } else if (weather?.hourly?.uv_index?.[0] !== undefined) {
        uvVal = Utils.round(weather.hourly.uv_index[0], 1);
      }

      const feelsLikeFormatted = Utils.formatTemp(current.apparent_temperature, unit, true);

      const card = document.createElement('article');
      card.className = 'comparison-card';
      card.innerHTML = `
        <header class="comparison-card-header">
          <div class="comparison-location-title">
            <span>${location.name}</span>
            <span class="country-badge">${location.country || 'GLOBAL'}</span>
          </div>
          <button
            type="button"
            class="btn-remove-comparison"
            aria-label="Remove ${location.name} from comparison"
            title="Remove from comparison"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <div class="comparison-temp-block">
          <div>
            <span class="comparison-temp-val">${tempFormatted}</span>
            <p class="section-subtitle">${condition.description}</p>
          </div>
          <div class="comparison-icon-box" aria-hidden="true">
            ${condition.iconSvg}
          </div>
        </div>

        <ul class="comparison-metrics-list">
          <li class="comparison-metric-row">
            <span class="comparison-metric-label">Feels Like</span>
            <span class="comparison-metric-value">${feelsLikeFormatted}</span>
          </li>
          <li class="comparison-metric-row">
            <span class="comparison-metric-label">Humidity</span>
            <span class="comparison-metric-value">${Utils.round(current.relative_humidity_2m)}%</span>
          </li>
          <li class="comparison-metric-row">
            <span class="comparison-metric-label">Wind Speed</span>
            <span class="comparison-metric-value">${Utils.round(current.wind_speed_10m)} km/h</span>
          </li>
          <li class="comparison-metric-row">
            <span class="comparison-metric-label">UV Index</span>
            <span class="comparison-metric-value">${uvVal}</span>
          </li>
          <li class="comparison-metric-row">
            <span class="comparison-metric-label">Air Quality</span>
            <span class="comparison-metric-value">${aqiDisplay}</span>
          </li>
        </ul>
      `;

      const removeBtn = card.querySelector('.btn-remove-comparison');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          if (typeof onRemoveCity === 'function') onRemoveCity(location.name);
        });
      }

      comparisonGrid.appendChild(card);
    });
  },

  /**
   * Master dashboard coordinator: populates all UI sections with live meteorological
   * and environmental data from Open-Meteo Weather and Air Quality APIs.
   *
   * @param {Object} location - { name, country, admin1 } from Geocoding API
   * @param {Object} weather - Raw Open-Meteo payload containing current, hourly, and daily
   * @param {Object|null} [airQuality=null] - Air Quality API payload
   * @param {string} [unit='celsius'] - Active temperature unit
   * @param {boolean} [isFavourite=false] - Whether this city is saved in favourites
   */
  updateWeather(location, weather, airQuality = null, unit = 'celsius', isFavourite = false) {
    const el = this.getElements();
    const current = weather.current || {};
    const daily = weather.daily || {};
    const hourly = weather.hourly || {};

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

    // Automatically determine and apply living visual sky atmosphere from actual weather and solar time
    const atmosphere = Utils.determineAtmosphere(weather);
    this.setAtmosphericTheme(atmosphere);

    // 3. Hero Temperature & Extremes (Formatted in active unit)
    if (el.temperature) {
      el.temperature.textContent = Utils.formatTemp(current.temperature_2m, unit);
    }

    if (el.feelsLike) {
      el.feelsLike.textContent = Utils.formatTemp(current.apparent_temperature, unit, true);
    }

    if (daily.temperature_2m_max && daily.temperature_2m_max[0] !== undefined && el.tempHigh) {
      el.tempHigh.textContent = Utils.formatTemp(daily.temperature_2m_max[0], unit, true);
    }

    if (daily.temperature_2m_min && daily.temperature_2m_min[0] !== undefined && el.tempLow) {
      el.tempLow.textContent = Utils.formatTemp(daily.temperature_2m_min[0], unit, true);
    }

    // 4. Update Favourite Toggle Button State
    this.setFavouriteActive(isFavourite);

    // 5. Render Smart Weather Recommendations
    this.renderRecommendations(current, daily, hourly, unit);

    // 6. Render Hourly Forecast (24 Hours)
    this.renderHourlyForecast(hourly, current, unit);

    // 7. Render 5-Day Forecast
    this.renderDailyForecast(daily, unit);

    // 8. Render Weather Insights
    this.renderWeatherInsights(current, daily, hourly);

    // 9. Render Air Quality
    this.renderAirQuality(airQuality, current);

    // 10. Render Temperature Chart
    this.renderTemperatureChart(hourly, current, unit);
  },

  /**
   * Renders the interactive Recent Searches list in the DOM.
   *
   * @param {Array<string>} recentSearches - Array of recently searched city names
   * @param {Function} onSelectCity - Callback invoked when a city pill is clicked
   * @param {Function} [onClear] - Callback invoked when the clear button is clicked
   */
  renderRecentSearches(recentSearches, onSelectCity, onClear) {
    const { recentSearchesList, btnClearRecent } = this.getElements();
    if (!recentSearchesList) return;

    recentSearchesList.innerHTML = '';

    if (!Array.isArray(recentSearches) || recentSearches.length === 0) {
      const emptyState = document.createElement('span');
      emptyState.className = 'recent-searches-empty';
      emptyState.textContent = 'No recent searches';
      recentSearchesList.appendChild(emptyState);
      if (btnClearRecent) btnClearRecent.hidden = true;
      return;
    }

    if (btnClearRecent) {
      btnClearRecent.hidden = false;
      btnClearRecent.onclick = (e) => {
        e.preventDefault();
        if (typeof onClear === 'function') onClear();
      };
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
