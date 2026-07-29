import canvasPreset from "@canvas/tokens/tailwind";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [canvasPreset as Config],
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
