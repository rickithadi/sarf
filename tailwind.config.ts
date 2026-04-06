import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Nautical Precisionist design system tokens
        primary: '#001e40',
        'primary-container': '#003366',
        'on-primary': '#ffffff',
        'on-primary-fixed': '#001b3c',
        secondary: '#1a60a4',
        'secondary-container': '#7bb3fd',
        'on-secondary': '#ffffff',
        tertiary: '#002504',
        'tertiary-container': '#003d0b',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#5ead5c',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        // Surface tiers — boundaries via color shifts, never borders
        surface: '#f7f9fb',
        'surface-dim': '#d8dadc',
        'surface-bright': '#f7f9fb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f6',
        'surface-container': '#eceef0',
        'surface-container-high': '#e6e8ea',
        'surface-container-highest': '#e0e3e5',
        'on-surface': '#191c1e',
        'on-surface-variant': '#43474f',
        'inverse-surface': '#2d3133',
        'inverse-on-surface': '#eff1f3',
        'inverse-primary': '#a7c8ff',
        outline: '#737780',
        'outline-variant': '#c3c6d1',
        'surface-tint': '#3a5f94',
        // Surf condition status
        'surf-good': 'rgb(var(--surf-good-rgb) / <alpha-value>)',
        'surf-okay': 'rgb(var(--surf-okay-rgb) / <alpha-value>)',
        'surf-poor': 'rgb(var(--surf-poor-rgb) / <alpha-value>)',
        // Legacy brand aliases for backward compatibility during migration
        'brand-navy': '#001e40',
        'brand-ocean': '#1a60a4',
        'brand-ocean-deep': '#004883',
      },
    },
  },
  plugins: [],
};
export default config;
