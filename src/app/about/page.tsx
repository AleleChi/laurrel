import type { Metadata } from 'next';
import { getAboutPageData } from '@/sanity/client';
import { AboutPageClient } from './AboutPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getAboutPageData();

  return {
    title: data.meta.title,
    description: data.meta.description,
    openGraph: {
      title: data.meta.title,
      description: data.meta.description,
      locale: 'en_CA',
      type: 'website',
      images: [
        {
          url: data.hero.imageSrc,
          width: 1200,
          height: 630,
          alt: data.hero.altText,
        },
      ],
    },
    alternates: {
      canonical: 'https://laurrelservices.ca/about',
    },
  };
}

export default async function AboutPage() {
  const { data } = await getAboutPageData();

  // Structured Data (JSON-LD) for BreadcrumbList
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
        name: 'About',
        item: 'https://laurrelservices.ca/about',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutPageClient content={data} />
    </>
  );
}
