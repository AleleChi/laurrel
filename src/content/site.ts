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
    services: {
      title: string;
      description: string;
    }[];
  };
  whyLaurrel: {
    eyebrow: string;
    headline: string;
    intro: string;
    points: EditorialPoint[];
    imageSrc: string;
    altText: string;
  };
  photographicStory: {
    eyebrow: string;
    headline: string;
    bodyParagraphs: string[];
    ctaLabel: string;
    imageSrc: string;
    altText: string;
  };
  faq: {
    eyebrow: string;
    headline: string;
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
      headline: 'Different jobs. One place to start.',
      paragraph1:
        'Moving out of a property can mean more than getting your belongings from one address to another. There may be rooms to clean before handing back the keys, furniture that needs to be stored for a while, or a new place that isn’t quite ready.',
      paragraph2:
        'Laurrel Services offers cleaning, moving and storage services in Ottawa. Whether you need one service or want to enquire about several related jobs, you can start by telling us what needs doing, where and when.',
      cta: {
        label: 'Explore Our Services',
        href: '/#services',
      },
      imageSrc: '/assets/videos/cleaning-poster.jpg',
      altText: 'Laurrel Services professional cleaning service in residential Ottawa property',
    },
    whatWeDo: {
      eyebrow: 'WHAT WE DO',
      headline: 'Cleaning, moving and storage. Each with its own details.',
      intro:
        'The right arrangement depends on the work involved. A cleaning job starts with the property. A move involves belongings, access and timing. Storage depends on what needs to be kept and for how long.',
      services: [
        {
          title: 'Cleaning',
          description:
            'A property being cleaned for new occupants can require a different scope from one that is in regular use. The size of the space, its condition and the areas needing attention help determine what’s involved.',
        },
        {
          title: 'Moving',
          description:
            'Moving plans depend on the belongings being transported, the addresses involved and access at both properties. Stairs, elevators, parking restrictions and larger furniture are all worth identifying in advance.',
        },
        {
          title: 'Storage',
          description:
            'Storage starts with a few practical questions: what needs to be kept, how much space it requires, how long it will stay and whether access will be needed during that time.',
        },
      ],
    },
    whyLaurrel: {
      eyebrow: 'WHY LAURREL SERVICES',
      headline: 'The details are worth getting right.',
      intro:
        'Before booking a cleaning, moving or storage service, it’s worth understanding what the job involves. These are some of the details that matter when planning a request.',
      points: [
        {
          number: '01',
          title: 'The scope of the work',
          description:
            'A useful enquiry starts with the actual requirements. For cleaning, that includes the rooms and areas involved. For moving, it includes an outline of the belongings and the access conditions. For storage, it includes the items, expected duration and access needs.',
        },
        {
          number: '02',
          title: 'The timing',
          description:
            'Moving dates, property handovers and renovation schedules don’t always leave much room for changes. Share your preferred date and any important deadlines so availability and arrangements can be discussed.',
        },
        {
          number: '03',
          title: 'The services you need',
          description:
            'You may need cleaning on its own, assistance with a move or somewhere to keep belongings temporarily. If several services are connected to the same job, explain the full situation in your enquiry.',
        },
      ],
      imageSrc: '/assets/hero/laurrel-room.png',
      altText: 'Orderly architectural living room interior in Ottawa representing Laurrel standards',
    },
    photographicStory: {
      eyebrow: 'WHEN PLANS OVERLAP',
      headline: 'The move is Friday. The keys aren’t ready until Monday.',
      bodyParagraphs: [
        'A gap between moving out and moving in can affect several arrangements at once. There may be belongings to transport, items to store temporarily and a property to clean before it’s handed over.',
        'When making your enquiry, tell us about the full timeline and the services you need. That gives Laurrel the information required to discuss what’s available for your situation.',
      ],
      ctaLabel: 'Discuss Your Requirements',
      imageSrc: '/assets/videos/storage-poster.jpg',
      altText: 'Laurrel Services storage facility and moving organization in Ottawa',
    },
    faq: {
      eyebrow: 'FREQUENTLY ASKED QUESTIONS',
      headline: 'A few things to know before you enquire.',
      imageSrc: '/assets/videos/moving-poster.jpg',
      altText: 'Laurrel Services moving specialist with packaged boxes',
      items: [
        {
          question: 'Can I request more than one service?',
          answer:
            'You can describe multiple service requirements in the same enquiry. For example, if you’re moving and also need cleaning or storage, include those details so the request can be reviewed as a whole. Availability and arrangements will need to be confirmed.',
        },
        {
          question: 'What should I include when requesting cleaning?',
          answer:
            'Share the type of property, approximate size, areas needing attention, current condition and preferred date. Mention any particular cleaning requirements so the scope can be discussed.',
        },
        {
          question: 'What information is useful for a moving quote?',
          answer:
            'Provide your collection and destination locations, preferred moving date, an approximate inventory and details about stairs, elevators, parking restrictions or larger items that may need special handling.',
        },
        {
          question: 'What should I know before requesting storage?',
          answer:
            'Start with the items you need to store, approximate volume, preferred duration and any access requirements. The available storage arrangements and their terms should be confirmed before booking.',
        },
        {
          question: 'Can I enquire from outside central Ottawa?',
          answer:
            'Include your location or postal code in your request. Service coverage and availability can then be confirmed for the address.',
        },
      ],
    },
    finalCta: {
      headline: 'Tell us what you’ve got planned.',
      body:
        'A property to clean, a move to arrange or belongings that need storage. Share the details and your preferred date, and we’ll discuss the next steps.',
      ctaLabel: 'Request a Quote',
    },
    meta: {
      title: 'About Laurrel Services | Cleaning, Moving & Storage in Ottawa',
      description:
        'Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Find out what we do and how to enquire about a service.',
    },
  },
};
