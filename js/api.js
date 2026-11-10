/**
 * Climora - API Service Module
 * Handles geocoding lookups and meteorological forecast requests
 * using the official Open-Meteo REST endpoints with robust error handling.
 */

const WeatherAPI = {
  GEOCODING_BASE_URL: 'https://geocoding-api.open-meteo.com/v1/search',
  FORECAST_BASE_URL: 'https://api.open-meteo.com/v1/forecast',
  AIR_QUALITY_BASE_URL: 'https://air-quality-api.open-meteo.com/v1/air-quality',

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
   * Fetches current meteorological conditions, hourly forecast (24h+), and 5-day daily forecast
   * from the Open-Meteo Forecast API for specified coordinates.
   *
   * @param {number} latitude - Decimal latitude
   * @param {number} longitude - Decimal longitude
   * @returns {Promise<Object>} Formatted current, hourly, and daily forecast data
   * @throws {Error} Descriptive error on network or service issues
   */
  async fetchWeather(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid geographical coordinates provided for weather fetch.');
    }

    // Specify required meteorological parameters for Phase 07
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,visibility,uv_index',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset',
      timezone: 'auto',
      forecast_days: '5'
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
  },

  /**
   * Fetches air quality metrics and index measurements from Open-Meteo Air Quality API.
   *
   * @param {number} latitude - Decimal latitude
   * @param {number} longitude - Decimal longitude
   * @returns {Promise<Object>} Air quality data containing hourly pollutants & indices
   * @throws {Error} Descriptive error on network or service issues
   */
  async fetchAirQuality(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid geographical coordinates provided for air quality fetch.');
    }

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: 'pm2_5,pm10,nitrogen_dioxide,ozone,european_aqi,us_aqi',
      timezone: 'auto',
      forecast_days: '5'
    });

    const endpoint = `${this.AIR_QUALITY_BASE_URL}?${params.toString()}`;

    let response;
    try {
      response = await fetch(endpoint);
    } catch (networkError) {
      throw new Error('Network error while retrieving air quality data.');
    }

    if (!response.ok) {
      throw new Error(`Air Quality service responded with error (${response.status} ${response.statusText}).`);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Failed to parse air quality data.');
    }

    return data;
  },

  /**
   * Reverse-geocodes coordinates into human-readable city and country names.
   * Utilizes client-side reverse geocoding with timezone fallback.
   *
   * @param {number} latitude - Decimal latitude
   * @param {number} longitude - Decimal longitude
   * @param {string} [timezone=''] - Optional timezone fallback from weather payload
   * @returns {Promise<Object>} { name, country, latitude, longitude }
   */
  async reverseGeocode(latitude, longitude, timezone = '') {
    try {
      const endpoint = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const city = data.city || data.locality || data.principalSubdivision;
        const country = data.countryCode || data.countryName;
        if (city) {
          return {
            name: city,
            country: country ? country.toUpperCase() : 'GPS',
            latitude,
            longitude
          };
        }
      }
    } catch {
      // Gracefully continue to fallback if network or service fails
    }

    let cityName = 'Current Location';
    if (timezone && timezone.includes('/')) {
      const parts = timezone.split('/');
      cityName = parts[parts.length - 1].replace(/_/g, ' ');
    }

    return {
      name: cityName,
      country: 'GPS',
      latitude,
      longitude
    };
  }
};
