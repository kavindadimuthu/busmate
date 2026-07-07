import type { Preview } from "@storybook/react";
import React from "react";
import { withThemeByClassName } from "@storybook/addon-themes";
import { ThemePersonalityProvider } from "../src/context/theme-personality-provider";
import { THEMES } from "../src/context/theme-registry";

// Import all CSS — order matters
import "../src/styles/globals.css";

/* ── Decorators ───────────────────────────────────────── */

const withThemePersonality: Preview["decorators"] = [
  (Story, context) => {
    const personality = context.globals.personality || "default";

    // Set personality on the HTML element (matches production behavior)
    React.useEffect(() => {
      document.documentElement.setAttribute("data-theme", personality);
    }, [personality]);

    return (
      <ThemePersonalityProvider defaultPersonality={personality}>
        <div className="bg-background text-foreground min-h-screen p-6">
          <Story />
        </div>
      </ThemePersonalityProvider>
    );
  },
];

/* ── Global Types (toolbar controls) ──────────────────── */

const globalTypes: Preview["globalTypes"] = {
  personality: {
    name: "Theme Personality",
    description: "Color personality for the UI",
    defaultValue: "default",
    toolbar: {
      icon: "paintbrush",
      items: THEMES.map((t) => ({
        value: t.id,
        title: t.label,
        right: t.description,
      })),
      dynamicTitle: true,
    },
  },
};

/* ── Preview Config ───────────────────────────────────── */

const preview: Preview = {
  globalTypes,
  decorators: [
    ...withThemePersonality,
    // Dark mode toggle via class on html element (matches next-themes)
    withThemeByClassName({
      themes: {
        Light: "",
        Dark: "dark",
      },
      defaultTheme: "Light",
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    viewport: {
      viewports: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" } },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop", styles: { width: "1280px", height: "800px" } },
      },
    },
    docs: {
      toc: true,
    },
  },
};

export default preview;
