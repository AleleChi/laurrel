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
    statNumber: string;
    statLabel: string;
    services: {
      title: string;
      description: string;
      href: string;
    }[];
  };
  whyLaurrel: {
    eyebrow: string;
    headline: string;
    intro: string;
    items: {
      title: string;
      description: string;
    }[];
    imageSrc: string;
    altText: string;
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
      headline: 'More than one job often comes with the move.',
      paragraph1:
        "There's the furniture to transport, the property to clean before the keys go back, and sometimes a few days when everything needs somewhere to stay. Each job has its own timing and requirements.",
      paragraph2:
        'Laurrel Services offers cleaning, moving and storage in Ottawa. You can request one service on its own or tell us about several related jobs. We start with the details of what you need, where and when.',
      cta: {
        label: 'Explore Our Services',
        href: '/#services',
      },
      imageSrc: '/assets/videos/cleaning-poster.jpg',
      altText: 'Laurrel Services professional cleaning service in progress in an Ottawa residence',
    },
    whatWeDo: {
      eyebrow: 'WHAT WE DO',
      headline: "For the spaces you use. And the ones you're moving between.",
      intro:
        "Not every customer needs all three services. Some need a property cleaned. Others are planning a move or making room for belongings they aren't ready to part with.",
      statNumber: '03',
      statLabel: 'CORE SERVICE AREAS',
      services: [
        {
          title: 'Cleaning',
          description:
            "Cleaning for residential and business spaces, with the scope discussed according to the property's size, condition and areas requiring attention.",
          href: '/#cleaning',
        },
        {
          title: 'Moving',
          description:
            'Moving arrangements based on the belongings, collection and delivery locations, access conditions and preferred schedule.',
          href: '/#moving',
        },
        {
          title: 'Storage',
          description:
            'Storage enquiries considered according to the items involved, space requirements, duration and access needs.',
          href: '/#storage',
        },
      ],
    },
    whyLaurrel: {
      eyebrow: 'WHY LAURREL',
      headline: 'A practical way to plan what needs doing.',
      intro:
        "Cleaning, moving and storage each require different arrangements. Knowing what's involved helps you make better decisions before confirming a service.",
      items: [
        {
          title: 'One enquiry for related jobs',
          description:
            'If you’re moving and also need cleaning or storage, you can explain everything in the same request rather than describing each job separately.',
        },
        {
          title: 'Details considered from the start',
          description:
            'Property size, access, belongings, dates and other requirements all matter when reviewing the scope of a job.',
        },
        {
          title: 'Room for individual needs',
          description:
            'You don’t have to be moving to request cleaning or storage. Each of Laurrel’s services can be discussed independently.',
        },
        {
          title: 'Clear next steps',
          description:
            'Once the requirements are understood, the available arrangements and quotation can be discussed before you decide how to proceed.',
        },
      ],
      imageSrc: '/assets/hero/laurrel-room.png',
      altText: 'Prepared residential space in Ottawa arranged by Laurrel Services',
    },
    faq: {
      eyebrow: 'FREQUENTLY ASKED QUESTIONS',
      headline: "Before you book, here's what to know.",
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
};
