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

export interface HeroSlideItem {
  id: string;
  serviceKey: 'cleaning' | 'moving' | 'storage';
  serviceLabel: string;
  imageSrc: string;
  altText: string;
  order: number;
  objectPosition?: string;
  assetId?: string;
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
      objectPosition?: string;
      slides?: HeroSlideItem[];
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
      'Cleaning, moving and storage services for homes and businesses in Ottawa and the National Capital Region. Explore our services and request a quote.',
    canonical: 'https://laurrelservices.com/',
    ogTitle: 'Laurrel Services | Cleaning, Moving & Storage in Ottawa',
    ogDescription:
      'Cleaning, moving and storage services for homes and businesses in Ottawa and the National Capital Region. Explore our services and request a quote.',
    ogImage: '/assets/brand/laurrel-social-preview-v2.jpg',
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
    eyebrow: 'CLEANING · MOVING · STORAGE SOLUTIONS IN OTTAWA',
    headline: {
      line1: 'One team.',
      line2: 'Three solutions.',
      line3: '',
    },
    body:
      'From cleaning homes and workspaces to moving furniture and finding storage options, Laurrel Services helps customers across Ottawa and surrounding areas arrange the service they need. Tell us what needs doing and your preferred date to get started.',
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
      body: 'Tell us what you need and your preferred date to get started.',
      actionText: 'Get in Touch',
    },
    media: {
      imageSrc: '/assets/images/laurrel-cleaning-slide.webp',
      altText: 'Cleaner wiping a countertop in a bright residential interior.',
      objectPosition: 'center center',
      slides: [
        {
          id: 'hero-slide-cleaning',
          serviceKey: 'cleaning',
          serviceLabel: 'Cleaning',
          imageSrc: '/assets/images/laurrel-cleaning-slide.webp',
          altText: 'Cleaner wiping a countertop in a bright residential interior.',
          order: 1,
          objectPosition: '70% 30%',
        },
        {
          id: 'hero-slide-moving',
          serviceKey: 'moving',
          serviceLabel: 'Moving',
          imageSrc: '/assets/images/laurrel-moving-slide.webp',
          altText: 'Movers carrying wrapped household furniture towards a moving truck.',
          order: 2,
          objectPosition: '60% 40%',
        },
        {
          id: 'hero-slide-storage',
          serviceKey: 'storage',
          serviceLabel: 'Storage Solutions',
          imageSrc: '/assets/images/laurrel-storage-solutions-slide.webp',
          altText: 'Packed boxes and protected household belongings arranged for storage.',
          order: 3,
          objectPosition: '65% 50%',
        },
      ],
      services: [
        {
          id: 'cleaning',
          service: 'Cleaning',
          title: 'Residential & Handover Cleaning',
          tagline: 'Spotless, detail-oriented care for homes and apartments',
          description: 'Thorough cleaning tailored for routine upkeep, deep seasonal care, or tenancy handover.',
          imageSrc: '/assets/images/laurrel-cleaning-slide.webp',
          fallbackImage: '/assets/images/laurrel-cleaning-alternate.webp',
          altText: 'Cleaner wiping a countertop in a bright residential interior.',
          badge: 'Ottawa & NCR',
        },
        {
          id: 'moving',
          service: 'Moving',
          title: 'Local Moving & Furniture Transport',
          tagline: 'Dependable moving and organized packing support',
          description: 'Careful household moves handled with protective blankets and organized transport across Ottawa.',
          imageSrc: '/assets/images/laurrel-moving-slide.webp',
          fallbackImage: '/assets/images/laurrel-moving-alternate.webp',
          altText: 'Movers carrying wrapped household furniture towards a moving truck.',
          badge: 'Local & Regional',
        },
        {
          id: 'storage',
          service: 'Storage',
          title: 'Transitional Storage Solutions',
          tagline: 'Clean, dependable interim storage for your belongings',
          description: 'Interim holding for furniture and personal items when moving dates or renovation schedules do not align.',
          imageSrc: '/assets/images/laurrel-storage-solutions-slide.webp',
          fallbackImage: '/assets/images/laurrel-storage-solutions-alternate.webp',
          altText: 'Packed boxes and protected household belongings arranged for storage.',
          badge: 'Interim & Flexible',
        },
      ],
      videos: [],
    },
  },
  ticker: {
    items: [
      { id: 'cleaning', label: 'Cleaning' },
      { id: 'moving', label: 'Moving' },
      { id: 'storage', label: 'Storage Solutions' },
      { id: 'location', label: 'Ottawa & Surrounding Areas' },
    ],
  },
  about: {
    eyebrow: 'ABOUT LAURREL SERVICES',
    headline: 'A cleaner space. A smoother move. Storage options when you need them.',
    introParagraph:
      "Whether you're preparing a property, relocating furniture or looking for somewhere to keep your belongings, Laurrel Services helps with cleaning, moving and storage solutions in Ottawa and surrounding areas. Request one service or tell us about several jobs you need help with.",
    stat: {
      number: '03',
      caption: 'CORE SERVICES',
    },
    rightHeading: 'Choose the service you need.',
    services: [
      {
        title: 'Cleaning',
        description:
          "Cleaning for homes and workplaces, whether it's regular upkeep, a deeper clean or preparing a property before or after a move.",
      },
      {
        title: 'Moving',
        description:
          "Moving furniture and household belongings from one address to another. Tell us what you're moving, where it's going and when.",
      },
      {
        title: 'Storage Solutions',
        description:
          'Need somewhere for your belongings while plans change? Tell us what you need to store and for how long so we can discuss suitable options.',
      },
    ],
    cta: {
      label: 'About Laurrel',
      href: '/about',
    },
    media: {
      imageSrc: '/assets/images/laurrel-about-residential-prep.webp',
      altText:
        'Sunlit residential room prepared for moving, with neatly packed boxes, protected wrapped furniture, a hand truck, and clean hardwood floors.',
    },
  },
  aboutPage: {
    banner: {
      title: 'About Laurrel Services',
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
      ],
      imageSrc: '/assets/images/laurrel-about-banner.webp',
      altText: 'Sunlit contemporary Ottawa residence prepared for moving with packed boxes and wrapped furniture',
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
      imageSrc: '/assets/images/laurrel-about-company.webp',
      altText: 'Laurrel Services moving specialists carefully transporting protected furniture in Ottawa',
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
      imageSrc: '/assets/images/laurrel-about-how-we-work.webp',
      altText: 'Laurrel team member carefully preparing and packing household items with protective materials',
      cutoutImageSrc: '/assets/images/laurrel-about-how-we-work.webp',
      cutoutAltText: 'Laurrel team member carefully preparing and packing household items with protective materials',
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
      imageSrc: '/assets/images/laurrel-about-faq.webp',
      altText: 'Professional Laurrel service specialist ready to assist with cleaning, moving and storage enquiries',
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
      ogImage: '/assets/brand/laurrel-social-preview-v2.jpg',
    },
  },
  servicesHighlight: {
    eyebrow: 'OUR SERVICES',
    headline: 'Cleaning, moving and storage solutions across Ottawa.',
    intro:
      'Whether you need your property cleaned, furniture moved to a new address or somewhere to keep your belongings, start with the service that fits your plans. Tell us about the job, your location and your preferred date.',
    cta: {
      label: 'Explore All Services',
      href: '/services',
    },
    services: [
      {
        id: 'cleaning',
        title: 'Cleaning',
        description:
          "Cleaning for homes and workplaces, from regular upkeep and deep cleaning to preparing a property before or after a move.",
        anchor: '/services#cleaning',
        keyPoints: [
          'Move-in and move-out tenancy turnover cleans',
          'Kitchen detailing, appliance interiors, and bathroom sanitization',
          'Post-renovation fine dust removal and floor washing',
          'Scheduled recurring maintenance for busy households',
        ],
        imageSrc: '/assets/images/laurrel-service-cleaning.webp',
        altText: 'Professional Laurrel cleaner detailing a kitchen marble countertop in a bright Ottawa residence',
      },
      {
        id: 'moving',
        title: 'Moving',
        description:
          "Moving to a new address or need furniture transported? Tell us what you're moving, where it's going and when you'd like it moved.",
        anchor: '/services#moving',
        keyPoints: [
          'Apartment and residential household moves across Ottawa',
          'Furniture loading, protective wrapping, and careful transport',
          'Quilted blankets and floor runners for property protection',
          'Careful coordination around elevator bookings and loading zones',
        ],
        imageSrc: '/assets/images/laurrel-service-moving.webp',
        altText: 'Two professional Laurrel movers carefully transporting a wrapped sofa toward the moving truck in Ottawa',
      },
      {
        id: 'storage',
        title: 'Storage Solutions',
        description:
          'Need somewhere to keep your belongings between moves or during renovations? Tell us what needs storing and for how long so we can discuss suitable options.',
        anchor: '/services#storage',
        keyPoints: [
          'Interim holding when move-out and move-in dates do not align',
          'Temporary storage during interior renovations or painting',
          'Clean, dry, and secure storage for furniture and packed cartons',
          'Transport arrangements directly into designated storage units',
        ],
        imageSrc: '/assets/images/laurrel-service-storage-solutions.webp',
        altText: 'Organized household furniture and sealed moving cartons staged for interim storage in an Ottawa home',
      },
    ],
  },
  servicesPage: {
    meta: {
      title: 'Cleaning, Moving & Storage Services in Ottawa | Laurrel',
      description:
        "Explore Laurrel's cleaning, moving and storage services in Ottawa. Find out what details to include when requesting a service estimate or discussing your plans.",
      canonical: 'https://laurrelservices.com/services',
      ogImage: '/assets/brand/laurrel-social-preview-v2.jpg',
    },
    banner: {
      title: 'Our Services',
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
      ],
      imageSrc: '/assets/images/laurrel-services-banner.webp',
      altText: 'Residential interior and moving truck prepared for comprehensive moving, cleaning and storage services',
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
        imageSrc: '/assets/images/laurrel-service-cleaning.webp',
        imageAlt: 'Professional Laurrel cleaner detailing a kitchen marble countertop in a bright Ottawa residence',
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
        imageSrc: '/assets/images/laurrel-service-moving.webp',
        imageAlt: 'Two professional Laurrel movers carefully transporting a wrapped sofa toward the moving truck in Ottawa',
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
        badge: 'STORAGE SOLUTIONS IN OTTAWA',
        title: 'Storage Solutions in Ottawa',
        headline: 'Dependable holding when moving dates or renovation plans do not align',
        paragraphs: [
          'One of the most stressful parts of property transitions is a schedule gap—such as when your current lease ends on the last day of the month, but your new home is not ready until the following week. In other cases, home renovations or floor refinishing require clearing rooms entirely.',
          'We coordinate safe, accessible interim storage arrangements for your furniture and packed boxes. We handle loading at your current location, transfer into clean storage facilities, and deliver everything once your new space is ready.',
        ],
        imageSrc: '/assets/images/laurrel-service-storage-solutions.webp',
        imageAlt: 'Organized household furniture and sealed moving cartons staged for interim storage in an Ottawa home',
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
        ctaLabel: 'Ask About Storage Solutions',
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
    headline: 'When your plans involve more than one service.',
    intro:
      "Moving, cleaning and storage sometimes need to happen around the same dates. Whether you're handing back keys, waiting to move into a new home or clearing rooms for renovations, tell us what needs doing and when. We'll discuss the services available for your situation.",
    cta: {
      label: 'Request a Quote',
    },
    situations: [
      {
        id: 'handback-keys',
        title: 'Moving out and handing back the keys',
        description:
          'Once the furniture is out, the property may need cleaning before the keys are returned. Share your moving date, property details and handover deadline so we can discuss both jobs.',
        relatedServicesText: 'Moving and Cleaning',
        preselectedServices: ['moving', 'cleaning'],
        imageSrc: '/assets/images/laurrel-moveout-cleaning.webp',
        imageAlt: 'Empty residential property undergoing methodical move-out cleaning before tenancy handover in Ottawa',
        details: {
          intro:
            'Moving and cleaning may need to be planned around your handover deadline. Tell us when the rooms will be empty and what areas need attention.',
          considerations: [
            'Target key handover inspection date and time',
            'Number of rooms, floor areas, and appliance cleaning requirements',
            'Moving truck departure timing and empty room access window',
          ],
        },
      },
      {
        id: 'moving-dates-gap',
        title: 'A gap between moving dates',
        description:
          "If you're leaving one address before the next is ready, you may need somewhere for your furniture and boxes. Tell us what needs moving, how long you need storage and your expected move-in date.",
        relatedServicesText: 'Moving and Storage Solutions',
        preselectedServices: ['moving', 'storage'],
        imageSrc: '/assets/images/laurrel-between-moving-dates.webp',
        imageAlt: 'Wrapped household furniture and stacked moving boxes prepared for interim holding between moving dates',
        details: {
          intro:
            'Share the gap between your moving dates and what needs storing so we can discuss suitable storage solutions alongside your move.',
          considerations: [
            'Move-out date from current home and possession date for your new address',
            'Estimated inventory of large furniture items and packed carton count',
            'Whether you may need interim access to any belongings during the gap',
          ],
        },
      },
      {
        id: 'property-renovation',
        title: 'Clearing rooms for renovation',
        description:
          'Furniture and belongings may need moving or temporary storage while renovation work takes place. Cleaning may also be needed afterwards. Tell us which rooms are involved and your expected timetable.',
        relatedServicesText: 'Moving, Storage Solutions and Cleaning',
        preselectedServices: ['moving', 'storage', 'cleaning'],
        imageSrc: '/assets/images/laurrel-renovation-preparation.webp',
        imageAlt: 'Careful packing of delicate household furnishings and floor protection before home renovations',
        details: {
          intro:
            "Let us know which rooms need clearing, when work starts and whether you'll need cleaning afterwards.",
          considerations: [
            'Specific rooms being renovated, painted, or refinished',
            'Estimated duration of contractor work on site',
            'Post-renovation fine-dust cleaning and furniture return schedule',
          ],
        },
      },
    ],
  },
  requestQuoteSection: {
    eyebrow: 'GET STARTED',
    headline: "Let's get your quote started.",
    body:
      "Need cleaning, moving or storage solutions in Ottawa or surrounding areas? Tell us what you're looking for, where you need it and your preferred date. We'll review your request and follow up about the next steps.",
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
      ogImage: '/assets/brand/laurrel-social-preview-v2.jpg',
    },
    banner: {
      title: 'Contact Us',
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'Contact Us', href: '/contact' },
      ],
      imageSrc: '/assets/images/laurrel-contact-banner.webp',
      altText: 'Inviting contemporary residential living room representing Laurrel Services care in Ottawa',
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

