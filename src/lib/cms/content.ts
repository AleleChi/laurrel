import {
  siteConfig,
  getSiteUrl,
  PageSeoConfig,
  AboutPageConfig,
  ServicesPageConfig,
  ContactPageConfig,
  ServicesHighlightConfig,
  OverlappingPlansConfig,
  RequestQuoteSectionConfig,
  HomeFaqConfig,
  HomeContactConfig,
} from '@/content/site';

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.API_BASE_URL ||
  'http://localhost:5000';

export interface PageSeoData {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  locale?: string;
}

export interface PublishedPagePayload<TSections = Record<string, any>> {
  page: {
    id: string;
    name: string;
    slug: string;
    template: string;
    status: string;
    seo: {
      title?: string;
      description?: string;
      canonical?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      noIndex?: boolean;
    };
    currentRevisionId?: string;
    publishedAt?: string;
    updatedAt: string;
  };
  sections: TSections;
  source: 'cms' | 'local_fallback';
}

/**
 * Low-level published page fetcher from native Neon-backed Express API
 */
export async function fetchPublishedPage(
  slug: string
): Promise<PublishedPagePayload | null> {
  const normalizedSlug = slug.replace(/^\//, '') || 'home';
  const url = `${BACKEND_URL.replace(/\/$/, '')}/api/public/content/${normalizedSlug}`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return {
          page: data.data.page,
          sections: data.data.sections,
          source: 'cms',
        };
      }
    }
  } catch (err: any) {
    console.warn(`[CMS Content Fetch Warning] Backend unreachable at ${url}: ${err.message}. Using approved static fallback.`);
  }

  return null;
}

/**
 * Homepage Published Content Fetcher with graceful fallback to approved siteConfig
 */
