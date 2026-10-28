// Colores y tipografía de toda la aplicación: se definen solo aquí.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          50: '#EEF5FB',
          100: '#DEEAF6',
          500: '#2E75B6',
          700: '#1F4E79',
          900: '#13304B',
        },
        exito: '#2E7D32',
        aviso: '#B26A00',
        peligro: '#C62828',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Calibri', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
