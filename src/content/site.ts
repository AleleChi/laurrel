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

export interface ServicesPageServiceDetail {
  id: string;
  anchor: string;
  badge: string;
  title: string;
  summary: string;
  details: string[];
  ctaLabel: string;
}

export interface ServicesPageConfig {
  meta: {
    title: string;
    description: string;
  };
  heading: string;
  intro: string;
  sections: ServicesPageServiceDetail[];
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
        'Explore Laurrel Services cleaning, moving and storage options in Ottawa. Learn what information to provide and request a quote for your next job.',
    },
    heading: 'Cleaning, Moving & Storage Services in Ottawa',
    intro:
      "Laurrel Services offers cleaning, moving and storage for customers in Ottawa. Whether you're preparing a property, arranging a move or looking into storage, start with the service you need and the details of the job.",
    sections: [
      {
        id: 'cleaning',
        anchor: 'cleaning',
        badge: 'SERVICE 01',
        title: 'Residential & Commercial Cleaning',
        summary:
          'From move-in and move-out cleans to recurring property maintenance and post-renovation preparation, every space requires different focus.',
        details: [
          'Occupied residential cleaning tailored to room priorities and schedules',
          'Move-in / move-out turnover cleaning for tenants, owners and property managers',
          'Post-renovation dust removal and deep surface care',
          'Commercial and workplace cleaning structured around business operating hours',
        ],
        ctaLabel: 'Request a Quote',
      },
      {
        id: 'moving',
        anchor: 'moving',
        badge: 'SERVICE 02',
        title: 'Careful Residential & Commercial Moving',
        summary:
          'A successful move begins with understanding what is being transported, building access, and timing.',
        details: [
          'Local moves across Ottawa and surrounding communities',
          'Furniture protection, padding and secure cargo securing',
          'Staircase, elevator, loading bay and narrow corridor coordination',
          'Clear communication from initial inventory review to final placement',
        ],
        ctaLabel: 'Request a Quote',
      },
      {
        id: 'storage',
        anchor: 'storage',
        badge: 'SERVICE 03',
        title: 'Secured Short & Long-Term Storage',
        summary:
          'Flexible storage arrangements for households in transition, renovations, or surplus commercial inventory.',
        details: [
          'Transition storage between lease dates or closing schedules',
          'Safe keeping for packed boxes, furniture sets and household goods',
          'Scalable space arrangements based on actual volume',
          'Coordinated transfers in tandem with our moving services',
        ],
        ctaLabel: 'Request a Quote',
      },
    ],
  },
};
