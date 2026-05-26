import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // amista カラー: サーモンオレンジ × ダーク
        primary: {
          50:  "#fff4f1",
          100: "#ffe5d9",
          200: "#ffbfa0",
          300: "#ffa07a",
          400: "#f49070",
          500: "#ed7e5c",  // メインカラー: Salmon Orange
          600: "#d4623e",
          700: "#af4b2c",
          800: "#8c3c24",
          900: "#6e3020",
          950: "#3b1610",
        },
        secondary: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        warm: {
          50:  "#fdf8f6",
          100: "#f2e8e5",
          200: "#eaddd7",
          300: "#e0cec7",
          400: "#d2bab0",
          500: "#bfa094",
        },
      },
      fontFamily: {
        sans: [
          "Noto Sans JP",
          "Hiragino Kaku Gothic ProN",
          "Hiragino Sans",
          "Meiryo",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #f09270 0%, #ed7e5c 100%)",
        "gradient-warm":    "linear-gradient(135deg, #ed7e5c 0%, #d4623e 50%, #af4b2c 100%)",
        "gradient-soft":    "linear-gradient(135deg, #fff4f1 0%, #fffbeb 100%)",
        "gradient-hero":    "linear-gradient(135deg, #d4623e 0%, #af4b2c 100%)",
      },
      boxShadow: {
        card:       "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover":"0 8px 32px rgba(237, 126, 92, 0.25)",
      },
      animation: {
        "fade-in":  "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
