/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/core/src/**/*.{js,ts,jsx,tsx}',
    '../restaurante/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Sora', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        sora: ['Sora', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      colors: {
        heis: {
          teal: '#02CBA9',
          purple: '#7D71EB',
          cyan: '#1CC0F9',
          night: '#110C2B',
          nightSurface: '#18123B',
          nightElevated: '#22194E',
          white: '#FFFFFF',
        },
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          cyan: 'var(--brand-cyan)',
          night: 'var(--brand-night)',
          glow: 'var(--brand-glow)',
        },
      },
      boxShadow: {
        'heis-glow': '0 0 25px rgba(2, 203, 169, 0.25)',
        'heis-purple': '0 0 25px rgba(125, 113, 235, 0.25)',
      },
    },
  },
  plugins: [],
};


