import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/content/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/_next/', '/assets/'],
        disallow: [
          '/admin/',
          '/api/',
          '/book/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
