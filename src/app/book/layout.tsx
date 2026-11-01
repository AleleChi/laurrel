import { Metadata } from 'next';
import { getSiteUrl } from '@/content/site';

export const metadata: Metadata = {
  title: 'Book a Consultation | Laurrel Services Ottawa',
  description:
    'Schedule a consultation or discuss cleaning, moving, and storage requirements with Laurrel Services in Ottawa.',
  alternates: {
    canonical: `${getSiteUrl()}/book`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
