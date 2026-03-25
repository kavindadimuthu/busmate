import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

const config: StorybookConfig = {
  stories: [
    "../src/docs/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: [],
  viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: {
        alias: [
          { find: /^@busmate\/ui$/, replacement: resolve(__dirname, "../src/index.ts") },
          { find: /^@busmate\/ui\/(.*)$/, replacement: resolve(__dirname, "../src/$1") },
          { find: /^@\/(.*)$/, replacement: resolve(__dirname, "../src/$1") },
        ],
      },
    });
  },
};

export default config;
