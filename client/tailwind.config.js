export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#040711',          // Ultra-dark obsidian navy
          surface: '#0A0F1D',     // Elevated card background
          surfaceHover: '#111827',
          border: '#1E293B',      // Crisp border line
          borderHover: '#334155',
          neon: '#00F0FF',        // Cyber / Fintech Electric Cyan
          emerald: '#10B981',     // Settlement green
          violet: '#8B5CF6',      // Purple gradient accent
          rose: '#F43F5E',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      backgroundImage: {
        'fintech-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 240, 255, 0.15), transparent)',
        'violet-glow': 'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139, 92, 246, 0.12), transparent)',
        'mesh': 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.6) 0%, #040711 100%)'
      }
    }
  },
  plugins: []
};
