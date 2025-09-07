// 🔧 Console Utilities - Safe console logging with error handling

/**
 * Safe console.log that won't break if console is unavailable
 */
export const safeLog = (...args) => {
  try {
    if (typeof console !== 'undefined' && console.log) {
      console.log(...args);
    }
  } catch (e) {
    // Silently fail if console is not available
  }
};

/**
 * Safe console.error that won't break if console is unavailable
 */
export const safeError = (...args) => {
  try {
    if (typeof console !== 'undefined' && console.error) {
      console.error(...args);
    }
  } catch (e) {
    // Silently fail if console is not available
  }
};

/**
 * Safe console.warn that won't break if console is unavailable
 */
export const safeWarn = (...args) => {
  try {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(...args);
    }
  } catch (e) {
    // Silently fail if console is not available
  }
};

/**
 * Safe console.info that won't break if console is unavailable
 */
export const safeInfo = (...args) => {
  try {
    if (typeof console !== 'undefined' && console.info) {
      console.info(...args);
    }
  } catch (e) {
    // Silently fail if console is not available
  }
};

/**
 * Development-only console logging
 */
export const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    safeLog(...args);
  }
};

/**
 * Development-only console error logging
 */
export const devError = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    safeError(...args);
  }
};

/**
 * Suppress CSS console warnings that are browser-specific
 */
export const suppressCSSWarnings = () => {
  try {
    // Store original console methods
    const originalWarn = console.warn;
    const originalError = console.error;

    // Override console.warn to filter CSS warnings
    console.warn = function(...args) {
      const message = args.join(' ');
      
      // Filter out known CSS compatibility warnings
      const cssWarnings = [
        'Unknown property',
        'Unknown pseudo-class',
        'Error in parsing value',
        'Expected media feature',
        'Ruleset ignored due to bad selector',
        'Declaration dropped',
        '-moz-osx-font-smoothing',
        '-webkit-text-size-adjust',
        '-moz-text-size-adjust',
        'text-size-adjust',
        '-ms-fill',
        '-ms-input-placeholder',
        '-ms-expand',
        '-ms-high-contrast',
        '-internal-autofill-selected',
        '-moz-focus-inner',
        '-moz-column-gap',
        'left',
        'right',
        'top',
        'bottom'
      ];

      // Filter out React Router warnings
      const reactWarnings = [
        'React Router Future Flag Warning',
        'React Router will begin wrapping state updates',
        'Relative route resolution within Splat routes is changing'
      ];

      // Filter out React DOM warnings
      const reactDomWarnings = [
        'validateDOMNesting',
        'div cannot appear as a descendant of p'
      ];

      const shouldSuppress = cssWarnings.some(warning => 
        message.includes(warning)
      ) || reactWarnings.some(warning => 
        message.includes(warning)
      ) || reactDomWarnings.some(warning => 
        message.includes(warning)
      );

      if (!shouldSuppress) {
        originalWarn.apply(console, args);
      }
    };

    // Override console.error to filter CSS errors
    console.error = function(...args) {
      const message = args.join(' ');
      
      // Filter out known CSS parsing errors
      const cssErrors = [
        'Error in parsing value for',
        'Unknown property',
        'Declaration dropped',
        'spoofer.js', // Filter spoofer.js errors from extensions
        'iframe which has both allow-scripts and allow-same-origin',
        'sandbox attribute can remove its sandboxing',
        'downloadable font: Glyph bbox was incorrect',
        'Adding a listener for beforescriptexecute events is deprecated',
        'Cookie has been rejected because it is in a cross-site context',
        'Cookie will soon be rejected because it is foreign',
        'Partitioned cookie or storage access was provided',
        'Loading failed for the script'
      ];

      const shouldSuppress = cssErrors.some(error => 
        message.includes(error)
      );

      if (!shouldSuppress) {
        originalError.apply(console, args);
      }
    };

  } catch (e) {
    // If console override fails, ignore silently
  }
};

/**
 * Initialize console error suppression for production
 */
export const initConsoleErrorSuppression = () => {
  if (process.env.NODE_ENV === 'production') {
    suppressCSSWarnings();
  }
};
