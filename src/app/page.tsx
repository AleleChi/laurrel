import type { Metadata } from 'next';
import { getPublishedHomePageData } from '@/lib/cms/content';
import { getSiteUrl } from '@/content/site';
import { HomePageClient } from './HomePageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const homeData = await getPublishedHomePageData();

  return {
    title: homeData.seo.title,
    description: homeData.seo.description,
    openGraph: {
      title: homeData.seo.title,
      description: homeData.seo.description,
      locale: homeData.seo.locale,
      type: 'website',
      images: [
        {
          url: homeData.hero.media.imageSrc,
          width: 1200,
          height: 630,
          alt: homeData.hero.media.altText,
        },
      ],
    },
    alternates: {
      canonical: `${getSiteUrl()}/`,
    },
  };
}

export default async function HomePage() {
  const homeData = await getPublishedHomePageData();

  return <HomePageClient initialData={homeData} />;
}
