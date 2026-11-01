import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consultation Booking | Laurrel Services',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function BookTokenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
