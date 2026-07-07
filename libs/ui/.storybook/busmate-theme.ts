import { create } from "@storybook/theming";

export const BusMateTheme = create({
  base: "light",
  brandTitle: "BusMate UI",
  brandUrl: "/",

  // Brand colors (BusMate Blue)
  colorPrimary: "hsl(221, 83%, 53%)",
  colorSecondary: "hsl(221, 83%, 53%)",

  // UI
  appBg: "hsl(0, 0%, 98%)",
  appContentBg: "hsl(0, 0%, 100%)",
  appBorderColor: "hsl(220, 13%, 88%)",
  appBorderRadius: 8,

  // Typography
  fontBase: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, monospace',

  // Text colors
  textColor: "hsl(220, 16%, 12%)",
  textInverseColor: "hsl(0, 0%, 100%)",
  textMutedColor: "hsl(220, 9%, 42%)",

  // Toolbar
  barTextColor: "hsl(220, 9%, 42%)",
  barSelectedColor: "hsl(221, 83%, 53%)",
  barBg: "hsl(0, 0%, 100%)",

  // Form colors
  inputBg: "hsl(0, 0%, 100%)",
  inputBorder: "hsl(220, 13%, 88%)",
  inputTextColor: "hsl(220, 16%, 12%)",
  inputBorderRadius: 6,
});
