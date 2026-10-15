import type { Metadata } from 'next';
import { getServicesPageData } from '@/sanity/client';
import { ServicesPageClient } from './ServicesPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getServicesPageData();

  return {
    title: data.meta.title,
    description: data.meta.description,
    openGraph: {
      title: data.meta.title,
      description: data.meta.description,
      locale: 'en_CA',
      type: 'website',
    },
    alternates: {
      canonical: 'https://laurrelservices.ca/services',
    },
  };
}

export default async function ServicesPage() {
  const { data } = await getServicesPageData();

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
      <ServicesPageClient content={data} />
    </>
  );
}
