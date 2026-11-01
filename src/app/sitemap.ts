import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/content/site';
import { fetchPublishedPage } from '@/lib/cms/content';

export const revalidate = 3600; // Cache and revalidate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const pages = [
    { slug: 'home', path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { slug: 'services', path: '/services', changeFrequency: 'weekly' as const, priority: 0.9 },
    { slug: 'about', path: '/about', changeFrequency: 'monthly' as const, priority: 0.8 },
    { slug: 'contact', path: '/contact', changeFrequency: 'monthly' as const, priority: 0.8 },
  ];

  const sitemapEntries = await Promise.all(
    pages.map(async (p) => {
      let lastModified = new Date();
      try {
        const published = await fetchPublishedPage(p.slug);
        if (published?.page?.updatedAt) {
          lastModified = new Date(published.page.updatedAt);
        } else if (published?.page?.publishedAt) {
          lastModified = new Date(published.page.publishedAt);
        }
      } catch {
        // Fall back gracefully to current timestamp
      }

      return {
        url: `${baseUrl}${p.path}`,
        lastModified,
        changeFrequency: p.changeFrequency,
        priority: p.priority,
      };
    })
  );

  return sitemapEntries;
}
