module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Poppins", "Cairo", "Noto Sans Arabic", "Roboto", "Helvetica", "Arial", "sans-serif"],
        arabic: ["Cairo", "Tajawal", "Noto Sans Arabic", "Amiri", "sans-serif"]
      }
    }
  },
  plugins: []
};
