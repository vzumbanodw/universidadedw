import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-primary)", "system-ui", "sans-serif"],
        secondary: ["var(--font-secondary)", "system-ui", "sans-serif"],
      },
      colors: {
        // Brand primitives — fixed across themes, kept as hex so Tailwind
        // opacity modifiers (`bg-brand-primary/12`) work out of the box.
        brand: {
          primary: "#00A0B1",
          secondary: "#00394A",
          tertiary: "#1D6076",
          dark: "#12263A",
          orange: "#FBB040",
          green: "#A6CE39",
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F4F4F4",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#222222",
          900: "#171717",
        },
        background: {
          DEFAULT: "var(--background)",
          default: "var(--background)",
          subtle: "var(--background-subtle)",
          elevated: "var(--background-elevated)",
          header: "var(--background-header)",
          success: "var(--background-success)",
          error: "var(--background-error)",
          warning: "var(--background-warning)",
          information: "var(--background-information)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          muted: "var(--surface-muted)",
        },
        foreground: {
          DEFAULT: "var(--text-body)",
          default: "var(--text-body)",
          heading: "var(--text-heading)",
          title: "var(--text-title)",
          subtitle: "var(--text-subtitle)",
          muted: "var(--text-muted)",
          brand: "var(--text-brand)",
          placeholder: "var(--text-placeholder)",
          disabled: "var(--text-disabled)",
          success: "var(--text-success)",
          error: "var(--text-error)",
          warning: "var(--text-warning)",
          information: "var(--text-information)",
        },
        border: {
          DEFAULT: "var(--border-default)",
          default: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
          disabled: "var(--border-disabled)",
          success: "var(--border-success)",
          error: "var(--border-error)",
          warning: "var(--border-warning)",
          information: "var(--border-information)",
        },
        icon: {
          DEFAULT: "var(--icon-default)",
          default: "var(--icon-default)",
          brand: "var(--icon-brand)",
          subtle: "var(--icon-subtle)",
          muted: "var(--icon-muted)",
          disabled: "var(--icon-disabled)",
          success: "var(--icon-success)",
          error: "var(--icon-error)",
          warning: "var(--icon-warning)",
          information: "var(--icon-information)",
        },
        button: {
          primary: "var(--button-primary)",
          secondary: "var(--button-secondary)",
        },
        ring: {
          DEFAULT: "var(--ring)",
        },
      },
      borderRadius: {
        tiny: "var(--radius-tiny)",
        small: "var(--radius-small)",
        regular: "var(--radius-regular)",
        medium: "var(--radius-medium)",
        large: "var(--radius-large)",
        full: "var(--radius-full)",
      },
      borderWidth: {
        tiny: "var(--border-width-tiny)",
        regular: "var(--border-width-regular)",
        medium: "var(--border-width-medium)",
        big: "var(--border-width-big)",
      },
      boxShadow: {
        "elevation-sm": "0 1px 2px 0 rgba(18, 38, 58, 0.04), 0 1px 1px 0 rgba(18, 38, 58, 0.03)",
        "elevation-md": "0 4px 12px -2px rgba(18, 38, 58, 0.08), 0 2px 4px -2px rgba(18, 38, 58, 0.04)",
        "elevation-lg": "0 12px 32px -8px rgba(18, 38, 58, 0.12), 0 4px 12px -4px rgba(18, 38, 58, 0.06)",
        "elevation-xl": "0 24px 64px -12px rgba(18, 38, 58, 0.18), 0 8px 24px -8px rgba(18, 38, 58, 0.08)",
        "focus-ring": "0 0 0 3px rgba(0, 160, 177, 0.18)",
        "focus-ring-error": "0 0 0 3px rgba(248, 71, 58, 0.18)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "progress-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 480ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "fade-in": "fade-in 320ms ease-out both",
        "slide-in-left": "slide-in-left 280ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        float: "float 6s ease-in-out infinite",
        spin: "spin 0.7s linear infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
        "progress-grow": "progress-grow 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
