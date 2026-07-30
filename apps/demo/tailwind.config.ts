import anansePreset from "@ananse/tokens/tailwind";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [anansePreset as Config],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/react/dist/**/*.js",
    "../../packages/react/src/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
