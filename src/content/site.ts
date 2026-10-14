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
  hero: {
    title: string;
    breadcrumb: { label: string; href: string }[];
    imageSrc: string;
    altText: string;
  };
  intro: {
    label: string;
    headline: string;
    paragraphs: string[];
    imageSrc: string;
    altText: string;
  };
  work: {
    label: string;
    headline: string;
    intro: string;
    services: AboutServiceItem[];
  };
  start: {
    label: string;
    headline: string;
    paragraph: string;
    closingLine: string;
  };
  location: {
    label: string;
    headline: string;
    body: string;
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
    hero: {
      title: 'About Laurrel Services',
      breadcrumb: [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
      ],
      imageSrc: '/assets/videos/moving-poster.jpg',
      altText: 'Laurrel Services moving specialist in Ottawa',
    },
    intro: {
      label: 'OUR COMPANY',
      headline: 'The work around a property rarely happens in isolation.',
      paragraphs: [
        'Moving to a new address can mean arranging several things at once: getting belongings out of one property, preparing that space for its next occupant and finding somewhere for items that cannot move into the new place immediately.',
        "But not every job begins with a move. A property may need cleaning while it's occupied or empty. A renovation may require furniture to be stored temporarily. A business may need help relocating equipment or belongings.",
        'Laurrel Services focuses on three areas: cleaning, moving and storage. Based in the Ottawa service market, the company provides a starting point for customers who need one of these services or who want to discuss how more than one might fit into their plans.',
      ],
      imageSrc: '/assets/hero/laurrel-room.png',
      altText: 'Clean and orderly interior space representing Laurrel Services standards',
    },
    work: {
      label: 'OUR WORK',
      headline: 'Three services. Different requirements.',
      intro:
        'The details needed to plan a cleaning job are not the same as those needed for a move or a storage arrangement. Understanding those differences is an important part of preparing a useful service request.',
      services: [
        {
          title: 'Cleaning',
          description:
            'A cleaning request begins with the property itself. Its size, condition, occupancy and the specific areas requiring attention help establish the work involved. A home being prepared for new occupants may have different requirements from a property in regular use.',
          imageSrc: '/assets/videos/cleaning-poster.jpg',
          altText: 'Laurrel Services cleaning professional inspecting residential property in Ottawa',
        },
        {
          title: 'Moving',
          description:
            'For a move, the inventory and the route are only part of the picture. Collection and delivery addresses, stairs, elevators, parking restrictions, larger furniture and scheduling can all influence how the work needs to be organised.',
          imageSrc: '/assets/videos/moving-poster.jpg',
          altText: 'Laurrel Services moving specialist organizing boxed belongings',
        },
        {
          title: 'Storage',
          description:
            'Storage requirements depend on what needs to be kept, how much space those belongings require, the expected duration and whether access will be needed during that period. The available arrangements should be explained before the customer commits.',
          imageSrc: '/assets/videos/storage-poster.jpg',
          altText: 'Laurrel Services storage facility organization in Ottawa',
        },
      ],
    },
    start: {
      label: 'GETTING STARTED',
      headline: 'Start with the details of the job.',
      paragraph:
        'Tell us which service you need, where the work will take place and when you hope to arrange it. For cleaning, include information about the property and areas requiring attention. For moving, provide the collection and destination locations and an outline of your belongings. For storage, describe the items and how long you expect to need space.',
      closingLine:
        'If your request involves more than one service, include those details in the same enquiry so the requirements can be considered together.',
    },
    location: {
      label: 'WHERE WE WORK',
      headline: 'Our services in Ottawa.',
      body:
        'Laurrel Services serves customers in Ottawa, Ontario. When requesting a service, include the property address or general location so availability and arrangements can be confirmed.',
    },
    finalCta: {
      headline: 'Tell us what you need.',
      body: 'Cleaning, moving or storage — share the details of your request and the date you have in mind.',
      ctaLabel: 'Request a Quote',
    },
    meta: {
      title: 'About Laurrel Services | Cleaning, Moving & Storage in Ottawa',
      description:
        'Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Find out what we do and how to enquire about a service.',
    },
  },
};
