/**
 * Climora - Storage Service Module
 * Handles safe, robust LocalStorage persistence for application state:
 * - Selected city
 * - Temperature unit (°C / °F)
 * - Visual theme (Dark / Light)
 * - Favourite cities
 * - Recent searches history
 *
 * Implements defensive validation and automatic recovery against missing,
 * invalid, or corrupted LocalStorage payloads and private-browsing restrictions.
 */

const StorageService = {
  // Storage key namespaces
  KEYS: {
    PREFERENCES: 'climora_prefs',
    FAVOURITES: 'climora_favourites',
    RECENT_SEARCHES: 'climora_recent_searches',
    COMPARISON: 'climora_comparison'
  },

  // Resilient defaults if LocalStorage is empty or corrupted
  DEFAULT_PREFERENCES: {
    unit: 'celsius',
    theme: 'dark',
    selectedCity: 'London',
    lastCity: 'London'
  },

  /**
   * Verifies if browser LocalStorage is available and writable.
   * Handles Safari private mode or restricted cookie policies.
   *
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const testKey = '__climora_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Safely reads and deserializes JSON from LocalStorage.
   * Handles null, undefined, and JSON parse syntax errors gracefully.
   *
   * @param {string} key - LocalStorage key identifier
   * @param {*} fallbackValue - Safe default value on error or absence
   * @returns {*} Deserialized value or fallback
   */
  _get(key, fallbackValue) {
    if (!this.isAvailable()) return fallbackValue;

    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) {
        return fallbackValue;
      }
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : fallbackValue;
    } catch (err) {
      console.warn(`Climora Storage: Corrupted or unparseable data for key "${key}". Resetting to safe default.`, err);
      return fallbackValue;
    }
  },

  /**
   * Safely serializes and persists a value into LocalStorage using JSON.stringify().
   * Prevents redundant disk writes if the payload has not changed.
   *
   * @param {string} key - LocalStorage key identifier
   * @param {*} value - Data to serialize
   * @returns {boolean} Whether writing succeeded
   */
  _set(key, value) {
    if (!this.isAvailable()) return false;

    try {
      const serialized = JSON.stringify(value);
      // Skip redundant write if identical string is already stored
      if (localStorage.getItem(key) === serialized) {
        return true;
      }
      localStorage.setItem(key, serialized);
      return true;
    } catch (err) {
      console.warn(`Climora Storage: Unable to write to key "${key}" (quota exceeded or storage blocked).`, err);
      return false;
    }
  },

  /**
   * Retrieves user preferences (temperature unit, theme, selected city)
   * with defensive sanitization.
   *
   * @returns {Object} { unit: string, theme: string, selectedCity: string, lastCity: string }
   */
  getPreferences() {
    const prefs = this._get(this.KEYS.PREFERENCES, {});

    // Ensure object type
    const safePrefs = (prefs && typeof prefs === 'object' && !Array.isArray(prefs)) ? prefs : {};

    // Validate temperature unit
    const unit = safePrefs.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';

    // Validate visual theme
    const theme = safePrefs.theme === 'light' ? 'light' : 'dark';

    // Validate selected / last viewed city string
    const rawCity = safePrefs.selectedCity || safePrefs.lastCity;
    const selectedCity = (typeof rawCity === 'string' && rawCity.trim()) 
      ? rawCity.trim() 
      : this.DEFAULT_PREFERENCES.selectedCity;

    return {
      unit,
      theme,
      selectedCity,
      lastCity: selectedCity
    };
  },

  /**
   * Persists partial or complete user preferences.
   *
   * @param {Object} partialPrefs - New preferences to merge
   * @returns {Object} Updated complete preferences
   */
  savePreferences(partialPrefs) {
    if (!partialPrefs || typeof partialPrefs !== 'object') return this.getPreferences();

    const current = this.getPreferences();
    const updated = {
      ...current,
      ...partialPrefs
    };

    // Keep selectedCity and lastCity synchronized
    if (partialPrefs.selectedCity) {
      updated.lastCity = partialPrefs.selectedCity;
    } else if (partialPrefs.lastCity) {
      updated.selectedCity = partialPrefs.lastCity;
    }

    this._set(this.KEYS.PREFERENCES, updated);
    return updated;
  },

  /**
   * Retrieves saved favourite cities with schema validation.
   *
   * @returns {Array<Object>} Array of { name, country, latitude, longitude }
   */
  getFavourites() {
    const list = this._get(this.KEYS.FAVOURITES, []);
    if (!Array.isArray(list)) return [];

    return list.filter((item) => (
      item &&
      typeof item === 'object' &&
      typeof item.name === 'string' &&
      item.name.trim().length > 0 &&
      typeof item.latitude === 'number' &&
      typeof item.longitude === 'number'
    ));
  },

  /**
   * Persists favourite cities array.
   *
   * @param {Array<Object>} favourites - Array of favourite city objects
   * @returns {boolean}
   */
  saveFavourites(favourites) {
    if (!Array.isArray(favourites)) return false;
    return this._set(this.KEYS.FAVOURITES, favourites);
  },

  /**
   * Retrieves recent searches history (max 5 items, clean strings).
   *
   * @returns {Array<string>} Array of unique city strings
   */
  getRecentSearches() {
    const list = this._get(this.KEYS.RECENT_SEARCHES, []);
    if (!Array.isArray(list)) return [];

    return list.filter((item) => typeof item === 'string' && item.trim().length > 0);
  },

  /**
   * Persists recent searches history.
   *
   * @param {Array<string>} recentSearches - Array of unique city strings
   * @returns {boolean}
   */
  saveRecentSearches(recentSearches) {
    if (!Array.isArray(recentSearches)) return false;
    return this._set(this.KEYS.RECENT_SEARCHES, recentSearches);
  },

  /**
   * Clears recent searches history from LocalStorage.
   *
   * @returns {boolean}
   */
  clearRecentSearches() {
    return this._set(this.KEYS.RECENT_SEARCHES, []);
  },

  /**
   * Retrieves active comparison cities.
   *
   * @returns {Array<string>} Array of city name strings
   */
  getComparisonCities() {
    const list = this._get(this.KEYS.COMPARISON, []);
    if (!Array.isArray(list)) return [];
    return list.filter((item) => typeof item === 'string' && item.trim().length > 0);
  },

  /**
   * Persists active comparison cities.
   *
   * @param {Array<string>} cities - Array of city name strings
   * @returns {boolean}
   */
  saveComparisonCities(cities) {
    if (!Array.isArray(cities)) return false;
    return this._set(this.KEYS.COMPARISON, cities);
  }
};
