/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0F",
        surface: "#16161D",
        "surface-elevated": "#1E1E27",
        border: "#2A2A35",
        accent: "#C9A227",
        "accent-muted": "#8A7530",
        foreground: "#F5F5F2",
        muted: "#9A9AA5",
        success: "#3FAE6E",
        warning: "#D9A441",
        danger: "#E0574C",
      },
      fontFamily: {
        sans: ["Inter"],
      },
    },
  },
  plugins: [],
};
