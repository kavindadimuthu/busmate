import { addons } from "@storybook/manager-api";
import { BusMateTheme } from "./busmate-theme";

addons.setConfig({
  theme: BusMateTheme,
  sidebar: {
    showRoots: true,
  },
});
