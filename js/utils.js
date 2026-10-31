/**
 * Climora - Utilities & Helpers Module
 * Provides pure utility functions for weather condition mappings,
 * date/time formatting, unit calculations, and wind direction conversion.
 */

const Utils = {
  /**
   * Maps WMO Weather Interpretation Codes (WW) to human-readable
   * descriptions, atmospheric visual themes, and corresponding SVG illustrations.
   *
   * @param {number} code - WMO weather code from Open-Meteo
   * @param {number} isDay - 1 for daytime, 0 for nighttime
   * @returns {Object} { description, summary, weatherClass, iconSvg }
   */
  getWeatherCondition(code, isDay = 1) {
    const isNight = isDay === 0;

    switch (code) {
      case 0:
        return {
          description: isNight ? 'Clear Sky' : 'Clear Sky',
          summary: isNight ? 'Crisp and clear night sky.' : 'Brilliant sunshine with clear skies.',
          weatherClass: 'weather-clear',
          iconSvg: isNight
            ? `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M48 34A18 18 0 1 1 30 16 14 14 0 0 0 48 34z" />
               </svg>`
            : `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="32" cy="32" r="12" />
                <line x1="32" y1="8" x2="32" y2="14" /><line x1="32" y1="50" x2="32" y2="56" />
                <line x1="8" y1="32" x2="14" y2="32" /><line x1="50" y1="32" x2="56" y2="32" />
                <line x1="15" y1="15" x2="19.2" y2="19.2" /><line x1="44.8" y1="44.8" x2="49" y2="49" />
                <line x1="15" y1="49" x2="19.2" y2="44.8" /><line x1="44.8" y1="19.2" x2="49" y2="15" />
               </svg>`
        };

      case 1:
        return {
          description: 'Mainly Clear',
          summary: 'Mostly clear with faint, scattered atmospheric transparency.',
          weatherClass: 'weather-clear',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="28" cy="28" r="10" />
              <path d="M44 38c2.2 0 4 1.8 4 4s-1.8 4-4 4H26c-4.4 0-8-3.6-8-8 0-4 3-7.3 7-7.9 1.2-5 5.7-8.1 11-8.1 6.1 0 11 4.5 11.8 10.5 3.5.5 6.2 3.5 6.2 7.5 0 1-.2 1.9-.6 2.8" />
            </svg>`
        };

      case 2:
        return {
          description: 'Partly Cloudy',
          summary: 'Scattered clouds offering intermittent intervals of sunshine.',
          weatherClass: 'weather-cloudy',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="26" cy="26" r="9" />
              <path d="M46 42c2.2 0 4 1.8 4 4s-1.8 4-4 4H24c-4.4 0-8-3.6-8-8 0-4 3-7.3 7-7.9 1.2-5 5.7-8.1 11-8.1 6.1 0 11 4.5 11.8 10.5 3.5.5 6.2 3.5 6.2 7.5" />
            </svg>`
        };

      case 3:
        return {
          description: 'Overcast',
          summary: 'Uniform cloud canopy blanketing the sky.',
          weatherClass: 'weather-cloudy',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M46 40c3.3 0 6 2.7 6 6s-2.7 6-6 6H20c-5.5 0-10-4.5-10-10 0-4.9 3.5-9 8.3-9.8C20 25.5 25.5 21 32 21c7.2 0 13.2 5.3 14.2 12.3 3.4.6 5.8 3.5 5.8 6.7" />
            </svg>`
        };

      case 45:
      case 48:
        return {
          description: 'Fog',
          summary: 'Dense atmospheric moisture and reduced horizontal visibility.',
          weatherClass: 'weather-foggy',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 28h36M10 36h44M16 44h32M20 52h24" />
            </svg>`
        };

      case 51:
      case 53:
      case 55:
        return {
          description: 'Drizzle',
          summary: 'Gentle, fine mist-like precipitation.',
          weatherClass: 'weather-rainy',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M46 36c3.3 0 6 2.7 6 6s-2.7 6-6 6H20c-5.5 0-10-4.5-10-10 0-4.9 3.5-9 8.3-9.8C20 21.5 25.5 17 32 17c7.2 0 13.2 5.3 14.2 12.3" />
              <line x1="22" y1="52" x2="20" y2="56" /><line x1="32" y1="52" x2="30" y2="56" /><line x1="42" y1="52" x2="40" y2="56" />
            </svg>`
        };

      case 61:
      case 63:
      case 65:
        return {
          description: code === 61 ? 'Slight Rain' : code === 63 ? 'Moderate Rain' : 'Heavy Rain',
          summary: 'Consistent rainfall with oceanic petrichor and overcast skies.',
          weatherClass: 'weather-rainy',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M46 32c3.3 0 6 2.7 6 6s-2.7 6-6 6H20c-5.5 0-10-4.5-10-10 0-4.9 3.5-9 8.3-9.8C20 17.5 25.5 13 32 13c7.2 0 13.2 5.3 14.2 12.3" />
              <line x1="22" y1="48" x2="18" y2="58" /><line x1="34" y1="48" x2="30" y2="58" /><line x1="46" y1="48" x2="42" y2="58" />
            </svg>`
        };

      case 71:
      case 73:
      case 75:
      case 77:
        return {
          description: code === 71 ? 'Slight Snow' : code === 73 ? 'Moderate Snow' : 'Heavy Snow',
          summary: 'Crisp freezing temperatures with crystalline snowfall.',
          weatherClass: 'weather-snowy',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M46 32c3.3 0 6 2.7 6 6s-2.7 6-6 6H20c-5.5 0-10-4.5-10-10 0-4.9 3.5-9 8.3-9.8C20 17.5 25.5 13 32 13c7.2 0 13.2 5.3 14.2 12.3" />
              <circle cx="22" cy="52" r="1.5" /><circle cx="32" cy="54" r="1.5" /><circle cx="42" cy="52" r="1.5" />
            </svg>`
        };

      case 80:
      case 81:
      case 82:
        return {
          description: 'Rain Showers',
          summary: 'Intermittent bursts of rain interspersed with cloudy intervals.',
          weatherClass: 'weather-rainy',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="24" cy="22" r="8" />
              <path d="M44 34c3.3 0 6 2.7 6 6s-2.7 6-6 6H20c-5.5 0-10-4.5-10-10 0-4.9 3.5-9 8.3-9.8C20 19.5 25.5 15 32 15" />
              <line x1="22" y1="50" x2="18" y2="60" /><line x1="34" y1="50" x2="30" y2="60" /><line x1="46" y1="50" x2="42" y2="60" />
            </svg>`
        };

      case 85:
      case 86:
        return {
          description: 'Snow Showers',
          summary: 'Sudden flurries of snowfall with shifting atmospheric visibility.',
          weatherClass: 'weather-snowy',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M46 32c3.3 0 6 2.7 6 6s-2.7 6-6 6H20c-5.5 0-10-4.5-10-10 0-4.9 3.5-9 8.3-9.8C20 17.5 25.5 13 32 13" />
              <circle cx="22" cy="50" r="1.5" /><circle cx="34" cy="52" r="1.5" /><circle cx="44" cy="50" r="1.5" />
            </svg>`
        };

      case 95:
      case 96:
      case 99:
        return {
          description: code === 95 ? 'Thunderstorm' : 'Thunderstorm with Hail',
          summary: 'Volatile atmospheric conditions with lightning and heavy squalls.',
          weatherClass: 'weather-stormy',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M46 32c3.3 0 6 2.7 6 6s-2.7 6-6 6H20c-5.5 0-10-4.5-10-10 0-4.9 3.5-9 8.3-9.8C20 17.5 25.5 13 32 13c7.2 0 13.2 5.3 14.2 12.3" />
              <polygon points="30 46 25 54 33 54 28 62 42 50 34 50 38 46" fill="currentColor" />
            </svg>`
        };

      default:
        return {
          description: 'Weather Condition',
          summary: 'Atmospheric conditions recorded at regional station.',
          weatherClass: 'weather-clear',
          iconSvg: `<svg class="weather-illustration" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="32" cy="32" r="12" />
            </svg>`
        };
    }
  },

  /**
   * Formats an ISO date-time string (e.g., "2026-11-01T06:45") into a 12-hour time string ("6:45 AM").
   *
   * @param {string} isoString - Date time string from Open-Meteo
   * @returns {string} Formatted time string
   */
  formatTime(isoString) {
    if (!isoString) return '--:--';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '--:--';
    }
  },

  /**
   * Formats the current local date into a clean string (e.g. "Sunday, Nov 1, 2026").
   *
   * @param {Date} [date] - Date instance (defaults to now)
   * @returns {string} Formatted date string
   */
  formatCurrentDate(date = new Date()) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  /**
   * Converts wind degrees (0-360) into a cardinal compass direction (e.g., "NE", "SSW").
   *
   * @param {number} degrees - Wind direction in degrees
   * @returns {string} Compass direction abbreviation
   */
  getCompassDirection(degrees) {
    if (typeof degrees !== 'number' || isNaN(degrees)) return '--';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((degrees % 360) / 22.5) % 16;
    return directions[index] || 'N';
  },

  /**
   * Safely rounds a number to one decimal or integer.
   *
   * @param {number} val - Numeric value
   * @param {number} [precision=0] - Decimal places
   * @returns {number|string}
   */
  round(val, precision = 0) {
    if (typeof val !== 'number' || isNaN(val)) return '--';
    if (precision === 0) return Math.round(val);
    return val.toFixed(precision);
  }
};
