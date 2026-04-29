/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0A1F44",
        accent: "#F5B400",
        success: "#16C784",
        error: "#FF4D4F",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        arabic: ["Tajawal", "sans-serif"],
      },
    },
  },
  plugins: [],
}
