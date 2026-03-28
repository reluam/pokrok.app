/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        accent: "#4ECDC4",
        "accent-orange": "#FF8C42",
        background: "#FDFDF7",
        foreground: "#171717",
        muted: "#666666",
        border: "#e5e5e5",
        "box-bg": "#f5f5f5",
      },
      fontFamily: {
        sans: ["Nunito"],
        heading: ["Baloo2"],
      },
    },
  },
  plugins: [],
};
