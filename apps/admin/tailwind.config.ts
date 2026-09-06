import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "rlap-primary": "#002530",
        "rlap-primary-container": "#163b48",
        "rlap-secondary": "#9a442d",
        "rlap-secondary-light": "#e07a5f",
        "rlap-secondary-container": "#fc9174",
        "rlap-tertiary": "#371a00",
        "rlap-tertiary-light": "#d97706",
        "rlap-error": "#ba1a1a",
        "rlap-success": "#2d7a68",
        "rlap-surface": "#fbf9f6",
        "rlap-surface-dim": "#dbdad7",
        "rlap-surface-bright": "#fbf9f6",
        "rlap-surface-container": "#efeeeb",
        "rlap-surface-container-high": "#eae8e5",
        "rlap-surface-container-highest": "#e4e2df",
        "rlap-on-surface": "#1b1c1a",
        "rlap-on-surface-variant": "#41484b",
        "rlap-outline": "#72787b",
        "rlap-outline-variant": "#c1c7cb",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["40px", { lineHeight: "48px", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "title-md": ["18px", { lineHeight: "26px", fontWeight: "600" }],
        "body-lg": ["17px", { lineHeight: "26px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-lg": ["15px", { lineHeight: "20px", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "18px", fontWeight: "500" }],
        caption: ["13px", { lineHeight: "18px", fontWeight: "500" }],
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      boxShadow: {
        "rlap-1": "0 2px 4px rgba(22, 59, 72, 0.03), 0 8px 24px rgba(22, 59, 72, 0.05)",
        "rlap-2": "0 6px 16px rgba(22, 59, 72, 0.06), 0 16px 36px rgba(22, 59, 72, 0.08)",
        "rlap-3": "0 12px 32px rgba(22, 59, 72, 0.12), 0 24px 64px rgba(22, 59, 72, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
