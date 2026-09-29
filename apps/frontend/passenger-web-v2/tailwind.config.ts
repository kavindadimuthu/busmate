import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1240px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        tint: "hsl(var(--tint))",
        soft: "hsl(var(--soft))",
        alt: "hsl(var(--alt))",
        footer: "hsl(var(--footer))",
        highlight: "hsl(var(--highlight))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        header: "hsl(var(--header))",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #2563eb, #1d4ed8)",
        "gradient-band": "linear-gradient(110deg, #1e3a8a, #2563eb)",
      },
      boxShadow: {
        float: "0 24px 60px -24px rgba(30, 64, 175, 0.4)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    animate,
    // `touch:` — finger-sized tap targets on any touchscreen (tablets included), whatever its width.
    // Tailwind emits plugin variants before the `md:` breakpoints, so the `:root` prefix is what lets
    // a touch rule beat a later `md:` rule on a tablet.
    plugin(({ addVariant }) => addVariant("touch", "@media (pointer: coarse) { :root & }")),
  ],
} satisfies Config;