export async function getPublishedHomePageData(): Promise<{
  hero: typeof siteConfig.hero;
  ticker: typeof siteConfig.ticker;
  about: typeof siteConfig.about;
  servicesHighlight: ServicesHighlightConfig;
  overlappingPlans: OverlappingPlansConfig;
  requestQuote: RequestQuoteSectionConfig;
  faq: HomeFaqConfig;
  contact: HomeContactConfig;
  seo: PageSeoData;
  source: 'cms' | 'local_fallback';
}> {
  const result = await fetchPublishedPage('home');

  if (result && result.sections) {
    const sec = result.sections;
    return {
      hero: {
        ...siteConfig.hero,
        ...(sec['hero'] || {}),
        headline: {
          line1: (sec['hero']?.headline?.line1 && sec['hero'].headline.line1 !== 'Clean spaces.' && sec['hero'].headline.line1 !== 'Make space')
            ? sec['hero'].headline.line1
            : siteConfig.hero.headline.line1,
          line2: (sec['hero']?.headline?.line2 && sec['hero'].headline.line2 !== 'Smooth moves.' && sec['hero'].headline.line2 !== "for what's next.")
            ? sec['hero'].headline.line2
            : siteConfig.hero.headline.line2,
          line3: sec['hero']?.headline?.line3 !== undefined ? sec['hero'].headline.line3 : siteConfig.hero.headline.line3,
        },
        eyebrow: (sec['hero']?.eyebrow && !sec['hero'].eyebrow.includes('STORAGE IN OTTAWA'))
          ? sec['hero'].eyebrow
          : siteConfig.hero.eyebrow,
        body: (sec['hero']?.body && sec['hero'].body.length > 50 && !sec['hero'].body.includes('Whether you’re preparing a property') && !sec['hero'].body.includes('From keeping your place clean'))
          ? sec['hero'].body
          : siteConfig.hero.body,
        media: {
          ...siteConfig.hero.media,
          ...((sec['hero'] && sec['hero'].media) || {}),
          // Guard against legacy single-image or outdated /assets/hero/ values from older CMS revisions
          imageSrc: (
            sec['hero']?.media?.imageSrc &&
            !sec['hero'].media.imageSrc.includes('cleaning-hero') &&
            !sec['hero'].media.imageSrc.includes('laurrel-room') &&
            !sec['hero'].media.imageSrc.startsWith('/assets/hero/')
          )
            ? sec['hero'].media.imageSrc
            : siteConfig.hero.media.imageSrc,
          slides: (Array.isArray(sec['hero']?.media?.slides) && sec['hero'].media.slides.length > 0)
            ? sec['hero'].media.slides
            : siteConfig.hero.media.slides,
          services:
            (sec['hero']?.media?.services && sec['hero'].media.services.length > 0)
              ? sec['hero'].media.services
              : siteConfig.hero.media.services,
        },
      },
      ticker: (
        Array.isArray(sec['ticker']?.items) &&
        sec['ticker'].items.some((i: any) => i?.label === 'Storage Solutions')
      )
        ? sec['ticker']
        : siteConfig.ticker,
      about: (() => {
        const rawAbout = sec['about'] || {};
        const isOutdatedHeadline =
          !rawAbout.headline ||
          rawAbout.headline === 'Three services that belong together.' ||
          rawAbout.headline === 'The details matter before the work begins.' ||
          rawAbout.headline.includes('belong together');
        const isOutdatedImage =
          !rawAbout.media?.imageSrc ||
          rawAbout.media.imageSrc === '/assets/hero/about-handover.webp' ||
          rawAbout.media.imageSrc.includes('about-handover') ||
          rawAbout.media.imageSrc.includes('moving-poster');
        const isOutdatedServices =
          !Array.isArray(rawAbout.services) ||
          rawAbout.services.some((s: any) =>
            s?.title === 'One point of contact' ||
            s?.title === 'Planned around real dates' ||
            s?.title === 'No forced bundles'
          );

        return {
          ...siteConfig.about,
          ...rawAbout,
          eyebrow: rawAbout.eyebrow || siteConfig.about.eyebrow,
          headline: isOutdatedHeadline ? siteConfig.about.headline : rawAbout.headline,
          introParagraph: (rawAbout.introParagraph && !rawAbout.introParagraph.includes('under one roof') && !rawAbout.introParagraph.includes('Moving day rarely means just one job'))
            ? rawAbout.introParagraph
            : siteConfig.about.introParagraph,
          rightHeading: (rawAbout.rightHeading && !rawAbout.rightHeading.includes('Practical help for homes'))
            ? rawAbout.rightHeading
            : siteConfig.about.rightHeading,
          services: isOutdatedServices ? siteConfig.about.services : rawAbout.services,
          cta: rawAbout.cta || siteConfig.about.cta,
          media: {
            ...siteConfig.about.media,
            ...(rawAbout.media || {}),
            imageSrc: isOutdatedImage ? siteConfig.about.media.imageSrc : rawAbout.media.imageSrc,
            altText: isOutdatedImage ? siteConfig.about.media.altText : (rawAbout.media.altText || siteConfig.about.media.altText),
          },
        };
      })(),
      servicesHighlight: (() => {
        const raw = sec['servicesHighlight'] || {};
        const isOutdatedHeadline =
          !raw.headline ||
          raw.headline === 'Cleaning, moving and storage, depending on what you need.' ||
          raw.headline.includes('depending on what you need');
        const hasLegacyImages =
          !Array.isArray(raw.services) ||
          raw.services.some(
            (s: any) => !s?.imageSrc || s.imageSrc.startsWith('/assets/hero/')
          );
        if (isOutdatedHeadline || hasLegacyImages) {
          return siteConfig.servicesHighlight;
        }
        return {
          ...siteConfig.servicesHighlight,
          ...raw,
        };
      })(),
      overlappingPlans: (() => {
        const raw = sec['overlappingPlans'] || {};
        const isOutdatedHeadline =
          !raw.headline ||
          raw.headline === 'When one job depends on another.' ||
          raw.headline.includes('one job depends');
        const hasLegacyImages =
          !Array.isArray(raw.situations) ||
          raw.situations.some(
            (s: any) => !s?.imageSrc || s.imageSrc.startsWith('/assets/hero/')
          );
        if (isOutdatedHeadline || hasLegacyImages) {
          return siteConfig.overlappingPlans;
        }
        return {
          ...siteConfig.overlappingPlans,
          ...raw,
        };
      })(),
      requestQuote: (() => {
        const raw = sec['requestQuote'];
        if (!raw) return siteConfig.requestQuoteSection;
        const isOutdatedHeadline =
          raw.headline === 'Tell us what needs doing.' ||
          raw.headline?.includes('Tell us what needs');
        if (isOutdatedHeadline) {
          return siteConfig.requestQuoteSection;
        }
        return {
          ...siteConfig.requestQuoteSection,
          ...raw,
        };
      })(),
      faq: sec['faq'] || siteConfig.homeFaq,
      contact: sec['contact'] || siteConfig.homeContact,
      seo: {
        title: result.page.seo?.title || siteConfig.meta.title,
        description: result.page.seo?.description || siteConfig.meta.description,
        canonical: result.page.seo?.canonical || siteConfig.meta.canonical || `${getSiteUrl()}/`,
        ogTitle: result.page.seo?.ogTitle || result.page.seo?.title || siteConfig.meta.title,
        ogDescription: result.page.seo?.ogDescription || result.page.seo?.description || siteConfig.meta.description,
        ogImage: result.page.seo?.ogImage || siteConfig.meta.ogImage || '/assets/brand/laurrel-social-preview-v2.jpg',
        noIndex: Boolean(result.page.seo?.noIndex),
        locale: siteConfig.meta.locale,
      },
      source: 'cms',
    };
  }

  return {
    hero: siteConfig.hero,
    ticker: siteConfig.ticker,
    about: siteConfig.about,
    servicesHighlight: siteConfig.servicesHighlight,
    overlappingPlans: siteConfig.overlappingPlans,
    requestQuote: siteConfig.requestQuoteSection,
    faq: siteConfig.homeFaq,
    contact: siteConfig.homeContact,
    seo: siteConfig.meta,
    source: 'local_fallback',
  };
}

