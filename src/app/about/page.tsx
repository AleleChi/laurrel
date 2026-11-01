import type { Metadata } from 'next';
import { getPublishedAboutPageData } from '@/lib/cms/content';
import { getSiteUrl } from '@/content/site';
import { AboutPageClient } from './AboutPageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getPublishedAboutPageData();
  const siteUrl = getSiteUrl();
  const canonicalUrl = data.meta?.canonical || `${siteUrl}/about`;
  const ogImageUrl = data.meta?.ogImage || '/assets/brand/og-image.jpg';
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
          alt: data.banner?.altText || 'About Laurrel Services',
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

export default async function AboutPage() {
  const { data } = await getPublishedAboutPageData();
  const siteUrl = getSiteUrl();

  // Structured Data (JSON-LD) for BreadcrumbList
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
        name: 'About',
        item: `${siteUrl}/about`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AboutPageClient content={data} />
    </>
  );
}
