import type { Metadata } from 'next';
import { getPublishedServicesPageData } from '@/lib/cms/content';
import { getSiteUrl } from '@/content/site';
import { ServicesPageClient } from './ServicesPageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getPublishedServicesPageData();
  const title = data.meta?.title || 'Cleaning, Moving & Storage Services Ottawa | Laurrel Services';
  const description = data.meta?.description || 'Explore cleaning, moving and storage services in Ottawa.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: 'en_CA',
      type: 'website',
    },
    alternates: {
      canonical: `${getSiteUrl()}/services`,
    },
  };
}

export default async function ServicesPage() {
  const { data } = await getPublishedServicesPageData();
  const siteUrl = getSiteUrl();

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
        name: 'Services',
        item: `${siteUrl}/services`,
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
