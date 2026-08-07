import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Aperto — Web App',
  description:
    'Đặt lịch & quản lý dự án chụp ảnh, trọn vẹn trên một nền tảng — minh bạch từ booking đến bàn giao ảnh.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23ffc700'/%3E%3Cpath fill='%230a0a0b' d='M 96 50 A 46 46 0 0 1 82.527 82.527 L 55.376 64.004 L 63.703 56.101 Z M 82.527 82.527 A 46 46 0 0 1 50 96 L 43.899 63.703 L 55.376 64.004 Z M 50 96 A 46 46 0 0 1 17.473 82.527 L 35.996 55.376 L 43.899 63.703 Z M 17.473 82.527 A 46 46 0 0 1 4 50 L 36.297 43.899 L 35.996 55.376 Z M 4 50 A 46 46 0 0 1 17.473 17.473 L 44.624 35.996 L 36.297 43.899 Z M 17.473 17.473 A 46 46 0 0 1 50 4 L 56.101 36.297 L 44.624 35.996 Z M 50 4 A 46 46 0 0 1 82.527 17.473 L 64.004 44.624 L 56.101 36.297 Z M 82.527 17.473 A 46 46 0 0 1 96 50 L 63.703 56.101 L 64.004 44.624 Z'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
