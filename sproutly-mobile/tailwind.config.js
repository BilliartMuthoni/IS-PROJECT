/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.js", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forestDeep: "#0B1A13",
        forestMid: "#1B3D2F",
        forestLight: "#2D5A43",
        primary: "#1B4332",
        glassBorder: "rgba(255, 255, 255, 0.1)",
      },
    },
  },
  plugins: [],
};
