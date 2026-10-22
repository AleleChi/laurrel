import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Draft Preview | Laurrel Services Operations',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
