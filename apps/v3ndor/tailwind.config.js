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
        primary: {
          green: '#7ED321',
          blue: '#1B75BC',
          dark: '#0A2540',
        },
        secondary: {
          'green-light': '#E8F5E9',
          'blue-light': '#E3F2FD',
        },
        background: {
          light: {
            primary: '#FFFFFF',
            secondary: '#F5F5F5',
          },
          dark: {
            primary: '#121212',
            secondary: '#1E1E1E',
            elevated: '#2A2A2A',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
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
