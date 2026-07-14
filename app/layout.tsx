import type { Metadata } from 'next';
import { IBM_Plex_Mono, Rubik } from 'next/font/google';

import './globals.css';

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik-variable',
  weight: ['400', '500', '600'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Fulling - Dedicated AI Workspaces',
  description: 'The identity and runtime credential foundation for dedicated AI workspaces.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${rubik.variable} ${ibmPlexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
