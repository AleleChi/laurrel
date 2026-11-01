import type { Metadata } from 'next';
import { getPublishedHomePageData } from '@/lib/cms/content';
import { siteConfig, getSiteUrl } from '@/content/site';
import { HomePageClient } from './HomePageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const homeData = await getPublishedHomePageData();
  const siteUrl = getSiteUrl();
  const canonicalUrl = homeData.seo?.canonical || `${siteUrl}/`;
  const ogImageUrl =
    homeData.seo?.ogImage || siteConfig.meta.ogImage || '/assets/brand/laurrel-social-preview-v2.jpg';
  const title = homeData.seo?.title || siteConfig.meta.title;
  const description = homeData.seo?.description || siteConfig.meta.description;
  const ogTitle =
    homeData.seo?.ogTitle ||
    siteConfig.meta.ogTitle ||
    'Laurrel Services | Cleaning, Moving & Storage in Ottawa';
  const ogDescription =
    homeData.seo?.ogDescription ||
    siteConfig.meta.ogDescription ||
    description;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !homeData.seo?.noIndex,
      follow: !homeData.seo?.noIndex,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: 'Laurrel Services',
      locale: homeData.seo?.locale || 'en_CA',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: 'image/jpeg',
          alt: 'Laurrel Services — Cleaning, Moving & Storage in Ottawa',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function HomePage() {
  const homeData = await getPublishedHomePageData();
  const siteUrl = getSiteUrl();

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: `${siteUrl}/`,
    name: 'Laurrel Services',
    description:
      'Cleaning, moving and storage services for homes and businesses in Ottawa and the National Capital Region.',
    inLanguage: 'en-CA',
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#organization`,
    name: 'Laurrel Services',
    url: `${siteUrl}/`,
    logo: `${siteUrl}/assets/brand/laurrel-symbol.png`,
    image: `${siteUrl}/assets/brand/laurrel-social-preview-v2.jpg`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <HomePageClient initialData={homeData} />
    </>
  );
}
