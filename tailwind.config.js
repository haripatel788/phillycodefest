/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        mist: '#f4efe4',
        navy: '#0D1B2A',
        primary: '#1B6CA8',
        success: '#2E7D52',
        warning: '#B45309',
        border: '#E5E7EB',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        serif: ['"Source Serif 4"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 14px 50px rgba(13, 27, 42, 0.12)',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseScale: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.07)' },
        },
      },
      animation: {
        floatIn: 'floatIn 700ms ease-out both',
        pulseScale: 'pulseScale 1700ms ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
