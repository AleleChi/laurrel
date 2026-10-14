import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/content/site';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: siteConfig.meta.title,
  description: siteConfig.meta.description,
  metadataBase: new URL('https://laurrelservices.ca'),
  openGraph: {
    title: siteConfig.meta.title,
    description: siteConfig.meta.description,
    locale: 'en_CA',
    type: 'website',
  },
  icons: {
    icon: '/assets/brand/laurrel-logo-source.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-CA" className={manrope.variable}>
      <body className="font-sans antialiased bg-[#F8F7F4] text-[#202024] selection:bg-[#390044] selection:text-white">
        {children}
      </body>
    </html>
  );
}
