import type { Metadata } from 'next';
import { getPublishedAboutPageData } from '@/lib/cms/content';
import { getSiteUrl } from '@/content/site';
import { AboutPageClient } from './AboutPageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getPublishedAboutPageData();

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
          url: data.banner.imageSrc,
          width: 1200,
          height: 630,
          alt: data.banner.altText,
        },
      ],
    },
    alternates: {
      canonical: `${getSiteUrl()}/about`,
    },
  };
}

export default async function AboutPage() {
  const { data } = await getPublishedAboutPageData();
  const siteUrl = getSiteUrl();

  // Structured Data (JSON-LD) for BreadcrumbList
  const jsonLd = {
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
        name: 'About',
        item: `${siteUrl}/about`,
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
