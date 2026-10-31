/**
 * Climora - API Service Module
 * Handles geocoding lookups and meteorological forecast requests
 * using the official Open-Meteo REST endpoints with robust error handling.
 */

const WeatherAPI = {
  GEOCODING_BASE_URL: 'https://geocoding-api.open-meteo.com/v1/search',
  FORECAST_BASE_URL: 'https://api.open-meteo.com/v1/forecast',

  /**
   * Queries the Open-Meteo Geocoding API to resolve a city name
   * into geographical coordinates (latitude, longitude) and country metadata.
   *
   * @param {string} cityName - City name to look up
   * @returns {Promise<Object>} { name, country, latitude, longitude, admin1 }
   * @throws {Error} Descriptive error on network failure, HTTP status, or not-found
   */
  async searchCity(cityName) {
    if (!cityName || !cityName.trim()) {
      throw new Error('Please enter a valid city name.');
    }

    // Safely construct query parameters using URLSearchParams
    const params = new URLSearchParams({
      name: cityName.trim(),
      count: '5',
      language: 'en',
      format: 'json'
    });

    const endpoint = `${this.GEOCODING_BASE_URL}?${params.toString()}`;

    let response;
    try {
      response = await fetch(endpoint);
    } catch (networkError) {
      throw new Error('Network connection error. Please check your internet connectivity.');
    }

    // Handle HTTP error codes
    if (!response.ok) {
      throw new Error(`Geocoding service error (${response.status} ${response.statusText}). Please try again later.`);
    }

    // Parse JSON payload
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Unable to parse geocoding service response.');
    }

    // Validate if matching locations were returned
    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      throw new Error(`Location "${cityName}" was not found. Please verify the spelling.`);
    }

    // Select the best matching result (first entry)
    const primaryResult = data.results[0];

    return {
      name: primaryResult.name,
      country: primaryResult.country_code ? primaryResult.country_code.toUpperCase() : (primaryResult.country || ''),
      latitude: primaryResult.latitude,
      longitude: primaryResult.longitude,
      admin1: primaryResult.admin1 || ''
    };
  },

  /**
   * Fetches current meteorological conditions and daily extremes
   * from the Open-Meteo Forecast API for specified coordinates.
   *
   * @param {number} latitude - Decimal latitude
   * @param {number} longitude - Decimal longitude
   * @returns {Promise<Object>} Formatted current and daily forecast data
   * @throws {Error} Descriptive error on network or service issues
   */
  async fetchWeather(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid geographical coordinates provided for weather fetch.');
    }

    // Specify required meteorological parameters as requested
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
      daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'auto'
    });

    const endpoint = `${this.FORECAST_BASE_URL}?${params.toString()}`;

    let response;
    try {
      response = await fetch(endpoint);
    } catch (networkError) {
      throw new Error('Network error while retrieving weather forecast. Please check your connection.');
    }

    // Verify HTTP response status
    if (!response.ok) {
      throw new Error(`Weather service responded with error (${response.status} ${response.statusText}).`);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Failed to parse weather forecast data.');
    }

    // Validate that current metrics were returned
    if (!data || !data.current) {
      throw new Error('Weather data payload is empty or incomplete.');
    }

    return data;
  }
};
