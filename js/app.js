/**
 * Climora - Application Controller & Orchestration
 * Connects the user interface with the Open-Meteo Weather API service,
 * coordinates asynchronous search requests, manages recent searches, and handles errors.
 */

document.addEventListener('DOMContentLoaded', () => {
  const elements = UIController.getElements();
  const { searchForm, searchInput } = elements;

  // 1. JavaScript Array to store recently searched city names
  const recentSearches = [];
  const MAX_RECENT_SEARCHES = 5;

  /**
   * Adds a searched city name to the recent searches array.
   * - Checks for duplicates case-insensitively using findIndex().
   * - Removes the older occurrence with splice() if a duplicate is found.
   * - Inserts the new city at the beginning using unshift() (newest first).
   * - Enforces a maximum limit of 5 items using splice().
   *
   * @param {string} cityName - Name of the searched city
   */
  function addRecentSearch(cityName) {
    if (!cityName || typeof cityName !== 'string') return;

    // 1. Find if the city already exists in the array (case-insensitive check)
    const existingIndex = recentSearches.findIndex(
      (item) => item.toLowerCase() === cityName.toLowerCase()
    );

    // 2. Remove the previous entry if already present
    if (existingIndex !== -1) {
      recentSearches.splice(existingIndex, 1);
    }

    // 3. Add the newly searched city to the front of the array (newest first)
    recentSearches.unshift(cityName);

    // 4. Cap the array at 5 recent searches
    if (recentSearches.length > MAX_RECENT_SEARCHES) {
      // splice(5) removes all items starting from index 5 to the end
      recentSearches.splice(MAX_RECENT_SEARCHES);
    }
  }

  /**
   * Callback invoked when a user clicks a recent search pill button.
   * Populates the search input field and triggers the weather search.
   *
   * @param {string} cityName - Clicked city name
   */
  function onSelectRecentCity(cityName) {
    if (searchInput) {
      searchInput.value = cityName;
    }
    handleSearch(cityName, true);
  }

  /**
   * Coordinates the full weather search lifecycle:
   * 1. Displays loading state
   * 2. Resolves coordinates via Open-Meteo Geocoding API
   * 3. Fetches live meteorological conditions via Open-Meteo Forecast API
   * 4. Updates all dashboard cards and atmospheric themes
   * 5. Saves and re-renders the recent searches list (if saveToRecent is true)
   * 6. Handles and surfaces any errors with try/catch/finally
   *
   * @param {string} cityName - City name to search
   * @param {boolean} [saveToRecent=true] - Whether to add to the recent searches list
   */
  async function handleSearch(cityName, saveToRecent = true) {
    const query = cityName ? cityName.trim() : '';

    if (!query) {
      UIController.showError('Please enter a city or region to search.');
      if (searchInput) searchInput.focus();
      return;
    }

    try {
      // 1. Activate loading feedback
      UIController.setLoading(true, `Locating and fetching weather for "${query}"...`);

      // 2. Fetch geographical coordinates from the Geocoding API
      const location = await WeatherAPI.searchCity(query);

      // 3. Fetch live meteorological metrics from the Forecast API
      const weather = await WeatherAPI.fetchWeather(location.latitude, location.longitude);

      // 4. Update the user interface with live data
      UIController.updateWeather(location, weather);

      // 5. Update and render recent searches history when requested
      if (saveToRecent) {
        addRecentSearch(location.name);
        UIController.renderRecentSearches(recentSearches, onSelectRecentCity);
      }

      // 6. Keep search input populated with the resolved city name and dismiss status messages
      if (searchInput) {
        searchInput.value = location.name;
      }
      UIController.clearStatus();

    } catch (error) {
      console.warn('Climora API Notice:', error.message);
      UIController.showError(error.message || 'An unexpected error occurred while fetching weather data.');
    } finally {
      // Always guarantee loading state is turned off
      UIController.setLoading(false);
    }
  }

  // 2. Search Form Submission Event Listener (Search button click & Enter key press)
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const enteredCity = searchInput ? searchInput.value.trim() : '';

      if (!enteredCity) {
        UIController.showError('Please enter a valid city name.');
        if (searchInput) searchInput.focus();
        return;
      }

      handleSearch(enteredCity, true);
    });
  }

  // 3. Geolocation Button Listener (HTML5 Geolocation API integration)
  const geoBtn = document.getElementById('btn-geolocation');
  if (geoBtn) {
    geoBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        UIController.showError('Geolocation is not supported by your browser.');
        return;
      }

      UIController.setLoading(true, 'Determining your geographical location...');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const weather = await WeatherAPI.fetchWeather(latitude, longitude);

            // Construct localized display record
            const location = {
              name: 'Current Location',
              country: 'GPS',
              latitude,
              longitude
            };

            UIController.updateWeather(location, weather);
            UIController.clearStatus();
          } catch (err) {
            UIController.showError(err.message || 'Unable to retrieve weather for current location.');
          } finally {
            UIController.setLoading(false);
          }
        },
        (geoError) => {
          UIController.setLoading(false);
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              UIController.showError('Location access was denied. Please search for your city manually.');
              break;
            case geoError.POSITION_UNAVAILABLE:
              UIController.showError('Location information is currently unavailable.');
              break;
            case geoError.TIMEOUT:
              UIController.showError('Location request timed out. Please try again or search manually.');
              break;
            default:
              UIController.showError('Unable to determine location.');
              break;
          }
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  // 4. Initial Display: Render empty recent searches state on page load
  UIController.renderRecentSearches(recentSearches, onSelectRecentCity);

  // Automatically fetch an initial city to showcase live data on startup without polluting search history
  handleSearch('London', false);
});
