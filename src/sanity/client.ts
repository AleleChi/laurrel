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
        banner,
        aboutCompany,
        whatWeDo,
        whyLaurrel,
        photographicStory,
        faq,
        finalCta,
        seo
      }`;
      const res = await client.fetch(query, {}, { next: { revalidate: 60 } });
      if (res) {
        return {
          data: {
            banner: {
              title: res.banner?.title || siteConfig.aboutPage.banner.title,
              breadcrumb: siteConfig.aboutPage.banner.breadcrumb,
              imageSrc: res.banner?.image?.asset?.url || siteConfig.aboutPage.banner.imageSrc,
              altText: res.banner?.image?.alt || siteConfig.aboutPage.banner.altText,
            },
            aboutCompany: {
              eyebrow: res.aboutCompany?.eyebrow || siteConfig.aboutPage.aboutCompany.eyebrow,
              headline: res.aboutCompany?.headline || siteConfig.aboutPage.aboutCompany.headline,
              paragraph1: res.aboutCompany?.paragraph1 || siteConfig.aboutPage.aboutCompany.paragraph1,
              paragraph2: res.aboutCompany?.paragraph2 || siteConfig.aboutPage.aboutCompany.paragraph2,
              cta: res.aboutCompany?.cta || siteConfig.aboutPage.aboutCompany.cta,
              imageSrc: res.aboutCompany?.image?.asset?.url || siteConfig.aboutPage.aboutCompany.imageSrc,
              altText: res.aboutCompany?.image?.alt || siteConfig.aboutPage.aboutCompany.altText,
            },
            whatWeDo: {
              eyebrow: res.whatWeDo?.eyebrow || siteConfig.aboutPage.whatWeDo.eyebrow,
              headline: res.whatWeDo?.headline || siteConfig.aboutPage.whatWeDo.headline,
              intro: res.whatWeDo?.intro || siteConfig.aboutPage.whatWeDo.intro,
              services: res.whatWeDo?.services || siteConfig.aboutPage.whatWeDo.services,
            },
            whyLaurrel: {
              eyebrow: res.whyLaurrel?.eyebrow || siteConfig.aboutPage.whyLaurrel.eyebrow,
              headline: res.whyLaurrel?.headline || siteConfig.aboutPage.whyLaurrel.headline,
              intro: res.whyLaurrel?.intro || siteConfig.aboutPage.whyLaurrel.intro,
              points: res.whyLaurrel?.points || siteConfig.aboutPage.whyLaurrel.points,
              imageSrc: res.whyLaurrel?.image?.asset?.url || siteConfig.aboutPage.whyLaurrel.imageSrc,
              altText: res.whyLaurrel?.image?.alt || siteConfig.aboutPage.whyLaurrel.altText,
            },
            photographicStory: {
              eyebrow: res.photographicStory?.eyebrow || siteConfig.aboutPage.photographicStory.eyebrow,
              headline: res.photographicStory?.headline || siteConfig.aboutPage.photographicStory.headline,
              bodyParagraphs: res.photographicStory?.bodyParagraphs || siteConfig.aboutPage.photographicStory.bodyParagraphs,
              ctaLabel: res.photographicStory?.ctaLabel || siteConfig.aboutPage.photographicStory.ctaLabel,
              imageSrc: res.photographicStory?.image?.asset?.url || siteConfig.aboutPage.photographicStory.imageSrc,
              altText: res.photographicStory?.image?.alt || siteConfig.aboutPage.photographicStory.altText,
            },
            faq: {
              eyebrow: res.faq?.eyebrow || siteConfig.aboutPage.faq.eyebrow,
              headline: res.faq?.headline || siteConfig.aboutPage.faq.headline,
              imageSrc: res.faq?.image?.asset?.url || siteConfig.aboutPage.faq.imageSrc,
              altText: res.faq?.image?.alt || siteConfig.aboutPage.faq.altText,
              items: res.faq?.items || siteConfig.aboutPage.faq.items,
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
