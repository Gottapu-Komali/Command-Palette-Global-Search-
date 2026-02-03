/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'rgb(var(--palette-bg) / <alpha-value>)',
          surface: 'rgb(var(--palette-surface) / <alpha-value>)',
          border: 'rgb(var(--palette-border) / <alpha-value>)',
          text: {
            primary: 'rgb(var(--palette-text-primary) / <alpha-value>)',
            secondary: 'rgb(var(--palette-text-secondary) / <alpha-value>)',
          },
          accent: 'rgb(var(--palette-accent) / <alpha-value>)',
          selection: 'rgb(var(--palette-selection) / <alpha-value>)',
        },
      },
      borderRadius: {
        'token-lg': 'var(--palette-radius-lg)',
        'token-md': 'var(--palette-radius-md)',
        'token-sm': 'var(--palette-radius-sm)',
      },
      animation: {
        'in': 'fade-in 0.2s ease-out, slide-in 0.2s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(10px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
