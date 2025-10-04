module.exports = {
  darkMode: "class", // Enable class-based dark mode
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Custom colors for better dark mode support
        dark: {
          bg: "#0f172a", // Main dark background
          card: "#1e293b", // Card background
          border: "#334155", // Border color
          text: "#e2e8f0", // Primary text
          muted: "#94a3b8", // Muted text
        },
      },
    },
  },
  plugins: [],
};
