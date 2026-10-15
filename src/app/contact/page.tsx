import type { Metadata } from 'next';
import { getContactPageData } from '@/sanity/client';
import { ContactPageClient } from './ContactPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const { data: content } = await getContactPageData();

  return {
    title: content.meta.title,
    description: content.meta.description,
    openGraph: {
      title: content.meta.title,
      description: content.meta.description,
      locale: 'en_CA',
      type: 'website',
      images: [
        {
          url: content.banner.imageSrc,
          width: 1200,
          height: 630,
          alt: content.banner.altText,
        },
      ],
    },
    alternates: {
      canonical: 'https://laurrelservices.ca/contact',
    },
  };
}

export default async function ContactPage() {
  const { data: content } = await getContactPageData();

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
        name: 'Contact Us',
        item: 'https://laurrelservices.ca/contact',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactPageClient content={content} />
    </>
  );
}
