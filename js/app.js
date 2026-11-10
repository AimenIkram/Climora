/**
 * Climora - Application Controller & Orchestration
 * Connects UI with Open-Meteo Weather, Air Quality, and Storage Services.
 * Orchestrates application state, geolocation, favourites persistence,
 * recent searches, unit conversions, theme switching, and multi-city comparisons.
 */

document.addEventListener('DOMContentLoaded', () => {
  const elements = UIController.getElements();
  const {
    searchForm,
    searchInput,
    btnGeolocation,
    unitCelsius,
    unitFahrenheit,
    themeToggle,
    btnFavouriteToggle,
    btnAddCurrentFavourite,
    comparisonForm,
    comparisonInput
  } = elements;

  // 1. Centralized Application State Initialized from LocalStorage
  const savedPrefs = StorageService.getPreferences();
  const state = {
    selectedCity: savedPrefs.selectedCity,
    unit: savedPrefs.unit,
    theme: savedPrefs.theme,
    lastCity: savedPrefs.lastCity,
    currentLocation: null,
    currentWeather: null,
    currentAirQuality: null,
    favourites: StorageService.getFavourites(),
    recentSearches: StorageService.getRecentSearches(),
    comparisonCities: StorageService.getComparisonCities(),
    comparisonData: []
  };

  const MAX_RECENT_SEARCHES = 5;
  const MAX_COMPARISON_CITIES = 3;

  // Monotonic token counter to prevent race conditions from out-of-order network responses
  let currentSearchRequestId = 0;

  // ---------------------------------------------------------------------------
  // Helper: Check if a city is in favourites
  // ---------------------------------------------------------------------------
  function isCurrentCityFavourite() {
    if (!state.currentLocation || !state.currentLocation.name) return false;
    const currentName = state.currentLocation.name.toLowerCase();
    return state.favourites.some((fav) => fav.name.toLowerCase() === currentName);
  }

  // ---------------------------------------------------------------------------
  // Stage 4: Recent Searches Management (Persisted via StorageService)
  // ---------------------------------------------------------------------------
  function addRecentSearch(cityName) {
    if (!cityName || typeof cityName !== 'string') return;
    const cleanName = cityName.trim();
    if (!cleanName) return;

    // Remove older duplicate case-insensitively
    const existingIndex = state.recentSearches.findIndex(
      (item) => item.toLowerCase() === cleanName.toLowerCase()
    );
    if (existingIndex !== -1) {
      state.recentSearches.splice(existingIndex, 1);
    }

    // Add newest search first
    state.recentSearches.unshift(cleanName);

    // Limit to max 5 items
    if (state.recentSearches.length > MAX_RECENT_SEARCHES) {
      state.recentSearches.splice(MAX_RECENT_SEARCHES);
    }

    // Persist to LocalStorage
    StorageService.saveRecentSearches(state.recentSearches);
    UIController.renderRecentSearches(state.recentSearches, onSelectRecentCity, onClearRecentSearches);
  }

  function onSelectRecentCity(cityName) {
    if (searchInput) searchInput.value = cityName;
    handleSearch(cityName, true);
  }

  function onClearRecentSearches() {
    state.recentSearches = [];
    StorageService.clearRecentSearches();
    UIController.renderRecentSearches([], onSelectRecentCity, onClearRecentSearches);
  }

  // ---------------------------------------------------------------------------
  // Stage 3: Favourite Cities Management
  // ---------------------------------------------------------------------------
  function toggleFavourite(location) {
    if (!location || !location.name) {
      UIController.showError('No active city to save.');
      return;
    }

    const cityIndex = state.favourites.findIndex(
      (item) => item.name.toLowerCase() === location.name.toLowerCase()
    );

    if (cityIndex !== -1) {
      // Remove from favourites
      state.favourites.splice(cityIndex, 1);
    } else {
      // Add to favourites with live weather snapshot if available
      const tempC = (state.currentWeather && state.currentWeather.current)
        ? state.currentWeather.current.temperature_2m
        : null;
      const weatherCode = (state.currentWeather && state.currentWeather.current)
        ? state.currentWeather.current.weather_code
        : null;
      const isDay = (state.currentWeather && state.currentWeather.current)
        ? state.currentWeather.current.is_day
        : 1;

      state.favourites.push({
        name: location.name,
        country: location.country || 'GLOBAL',
        latitude: location.latitude,
        longitude: location.longitude,
        tempC,
        weatherCode,
        isDay
      });
    }

    // Persist updated list
    StorageService.saveFavourites(state.favourites);

    // Update star button & favourites list UI
    UIController.setFavouriteActive(isCurrentCityFavourite());
    UIController.renderFavourites(state.favourites, onSelectFavouriteCity, onRemoveFavouriteCity, state.unit);
  }

  function onSelectFavouriteCity(cityName) {
    if (searchInput) searchInput.value = cityName;
    handleSearch(cityName, false);
  }

  function onRemoveFavouriteCity(cityName) {
    state.favourites = state.favourites.filter(
      (item) => item.name.toLowerCase() !== cityName.toLowerCase()
    );
    StorageService.saveFavourites(state.favourites);
    UIController.setFavouriteActive(isCurrentCityFavourite());
    UIController.renderFavourites(state.favourites, onSelectFavouriteCity, onRemoveFavouriteCity, state.unit);
  }

  function updateFavouriteWeatherSnapshot(cityName, weather) {
    if (!cityName || !weather || !weather.current) return;
    const match = state.favourites.find(
      (fav) => fav.name.toLowerCase() === cityName.toLowerCase()
    );
    if (match) {
      match.tempC = weather.current.temperature_2m;
      match.weatherCode = weather.current.weather_code;
      match.isDay = weather.current.is_day;
      StorageService.saveFavourites(state.favourites);
      UIController.renderFavourites(state.favourites, onSelectFavouriteCity, onRemoveFavouriteCity, state.unit);
    }
  }

  // ---------------------------------------------------------------------------
  // Stage 5: Theme Switcher & Temperature Conversion
  // ---------------------------------------------------------------------------
  function switchTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    StorageService.savePreferences({ theme: state.theme });
    UIController.setTheme(state.theme);
  }

  function switchTemperatureUnit(newUnit) {
    if (state.unit === newUnit) return;
    state.unit = newUnit;
    StorageService.savePreferences({ unit: state.unit });
    UIController.setTemperatureUnit(state.unit);

    // Re-render main weather dashboard with new temperature unit without extra API queries
    if (state.currentLocation && state.currentWeather) {
      UIController.updateWeather(
        state.currentLocation,
        state.currentWeather,
        state.currentAirQuality,
        state.unit,
        isCurrentCityFavourite()
      );
    }

    // Re-render favourites cards with updated temperature unit
    if (state.favourites.length > 0) {
      UIController.renderFavourites(state.favourites, onSelectFavouriteCity, onRemoveFavouriteCity, state.unit);
    }

    // Re-render comparison cards with updated unit
    if (state.comparisonData.length > 0) {
      UIController.renderComparison(state.comparisonData, onRemoveComparisonCity, state.unit);
    }
  }

  // ---------------------------------------------------------------------------
  // Stage 6: City Comparison Feature
  // ---------------------------------------------------------------------------
  async function addCityToComparison(cityName) {
    const cleanName = cityName.trim();
    if (!cleanName) return;

    if (state.comparisonData.length >= MAX_COMPARISON_CITIES) {
      UIController.showError(`Maximum of ${MAX_COMPARISON_CITIES} cities can be compared. Remove a city first.`);
      return;
    }

    const alreadyAdded = state.comparisonData.some(
      (item) => item.location.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (alreadyAdded) {
      UIController.showError(`"${cleanName}" is already added to comparison.`);
      return;
    }

    try {
      UIController.setComparisonLoading(true);
      UIController.setLoading(true, `Adding "${cleanName}" to comparison...`);
      const location = await WeatherAPI.searchCity(cleanName);

      const [weatherRes, aqiRes] = await Promise.allSettled([
        WeatherAPI.fetchWeather(location.latitude, location.longitude),
        WeatherAPI.fetchAirQuality(location.latitude, location.longitude)
      ]);

      if (weatherRes.status === 'rejected') {
        throw weatherRes.reason;
      }

      const weather = weatherRes.value;
      const airQuality = aqiRes.status === 'fulfilled' ? aqiRes.value : null;

      state.comparisonData.push({ location, weather, airQuality });

      if (!state.comparisonCities.includes(location.name)) {
        state.comparisonCities.push(location.name);
        StorageService.saveComparisonCities(state.comparisonCities);
      }

      UIController.renderComparison(state.comparisonData, onRemoveComparisonCity, state.unit);
      if (comparisonInput) comparisonInput.value = '';
      UIController.clearStatus();
    } catch (err) {
      UIController.showError(err.message || 'Unable to add city to comparison.');
    } finally {
      UIController.setComparisonLoading(false);
      UIController.setLoading(false);
    }
  }

  function onRemoveComparisonCity(cityName) {
    state.comparisonData = state.comparisonData.filter(
      (item) => item.location.name.toLowerCase() !== cityName.toLowerCase()
    );
    state.comparisonCities = state.comparisonCities.filter(
      (name) => name.toLowerCase() !== cityName.toLowerCase()
    );
    StorageService.saveComparisonCities(state.comparisonCities);
    UIController.renderComparison(state.comparisonData, onRemoveComparisonCity, state.unit);
  }

  async function restoreComparisonCities() {
    if (!state.comparisonCities || state.comparisonCities.length === 0) {
      UIController.renderComparison([], onRemoveComparisonCity, state.unit);
      return;
    }

    const citiesToFetch = [...state.comparisonCities.slice(0, MAX_COMPARISON_CITIES)];
    state.comparisonData = [];

    for (const city of citiesToFetch) {
      try {
        const location = await WeatherAPI.searchCity(city);
        const [weatherRes, aqiRes] = await Promise.allSettled([
          WeatherAPI.fetchWeather(location.latitude, location.longitude),
          WeatherAPI.fetchAirQuality(location.latitude, location.longitude)
        ]);

        if (weatherRes.status === 'fulfilled') {
          state.comparisonData.push({
            location,
            weather: weatherRes.value,
            airQuality: aqiRes.status === 'fulfilled' ? aqiRes.value : null
          });
        }
      } catch {
        // Silently skip failed comparison city restoration
      }
    }

    UIController.renderComparison(state.comparisonData, onRemoveComparisonCity, state.unit);
  }

  // ---------------------------------------------------------------------------
  // Master Weather Search Lifecycle (Stages 1, 3, 4, 5, 7)
  // ---------------------------------------------------------------------------
  async function handleSearch(cityName, saveToRecent = true) {
    const query = cityName ? cityName.trim() : '';

    if (!query) {
      UIController.showError('Please enter a city or region to search.');
      if (searchInput) searchInput.focus();
      return;
    }

    const requestId = ++currentSearchRequestId;

    try {
      UIController.setLoading(true, `Locating and fetching weather for "${query}"...`);

      // 1. Resolve coordinates
      const location = await WeatherAPI.searchCity(query);

      if (requestId !== currentSearchRequestId) return;

      // 2. Dual concurrent fetch for forecast & air quality
      const [weatherResult, airQualityResult] = await Promise.allSettled([
        WeatherAPI.fetchWeather(location.latitude, location.longitude),
        WeatherAPI.fetchAirQuality(location.latitude, location.longitude)
      ]);

      if (requestId !== currentSearchRequestId) return;

      if (weatherResult.status === 'rejected') {
        throw weatherResult.reason;
      }

      const weather = weatherResult.value;
      const airQuality = airQualityResult.status === 'fulfilled' ? airQualityResult.value : null;

      // 3. Update application state
      state.currentLocation = location;
      state.currentWeather = weather;
      state.currentAirQuality = airQuality;
      state.selectedCity = location.name;
      state.lastCity = location.name;

      // Persist selected city in preferences
      StorageService.savePreferences({ selectedCity: location.name, lastCity: location.name });

      // 4. Update UI across all components
      UIController.updateWeather(
        location,
        weather,
        airQuality,
        state.unit,
        isCurrentCityFavourite()
      );

      // Keep favourite city weather metrics up-to-date if present
      updateFavouriteWeatherSnapshot(location.name, weather);

      // 5. Update Recent Searches History
      if (saveToRecent) {
        addRecentSearch(location.name);
      }

      if (searchInput) {
        searchInput.value = location.name;
      }
      UIController.clearStatus();

    } catch (error) {
      if (requestId === currentSearchRequestId) {
        console.warn('Climora API Notice:', error.message);
        UIController.showError(error.message || 'An unexpected error occurred while fetching weather data.');
      }
    } finally {
      if (requestId === currentSearchRequestId) {
        UIController.setLoading(false);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Stage 2: Geolocation ("Use My Location")
  // ---------------------------------------------------------------------------
  const geoBtn = btnGeolocation || document.getElementById('btn-geolocation');
  if (geoBtn) {
    geoBtn.addEventListener('click', async () => {
      if (!LocationService.isSupported()) {
        UIController.showError('Geolocation is not supported by your browser. Please search manually.');
        return;
      }

      const requestId = ++currentSearchRequestId;
      UIController.setLoading(true, 'Requesting device GPS coordinates...');

      try {
        const { latitude, longitude } = await LocationService.getCurrentPosition();

        if (requestId !== currentSearchRequestId) return;

        UIController.setLoading(true, 'Coordinates acquired. Fetching local weather...');

        // 1. Concurrently fetch weather and air quality for detected coordinates
        const [weatherResult, airQualityResult] = await Promise.allSettled([
          WeatherAPI.fetchWeather(latitude, longitude),
          WeatherAPI.fetchAirQuality(latitude, longitude)
        ]);

        if (requestId !== currentSearchRequestId) return;

        if (weatherResult.status === 'rejected') {
          throw weatherResult.reason;
        }

        const weather = weatherResult.value;
        const airQuality = airQualityResult.status === 'fulfilled' ? airQualityResult.value : null;

        // 2. Reverse geocode to resolve readable city and country names
        const location = await WeatherAPI.reverseGeocode(latitude, longitude, weather.timezone);

        if (requestId !== currentSearchRequestId) return;

        // 3. Update centralized state & persistent preferences
        state.currentLocation = location;
        state.currentWeather = weather;
        state.currentAirQuality = airQuality;
        state.selectedCity = location.name;
        state.lastCity = location.name;

        StorageService.savePreferences({ selectedCity: location.name, lastCity: location.name });

        // 4. Update UI across all components
        UIController.updateWeather(
          location,
          weather,
          airQuality,
          state.unit,
          isCurrentCityFavourite()
        );

        // Keep favourite city weather metrics up-to-date if present
        updateFavouriteWeatherSnapshot(location.name, weather);

        if (location.name !== 'Current Location') {
          addRecentSearch(location.name);
        }

        if (searchInput) {
          searchInput.value = location.name;
        }
        UIController.clearStatus();
      } catch (err) {
        if (requestId === currentSearchRequestId) {
          // If error originated from GeolocationPositionError, translate with LocationService; otherwise show network error
          const msg = (err && (typeof err.code === 'number' || err.code === 'NOT_SUPPORTED'))
            ? LocationService.getErrorMessage(err)
            : (err.message || 'Unable to retrieve weather for current location. Please search manually.');
          UIController.showError(msg);
        }
      } finally {
        if (requestId === currentSearchRequestId) {
          UIController.setLoading(false);
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Event Listeners: Search Form & Comparison Form
  // ---------------------------------------------------------------------------
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredCity = searchInput ? searchInput.value.trim() : '';
      if (!enteredCity) {
        UIController.showError('Please enter a valid city name.');
        if (searchInput) searchInput.focus();
        return;
      }
      handleSearch(enteredCity, true);
    });
  }

  if (comparisonForm) {
    comparisonForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredCity = comparisonInput ? comparisonInput.value.trim() : '';
      if (!enteredCity) return;
      addCityToComparison(enteredCity);
    });
  }

  // ---------------------------------------------------------------------------
  // Event Listeners: Favourites Actions
  // ---------------------------------------------------------------------------
  if (btnFavouriteToggle) {
    btnFavouriteToggle.addEventListener('click', () => {
      toggleFavourite(state.currentLocation);
    });
  }

  if (btnAddCurrentFavourite) {
    btnAddCurrentFavourite.addEventListener('click', () => {
      toggleFavourite(state.currentLocation);
    });
  }

  // ---------------------------------------------------------------------------
  // Event Listeners: Theme & Unit Toggles
  // ---------------------------------------------------------------------------
  if (themeToggle) {
    themeToggle.addEventListener('click', switchTheme);
  }

  if (unitCelsius) {
    unitCelsius.addEventListener('change', () => switchTemperatureUnit('celsius'));
  }

  if (unitFahrenheit) {
    unitFahrenheit.addEventListener('change', () => switchTemperatureUnit('fahrenheit'));
  }

  // ---------------------------------------------------------------------------
  // Application Startup: Restore Preferences, State & UI
  // ---------------------------------------------------------------------------
  UIController.setTheme(state.theme);
  UIController.setTemperatureUnit(state.unit);
  UIController.renderRecentSearches(state.recentSearches, onSelectRecentCity, onClearRecentSearches);
  UIController.renderFavourites(state.favourites, onSelectFavouriteCity, onRemoveFavouriteCity, state.unit);
  restoreComparisonCities();

  // Load saved selected city or default city from preferences
  handleSearch(state.selectedCity || state.lastCity || 'London', false);
});
