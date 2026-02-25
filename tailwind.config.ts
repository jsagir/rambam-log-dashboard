import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        hebrew: ['Noto Sans Hebrew', 'Arial', 'sans-serif'],
      },
      colors: {
        background: '#1C1914',
        foreground: '#F5F0E8',
        card: '#252019',
        'card-hover': '#2E2822',
        border: '#3A332A',
        gold: '#C8A961',
        'gold-dim': '#A08040',
        'gold-light': '#D4A942',
        parchment: '#F5F0E8',
        'parchment-dim': '#D0C8B8',
        'text-dim': '#B8AFA0',
        success: '#4A8F6F',
        warning: '#D4A843',
        critical: '#C75B3A',
        info: '#2D6A7A',
        translation: '#7B8B9A',
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
    },
  },
  plugins: [],
};

export default config;
