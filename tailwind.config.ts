import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#023859',
          600: '#26658C',
          400: '#54ACBF',
        },
        bg: '#EEF4F6',
        surface: '#F6F9FA',
        border: '#D3E1E7',
        muted: '#5B7183',
        success: '#3FA66B',
        warning: '#E0A438',
        danger: '#D6534B',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(2, 56, 89, 0.06), 0 1px 12px rgba(2, 56, 89, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
