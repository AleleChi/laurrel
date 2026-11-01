import type { Metadata } from 'next';
import { getPublishedServicesPageData } from '@/lib/cms/content';
import { siteConfig, getSiteUrl } from '@/content/site';
import { ServicesPageClient } from './ServicesPageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getPublishedServicesPageData();
  const siteUrl = getSiteUrl();
  const canonicalUrl = data.meta?.canonical || `${siteUrl}/services`;
  const ogImageUrl =
    data.meta?.ogImage || siteConfig.servicesPage.meta.ogImage || '/assets/brand/laurrel-social-preview-v2.jpg';
  const title = data.meta?.title;
  const description = data.meta?.description;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !data.meta?.noIndex,
      follow: !data.meta?.noIndex,
    },
    openGraph: {
      title: data.meta?.ogTitle || title,
      description: data.meta?.ogDescription || description,
      url: canonicalUrl,
      siteName: 'Laurrel Services',
      locale: 'en_CA',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: 'image/jpeg',
          alt: data.banner?.altText || 'Cleaning, Moving & Storage Services in Ottawa',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.meta?.ogTitle || title,
      description: data.meta?.ogDescription || description,
      images: [ogImageUrl],
    },
  };
}

export default async function ServicesPage() {
  const { data } = await getPublishedServicesPageData();
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
        name: 'Services',
        item: `${siteUrl}/services`,
      },
    ],
  };

  const servicesSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${siteUrl}/services#cleaning`,
        name: 'Residential Cleaning Services',
        serviceType: 'Cleaning',
        description:
          'Routine, deep, and move-out residential cleaning services in Ottawa and the National Capital Region.',
        provider: {
          '@id': `${siteUrl}/#organization`,
        },
        areaServed: {
          '@type': 'City',
          name: 'Ottawa',
        },
        url: `${siteUrl}/services#cleaning`,
      },
      {
        '@type': 'Service',
        '@id': `${siteUrl}/services#moving`,
        name: 'Local Moving Services',
        serviceType: 'Moving',
        description:
          'Careful residential moving, furniture handling, and local relocations across Ottawa and the NCR.',
        provider: {
          '@id': `${siteUrl}/#organization`,
        },
        areaServed: {
          '@type': 'City',
          name: 'Ottawa',
        },
        url: `${siteUrl}/services#moving`,
      },
      {
        '@type': 'Service',
        '@id': `${siteUrl}/services#storage`,
        name: 'Transitional Storage Arrangements',
        serviceType: 'Storage',
        description:
          'Coordinated transitional storage solutions during home moves, renovations, and property transitions in Ottawa.',
        provider: {
          '@id': `${siteUrl}/#organization`,
        },
        areaServed: {
          '@type': 'City',
          name: 'Ottawa',
        },
        url: `${siteUrl}/services#storage`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <ServicesPageClient content={data} />
    </>
  );
}
