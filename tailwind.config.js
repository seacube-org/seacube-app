/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1A73E8",
        surface: "#FFFFFF",
        background: "#F4F5F7",
        border: "#E5E7EB",
        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        status: {
          draft: "#F3F4F6",
          open: "#DBEAFE",
          paid: "#D1FAE5",
          overdue: "#FEE2E2",
          voided: "#F3F4F6",
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
