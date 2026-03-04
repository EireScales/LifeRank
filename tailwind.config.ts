import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3A6DF0",
        accent: "#7B6CFF",
        appbg: "#F6F7FB"
      },
      boxShadow: {
        card: "0 14px 34px rgba(58, 109, 240, 0.12)"
      },
      keyframes: {
        rise: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 0.45s ease-out"
      }
    }
  },
  plugins: []
};

export default config;
