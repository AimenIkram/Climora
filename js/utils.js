/**
 * Climora - Utilities & Helpers Module
 * Provides pure utility functions for weather condition mappings,
 * date/time formatting, unit calculations, and wind direction conversion.
 */

const Utils = {
  /**
   * Intelligently determines the real-time visual sky atmosphere based on
   * actual Open-Meteo weather parameters, local time of day, and sunset/sunrise data.
   *
   * @param {Object} weather - Raw Open-Meteo forecast payload
   * @returns {Object} { id, name, isDaylight, summary, iconSvg }
   */
  determineAtmosphere(weather) {
    if (!weather || !weather.current) {
      return {
        id: 'atmosphere-sunny-day',
        name: 'Sunny Day',
        isDaylight: true,
        summary: 'Bright atmospheric sky with natural sunlight',
        iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      };
    }

    const current = weather.current;
    const daily = weather.daily || {};
    const code = typeof current.weather_code === 'number' ? current.weather_code : 0;
    const isDay = current.is_day === 1;

    // Check for Sunset / Twilight window (golden hour into civil twilight)
    let isSunset = false;
    if (daily.sunset && Array.isArray(daily.sunset) && daily.sunset[0] && current.time) {
      try {
        const currentTimeMs = new Date(current.time).getTime();
        const sunsetTimeMs = new Date(daily.sunset[0]).getTime();
        if (!isNaN(currentTimeMs) && !isNaN(sunsetTimeMs)) {
          const diffMinutes = (currentTimeMs - sunsetTimeMs) / (60 * 1000);
          // From 50 minutes before sunset to 40 minutes after sunset
          if (diffMinutes >= -50 && diffMinutes <= 40) {
            isSunset = true;
          }
        }
      } catch {
        isSunset = false;
      }
    }

    // Meteorological classifications
    const isThunderstorm = [95, 96, 99].includes(code);
    const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
    const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
    const isFog = [45, 48].includes(code);
    const isOvercast = code === 3;
    const isPartlyCloudy = code === 2;
    const isClear = [0, 1].includes(code);

    // Severe thunderstorm overrides ambient time-of-day coloring
    if (isThunderstorm) {
      return {
        id: 'atmosphere-stormy',
        name: 'Thunderstorm',
        isDaylight: false,
        summary: 'Dramatic storm clouds with ambient lightning flashes',
        iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polygon points="13 11 9 17 15 17 11 23"/></svg>`
      };
    }

    // Sunset / Golden Twilight atmosphere
    if (isSunset && (isClear || isPartlyCloudy || code === 51 || isFog)) {
      return {
        id: 'atmosphere-sunset',
        name: 'Sunset Horizon',
        isDaylight: false,
        summary: 'Warm amber, peach, and rose twilight glow',
        iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/></svg>`
      };
    }

    // Snow condition
    if (isSnow) {
      return {
        id: isDay ? 'atmosphere-snowy-day' : 'atmosphere-snowy-night',
        name: isDay ? 'Snowy Day' : 'Snowy Night',
        isDaylight: isDay,
        summary: isDay ? 'Soft cold daylight with crystalline snowfall' : 'Midnight snowfall under icy skies',
        iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="8" y1="20" x2="8.01" y2="20"/><line x1="12" y1="18" x2="12.01" y2="18"/><line x1="12" y1="22" x2="12.01" y2="22"/><line x1="16" y1="16" x2="16.01" y2="16"/><line x1="16" y1="20" x2="16.01" y2="20"/></svg>`
      };
    }

    // Fog / Mist
    if (isFog) {
      return {
        id: isDay ? 'atmosphere-foggy-day' : 'atmosphere-foggy-night',
        name: isDay ? 'Misty Fog Day' : 'Foggy Night',
        isDaylight: isDay,
        summary: 'Diffused silver-grey atmosphere with low visibility',
        iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="10" x2="19" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="7" y1="18" x2="17" y2="18"/></svg>`
      };
    }

    // Rain / Drizzle / Showers
    if (isRain) {
      return {
        id: isDay ? 'atmosphere-rainy-day' : 'atmosphere-rainy-night',
        name: isDay ? 'Rainy Day' : 'Rainy Night',
        isDaylight: isDay,
        summary: isDay ? 'Steel grey skies with falling rain streaks' : 'Reflective midnight rain and ocean mist',
        iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`
      };
    }

    // Overcast
    if (isOvercast) {
      return {
        id: isDay ? 'atmosphere-overcast-day' : 'atmosphere-overcast-night',
        name: isDay ? 'Overcast Sky' : 'Overcast Night',
        isDaylight: isDay,
        summary: isDay ? 'Dramatic slate-grey overcast cloud canopy' : 'Dark veiled cloud canopy at night',
        iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`
      };
    }

    // Partly Cloudy
    if (isPartlyCloudy) {
      return {
        id: isDay ? 'atmosphere-partly-cloudy-day' : 'atmosphere-cloudy-night',
        name: isDay ? 'Partly Cloudy' : 'Cloudy Night',
        isDaylight: isDay,
        summary: isDay ? 'Azure sky with billowy clouds and daylight' : 'Moonlit clouds across a midnight sky',
        iconSvg: isDay
          ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>`
          : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 17.5a3.5 3.5 0 0 0-3.5-3.5H15a4 4 0 0 0-7.8 1.2A3 3 0 0 0 7 21h8.5a3.5 3.5 0 0 0 3.5-3.5Z"/></svg>`
      };
    }

    // Clear Sky
    if (isDay) {
      return {
        id: 'atmosphere-sunny-day',
        name: 'Sunny Day',
        isDaylight: true,
        summary: 'Radiant sky blue with brilliant natural sunlight',
        iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      };
    } else {
      return {
        id: 'atmosphere-clear-night',
        name: 'Clear Night',
        isDaylight: false,
        summary: 'Deep navy midnight sky with stars and moonlight',
        iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
      };
    }
  },

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
   * Directly extracts the time component to preserve the location's local time accurately.
   *
   * @param {string} isoString - Date time string from Open-Meteo
   * @returns {string} Formatted time string
   */
  formatTime(isoString) {
    if (!isoString) return '--:--';
    try {
      if (typeof isoString === 'string' && isoString.includes('T')) {
        const timePart = isoString.split('T')[1];
        const [hStr, mStr] = timePart.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (!isNaN(h) && !isNaN(m)) {
          const period = h >= 12 ? 'PM' : 'AM';
          const hour12 = h % 12 === 0 ? 12 : h % 12;
          const minFormatted = m < 10 ? `0${m}` : m;
          return `${hour12}:${minFormatted} ${period}`;
        }
      }
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '--:--';
    }
  },

  /**
   * Formats an hourly ISO string into a concise 12-hour format ("8 PM", "12 AM").
   *
   * @param {string} isoString - ISO string from hourly array
   * @returns {string} Formatted 12-hour string
   */
  formatHourlyTime(isoString) {
    if (!isoString) return '--:--';
    try {
      if (typeof isoString === 'string' && isoString.includes('T')) {
        const timePart = isoString.split('T')[1];
        const h = parseInt(timePart.split(':')[0], 10);
        if (!isNaN(h)) {
          const period = h >= 12 ? 'PM' : 'AM';
          const hour12 = h % 12 === 0 ? 12 : h % 12;
          return `${hour12} ${period}`;
        }
      }
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    } catch {
      return '--:--';
    }
  },

  /**
   * Formats a daily date ISO string into day name and calendar date.
   *
   * @param {string} dateString - "YYYY-MM-DD" or ISO string
   * @param {number} [dayIndex=0] - 0 for today
   * @returns {Object} { dayName, calendarDate }
   */
  formatDailyDate(dateString, dayIndex = 0) {
    if (!dateString) return { dayName: '--', calendarDate: '--' };
    try {
      // Split YYYY-MM-DD to construct local date without UTC midnight timezone shifting
      const parts = dateString.split('T')[0].split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);

      const dayName = dayIndex === 0
        ? 'Today'
        : date.toLocaleDateString('en-US', { weekday: 'long' });

      const calendarDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return { dayName, calendarDate };
    } catch {
      return { dayName: '--', calendarDate: '--' };
    }
  },

  /**
   * Maps a numeric UV index value to an atmospheric risk classification.
   *
   * @param {number} uv - UV index number
   * @returns {string} Risk category text
   */
  getUvCategory(uv) {
    if (typeof uv !== 'number' || isNaN(uv)) return 'Not available';
    if (uv < 3) return 'Low Risk';
    if (uv < 6) return 'Moderate Risk';
    if (uv < 8) return 'High Risk';
    if (uv < 11) return 'Very High Risk';
    return 'Extreme Risk';
  },

  /**
   * Evaluates Air Quality Index (AQI) values and maps them to standard ratings.
   * Supports US AQI (EPA standard) and European AQI (EAQI).
   *
   * @param {number} aqi - Numeric AQI value
   * @param {string} [scale='us'] - 'us' or 'european'
   * @returns {Object} { label, statusClass }
   */
  getAqiCategory(aqi, scale = 'us') {
    if (typeof aqi !== 'number' || isNaN(aqi)) {
      return { label: 'Unavailable', statusClass: 'status-unavailable' };
    }

    if (scale === 'european') {
      if (aqi <= 20) return { label: 'Good', statusClass: 'aqi-good' };
      if (aqi <= 40) return { label: 'Fair', statusClass: 'aqi-moderate' };
      if (aqi <= 60) return { label: 'Moderate', statusClass: 'aqi-unhealthy-sensitive' };
      if (aqi <= 80) return { label: 'Poor', statusClass: 'aqi-unhealthy' };
      if (aqi <= 100) return { label: 'Very Poor', statusClass: 'aqi-very-unhealthy' };
      return { label: 'Extremely Poor', statusClass: 'aqi-hazardous' };
    }

    // Default: US AQI (EPA Scale)
    if (aqi <= 50) return { label: 'Good', statusClass: 'aqi-good' };
    if (aqi <= 100) return { label: 'Moderate', statusClass: 'aqi-moderate' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', statusClass: 'aqi-unhealthy-sensitive' };
    if (aqi <= 200) return { label: 'Unhealthy', statusClass: 'aqi-unhealthy' };
    if (aqi <= 300) return { label: 'Very Unhealthy', statusClass: 'aqi-very-unhealthy' };
    return { label: 'Hazardous', statusClass: 'aqi-hazardous' };
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
  },

  /**
   * Converts Celsius temperature to Fahrenheit.
   * Formula: (°C × 9/5) + 32
   *
   * @param {number} celsius - Temperature in Celsius
   * @returns {number} Temperature in Fahrenheit
   */
  celsiusToFahrenheit(celsius) {
    if (typeof celsius !== 'number' || isNaN(celsius)) return NaN;
    return (celsius * 9) / 5 + 32;
  },

  /**
   * Converts Fahrenheit temperature to Celsius.
   * Formula: (°F − 32) × 5/9
   *
   * @param {number} fahrenheit - Temperature in Fahrenheit
   * @returns {number} Temperature in Celsius
   */
  fahrenheitToCelsius(fahrenheit) {
    if (typeof fahrenheit !== 'number' || isNaN(fahrenheit)) return NaN;
    return ((fahrenheit - 32) * 5) / 9;
  },

  /**
   * Formats a raw Celsius value according to the user's active unit preference.
   * Keeps stored data internally consistent in Celsius and converts on output.
   *
   * @param {number} celsius - Temperature in Celsius
   * @param {string} [unit='celsius'] - 'celsius' or 'fahrenheit'
   * @param {boolean} [includeSymbol=false] - Whether to append the degree symbol °
   * @returns {string} Formatted temperature
   */
  formatTemp(celsius, unit = 'celsius', includeSymbol = false) {
    if (typeof celsius !== 'number' || isNaN(celsius)) return '--';
    const converted = unit === 'fahrenheit' ? this.celsiusToFahrenheit(celsius) : celsius;
    const rounded = Math.round(converted);
    return includeSymbol ? `${rounded}°` : `${rounded}`;
  },

  /**
   * Generates tailored, rule-based weather recommendations based on current meteorological parameters.
   *
   * @param {Object} current - Current weather metrics
   * @param {Object} daily - Daily forecast metrics
   * @param {Object} hourly - Hourly forecast metrics
   * @param {string} [unit='celsius'] - Active temperature unit
   * @returns {Array<Object>} List of { id, title, text, iconSvg, type }
   */
  getWeatherRecommendations(current = {}, daily = {}, hourly = {}, unit = 'celsius') {
    const list = [];
    if (!current || typeof current.temperature_2m !== 'number') {
      return list;
    }

    const tempC = current.temperature_2m;
    const weatherCode = current.weather_code ?? 0;
    const windSpeed = current.wind_speed_10m ?? 0;
    const rainProb = daily.precipitation_probability_max?.[0] ?? 0;
    const precip = current.precipitation ?? 0;
    const uv = hourly.uv_index?.[0] ?? daily.uv_index_max?.[0] ?? 0;

    // 1. Rain / Storm check
    const isRainCode = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);
    if (precip > 0 || rainProb >= 40 || isRainCode) {
      list.push({
        id: 'rain',
        type: 'advisory',
        title: 'Rain Protection',
        text: 'Precipitation expected today. Consider carrying an umbrella or waterproof outerwear.',
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`
      });
    }

    // 2. High UV Radiation check
    if (uv >= 6) {
      list.push({
        id: 'uv',
        type: 'warning',
        title: 'Sun Protection',
        text: `UV index is elevated (${this.round(uv, 1)}). Apply SPF 30+ sunscreen, wear sunglasses, and seek shade during peak hours.`,
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      });
    }

    // 3. High Wind check
    if (windSpeed >= 28) {
      list.push({
        id: 'wind',
        type: 'advisory',
        title: 'Wind Caution',
        text: `Breezy conditions recorded (${Math.round(windSpeed)} km/h). Secure lightweight outdoor belongings.`,
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`
      });
    }

    // 4. Cold weather check
    if (tempC < 10) {
      list.push({
        id: 'cold',
        type: 'info',
        title: 'Warm Layers',
        text: `Cold airmass present (${this.formatTemp(tempC, unit, true)}). Dress in thermal layers and keep hands and ears covered.`,
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`
      });
    } else if (tempC > 30) {
      // 5. Warm / Heat check
      list.push({
        id: 'heat',
        type: 'warning',
        title: 'Hydration Alert',
        text: `Hot temperatures (${this.formatTemp(tempC, unit, true)}). Drink plenty of water and limit strenuous mid-day outdoor exertion.`,
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
      });
    }

    // 6. Pleasant weather check (if no adverse condition was flagged)
    if (list.length === 0 && tempC >= 16 && tempC <= 26 && windSpeed < 22 && rainProb < 25) {
      list.push({
        id: 'pleasant',
        type: 'positive',
        title: 'Optimal Conditions',
        text: 'Pleasant and comfortable weather. An ideal time for an outdoor walk, exercise, or patio activities.',
        iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`
      });
    }

    return list;
  }
};
