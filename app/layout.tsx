import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'TeachAlike - Learn. Listen. Grow.',
  description:
    'TeachAlike is a reading-companion app for children: guided reading sessions, book-linked mini-games, and family voice profiles.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script id="theme-init" strategy="beforeInteractive">
        {`(() => {
          try {
            const storedTheme = localStorage.getItem('teachalike_theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = storedTheme ? storedTheme === 'dark' : prefersDark;
            document.documentElement.classList.toggle('dark', isDark);
            document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
          } catch (_) {}
        })()`}
      </Script>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
