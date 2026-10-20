/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        academic: {
          paper: '#FAF9F6',       // WCAG AAA warm paper (Light mode)
          darkPaper: '#0B0F19',   // Deep academic slate/obsidian (Dark mode)
          cardLight: '#FFFFFF',
          cardDark: '#131B2E',
          borderLight: '#E2E8F0',
          borderDark: '#1E293B',
          textLight: '#0F172A',   // 15.8:1 AAA contrast
          textDark: '#F1F5F9',    // 17.2:1 AAA contrast
          mutedLight: '#475569',  // 7.1:1 AAA contrast
          mutedDark: '#94A3B8',
          accent: '#3B82F6',      // Kinematic Blue
          spring: '#10B981',      // SLIP Emerald
          force: '#EF4444',       // GRF Vector Crimson
          angle: '#F59E0B',       // Joint Flexion Amber
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace']
      },
      maxWidth: {
        'prose-academic': '72ch', // Optimal reading limit 65-75ch
      },
      spacing: {
        'touch-target': '48px',   // Mobile human interface touch floor
      }
    },
  },
  plugins: [],
}
