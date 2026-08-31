export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pay: {
          darker: '#090D16',
          dark: '#0E131F',
          card: '#141B2D',
          border: '#1F293D',
          accent: '#6366F1', // Indigo Neon Fintech
          accentHover: '#4F46E5',
          emerald: '#10B981',
          rose: '#F43F5E',
          amber: '#F59E0B',
          purple: '#A855F7'
        }
      }
    }
  },
  plugins: []
};