/**
 * About Page Published Content Fetcher with graceful fallback to approved siteConfig
 */
export async function getPublishedAboutPageData(): Promise<{
  data: AboutPageConfig;
  source: 'cms' | 'local_fallback';
}> {
  const result = await fetchPublishedPage('about');

  if (result && result.sections) {
    const sec = result.sections;
    const banner = (sec['banner']?.imageSrc && !sec['banner'].imageSrc.includes('about-handover'))
      ? sec['banner']
      : siteConfig.aboutPage.banner;
    const aboutCompany = (sec['aboutCompany']?.imageSrc && !sec['aboutCompany'].imageSrc.includes('about-company-work'))
      ? sec['aboutCompany']
      : siteConfig.aboutPage.aboutCompany;
    const whatWeDo = sec['whatWeDo'] || siteConfig.aboutPage.whatWeDo;
    const whyLaurrel = (sec['whyLaurrel']?.imageSrc && !sec['whyLaurrel'].imageSrc.includes('about-how-we-work'))
      ? sec['whyLaurrel']
      : siteConfig.aboutPage.whyLaurrel;
    const marquee = sec['marquee'] || siteConfig.aboutPage.marquee;
    const faq = (sec['faq']?.imageSrc && !sec['faq'].imageSrc.includes('about-handover'))
      ? sec['faq']
      : siteConfig.aboutPage.faq;
    const finalCta = sec['finalCta'] || siteConfig.aboutPage.finalCta;
    const meta: PageSeoData = {
      title: result.page.seo?.title || siteConfig.aboutPage.meta.title,
      description: result.page.seo?.description || siteConfig.aboutPage.meta.description,
      canonical: result.page.seo?.canonical || siteConfig.aboutPage.meta.canonical || `${getSiteUrl()}/about`,
      ogTitle: result.page.seo?.ogTitle || result.page.seo?.title || siteConfig.aboutPage.meta.title,
      ogDescription: result.page.seo?.ogDescription || result.page.seo?.description || siteConfig.aboutPage.meta.description,
      ogImage: result.page.seo?.ogImage || siteConfig.aboutPage.meta.ogImage || '/assets/brand/laurrel-social-preview-v2.jpg',
      noIndex: Boolean(result.page.seo?.noIndex),
    };

    return {
      data: {
        banner,
        aboutCompany,
        whatWeDo,
        whyLaurrel,
        marquee,
        faq,
        finalCta,
        meta,
      },
      source: 'cms',
    };
  }

  return {
    data: siteConfig.aboutPage,
    source: 'local_fallback',
  };
}

/**
 * Services Page Published Content Fetcher with graceful fallback to approved siteConfig
 */
