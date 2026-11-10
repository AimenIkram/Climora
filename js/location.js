/**
 * Climora - Location Service Module
 * Handles browser Geolocation API interactions:
 * - Checks browser Geolocation API availability
 * - Requests GPS coordinates (latitude, longitude) asynchronously
 * - Provides user-friendly translations for permission, hardware, and timeout errors
 */

const LocationService = {
  /**
   * Checks if the browser supports the Geolocation API.
   *
   * @returns {boolean} Whether navigator.geolocation is available
   */
  isSupported() {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  },

  /**
   * Asynchronously requests the user's current geographical position.
   * Only called when explicitly triggered by user interaction.
   *
   * @param {Object} [options] - Geolocation options
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
   */
  getCurrentPosition(options = { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const error = new Error('Geolocation is not supported by your browser.');
        error.code = 'NOT_SUPPORTED';
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (geoError) => {
          reject(geoError);
        },
        options
      );
    });
  },

  /**
   * Translates standard GeolocationPositionError codes into user-friendly messages.
   *
   * @param {GeolocationPositionError|Error} error - Error thrown by navigator.geolocation
   * @returns {string} Human-readable explanatory message
   */
  getErrorMessage(error) {
    if (!error) {
      return 'Unable to determine your location. You can search for any city manually.';
    }

    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return 'Location permission was denied. You can search for your city manually above.';
      case 2: // POSITION_UNAVAILABLE
        return 'Location information is currently unavailable. Please enter your city manually.';
      case 3: // TIMEOUT
        return 'Location request timed out. Please try again or search manually.';
      case 'NOT_SUPPORTED':
        return 'Geolocation is not supported by this browser. Please use the search bar above.';
      default:
        return error.message || 'An error occurred while finding your location. Please search manually.';
    }
  }
};
