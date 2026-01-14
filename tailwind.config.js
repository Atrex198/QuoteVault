/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0df2f2",
        secondary: "#00b8b8",
        accent: "#64ffda",
        background: {
          light: "#f5f8f8",
          dark: "#102222",
        },
        card: {
          light: "#d4f5f5",
          dark: "#1a3333",
          accent: "#5a5a5a",
        },
        text: {
          primary: "#000000",
          secondary: "#666666",
          light: "#ffffff",
        },
      },
      fontFamily: {
        display: ["Inter_400Regular", "Inter_500Medium", "Inter_600SemiBold", "Inter_700Bold"],
        serif: ["serif"],
      },
    },
  },
  plugins: [],
};