export async function getPublishedServicesPageData(): Promise<{
  data: ServicesPageConfig;
  source: 'cms' | 'local_fallback';
}> {
  const result = await fetchPublishedPage('services');

  if (result && result.sections) {
    const sec = result.sections;
    const banner = (sec['banner']?.imageSrc && !sec['banner'].imageSrc.includes('cleaning-hero'))
      ? sec['banner']
      : siteConfig.servicesPage.banner;
    const articleIntro = sec['articleIntro'] || siteConfig.servicesPage.articleIntro;
    const rawServices = sec['servicesList']?.services;
    const hasLegacyServiceImages =
      !Array.isArray(rawServices) ||
      rawServices.some((s: any) => !s?.imageSrc || s.imageSrc.startsWith('/assets/hero/'));
    const services = hasLegacyServiceImages ? siteConfig.servicesPage.services : rawServices;
    const gettingStarted = sec['gettingStarted'] || siteConfig.servicesPage.gettingStarted;
    const faq = sec['faq'] || siteConfig.servicesPage.faq;
    const finalCta = sec['finalCta'] || siteConfig.servicesPage.finalCta;
    const sidebarForm = sec['sidebarForm'] || siteConfig.servicesPage.sidebarForm;
    const sidebarInfoPanel = sec['sidebarInfoPanel'] || siteConfig.servicesPage.sidebarInfoPanel;
    const meta: PageSeoData = {
      title: result.page.seo?.title || siteConfig.servicesPage.meta.title,
      description: result.page.seo?.description || siteConfig.servicesPage.meta.description,
      canonical: result.page.seo?.canonical || siteConfig.servicesPage.meta.canonical || `${getSiteUrl()}/services`,
      ogTitle: result.page.seo?.ogTitle || result.page.seo?.title || siteConfig.servicesPage.meta.title,
      ogDescription: result.page.seo?.ogDescription || result.page.seo?.description || siteConfig.servicesPage.meta.description,
      ogImage: result.page.seo?.ogImage || siteConfig.servicesPage.meta.ogImage || '/assets/brand/laurrel-social-preview-v2.jpg',
      noIndex: Boolean(result.page.seo?.noIndex),
    };

    return {
      data: {
        banner,
        articleIntro,
        services,
        gettingStarted,
        faq,
        finalCta,
        sidebarForm,
        sidebarInfoPanel,
        meta,
      },
      source: 'cms',
    };
  }

  return {
    data: siteConfig.servicesPage,
    source: 'local_fallback',
  };
}

/**
 * Contact Page Published Content Fetcher with graceful fallback to approved siteConfig
 */
export async function getPublishedContactPageData(): Promise<{
  data: ContactPageConfig;
  source: 'cms' | 'local_fallback';
}> {
  const result = await fetchPublishedPage('contact');

  if (result && result.sections) {
    const sec = result.sections;
    const banner = (sec['banner']?.imageSrc && !sec['banner'].imageSrc.includes('about-handover'))
      ? sec['banner']
      : siteConfig.contactPage.banner;
    const info = sec['contactInfo'] || {};
    const form = sec['form'] || siteConfig.contactPage.form;
    const meta: PageSeoData = {
      title: result.page.seo?.title || siteConfig.contactPage.meta.title,
      description: result.page.seo?.description || siteConfig.contactPage.meta.description,
      canonical: result.page.seo?.canonical || siteConfig.contactPage.meta.canonical || `${getSiteUrl()}/contact`,
      ogTitle: result.page.seo?.ogTitle || result.page.seo?.title || siteConfig.contactPage.meta.title,
      ogDescription: result.page.seo?.ogDescription || result.page.seo?.description || siteConfig.contactPage.meta.description,
      ogImage: result.page.seo?.ogImage || siteConfig.contactPage.meta.ogImage || '/assets/brand/laurrel-social-preview-v2.jpg',
      noIndex: Boolean(result.page.seo?.noIndex),
    };

    return {
      data: {
        banner,
        eyebrow: info.eyebrow || siteConfig.contactPage.eyebrow,
        headline: info.headline || siteConfig.contactPage.headline,
        supportingParagraph: info.supportingParagraph || siteConfig.contactPage.supportingParagraph,
        businessEmail:
          info.businessEmail && info.businessEmail.trim().length > 0 && info.businessEmail !== 'info@laurrelservices.ca'
            ? info.businessEmail.replace(/@laurrelservices\.ca$/i, '@laurrelservices.com')
            : siteConfig.contactPage.businessEmail,
        businessPhone:
          info.businessPhone && info.businessPhone.trim().length > 0
            ? info.businessPhone
            : siteConfig.contactPage.businessPhone,
        businessPhoneHref: siteConfig.contactPage.businessPhoneHref,
        hasPublicOffice: info.hasPublicOffice ?? siteConfig.contactPage.hasPublicOffice,
        officeAddress: info.officeAddress ?? siteConfig.contactPage.officeAddress,
        googleMapsPlaceId: info.googleMapsPlaceId ?? siteConfig.contactPage.googleMapsPlaceId,
        locationHeading: info.locationHeading || siteConfig.contactPage.locationHeading,
        serviceRegionDescription: info.serviceRegionDescription || siteConfig.contactPage.serviceRegionDescription,
        confirmedServiceAreas: info.confirmedServiceAreas || siteConfig.contactPage.confirmedServiceAreas,
        form,
        meta,
      },
      source: 'cms',
    };
  }

  return {
    data: siteConfig.contactPage,
    source: 'local_fallback',
  };
}
