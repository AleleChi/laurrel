import type { Metadata } from 'next';
import { getPublishedContactPageData } from '@/lib/cms/content';
import { getSiteUrl } from '@/content/site';
import { ContactPageClient } from './ContactPageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { data: content } = await getPublishedContactPageData();

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
      canonical: `${getSiteUrl()}/contact`,
    },
  };
}

export default async function ContactPage() {
  const { data: content } = await getPublishedContactPageData();
  const siteUrl = getSiteUrl();

  // Structured Data (JSON-LD) for BreadcrumbList and LocalBusiness
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Contact Us',
          item: `${siteUrl}/contact`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Laurrel Services',
      url: siteUrl,
      telephone: content.businessPhone || '(343) 843-3032',
      email:
        content.businessEmail && !content.businessEmail.endsWith('@laurrelservices.ca')
          ? content.businessEmail
          : 'info@laurrelservices.com',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Ottawa',
        addressRegion: 'ON',
        addressCountry: 'CA',
      },
      areaServed: [
        {
          '@type': 'City',
          name: 'Ottawa',
        },
        {
          '@type': 'AdministrativeArea',
          name: 'National Capital Region',
        },
      ],
    },
  ];

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
