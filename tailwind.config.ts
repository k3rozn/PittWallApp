import type { Config } from "tailwindcss";

// Tailwind v4: most configuration moves to CSS @theme.
// We only need the config file for content paths and plugins.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
