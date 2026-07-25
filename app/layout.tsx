import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'TeachAlike - Learn. Listen. Grow.',
  description:
    'TeachAlike is a reading-companion app for children: guided reading sessions, book-linked mini-games, and family voice profiles.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
