export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#080C14',          // Deep obsidian dark slate
          canvas: '#0B0F17',
          surface: '#0F172A',     // Elevated card background
          surfaceHover: '#1E293B',
          border: '#1E293B',      // Crisp slate border line
          borderHover: '#334155',
          neon: '#00F0FF',        // Cyan accent
          emerald: '#10B981',     // Settlement green
          violet: '#8B5CF6',      // Purple gradient accent
          rose: '#F43F5E',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      backgroundImage: {
        'fintech-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.12), transparent)',
        'violet-glow': 'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139, 92, 246, 0.08), transparent)',
        'mesh': 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.6) 0%, #080C14 100%)'
      }
    }
  },
  plugins: []
};
