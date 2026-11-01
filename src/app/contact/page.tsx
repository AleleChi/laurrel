import type { Metadata } from 'next';
import { getPublishedContactPageData } from '@/lib/cms/content';
import { getSiteUrl } from '@/content/site';
import { ContactPageClient } from './ContactPageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { data: content } = await getPublishedContactPageData();
  const siteUrl = getSiteUrl();
  const canonicalUrl = content.meta?.canonical || `${siteUrl}/contact`;
  const ogImageUrl = content.meta?.ogImage || '/assets/brand/og-image.jpg';
  const title = content.meta?.title;
  const description = content.meta?.description;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !content.meta?.noIndex,
      follow: !content.meta?.noIndex,
    },
    openGraph: {
      title: content.meta?.ogTitle || title,
      description: content.meta?.ogDescription || description,
      url: canonicalUrl,
      siteName: 'Laurrel Services',
      locale: 'en_CA',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: content.banner?.altText || 'Contact Laurrel Services Ottawa',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.meta?.ogTitle || title,
      description: content.meta?.ogDescription || description,
      images: [ogImageUrl],
    },
  };
}

export default async function ContactPage() {
  const { data: content } = await getPublishedContactPageData();
  const siteUrl = getSiteUrl();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${siteUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Contact Us',
        item: `${siteUrl}/contact`,
      },
    ],
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#organization`,
    name: 'Laurrel Services',
    url: `${siteUrl}/`,
    logo: `${siteUrl}/assets/brand/laurrel-symbol.png`,
    image: `${siteUrl}/assets/brand/og-image.jpg`,
    description:
      'Professional residential cleaning, careful local moving, and transitional storage arrangements in Ottawa and the National Capital Region.',
    email: 'info@laurrelservices.com',
    telephone: '+13438433032',
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
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '08:00',
        closes: '18:00',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <ContactPageClient content={content} />
    </>
  );
}
