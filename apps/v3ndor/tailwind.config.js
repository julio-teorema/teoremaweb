const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--v-bg-card)',
        elevated: 'var(--v-bg-elevated)',
        soft: 'var(--v-bg-soft)',
        text: {
          DEFAULT: 'var(--v-text-primary)',
          primary: 'var(--v-text-primary)',
          secondary: 'var(--v-text-secondary)',
          muted: 'var(--v-text-muted)',
        },
        border: {
          DEFAULT: 'var(--v-border)',
          strong: 'var(--v-border-strong)',
        },
        state: {
          success: 'var(--state-success)',
          'success-soft': 'var(--state-success-soft)',
          warning: 'var(--state-warning)',
          'warning-soft': 'var(--state-warning-soft)',
          danger: 'var(--state-danger)',
          'danger-soft': 'var(--state-danger-soft)',
          info: 'var(--state-info)',
          'info-soft': 'var(--state-info-soft)',
        },
        primary: {
          green: 'var(--color-primary-green)',
          blue: 'var(--color-primary-blue)',
          dark: 'var(--color-primary-dark)',
        },
        secondary: {
          'green-light': 'var(--color-secondary-green-light)',
          'blue-light': 'var(--color-secondary-blue-light)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--v-shadow-card)',
        popover: 'var(--v-shadow-popover)',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
    },
  },
  plugins: [],
};
