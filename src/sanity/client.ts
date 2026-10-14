import { createClient } from '@sanity/client';
import {
  siteConfig,
  HomepageAboutConfig,
  AboutPageConfig,
  SiteConfig,
} from '@/content/site';

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';

// Real Sanity client instance (instantiated if projectId is set)
export const client = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: process.env.NODE_ENV === 'production',
      token: process.env.SANITY_API_READ_TOKEN,
    })
  : null;

export const isCmsConfigured = Boolean(projectId);

/**
 * Fetch Homepage About section data with fallback to local centralized config
 */
export async function getHomeAboutData(): Promise<{
  data: HomepageAboutConfig;
  source: 'sanity' | 'local';
}> {
  if (client) {
    try {
      const query = `*[_type == "homeAbout"][0]{
        eyebrow,
        headline,
        introParagraph,
        stat,
        "mainImage": mainImage.asset->url,
        "mainImageAlt": mainImage.alt,
        rightHeading,
        services,
        cta
      }`;
      const res = await client.fetch(query, {}, { next: { revalidate: 60 } });
      if (res) {
        return {
          data: {
            eyebrow: res.eyebrow || siteConfig.about.eyebrow,
            headline: res.headline || siteConfig.about.headline,
            introParagraph: res.introParagraph || siteConfig.about.introParagraph,
            stat: res.stat || siteConfig.about.stat,
            rightHeading: res.rightHeading || siteConfig.about.rightHeading,
            services: res.services || siteConfig.about.services,
            cta: res.cta || siteConfig.about.cta,
            media: {
              imageSrc: res.mainImage || siteConfig.about.media.imageSrc,
              altText: res.mainImageAlt || siteConfig.about.media.altText,
            },
          },
          source: 'sanity',
        };
      }
    } catch (error) {
      console.warn('[CMS warning] Could not fetch homeAbout from Sanity; falling back to local content:', error);
    }
  }

  return {
    data: siteConfig.about,
    source: 'local',
  };
}

/**
 * Fetch Dedicated About Page data with fallback to local centralized config
 */
export async function getAboutPageData(): Promise<{
  data: AboutPageConfig;
  source: 'sanity' | 'local';
}> {
  if (client) {
    try {
      const query = `*[_type == "aboutPage"][0]{
        hero,
        intro,
        work,
        start,
        location,
        finalCta,
        seo
      }`;
      const res = await client.fetch(query, {}, { next: { revalidate: 60 } });
      if (res) {
        return {
          data: {
            hero: {
              title: res.hero?.title || siteConfig.aboutPage.hero.title,
              breadcrumb: siteConfig.aboutPage.hero.breadcrumb,
              imageSrc: res.hero?.image?.asset?.url || siteConfig.aboutPage.hero.imageSrc,
              altText: res.hero?.image?.alt || siteConfig.aboutPage.hero.altText,
            },
            intro: {
              label: res.intro?.label || siteConfig.aboutPage.intro.label,
              headline: res.intro?.headline || siteConfig.aboutPage.intro.headline,
              paragraphs: res.intro?.paragraphs || siteConfig.aboutPage.intro.paragraphs,
              imageSrc: res.intro?.image?.asset?.url || siteConfig.aboutPage.intro.imageSrc,
              altText: res.intro?.image?.alt || siteConfig.aboutPage.intro.altText,
            },
            work: {
              label: res.work?.label || siteConfig.aboutPage.work.label,
              headline: res.work?.headline || siteConfig.aboutPage.work.headline,
              intro: res.work?.intro || siteConfig.aboutPage.work.intro,
              services: res.work?.services || siteConfig.aboutPage.work.services,
            },
            start: {
              label: res.start?.label || siteConfig.aboutPage.start.label,
              headline: res.start?.headline || siteConfig.aboutPage.start.headline,
              paragraph: res.start?.paragraph || siteConfig.aboutPage.start.paragraph,
              closingLine: res.start?.closingLine || siteConfig.aboutPage.start.closingLine,
            },
            location: {
              label: res.location?.label || siteConfig.aboutPage.location.label,
              headline: res.location?.headline || siteConfig.aboutPage.location.headline,
              body: res.location?.body || siteConfig.aboutPage.location.body,
            },
            finalCta: {
              headline: res.finalCta?.headline || siteConfig.aboutPage.finalCta.headline,
              body: res.finalCta?.body || siteConfig.aboutPage.finalCta.body,
              ctaLabel: res.finalCta?.ctaLabel || siteConfig.aboutPage.finalCta.ctaLabel,
            },
            meta: {
              title: res.seo?.metaTitle || siteConfig.aboutPage.meta.title,
              description: res.seo?.metaDescription || siteConfig.aboutPage.meta.description,
            },
          },
          source: 'sanity',
        };
      }
    } catch (error) {
      console.warn('[CMS warning] Could not fetch aboutPage from Sanity; falling back to local content:', error);
    }
  }

  return {
    data: siteConfig.aboutPage,
    source: 'local',
  };
}
