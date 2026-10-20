import {
  siteConfig,
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
  seo: typeof siteConfig.meta;
  source: 'cms' | 'local_fallback';
}> {
  const result = await fetchPublishedPage('home');

  if (result && result.sections) {
    const sec = result.sections;
    return {
      hero: sec['hero'] || siteConfig.hero,
      ticker: sec['ticker'] || siteConfig.ticker,
      about: sec['about'] || siteConfig.about,
      servicesHighlight: sec['servicesHighlight'] || siteConfig.servicesHighlight,
      overlappingPlans: sec['overlappingPlans'] || siteConfig.overlappingPlans,
      requestQuote: sec['requestQuote'] || siteConfig.requestQuoteSection,
      faq: sec['faq'] || siteConfig.homeFaq,
      contact: sec['contact'] || siteConfig.homeContact,
      seo: {
        title: result.page.seo?.title || siteConfig.meta.title,
        description: result.page.seo?.description || siteConfig.meta.description,
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
    const banner = sec['banner'] || siteConfig.aboutPage.banner;
    const aboutCompany = sec['aboutCompany'] || siteConfig.aboutPage.aboutCompany;
    const whatWeDo = sec['whatWeDo'] || siteConfig.aboutPage.whatWeDo;
    const whyLaurrel = sec['whyLaurrel'] || siteConfig.aboutPage.whyLaurrel;
    const marquee = sec['marquee'] || siteConfig.aboutPage.marquee;
    const faq = sec['faq'] || siteConfig.aboutPage.faq;
    const finalCta = sec['finalCta'] || siteConfig.aboutPage.finalCta;
    const meta = {
      title: result.page.seo?.title || siteConfig.aboutPage.meta.title,
      description: result.page.seo?.description || siteConfig.aboutPage.meta.description,
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
    const banner = sec['banner'] || siteConfig.servicesPage.banner;
    const articleIntro = sec['articleIntro'] || siteConfig.servicesPage.articleIntro;
    const services = sec['servicesList']?.services || siteConfig.servicesPage.services;
    const gettingStarted = sec['gettingStarted'] || siteConfig.servicesPage.gettingStarted;
    const faq = sec['faq'] || siteConfig.servicesPage.faq;
    const finalCta = sec['finalCta'] || siteConfig.servicesPage.finalCta;
    const sidebarForm = sec['sidebarForm'] || siteConfig.servicesPage.sidebarForm;
    const sidebarInfoPanel = sec['sidebarInfoPanel'] || siteConfig.servicesPage.sidebarInfoPanel;
    const meta = {
      title: result.page.seo?.title || siteConfig.servicesPage.meta.title,
      description: result.page.seo?.description || siteConfig.servicesPage.meta.description,
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
    const banner = sec['banner'] || siteConfig.contactPage.banner;
    const info = sec['contactInfo'] || {};
    const form = sec['form'] || siteConfig.contactPage.form;
    const meta = {
      title: result.page.seo?.title || siteConfig.contactPage.meta.title,
      description: result.page.seo?.description || siteConfig.contactPage.meta.description,
    };

    return {
      data: {
        banner,
        eyebrow: info.eyebrow || siteConfig.contactPage.eyebrow,
        headline: info.headline || siteConfig.contactPage.headline,
        supportingParagraph: info.supportingParagraph || siteConfig.contactPage.supportingParagraph,
        businessEmail: info.businessEmail ?? siteConfig.contactPage.businessEmail,
        businessPhone: info.businessPhone ?? siteConfig.contactPage.businessPhone,
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
