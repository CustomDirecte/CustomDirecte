/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: {
    relative: true,
    files: [
      "./**/*.{html,js}",
      "../../src/pages/popup/**/*.{html,js}",
      "../../src/core/settings/**/*.js",
    ],
  },
  theme: {
    extend: {
      colors: {
        text: {
          DEFAULT: "var(--text)",
          light: "var(--text-light)",
          white: {
            DEFAULT: "var(--text-white)",
            full: "var(--text-white-full)",
          },
          pink: "var(--text-pink)",
        },
        switch: {
          main: "var(--switch-main)",
          off: "var(--switch-off)",
          stroke: "var(--switch-stroke)",
          circle: {
            DEFAULT: "var(--switch-circle)",
            stroke: "var(--switch-circle-stroke)",
          },
        },
        custom: {
          gray: {
            verylight: "var(--custom-gray-verylight)",
            light: "var(--custom-gray-light)",
            DEFAULT: "var(--custom-gray)",
            dark: {
              DEFAULT: "var(--custom-gray-dark)",
              transp: "var(--custom-gray-dark-transp)",
            },
            verydark: {
              DEFAULT: "var(--custom-gray-verydark)",
              transp: "var(--custom-gray-verydark-transp)",
            },
          },
          pink: {
            DEFAULT: "var(--custom-pink)",
            transp: "var(--custom-pink-transp)",
            ulttransp: "var(--custom-pink-ulttransp)",
          },
          white: {
            dark: "var(--custom-white-dark)",
            DEFAULT: "var(--custom-white)",
            light: "var(--custom-white-light)",
          },
        },
      },
      boxShadow: {
        xs: "0 0 6px 0 var(--shadow-xs)",
        sm: "0 2px 2px 0 var(--shadow-sm)",
        md: "0 0 1px 0 var(--shadow-md)",
        lg: "0 1px 2px 0 var(--shadow-lg)",
        xl: "0 0 2px 0 var(--shadow-xl)",
      },
    },
  },
  plugins: [require("./tailwindform.js")],
};
