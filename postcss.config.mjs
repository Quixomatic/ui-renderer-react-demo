import convertProperties from './postcss-convert-properties.mjs';

export default {
  plugins: {
    "@tailwindcss/postcss": {},
    "./postcss-convert-properties.mjs": {}, // Convert @property to regular CSS variables
    "postcss-nested": {},              // Flatten nested CSS for Sass compatibility
    "autoprefixer": {},                // Browser prefixes
    "postcss-custom-properties": {     // Convert CSS variables for older browsers/Sass
      preserve: false                  // Don't keep original CSS variables
    },
    "postcss-discard-comments": {}     // Remove comments for cleaner output
  }
}