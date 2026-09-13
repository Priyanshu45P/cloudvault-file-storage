/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          deep: '#0B2C6B',    // Primary - deep blue
          blue: '#1E5FCC',
          sky: '#4FA8F5',     // Secondary - sky blue
          purple: '#7C4DFF',  // Accent - purple
          bg: '#F7F9FC',
          surface: '#FFFFFF',
          'dark-bg': '#0B1220',
          'dark-surface': '#131B2E',
        },
      },
      boxShadow: {
        soft: '0 2px 12px rgba(11, 44, 107, 0.08)',
        card: '0 4px 20px rgba(11, 44, 107, 0.1)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
};
