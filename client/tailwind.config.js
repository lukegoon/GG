/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080c14',
        surface: '#0d1321',
        surface2: '#111927',
        surface3: '#16202e',
        accent: '#00e5ff',
        accent2: '#ff3d71',
        accent3: '#f5a623',
        accent4: '#7c4dff',
        success: '#00e676',
        text1: '#e8edf5',
        text2: '#8899aa',
        text3: '#506070',
        gold: '#ffd700',
        silver: '#c0c0c0',
        bronze: '#cd7f32',
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
        strong: 'rgba(255,255,255,0.10)',
      }
    }
  },
  plugins: []
}
