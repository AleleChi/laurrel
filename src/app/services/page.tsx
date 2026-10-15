import type { Metadata } from 'next';
import { siteConfig } from '@/content/site';
import { ServicesPageClient } from './ServicesPageClient';

export const metadata: Metadata = {
  title: siteConfig.servicesPage.meta.title,
  description: siteConfig.servicesPage.meta.description,
  openGraph: {
    title: siteConfig.servicesPage.meta.title,
    description: siteConfig.servicesPage.meta.description,
    locale: 'en_CA',
    type: 'website',
  },
  alternates: {
    canonical: 'https://laurrelservices.ca/services',
  },
};

export default function ServicesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://laurrelservices.ca',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services',
        item: 'https://laurrelservices.ca/services',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServicesPageClient />
    </>
  );
}
