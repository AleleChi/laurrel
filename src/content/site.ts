export const PRODUCTION_SITE_URL = 'https://laurrelservices.com';

export function getSiteUrl(): string {
  // Enforce authoritative production domain in production builds
  if (process.env.NODE_ENV === 'production' && !process.env.IS_PREVIEW_BUILD) {
    return PRODUCTION_SITE_URL;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  return PRODUCTION_SITE_URL;
}

export interface PageSeoConfig {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  locale?: string;
}

export interface NavDropdownItem {
  label: string;
  href: string;
}

export interface NavLink {
  label: string;
  href: string;
  isExternal?: boolean;
  dropdown?: NavDropdownItem[];
}

export interface TickerItem {
  id: string;
  label: string;
}

export interface AboutServiceItem {
  title: string;
  description: string;
  imageSrc?: string;
  altText?: string;
}

export interface EditorialPoint {
  number: string;
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HomepageAboutConfig {
  eyebrow: string;
  headline: string;
  introParagraph: string;
  stat: {
    number: string;
    caption: string;
  };
  rightHeading: string;
  services: AboutServiceItem[];
  cta: {
    label: string;
    href: string;
  };
  media: {
    imageSrc: string;
    altText: string;
    crop?: string;
  };
}

export interface HeroServiceItem {
  id: 'cleaning' | 'moving' | 'storage';
  service: 'Cleaning' | 'Moving' | 'Storage';
  title: string;
  tagline: string;
  description: string;
  imageSrc: string;
  fallbackImage: string;
  altText: string;
  badge: string;
}

export interface HeroVideoItem {
  id: string;
  service: 'Cleaning' | 'Moving' | 'Storage';
  serviceKey: 'cleaning' | 'moving' | 'storage';
  src: string;
  poster: string;
  description: string;
  order: number;
  objectPosition?: string;
}

export interface AboutPageConfig {
  banner: {
    title: string;
    breadcrumb: { label: string; href: string }[];
    imageSrc: string;
    altText: string;
  };
  aboutCompany: {
    eyebrow: string;
    headline: string;
    paragraph1: string;
    paragraph2: string;
    emphasisPoints?: {
      id: string;
      text: string;
    }[];
    cta: {
      label: string;
      href: string;
    };
    imageSrc: string;
    altText: string;
  };
  whatWeDo: {
    eyebrow: string;
    headline: string;
    intro: string;
    statNumber?: string;
    statLabel?: string;
    columns: {
      category: string;
      displayWord: string;
      description: string;
      href?: string;
      number?: string;
      title?: string;
    }[];
    services?: {
      number?: string;
      title: string;
      description: string;
      href: string;
      category?: string;
      displayWord?: string;
    }[];
  };
  whyLaurrel: {
    eyebrow: string;
    headline: string;
    intro: string;
    paragraph1?: string;
    paragraph2?: string;
    items?: {
      id?: string;
      title: string;
      description: string;
      icon?: string;
    }[];
    imageSrc: string;
    altText: string;
    cutoutImageSrc?: string;
    cutoutAltText?: string;
  };
  marquee?: {
    items: string[];
  };
  faq: {
    eyebrow: string;
    headline: string;
    intro: string;
    imageSrc: string;
    altText: string;
    items: FaqItem[];
  };
  finalCta: {
    headline: string;
    body: string;
    ctaLabel: string;
  };
  meta: PageSeoConfig;
}

export interface ServiceHighlightItem {
  id: 'cleaning' | 'moving' | 'storage';
  title: string;
  description: string;
  anchor: string;
  keyPoints?: string[];
  imageSrc?: string;
  altText?: string;
}

export interface ServicesHighlightConfig {
  eyebrow: string;
  headline: string;
  intro?: string;
  cta: {
    label: string;
    href: string;
  };
  services: ServiceHighlightItem[];
}

export interface ServiceDetailSection {
  id: 'cleaning' | 'moving' | 'storage';
  anchor: string;
  badge: string;
  title: string;
  headline: string;
  paragraphs: string[];
  imageSrc: string;
  imageAlt: string;
  planningTitle: string;
  planningIntro: string;
  usefulInfoTitle: string;
  usefulInfo: string[];
  extraNote?: string;
  ctaLabel: string;
}

export interface GettingStartedStep {
  number: string;
  title: string;
  description: string;
}

export interface ServicesPageConfig {
  meta: PageSeoConfig;
  banner: {
    title: string;
    breadcrumb: { label: string; href: string }[];
    imageSrc: string;
    altText: string;
  };
  articleIntro: {
    h2: string;
    paragraph1: string;
    paragraph2: string;
  };
  services: ServiceDetailSection[];
  gettingStarted: {
    eyebrow: string;
    headline: string;
    steps: GettingStartedStep[];
  };
  faq: {
    eyebrow: string;
    headline: string;
    items: FaqItem[];
  };
  finalCta: {
    eyebrow: string;
    headline: string;
    body: string;
    ctaLabel: string;
  };
  sidebarForm: {
    heading: string;
    supportingText: string;
    submitButtonText: string;
  };
  sidebarInfoPanel: {
    heading: string;
    body: string;
    ctaText: string;
  };
}

export interface OverlappingPlansSituation {
  id: string;
  title: string;
  description: string;
  relatedServicesText: string;
  preselectedServices: ('cleaning' | 'moving' | 'storage')[];
  imageSrc: string;
  imageAlt: string;
  details: {
    intro: string;
    considerations: string[];
  };
}

export interface OverlappingPlansConfig {
  eyebrow: string;
  headline: string;
  intro: string;
  situations: OverlappingPlansSituation[];
  cta?: {
    label: string;
  };
}

export interface RequestQuoteSectionConfig {
  eyebrow: string;
  headline: string;
  body: string;
  primaryCta: {
    label: string;
  };
  secondaryLink: {
    label: string;
    href: string;
  };
}

export interface HomeFaqItem {
  question: string;
  answer: string;
}

export interface HomeFaqConfig {
  eyebrow: string;
  headline: string;
  items: HomeFaqItem[];
  moreLink: {
    label: string;
    href: string;
  };
}

export interface ContactPageConfig {
  meta: PageSeoConfig;
  banner: {
    title: string;
    breadcrumb: { label: string; href: string }[];
    imageSrc: string;
    altText: string;
  };
  eyebrow: string;
  headline: string;
  supportingParagraph: string;
  businessEmail?: string;
  businessPhone?: string;
  businessPhoneHref?: string;
  hasPublicOffice: boolean; // Mode A (public office) if true; Mode B (service-area) if false
  officeAddress?: string;
  googleMapsPlaceId?: string;
  locationHeading: string;
  serviceRegionDescription: string;
  confirmedServiceAreas?: string[];
  form: {
    heading: string;
    buttonText: string;
  };
}

export interface HomeContactConfig {
  eyebrow: string;
  headline: string;
  paragraph: string;
  primaryCta: {
    label: string;
    href: string;
  };
}

export interface SiteConfig {
  companyName: string;
  tagline: string;
  location: string;
  meta: PageSeoConfig;
  navigation: {
    links: NavLink[];
    cta: {
      label: string;
      href: string;
    };
  };
  hero: {
    eyebrow: string;
    headline: {
      line1: string;
      line2: string;
      line3: string;
    };
    body: string;
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
    supportCard: {
      heading: string;
      body: string;
      actionText: string;
    };
    media: {
      imageSrc: string;
      altText: string;
      videoSrc?: string;
      videos?: HeroVideoItem[];
      services?: HeroServiceItem[];
    };
  };
  ticker: {
    items: TickerItem[];
  };
  about: HomepageAboutConfig;
  aboutPage: AboutPageConfig;
  servicesHighlight: ServicesHighlightConfig;
  servicesPage: ServicesPageConfig;
  overlappingPlans: OverlappingPlansConfig;
  requestQuoteSection: RequestQuoteSectionConfig;
  homeFaq: HomeFaqConfig;
  contactPage: ContactPageConfig;
  homeContact: HomeContactConfig;
}



export const siteConfig: SiteConfig = {
  companyName: 'LAURREL SERVICES',
  tagline: 'Cleaning. Moving. Storage.',
  location: 'Ottawa, Ontario',
  meta: {
    title: 'Cleaning, Moving & Storage in Ottawa | Laurrel Services',
    description:
      'Cleaning, moving and storage services in Ottawa and the National Capital Region. Tell Laurrel Services what you need and request a quote for your home or business.',
    canonical: 'https://laurrelservices.com/',
    ogImage: '/assets/brand/og-image.jpg',
    locale: 'en-CA',
  },
  navigation: {
    links: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      {
        label: 'Services',
        href: '/services',
        dropdown: [
          { label: 'All Services', href: '/services' },
          { label: 'Cleaning', href: '/services#cleaning' },
          { label: 'Moving', href: '/services#moving' },
          { label: 'Storage', href: '/services#storage' },
        ],
      },
      { label: 'Contact', href: '/contact' },
    ],
    cta: {
      label: 'Get a Quote',
      href: '#quote',
    },
  },
  hero: {
    eyebrow: 'CLEANING · MOVING · STORAGE IN OTTAWA',
    headline: {
      line1: 'Make space',
      line2: "for what's next.",
      line3: '',
    },
    body:
      "From keeping your place clean to preparing for a move or finding storage while plans change, Laurrel Services helps with the practical work around your home or business in Ottawa and the National Capital Region.",
    primaryCta: {
      label: 'Request a Quote',
      href: '#quote',
    },
    secondaryCta: {
      label: 'Explore Services',
      href: '#services',
    },
    supportCard: {
      heading: 'Need help planning your service?',
      body: 'Tell us what you need and your preferred date.',
      actionText: 'Get in Touch',
    },
    media: {
      imageSrc: '/assets/hero/cleaning-hero.webp',
      altText: 'Professional cleaner wearing yellow gloves detailing a bright kitchen counter in an Ottawa home',
      services: [
        {
          id: 'cleaning',
          service: 'Cleaning',
          title: 'Residential & Handover Cleaning',
          tagline: 'Spotless, detail-oriented care for homes and apartments',
          description: 'Thorough cleaning tailored for routine upkeep, deep seasonal care, or tenancy handover.',
          imageSrc: '/assets/hero/cleaning-hero.webp',
          fallbackImage: '/assets/hero/cleaning-hero.jpg',
          altText: 'Professional cleaner wearing yellow gloves detailing a bright kitchen counter in an Ottawa home',
          badge: 'Ottawa & NCR',
        },
        {
          id: 'moving',
          service: 'Moving',
          title: 'Local Moving & Furniture Transport',
          tagline: 'Dependable moving and organized packing support',
          description: 'Careful household moves handled with protective blankets and organized transport across Ottawa.',
          imageSrc: '/assets/hero/moving-hero.webp',
          fallbackImage: '/assets/hero/moving-hero.jpg',
          altText: 'Two movers carefully carrying a sofa through a sunlit residential room with moving boxes',
          badge: 'Local & Regional',
        },
        {
          id: 'storage',
          service: 'Storage',
          title: 'Transitional Storage Arrangements',
          tagline: 'Clean, dependable interim storage for your belongings',
          description: 'Interim holding for furniture and personal items when moving dates or renovation schedules do not align.',
          imageSrc: '/assets/hero/storage-hero.webp',
          fallbackImage: '/assets/hero/storage-hero.jpg',
          altText: 'Neatly arranged storage holding space with labeled boxes and protected furniture',
          badge: 'Interim & Flexible',
        },
      ],
      videos: [],
    },
  },
  ticker: {
    items: [
      { id: 't1', label: 'Cleaning' },
      { id: 't2', label: 'Moving' },
      { id: 't3', label: 'Storage' },
      { id: 't4', label: 'Ottawa & The National Capital Region' },
    ],
  },
  about: {
    eyebrow: 'ABOUT LAURREL SERVICES',
    headline: 'Three services that belong together.',
    introParagraph:
      "Moving day rarely means just one job. Furniture has to travel, keys have to be handed back to a spotless property, and sometimes your new address isn't ready on the day you leave your old one. Laurrel Services brings cleaning, moving, and transitional storage under one roof so you can plan what needs doing without juggling three separate companies.",
    stat: {
      number: '03',
      caption: 'CORE SERVICES',
    },
    rightHeading: 'Practical help for homes and businesses across Ottawa.',
    services: [
      {
        title: 'One point of contact',
        description:
          'Speak with a local team that understands Ottawa neighbourhoods, building loading bays, and elevator reservation schedules.',
      },
      {
        title: 'Planned around real dates',
        description:
          'Whether your move is happening next week or you are planning ahead, we confirm access details and timelines upfront.',
      },
      {
        title: 'No forced bundles',
        description:
          'Book a single service on its own, or coordinate two or three when your moving and cleaning schedules overlap.',
      },
    ],
    cta: {
      label: 'About Laurrel',
      href: '/about',
    },
    media: {
      imageSrc: '/assets/hero/about-handover.webp',
      altText: 'Client and coordinator reviewing residential property handover details in Ottawa',
    },
  },
  aboutPage: {
    banner: {
      title: 'About Laurrel Services',
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
      ],
      imageSrc: '/assets/hero/about-handover.webp',
      altText: 'Laurrel Services residential handover in Ottawa',
    },
    aboutCompany: {
      eyebrow: 'ABOUT OUR WORK',
      headline: 'Practical help for spaces, moves, and storage in Ottawa.',
      paragraph1:
        'Laurrel Services was founded to solve a familiar challenge in Ottawa: when people change homes or manage properties, cleaning, moving, and storage usually happen at the exact same time. Yet most people find themselves calling three unrelated providers, coordinating arrival times, and worrying about gaps in the schedule.',
      paragraph2:
        'We bring these essential capabilities together. Our team handles thorough residential and turnover cleaning, dependable furniture moving, and safe transitional storage arrangements. We focus on straightforward communication, clear written quotes, and arriving prepared for the job.',
      emphasisPoints: [
        {
          id: 'service',
          text: 'Book the single service your home or property requires today.',
        },
        {
          id: 'enquiry',
          text: 'Discuss multi-service schedules together in one straightforward enquiry.',
        },
      ],
      cta: {
        label: 'Explore Our Services',
        href: '/#services',
      },
      imageSrc: '/assets/about/about-company-work.webp',
      altText: 'Laurrel Services professional moving specialists carefully handling and positioning items in an Ottawa residence',
    },
    whatWeDo: {
      eyebrow: 'WHAT WE DO',
      headline: 'Three core capabilities, organized around your timeline.',
      intro:
        'Not every job starts with a move. Sometimes it is an apartment that needs a deep clean before handover, furniture that needs transporting across town, or personal belongings that need somewhere safe to stay during home renovations.',
      statNumber: '03',
      statLabel: 'CORE SERVICES',
      columns: [
        {
          category: 'CLEANING',
          displayWord: 'Clean.',
          description:
            'From tenancy handovers to detailed seasonal maintenance, our cleaners work methodically through kitchens, bathrooms, appliances, and living areas.',
          href: '/services#cleaning',
          number: '01',
          title: 'Cleaning',
        },
        {
          category: 'MOVING',
          displayWord: 'Move.',
          description:
            'Careful handling of furniture, packed boxes, and household belongings across Ottawa with protective padding, floor runners, and proper equipment.',
          href: '/services#moving',
          number: '02',
          title: 'Moving',
        },
        {
          category: 'STORAGE',
          displayWord: 'Store.',
          description:
            'Safe, accessible holding options for when moving dates do not align or when rooms need clearing for renovations and property staging.',
          href: '/services#storage',
          number: '03',
          title: 'Storage',
        },
      ],
      services: [
        {
          number: '01',
          title: 'Cleaning',
          description:
            'From tenancy handovers to detailed seasonal maintenance, our cleaners work methodically through kitchens, bathrooms, appliances, and living areas.',
          href: '/services#cleaning',
          category: 'CLEANING',
          displayWord: 'Clean.',
        },
        {
          number: '02',
          title: 'Moving',
          description:
            'Careful handling of furniture, packed boxes, and household belongings across Ottawa with protective padding, floor runners, and proper equipment.',
          href: '/services#moving',
          category: 'MOVING',
          displayWord: 'Move.',
        },
        {
          number: '03',
          title: 'Storage',
          description:
            'Safe, accessible holding options for when moving dates do not align or when rooms need clearing for renovations and property staging.',
          href: '/services#storage',
          category: 'STORAGE',
          displayWord: 'Store.',
        },
      ],
    },
    whyLaurrel: {
      eyebrow: 'HOW WE WORK',
      headline: 'Every job has its own details.',
      intro:
        'A regular home clean is different from preparing a property for new occupants. Moving a few pieces of furniture is different from relocating an entire household. And sometimes, belongings need somewhere to stay between addresses.\n\nThat’s why the details matter. Tell us what needs doing, where and when, and we’ll help you understand the next steps.',
      paragraph1:
        'A regular home clean is different from preparing a property for new occupants. Moving a few pieces of furniture is different from relocating an entire household. And sometimes, belongings need somewhere to stay between addresses.',
      paragraph2:
        'That’s why the details matter. Tell us what needs doing, where and when, and we’ll help you understand the next steps.',
      items: [],
      imageSrc: '/assets/about/about-how-we-work.webp',
      altText: 'Professional team carefully preparing, packing, and organizing household belongings in a bright Ottawa residence',
      cutoutImageSrc: '/assets/about/about-how-we-work.webp',
      cutoutAltText: 'Professional team carefully preparing, packing, and organizing household belongings in a bright Ottawa residence',
    },
    marquee: {
      items: [
        'Ottawa & NCR Focus',
        'Move-In / Move-Out Cleans',
        'Residential Furniture Moves',
        'Interim Holding Storage',
        'Clear Written Scopes',
        'Single Point of Contact',
      ],
    },
    faq: {
      eyebrow: 'FREQUENTLY ASKED QUESTIONS',
      headline: 'Clear answers about how we work.',
      intro: 'Answers to practical questions about our services and booking process in Ottawa.',
      imageSrc: '/assets/hero/about-handover.webp',
      altText: 'Ottawa customer discussing service arrangements with Laurrel Services',
      items: [
        {
          question: 'Where is Laurrel Services based, and which areas do you serve?',
          answer:
            'We are based in Ottawa, Ontario, and provide cleaning, moving, and storage coordination across the National Capital Region, including Centretown, Kanata, Nepean, Barrhaven, Orléans, Gloucester, and Stittsville.',
        },
        {
          question: 'Do I have to book cleaning, moving, and storage together?',
          answer:
            'No. You can book any service individually. Many of our clients only need a move-out clean or help transporting furniture. If your project involves multiple services, we coordinate them so the work happens in logical sequence.',
        },
        {
          question: 'How do you calculate service pricing?',
          answer:
            'We provide clear written estimates based on the details you share—such as property size, room count, inventory volume, building access (stairs versus elevators), and your required date. We discuss pricing upfront before confirming your appointment.',
        },
        {
          question: 'What happens if my new home is not ready on my move-out date?',
          answer:
            'We arrange transitional storage holding. We load your furniture and boxed belongings on your move-out day, hold them in secure, clean storage for the required days or weeks, and deliver them once your new keys are in hand.',
        },
      ],
    },
    finalCta: {
      headline: 'Tell us what needs doing.',
      body:
        'Share your preferred service, Ottawa location, and target date. We will help you work out the practical next step.',
      ctaLabel: 'Request a Quote',
    },
    meta: {
      title: 'About Laurrel Services | Cleaning, Moving & Storage Ottawa',
      description:
        'Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Find out how to enquire about one service or several related jobs.',
      canonical: 'https://laurrelservices.com/about',
      ogImage: '/assets/brand/og-image.jpg',
    },
  },
  servicesHighlight: {
    eyebrow: 'WHAT CAN WE HELP YOU WITH?',
    headline: 'Cleaning, moving and storage, depending on what you need.',
    intro:
      'Some jobs are part of everyday life. Others come with moving dates, new addresses and rooms that need clearing. Find the service you are looking for and tell us a little about the work.',
    cta: {
      label: 'Explore All Services',
      href: '/services',
    },
    services: [
      {
        id: 'cleaning',
        title: 'Cleaning',
        description:
          'For homes and properties that need regular attention, a deeper clean or a fresh start before someone moves in.',
        anchor: '/services#cleaning',
        keyPoints: [
          'Move-in and move-out tenancy turnover cleans',
          'Kitchen detailing, appliance interiors, and bathroom sanitization',
          'Post-renovation fine dust removal and floor washing',
          'Scheduled recurring maintenance for busy households',
        ],
        imageSrc: '/assets/hero/cleaning-hero.webp',
        altText: 'Professional cleaner detailing a modern kitchen counter with spray bottle and microfibre cloth',
      },
      {
        id: 'moving',
        title: 'Moving',
        description:
          'From furniture and packed boxes to the details that come with changing addresses, get help planning your next move.',
        anchor: '/services#moving',
        keyPoints: [
          'Apartment and residential household moves across Ottawa',
          'Furniture loading, protective wrapping, and careful transport',
          'Quilted blankets and floor runners for property protection',
          'Careful coordination around elevator bookings and loading zones',
        ],
        imageSrc: '/assets/hero/moving-hero.webp',
        altText: 'Professional movers carefully carrying household furniture in an Ottawa home',
      },
      {
        id: 'storage',
        title: 'Storage',
        description:
          'Need somewhere for your belongings while you move, renovate or make space at home? Ask about the storage arrangements available for your situation.',
        anchor: '/services#storage',
        keyPoints: [
          'Interim holding when move-out and move-in dates do not align',
          'Temporary storage during interior renovations or painting',
          'Clean, dry, and secure storage for furniture and packed cartons',
          'Transport arrangements directly into designated storage units',
        ],
        imageSrc: '/assets/hero/storage-hero.webp',
        altText: 'Clean, well-ordered storage space with protected furniture and labeled cartons',
      },
    ],
  },
  servicesPage: {
    meta: {
      title: 'Cleaning, Moving & Storage Services in Ottawa | Laurrel',
      description:
        "Explore Laurrel's cleaning, moving and storage services in Ottawa. Find out what details to include when requesting a service estimate or discussing your plans.",
      canonical: 'https://laurrelservices.com/services',
      ogImage: '/assets/brand/og-image.jpg',
    },
    banner: {
      title: 'Our Services',
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
      ],
      imageSrc: '/assets/hero/cleaning-hero.webp',
      altText: 'Laurrel Services cleaning, moving and storage in Ottawa',
    },
    articleIntro: {
      h2: 'Cleaning, moving and storage planned around your needs.',
      paragraph1:
        'Getting a property ready, moving to a new address, or finding room for belongings involves distinct practical tasks. Laurrel Services offers cleaning, moving, and storage arrangements across Ottawa, with each job scoped honestly according to the actual work required.',
      paragraph2:
        'Whether you need a single service on its own or have an upcoming move where cleaning and storage overlap, start by sharing what needs doing, where, and when. We will help you organize the next step.',
    },
    services: [
      {
        id: 'cleaning',
        anchor: 'cleaning',
        badge: 'CLEANING SERVICES IN OTTAWA',
        title: 'Cleaning Services in Ottawa',
        headline: 'Thorough cleaning for homes and property handovers in Ottawa',
        paragraphs: [
          'An occupied family home does not need the exact same attention as an empty apartment being prepared for a final lease inspection. Move-out cleans require methodical attention to baseboards, appliance interiors, cabinetry, and tile grout, while routine cleans focus on maintaining high-traffic living areas.',
          'Laurrel Services welcomes cleaning requests across Ottawa. Tell us about your property, room count, current condition, and your required date so we can confirm an accurate schedule and estimate.',
        ],
        imageSrc: '/assets/hero/cleaning-hero.webp',
        imageAlt: 'Professional cleaner wearing protective gloves detailing kitchen surfaces in an Ottawa residence',
        planningTitle: 'What to include in your cleaning enquiry',
        planningIntro:
          'Whether you are preparing to hand back rental keys, moving into a newly purchased home, or organizing a seasonal deep clean, sharing these details helps us prepare an accurate quote:',
        usefulInfoTitle: 'Helpful details to include:',
        usefulInfo: [
          'Property type (house, condo, apartment) and number of bedrooms/bathrooms',
          'Whether the space will be fully empty or currently furnished/occupied',
          'Specific areas needing deep attention (e.g. inside oven, fridge, interior windows)',
          'Your preferred date and key access arrangements (in-person or lockbox)',
          'Whether running water and electricity will be turned on during service',
        ],
        extraNote: 'If keys must be returned by an exact hour, let us know your inspection time so we schedule arrival accordingly.',
        ctaLabel: 'Request a Cleaning Quote',
      },
      {
        id: 'moving',
        anchor: 'moving',
        badge: 'MOVING SERVICES IN OTTAWA',
        title: 'Moving Services in Ottawa',
        headline: 'Careful residential moving and furniture transport',
        paragraphs: [
          'Moving to a new address involves more than lifting boxes into a truck. It requires coordinating building elevator bookings, navigating tight stairwells, protecting hardwood floors, and ensuring furniture arrives undamaged.',
          'Our moving team supports apartment and home moves across Ottawa. We bring heavy-duty quilted moving blankets, floor runners, and proper dollies so your furnishings and properties are treated with care from start to finish.',
        ],
        imageSrc: '/assets/hero/moving-hero.webp',
        imageAlt: 'Professional movers carefully handling furniture and packed boxes in an Ottawa residence',
        planningTitle: 'What to include in your moving enquiry',
        planningIntro:
          'To help us estimate truck capacity, crew size, and transit time accurately, share these practical details:',
        usefulInfoTitle: 'Helpful details to include:',
        usefulInfo: [
          'Origin and destination addresses or neighbourhoods in Ottawa',
          'Approximate inventory of large furniture items (beds, sofas, tables) and box count',
          'Access conditions at both locations (elevators, flight of stairs, parking distance)',
          'Elevator booking time window, if living in a condo or apartment building',
          'Your target moving date or preferred window of days',
        ],
        extraNote: 'Be sure to reserve your building service elevator early for the agreed time slot.',
        ctaLabel: 'Request a Moving Quote',
      },
      {
        id: 'storage',
        anchor: 'storage',
        badge: 'STORAGE ARRANGEMENTS IN OTTAWA',
        title: 'Transitional Storage Arrangements',
        headline: 'Dependable holding when moving dates or renovation plans do not align',
        paragraphs: [
          'One of the most stressful parts of property transitions is a schedule gap—such as when your current lease ends on the last day of the month, but your new home is not ready until the following week. In other cases, home renovations or floor refinishing require clearing rooms entirely.',
          'We coordinate safe, accessible interim storage arrangements for your furniture and packed boxes. We handle loading at your current location, transfer into clean storage facilities, and deliver everything once your new space is ready.',
        ],
        imageSrc: '/assets/hero/storage-hero.webp',
        imageAlt: 'Clean, organized storage space with wrapped furniture and labeled cartons',
        planningTitle: 'What to include in your storage enquiry',
        planningIntro:
          'Storage needs vary widely based on duration and volume. To help us arrange the right solution, share:',
        usefulInfoTitle: 'Helpful details to include:',
        usefulInfo: [
          'Estimated duration (a few days, several weeks, or monthly interim holding)',
          'General breakdown of items needing storage (furniture, mattresses, cartons)',
          'Whether you will require access to specific items while in storage',
          'Target pickup date and estimated final delivery date',
        ],
        extraNote: 'Items stored with us remain protected and inventoried throughout the holding period.',
        ctaLabel: 'Ask About Storage Options',
      },
    ],
    gettingStarted: {
      eyebrow: 'HOW WE WORK',
      headline: 'A straightforward process from inquiry to completion.',
      steps: [
        {
          number: '01',
          title: 'Share your service details',
          description:
            'Tell us what needs doing, where in Ottawa the work is located, and your preferred dates using our online quote form.',
        },
        {
          number: '02',
          title: 'Review your written estimate',
          description:
            'We review your access conditions and inventory, confirm logistical details, and provide a clear written estimate with no hidden add-ons.',
        },
        {
          number: '03',
          title: 'Confirm your appointment',
          description:
            'Once you approve the plan, we lock in your service window, provide preparation guidance, and confirm crew dispatch.',
        },
        {
          number: '04',
          title: 'Service day execution',
          description:
            'Our team arrives on time with the appropriate equipment, performs the work carefully, and verifies completion with you.',
        },
      ],
    },
    faq: {
      eyebrow: 'COMMON QUESTIONS',
      headline: 'Answers to practical questions about our services.',
      items: [
        {
          question: 'Can I combine a move-out clean with my moving service?',
          answer:
            'Yes. Many clients schedule furniture loading in the morning and have our cleaning team arrive as soon as rooms are empty to complete the move-out inspection clean before key return.',
        },
        {
          question: 'Do you bring your own cleaning supplies and equipment?',
          answer:
            'Yes. Our cleaning team arrives equipped with commercial-grade vacuums, microfibre cloths, mops, and cleaning solutions suitable for residential surfaces.',
        },
        {
          question: 'How do you protect floors and walls during a move?',
          answer:
            'We use protective floor runners at entryways and high-traffic hallways, and wrap furniture in thick quilted moving blankets to prevent scuffs to walls and doorways.',
        },
        {
          question: 'What happens if bad weather hits on my moving day?',
          answer:
            'Ottawa weather can be unpredictable. We monitor winter snowstorms and heavy rain, utilize extra protective coverings, and stay in direct communication with you leading up to the move.',
        },
      ],
    },
    finalCta: {
      eyebrow: 'REQUEST A QUOTE',
      headline: 'Tell us about your upcoming project.',
      body:
        'Share your preferred service, Ottawa location, and dates. We will review your details and provide a clear, written estimate.',
      ctaLabel: 'Request a Quote',
    },
    sidebarForm: {
      heading: 'Request a Quick Quote',
      supportingText: 'Share your service details and Ottawa address for a prompt estimate.',
      submitButtonText: 'Submit Quote Request',
    },
    sidebarInfoPanel: {
      heading: 'Planning more than one service?',
      body:
        'Moving out, cleaning a property, or arranging temporary storage between addresses? Tell us which services you need and the dates you are working with.',
      ctaText: 'Request a Quote',
    },
  },
  overlappingPlans: {
    eyebrow: 'WHEN PLANS OVERLAP',
    headline: 'When one job depends on another.',
    intro:
      'A final move-out clean usually has to wait until the furniture is loaded. New keys may arrive days after your current lease ends. A home renovation might require clearing rooms before contractors start work.\n\nTell us what needs doing and how your dates line up.',
    cta: {
      label: 'Request a Quote',
    },
    situations: [
      {
        id: 'handback-keys',
        title: 'A property that needs cleaning before handover',
        description:
          'Once the moving truck is loaded, there is still the lease handover inspection to pass. We coordinate moving in the morning and a thorough clean immediately after, before keys are returned.',
        relatedServicesText: 'Moving and Cleaning',
        preselectedServices: ['moving', 'cleaning'],
        imageSrc: '/assets/hero/cleaning-hero.webp',
        imageAlt: 'Cleaner detailing residential surfaces in an apartment ready for lease handover',
        details: {
          intro:
            'Once furniture is cleared out, a thorough clean ensures kitchens, bathrooms, and floors pass property handover inspection on schedule.',
          considerations: [
            'Target key handover inspection date and time',
            'Number of rooms and appliance cleaning requirements',
            'Moving truck departure timing and empty room access',
          ],
        },
      },
      {
        id: 'moving-dates-gap',
        title: 'Furniture that needs moving before a new lease begins',
        description:
          'Moving out on the last day of the month but cannot move in until the following week? We pick up your furniture and boxes, hold them in transitional storage, and deliver them when your new home is ready.',
        relatedServicesText: 'Moving and Storage',
        preselectedServices: ['moving', 'storage'],
        imageSrc: '/assets/hero/storage-hero.webp',
        imageAlt: 'Neatly organized storage holding unit with labeled cartons and protected furniture',
        details: {
          intro:
            'A transitional gap between addresses requires safe interim holding and coordinated transport without double handling.',
          considerations: [
            'Move-out date and new possession date',
            'Volume of boxed belongings and large furniture pieces',
            'Access requirements during the transitional gap period',
          ],
        },
      },
      {
        id: 'property-renovation',
        title: 'Belongings that need storage while a property is renovated',
        description:
          'Furniture may need to be moved out of the way before painters and contractors begin work. Once construction wraps up, there is also post-renovation dust cleaning to arrange.',
        relatedServicesText: 'Moving, Storage and Cleaning',
        preselectedServices: ['moving', 'storage', 'cleaning'],
        imageSrc: '/assets/hero/moving-hero.webp',
        imageAlt: 'Movers carefully handling and wrapping furniture pieces to protect from renovation dust',
        details: {
          intro:
            'Renovations require clear work zones. Protect furniture with interim storage and arrange post-renovation fine-dust cleaning once contractors finish.',
          considerations: [
            'Scope of rooms undergoing renovation or painting',
            'Estimated contractor work duration',
            'Post-renovation fine-dust cleaning and furniture reinstatement timing',
          ],
        },
      },
    ],
  },
  requestQuoteSection: {
    eyebrow: 'GET STARTED',
    headline: 'Tell us what needs doing.',
    body:
      'Share the service, location, and date you have in mind. Whether you need a move-out clean, help moving a home, or storage while you are in between addresses, we will help you take it from there.\n\nYou can request cleaning, moving, or storage individually, or include several requirements in one enquiry.',
    primaryCta: {
      label: 'Request a Quote',
    },
    secondaryLink: {
      label: 'Explore Services',
      href: '/services',
    },
  },
  homeFaq: {
    eyebrow: 'COMMON QUESTIONS',
    headline: 'Helpful answers before you get started.',
    moreLink: {
      label: 'Read all service FAQs',
      href: '/services#faq',
    },
    items: [
      {
        question: 'Do I need to request all three services together?',
        answer:
          'No. You can request Cleaning, Moving, or Storage entirely on its own. Many clients only need a move-out clean or help transporting furniture. If your project involves multiple services, we simply coordinate the schedule for you.',
      },
      {
        question: 'How does requesting a quote work?',
        answer:
          'Fill out our online quote form with your service details, address or neighbourhood in Ottawa, and preferred date. Our team reviews your request, confirms access details, and sends you a written estimate with clear next steps.',
      },
      {
        question: 'What areas in Ottawa and the region do you serve?',
        answer:
          'We work across Ottawa and the National Capital Region, including Centretown, Kanata, Nepean, Barrhaven, Orléans, Gloucester, and Stittsville. If your location is outside the core region, let us know and we will confirm feasibility.',
      },
      {
        question: 'What if I have a gap of several days between my leases?',
        answer:
          'This is one of our most common scenarios. We can pick up your furniture and belongings on your move-out day, hold them in transitional storage, and deliver them when your new home is ready for occupancy.',
      },
      {
        question: 'Does submitting a quote request automatically confirm my booking?',
        answer:
          'No. Submitting a quote request gives us the information needed to prepare your estimate. An appointment is confirmed once you review and approve the scope and timeline with our team.',
      },
    ],
  },
  contactPage: {
    meta: {
      title: 'Contact Laurrel Services | Ottawa, Ontario',
      description:
        'Contact Laurrel Services about cleaning, moving or storage in Ottawa. Call (343) 843-3032 or send an enquiry with your location and preferred date.',
      canonical: 'https://laurrelservices.com/contact',
      ogImage: '/assets/brand/og-image.jpg',
    },
    banner: {
      title: 'Contact Us',
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'Contact Us', href: '/contact' },
      ],
      imageSrc: '/assets/hero/about-handover.webp',
      altText: 'Laurrel Services customer support and project planning in Ottawa',
    },
    eyebrow: 'GET IN TOUCH',
    headline: 'Tell us about your upcoming project.',
    supportingParagraph:
      'Whether you have a confirmed date or you are just beginning to plan, share a few details about what you need. Letting us know the service, Ottawa location, and approximate timeline helps us provide a clear, accurate response.',
    businessEmail: 'info@laurrelservices.com',
    businessPhone: '(343) 843-3032',
    businessPhoneHref: 'tel:+13438433032',
    hasPublicOffice: false,
    officeAddress: 'Ottawa, Ontario, Canada',
    googleMapsPlaceId: 'ChIJrxNRrSNFzkwR7NxFe5Fs0II',
    locationHeading: 'Serving Ottawa and Surrounding Communities',
    serviceRegionDescription:
      'We coordinate cleaning, moving, and storage arrangements across Ottawa and the National Capital Region, including Centretown, Kanata, Nepean, Barrhaven, Orléans, Gloucester, and Stittsville.',
    confirmedServiceAreas: [
      'Centretown & Downtown Ottawa',
      'Kanata',
      'Nepean',
      'Barrhaven',
      'Orléans',
      'Gloucester',
      'Stittsville',
    ],
    form: {
      heading: 'Send us an enquiry',
      buttonText: 'Send Enquiry',
    },
  },
  homeContact: {
    eyebrow: 'GET IN TOUCH',
    headline: 'Have a project in mind? Let us know.',
    paragraph:
      'Tell us what you need, where in Ottawa the work will take place, and when. If you are still working out the details, we can help answer your questions.',
    primaryCta: {
      label: 'Contact Us',
      href: '/contact',
    },
  },
};

