import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2430",
        muted: "#6B7080",
        bg: "#FFFFFF",
        surface: "#F7F5FC",
        surface2: "#EFEAFA",
        lilac: {
          DEFAULT: "#B9A6E8",
          soft: "#EAE3FA",
          deep: "#8B6FD1",
        },
        blue: {
          DEFAULT: "#4C6FE7",
          soft: "#E3E9FD",
          deep: "#3552C2",
        },
        valid: {
          DEFAULT: "#1F9D6B",
          soft: "#E4F6EE",
        },
        warn: {
          DEFAULT: "#E8A93C",
          soft: "#FCF1DD",
        },
        danger: {
          DEFAULT: "#E14F4F",
          soft: "#FBE7E7",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(76, 111, 231, 0.08), 0 8px 24px -8px rgba(139, 111, 209, 0.12)",
        card: "0 1px 2px rgba(31,36,48,0.04), 0 8px 20px -6px rgba(139,111,209,0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
