export interface NavLink {
  label: string;
  href: string;
  isExternal?: boolean;
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
    items: {
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
  meta: {
    title: string;
    description: string;
  };
}

export interface ServiceHighlightItem {
  id: 'cleaning' | 'moving' | 'storage';
  title: string;
  description: string;
  anchor: string;
}

export interface ServicesHighlightConfig {
  eyebrow: string;
  headline: string;
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
  meta: {
    title: string;
    description: string;
  };
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

export interface SiteConfig {
  companyName: string;
  tagline: string;
  location: string;
  meta: {
    title: string;
    description: string;
    locale: string;
  };
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
    };
  };
  ticker: {
    items: TickerItem[];
  };
  about: HomepageAboutConfig;
  aboutPage: AboutPageConfig;
  servicesHighlight: ServicesHighlightConfig;
  servicesPage: ServicesPageConfig;
}

export const siteConfig: SiteConfig = {
  companyName: 'LAURREL SERVICES',
  tagline: 'Clean spaces. Smooth moves. Secure storage.',
  location: 'Ottawa, Ontario',
  meta: {
    title: 'Cleaning, Moving & Storage in Ottawa | Laurrel Services',
    description:
      'Cleaning, moving and storage services in Ottawa. Explore Laurrel Services and request a quote for your home, property or business.',
    locale: 'en-CA',
  },
  navigation: {
    links: [
      { label: 'Home', href: '/' },
      { label: 'Cleaning', href: '/#cleaning' },
      { label: 'Moving', href: '/#moving' },
      { label: 'Storage', href: '/#storage' },
      { label: 'About', href: '/about' },
    ],
    cta: {
      label: 'Get a Quote',
      href: '#quote',
    },
  },
  hero: {
    eyebrow: 'CLEANING · MOVING · STORAGE IN OTTAWA',
    headline: {
      line1: 'Clean spaces.',
      line2: 'Smooth moves.',
      line3: 'Secure storage.',
    },
    body: 'Whether you’re preparing a property, moving to a new address, or need space for belongings in between, Laurrel Services helps you arrange the work in one place.',
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
      imageSrc: '/assets/hero/laurrel-room.png',
      altText: 'Sunlit living room with pristine cream furniture and architectural staircase in Ottawa, Canada',
      videos: [
        {
          id: 'hero-video-cleaning',
          service: 'Cleaning',
          serviceKey: 'cleaning',
          src: '/assets/videos/clean.mp4',
          poster: '/assets/videos/cleaning-poster.jpg',
          description: 'Laurrel Services cleaning professional inspecting and maintaining residential space in Ottawa',
          order: 1,
          objectPosition: 'center 45%',
        },
        {
          id: 'hero-video-moving',
          service: 'Moving',
          serviceKey: 'moving',
          src: '/assets/videos/movinng.mp4',
          poster: '/assets/videos/moving-poster.jpg',
          description: 'Laurrel Services moving specialist carefully transporting boxed belongings',
          order: 2,
          objectPosition: 'center 45%',
        },
        {
          id: 'hero-video-storage',
          service: 'Storage',
          serviceKey: 'storage',
          src: '/assets/videos/storagge.mp4',
          poster: '/assets/videos/storage-poster.jpg',
          description: 'Laurrel Services storage specialist organizing modern, dependable storage facility',
          order: 3,
          objectPosition: 'center 45%',
        },
      ],
    },
  },
  ticker: {
    items: [
      { id: 'clean', label: 'Cleaning' },
      { id: 'move', label: 'Moving' },
      { id: 'store', label: 'Storage' },
    ],
  },
  about: {
    eyebrow: 'ABOUT LAURREL SERVICES',
    headline: 'The details matter before the work begins.',
    introParagraph:
      'Cleaning a property, moving belongings and arranging storage are different jobs, each with its own requirements. At Laurrel Services, these three services are the focus of our work in Ottawa.',
    stat: {
      number: '03',
      caption: 'CORE SERVICES',
    },
    rightHeading: 'Cleaning. Moving. Storage.',
    services: [
      {
        title: 'Cleaning',
        description:
          'From the condition of a property to the areas that need attention, a cleaning job starts with understanding the space and the work involved.',
      },
      {
        title: 'Moving',
        description:
          "A moving plan depends on what needs transporting, where it's going, building access and the time available to complete the job.",
      },
      {
        title: 'Storage',
        description:
          'The amount being stored, the length of time and access requirements are important considerations when arranging storage.',
      },
    ],
    cta: {
      label: 'About Laurrel',
      href: '/about',
    },
    media: {
      imageSrc: '/assets/videos/moving-poster.jpg',
      altText: 'Laurrel Services moving specialist carrying packed belongings into a clean residential interior in Ottawa',
    },
  },
  aboutPage: {
    banner: {
      title: 'About Laurrel Services',
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
      ],
      imageSrc: '/assets/videos/moving-poster.jpg',
      altText: 'Laurrel Services moving specialist in Ottawa',
    },
    aboutCompany: {
      eyebrow: 'ABOUT OUR COMPANY',
      headline: 'Cleaning, moving and storage. All in one place.',
      paragraph1:
        "There's the furniture to transport, the property to clean before the keys go back, and sometimes a few days when everything needs somewhere to stay. Each job has its own timing and requirements.",
      paragraph2:
        'Laurrel Services offers cleaning, moving and storage in Ottawa. You can request one service on its own or tell us about several related jobs. We start with the details of what you need, where and when.',
      emphasisPoints: [
        {
          id: 'service',
          text: 'Book the service your property or move requires.',
        },
        {
          id: 'enquiry',
          text: 'Discuss multiple service needs in the same enquiry.',
        },
      ],
      cta: {
        label: 'Explore Our Services',
        href: '/#services',
      },
      imageSrc: '/assets/videos/cleaning-poster.jpg',
      altText: 'Laurrel Services professional cleaning service in progress in an Ottawa residence',
    },
    whatWeDo: {
      eyebrow: 'WHAT WE DO',
      headline: "There's more than one way to get a space ready.",
      intro:
        "Not every job starts with a move. Sometimes it's a property that needs cleaning, furniture that needs relocating or belongings that need somewhere to stay. Laurrel Services offers all three, so you can start with the work that matters to you.",
      columns: [
        {
          category: 'CLEANING',
          displayWord: 'Clean.',
          description:
            'Whether a property is occupied or being prepared for its next use, tell us about the rooms, their condition and the cleaning work you have in mind.',
          href: '/#cleaning',
        },
        {
          category: 'MOVING',
          displayWord: 'Move.',
          description:
            'Changing addresses involves more than transporting boxes. The belongings, access at each property and preferred date all matter when planning a move.',
          href: '/#moving',
        },
        {
          category: 'STORAGE',
          displayWord: 'Store.',
          description:
            'Between properties, renovating or making extra room? Tell us what needs storing and how long you expect to need the space.',
          href: '/#storage',
        },
      ],
    },
    whyLaurrel: {
      eyebrow: 'WHY LAURREL SERVICES',
      headline: 'Different needs. One place to start.',
      intro:
        'Cleaning, moving and storage each require different arrangements. Knowing what’s involved helps you make better decisions before confirming a service.',
      items: [
        {
          id: 'enquiry',
          title: 'One enquiry for related jobs',
          description:
            'If your plans involve cleaning, moving and storage, include everything in the same request. The requirements can then be reviewed together.',
        },
        {
          id: 'details',
          title: 'Details before decisions',
          description:
            'The property, belongings, access conditions and dates all matter. Understanding these details is the starting point for discussing a service.',
        },
        {
          id: 'one-service',
          title: 'One service is fine too',
          description:
            "You can enquire about cleaning, moving or storage independently. There's no need to request more than the job requires.",
        },
        {
          id: 'dates',
          title: 'Plan around your dates',
          description:
            'Moving dates, property handovers and renovations can involve different deadlines. Include your preferred dates when making an enquiry.',
        },
      ],
      imageSrc: '/assets/hero/laurrel-room.png',
      altText: 'Prepared residential space in Ottawa arranged by Laurrel Services',
      cutoutImageSrc: '/assets/about/mover-cutout-trimmed.png',
      cutoutAltText: 'Laurrel Services moving specialist holding a packaged carton',
    },
    marquee: {
      items: ['CLEANING', 'MOVING', 'STORAGE'],
    },
    faq: {
      eyebrow: 'HAVE QUESTIONS?',
      headline: 'A few things worth knowing before you book.',
      intro:
        'A few practical answers about arranging cleaning, moving and storage with Laurrel Services.',
      imageSrc: '/assets/videos/storage-poster.jpg',
      altText: 'Laurrel Services modern and secure storage facility in Ottawa',
      items: [
        {
          question: 'Can I request more than one service?',
          answer:
            'Yes. If you need cleaning, moving or storage as part of the same job, describe the requirements in one enquiry. The arrangements and availability can then be reviewed.',
        },
        {
          question: 'What should I include in a cleaning request?',
          answer:
            'Tell us about the property, its approximate size, the areas to be cleaned, its current condition and your preferred date.',
        },
        {
          question: 'What information is needed for a moving quote?',
          answer:
            'Include your collection and delivery locations, preferred date, approximate inventory and any important access details, such as stairs, elevators or parking restrictions.',
        },
        {
          question: 'What should I tell you about my storage needs?',
          answer:
            'Describe the belongings, approximate amount of space needed, how long you expect to store them and whether you’ll require access during that period.',
        },
        {
          question: 'Does Laurrel serve locations outside Ottawa?',
          answer:
            'Include your location or postal code in your enquiry. Service availability can then be confirmed for your area.',
        },
      ],
    },
    finalCta: {
      headline: 'Tell us what you need done.',
      body:
        'Cleaning, moving or storage in Ottawa? Share a few details about the job and your preferred date.',
      ctaLabel: 'Request a Quote',
    },
    meta: {
      title: 'About Laurrel Services | Cleaning, Moving & Storage in Ottawa',
      description:
        'Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Understand our approach to planning related service requests.',
    },
  },
  servicesHighlight: {
    eyebrow: 'OUR SERVICES',
    headline: 'A space to clean. A move to make. Belongings to store.',
    cta: {
      label: 'Explore Services',
      href: '/services',
    },
    services: [
      {
        id: 'cleaning',
        title: 'Cleaning',
        description:
          "An apartment after move-out. A home that needs a thorough clean. A workplace being prepared for its next day of business. Tell us about the space, what needs attention and when you'd like it done.",
        anchor: '/services#cleaning',
      },
      {
        id: 'moving',
        title: 'Moving',
        description:
          "A new address comes with its own logistics. Furniture, boxes, stairs, elevators and moving dates all need consideration. Tell us what you're moving and where it needs to go.",
        anchor: '/services#moving',
      },
      {
        id: 'storage',
        title: 'Storage',
        description:
          "Between leases, renovating or simply making more room? Let us know what you're keeping, how much space you expect to need and how long you plan to store it.",
        anchor: '/services#storage',
      },
    ],
  },
  servicesPage: {
    meta: {
      title: 'Cleaning, Moving & Storage Services Ottawa | Laurrel Services',
      description:
        'Explore cleaning, moving and storage services in Ottawa. Learn what to include in your enquiry and request availability and a quote from Laurrel Services.',
    },
    banner: {
      title: 'Our Services',
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
      ],
      imageSrc: '/assets/hero/laurrel-room.png',
      altText: 'Laurrel Services cleaning, moving and storage services in Ottawa, Canada',
    },
    articleIntro: {
      h2: 'Cleaning, moving and storage services in Ottawa',
      paragraph1:
        'Getting a property ready, moving to a new address or finding room for belongings can involve different arrangements. Laurrel Services offers cleaning, moving and storage in Ottawa, with each request considered according to the work involved.',
      paragraph2:
        "Whether you need one service or several, start by telling us what needs doing, where and when. We'll use those details to discuss the available arrangements.",
    },
    services: [
      {
        id: 'cleaning',
        anchor: 'cleaning',
        badge: 'CLEANING SERVICES IN OTTAWA',
        title: 'Cleaning Services in Ottawa',
        headline: 'Cleaning for homes and properties in Ottawa',
        paragraphs: [
          "An occupied home doesn't need the same attention as an empty property being prepared for its next occupants. A workplace has its own requirements, too. Before any cleaning job can be planned properly, it helps to understand the space and what needs attention.",
          'Laurrel Services welcomes cleaning enquiries from Ottawa customers. Tell us about the property, the rooms or areas involved, its current condition and the date you have in mind.',
        ],
        imageSrc: '/assets/videos/cleaning-poster.jpg',
        imageAlt: 'Laurrel Services cleaning specialist preparing a residential space in Ottawa',
        planningTitle: 'What to include in your cleaning enquiry',
        planningIntro:
          "Whether you're preparing to move in, getting ready to hand back the keys or arranging cleaning for a property in regular use, the details help establish the scope. Useful information includes:",
        usefulInfoTitle: 'Useful information includes:',
        usefulInfo: [
          'The type and approximate size of the property',
          'Whether the space is occupied or empty',
          'The rooms and surfaces requiring attention',
          'Any particular areas of concern',
          'Your preferred date and access arrangements',
        ],
        ctaLabel: 'Enquire About Cleaning',
      },
      {
        id: 'moving',
        anchor: 'moving',
        badge: 'MOVING SERVICES IN OTTAWA',
        title: 'Moving Services in Ottawa',
        headline: 'Moving services in Ottawa',
        paragraphs: [
          'Moving across Ottawa can involve more than the distance between two addresses. A condo may have an elevator reservation. An apartment may have narrow stairs. Large furniture may need particular attention, and collection or delivery times may depend on building access.',
          'Laurrel Services handles moving enquiries in Ottawa. Start by telling us where the belongings are coming from, where they’re going and what needs transporting.',
        ],
        imageSrc: '/assets/videos/moving-poster.jpg',
        imageAlt: 'Laurrel Services moving specialist transporting packaged boxes in Ottawa',
        planningTitle: 'Planning your move',
        planningIntro:
          "You don't need to have every detail worked out before getting in touch. An approximate inventory and a preferred moving date are a useful starting point. Information to include:",
        usefulInfoTitle: 'Information to include:',
        usefulInfo: [
          'Collection and destination locations',
          'Preferred moving date',
          'Approximate number and type of belongings',
          'Large or unusually shaped furniture',
          'Stairs, elevators and loading access',
          'Parking or building restrictions',
        ],
        extraNote: 'If you also need cleaning or storage, mention that in the same enquiry.',
        ctaLabel: 'Enquire About Moving',
      },
      {
        id: 'storage',
        anchor: 'storage',
        badge: 'STORAGE SERVICES IN OTTAWA',
        title: 'Storage Services in Ottawa',
        headline: 'Storage services in Ottawa',
        paragraphs: [
          'Your lease may end before the next one begins. Renovations may require furniture to be moved out temporarily. Or you may simply need to make room for belongings you aren’t ready to part with.',
          'Storage requirements vary. A few packed boxes are different from the contents of an entire home, and the length of time matters just as much as the amount of space.',
          'Laurrel Services accepts storage enquiries in Ottawa. Describe what you need to keep, approximately how much space it will require and how long you expect to need storage.',
        ],
        imageSrc: '/assets/videos/storage-poster.jpg',
        imageAlt: 'Laurrel Services clean and secure storage facility in Ottawa',
        planningTitle: 'Before arranging storage',
        planningIntro: 'There are several details worth confirming:',
        usefulInfoTitle: 'Details worth confirming:',
        usefulInfo: [
          'What items need to be stored',
          'Approximate quantity or volume',
          'Expected storage duration',
          'Whether you’ll need access to the items',
          'When the belongings need to go into storage',
          'Any particular handling or storage requirements',
        ],
        extraNote:
          'The available storage arrangement, access conditions, location and applicable terms should be confirmed before booking.',
        ctaLabel: 'Enquire About Storage',
      },
    ],
    gettingStarted: {
      eyebrow: 'HOW TO GET STARTED',
      headline: 'Tell us about the job. Start with the essentials.',
      steps: [
        {
          number: '01',
          title: 'Describe what you need',
          description:
            'Choose Cleaning, Moving, Storage or a combination. Include the property or belongings involved and any important requirements.',
        },
        {
          number: '02',
          title: 'Share your location and preferred date',
          description:
            'Tell us where the work is needed and when you would like it arranged. For moving requests, include both the collection and delivery locations.',
        },
        {
          number: '03',
          title: 'Request availability and a quote',
          description:
            'Submit your enquiry so the service requirements and available arrangements can be confirmed before booking.',
        },
      ],
    },
    faq: {
      eyebrow: 'FREQUENTLY ASKED QUESTIONS',
      headline: 'Frequently Asked Questions',
      items: [
        {
          question: 'Can I enquire about cleaning, moving and storage together?',
          answer:
            'Yes. Describe the different requirements in one enquiry. For example, you might need belongings moved, a property cleaned and storage between two moving dates. Availability and arrangements will need to be confirmed.',
        },
        {
          question: 'What should I include when requesting a cleaning quote?',
          answer:
            'Start with the type and approximate size of the property, its current condition, the areas needing attention and your preferred date. Include any special requirements that could affect the scope.',
        },
        {
          question: 'What affects the planning of a move?',
          answer:
            'The belongings being transported, collection and destination locations, stairs, elevators, loading access and preferred date are all relevant. Larger items and building restrictions are worth identifying early.',
        },
        {
          question: 'How do I know how much storage space I need?',
          answer:
            'Start with an inventory of the items you intend to store. Include approximate dimensions for larger furniture and the expected duration. The suitable arrangement and available space can then be discussed.',
        },
        {
          question: 'Do you provide services outside Ottawa?',
          answer:
            'Include your location or postal code when enquiring. Laurrel can confirm whether the requested service is available at your address.',
        },
        {
          question: 'How much will my service cost?',
          answer:
            'The price will depend on the service requested and the work involved. Share the relevant details so an appropriate quotation can be discussed. Any final price and terms should be confirmed before booking.',
        },
      ],
    },
    finalCta: {
      eyebrow: 'READY TO GET STARTED?',
      headline: 'Tell us what needs doing.',
      body:
        'A cleaning job, a moving date or storage between addresses. Tell us about your plans and the service you need.',
      ctaLabel: 'Request a Quote',
    },
    sidebarForm: {
      heading: 'Tell us what you need.',
      supportingText:
        "Share a few details about the service you're planning, and we'll review your enquiry.",
      submitButtonText: 'Send Enquiry',
    },
    sidebarInfoPanel: {
      heading: 'Planning more than one service?',
      body:
        "Moving out, cleaning a property or arranging storage between addresses? Tell us which services you need and the dates you're working with.",
      ctaText: 'Request a Quote',
    },
  },
};
