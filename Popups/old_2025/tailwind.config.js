/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "selector",
  content: {
    relative: true,
    files: ["**.{html,js}"],
  },
  theme: {
    extend: {
      content: {
        check: 'url("svg/icons/check.svg")',
        reload: 'url("svg/icons/reload.svg")',
        calculator: 'url("svg/icons/calculator.svg")',
        chartmixed: 'url("svg/icons/chart-mixed.svg")',
        colors: 'url("svg/icons/colors.svg")',
        creditcardscan: 'url("svg/icons/credit-card-scan.svg")',
        download: 'url("svg/icons/download.svg")',
        drawsquare: 'url("svg/icons/draw-square.svg")',
        eyeslash: 'url("svg/icons/eye-slash.svg")',
        filebookmark: 'url("svg/icons/file-bookmark.svg")',
        fontcase: 'url("svg/icons/font-case.svg")',
        gear: 'url("svg/icons/gear.svg")',
        lock: 'url("svg/icons/lock.svg")',
        messagesquarearrowup: 'url("svg/icons/message-square-arrow-up.svg")',
        moon: 'url("svg/icons/moon.svg")',
        scalebalanced: 'url("svg/icons/scale-balanced.svg")',
        shapes: 'url("svg/icons/shapes.svg")',
        sidebar: 'url("svg/icons/sidebar.svg")',
        swatchbook: 'url("svg/icons/swatchbook.svg")',
        table: 'url("svg/icons/table.svg")',
      },
      animation: {
        fewping: "fewping 500ms cubic-bezier(0, 0, 0.2, 1) 3",
      },
      keyframes: {
        fewping: {
          "0%, 100%": { opacity: "1", filter: "invert(0%)" },
          "50%": { opacity: ".5", filter: "invert(10%)" },
        },
      },
      colors: {
        primary: {
          white: {
            transparent: "#faeaec",
            DEFAULT: "#e4c5ca",
          },
          light: "#c8194a",
          DEFAULT: "#a3133c",
          dark: "#7f0f2f",
        },
      },
      fontFamily: {
        sans: "Poppins, Arial, sans-serif",
      },
    },
  },
};
