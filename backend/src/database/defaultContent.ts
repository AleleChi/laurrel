/**
 * Default content dictionary for LAURREL SERVICES
 * Canonical source for CMS database bootstrap and one-time migration.
 */

export const defaultCmsPages = [
  {
    id: 'home',
    name: 'Homepage',
    slug: '/',
    template: 'homepage',
    status: 'published',
    seo: {
      title: 'Cleaning, Moving & Storage in Ottawa | Laurrel Services',
      description:
        'Cleaning, moving and storage services in Ottawa. Explore Laurrel Services and request a quote for your home, property or business.',
      canonical: 'https://laurrelservices.ca/',
      ogTitle: 'Cleaning, Moving & Storage in Ottawa | Laurrel Services',
      ogDescription:
        'Cleaning, moving and storage services in Ottawa. Explore Laurrel Services and request a quote for your home, property or business.',
      ogImage: '/assets/hero/laurrel-room.png',
      noIndex: false,
    },
    sections: [
      {
        sectionKey: 'hero',
        sectionType: 'hero',
        sortOrder: 1,
        content: {
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
            altText:
              'Sunlit living room with pristine cream furniture and architectural staircase in Ottawa, Canada',
            videos: [
              {
                id: 'hero-video-cleaning',
                service: 'Cleaning',
                serviceKey: 'cleaning',
                src: '/assets/videos/clean.mp4',
                poster: '/assets/videos/cleaning-poster.jpg',
                description:
                  'Laurrel Services cleaning professional inspecting and maintaining residential space in Ottawa',
                order: 1,
                objectPosition: 'center 45%',
              },
              {
                id: 'hero-video-moving',
                service: 'Moving',
                serviceKey: 'moving',
                src: '/assets/videos/movinng.mp4',
                poster: '/assets/videos/moving-poster.jpg',
                description:
                  'Laurrel Services moving specialist carefully transporting boxed belongings',
                order: 2,
                objectPosition: 'center 45%',
              },
              {
                id: 'hero-video-storage',
                service: 'Storage',
                serviceKey: 'storage',
                src: '/assets/videos/storagge.mp4',
                poster: '/assets/videos/storage-poster.jpg',
                description:
                  'Laurrel Services storage specialist organizing modern, dependable storage facility',
                order: 3,
                objectPosition: 'center 45%',
              },
            ],
          },
        },
      },
      {
        sectionKey: 'ticker',
        sectionType: 'ticker',
        sortOrder: 2,
        content: {
          items: [
            { id: 'clean', label: 'Cleaning' },
            { id: 'move', label: 'Moving' },
            { id: 'store', label: 'Storage' },
          ],
        },
      },
      {
        sectionKey: 'about',
        sectionType: 'about_teaser',
        sortOrder: 3,
        content: {
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
            altText:
              'Laurrel Services moving specialist carrying packed belongings into a clean residential interior in Ottawa',
          },
        },
      },
      {
        sectionKey: 'servicesHighlight',
        sectionType: 'services_highlight',
        sortOrder: 4,
        content: {
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
      },
      {
        sectionKey: 'overlappingPlans',
        sectionType: 'interactive_scenarios',
        sortOrder: 5,
        content: {
          eyebrow: 'WHEN PLANS OVERLAP',
          headline: 'When one job depends on another.',
          intro:
            "A final clean may have to wait until the furniture is moved. New keys may arrive days after your move-out date. Renovations can leave you short of space.\n\nTell us what needs doing and how your dates line up.",
          situations: [
            {
              id: 'handback-keys',
              title: 'Before you hand back the keys',
              description:
                'Once the furniture is out, there may still be cleaning to finish before the final inspection. Tell us about the property, the areas needing attention and your handover date.',
              relatedServicesText: 'Cleaning and Moving',
              preselectedServices: ['cleaning', 'moving'],
              imageSrc: '/assets/videos/cleaning-poster.jpg',
              imageAlt:
                'Laurrel Services cleaning professional preparing an apartment interior in Ottawa for key handover',
              details: {
                intro:
                  'Once the furniture is moved out, a thorough clean ensures the space is inspected and handed over on schedule.',
                considerations: [
                  'Target handover inspection date',
                  'Number of rooms and deep-cleaning requirements',
                  'Moving truck departure timing and empty room access',
                ],
              },
            },
            {
              id: 'moving-dates-gap',
              title: "When moving dates don't match",
              description:
                'Moving out on Friday but getting your new keys on Monday? Tell us about your belongings and both dates so we can discuss the moving and storage arrangements available.',
              relatedServicesText: 'Moving and Storage',
              preselectedServices: ['moving', 'storage'],
              imageSrc: '/assets/videos/storage-poster.jpg',
              imageAlt:
                'Laurrel Services secure storage arrangement for belongings between move-out and move-in dates',
              details: {
                intro:
                  'A transitional gap between addresses requires a secure holding arrangement and coordinated transport.',
                considerations: [
                  'Move-out date and new possession date',
                  'Volume of boxed belongings and large furniture pieces',
                  'Access requirements during the transitional gap period',
                ],
              },
            },
            {
              id: 'property-renovation',
              title: 'While your property is being renovated',
              description:
                'Furniture may need to be moved out of the way before work begins. Once the work is finished, there may also be cleaning to arrange. Tell us which parts of the job you need.',
              relatedServicesText: 'Moving, Storage and Cleaning',
              preselectedServices: ['moving', 'storage', 'cleaning'],
              imageSrc: '/assets/hero/laurrel-room.png',
              imageAlt:
                'Laurrel Services protected Ottawa property and furnishings during home renovation',
              details: {
                intro:
                  'Renovations need clear work areas. Protect furniture with temporary storage and arrange post-work fine-dust cleaning.',
                considerations: [
                  'Scope of rooms undergoing renovation',
                  'Estimated contractor work duration',
                  'Post-renovation fine-dust cleaning and furniture reinstatement timing',
                ],
              },
            },
          ],
        },
      },
      {
        sectionKey: 'requestQuote',
        sectionType: 'quote_banner',
        sortOrder: 6,
        content: {
          eyebrow: 'GET STARTED',
          headline: 'Tell us what needs doing.',
          body:
            'Choose the service you need and tell us where the work will take place, your preferred date and any details that may affect the job.\n\nYou can request cleaning, moving or storage individually, or include several requirements in one enquiry.',
          primaryCta: {
            label: 'Request a Quote',
          },
          secondaryLink: {
            label: 'Explore Service Details',
            href: '/services',
          },
        },
      },
      {
        sectionKey: 'faq',
        sectionType: 'faq',
        sortOrder: 7,
        content: {
          eyebrow: 'GOOD TO KNOW',
          headline: 'A few answers before you get started.',
          items: [
            {
              question: 'Do I need to request all three services?',
              answer:
                'No. You can enquire about cleaning, moving or storage on its own. If you need more than one, include the requirements in the same request.',
            },
            {
              question: 'What should I have ready when requesting a quote?',
              answer:
                'A short description of the job, the location and your preferred date are a good starting point. For moving or storage, include an approximate description of the belongings involved.',
            },
            {
              question: 'What if my move-out and move-in dates are different?',
              answer:
                'Include both dates and explain what needs to happen in between. If storage is required, mention what needs storing and for how long. Availability and arrangements will need to be confirmed.',
            },
            {
              question: 'Can I request a service outside central Ottawa?',
              answer:
                'Include the service address or postal code in your enquiry. Laurrel can confirm whether the requested service is available in that location.',
            },
          ],
          moreLink: {
            label: 'More About Our Services',
            href: '/services',
          },
        },
      },
      {
        sectionKey: 'contact',
        sectionType: 'contact_teaser',
        sortOrder: 8,
        content: {
          eyebrow: 'CONTACT',
          headline: 'Have a job in mind? Get in touch.',
          paragraph:
            "Tell us what you need, where and when. If you're still working out the details, you can start with a question.",
          primaryCta: {
            label: 'Contact Us',
            href: '/contact',
          },
        },
      },
    ],
  },
  {
    id: 'about',
    name: 'About Us',
    slug: '/about',
    template: 'editorial',
    status: 'published',
    seo: {
      title: 'About Laurrel Services | Cleaning, Moving & Storage in Ottawa',
      description:
        'Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Understand our approach to planning related service requests.',
      canonical: 'https://laurrelservices.ca/about',
      ogTitle: 'About Laurrel Services | Cleaning, Moving & Storage in Ottawa',
      ogDescription:
        'Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Understand our approach to planning related service requests.',
      ogImage: '/assets/videos/moving-poster.jpg',
      noIndex: false,
    },
    sections: [
      {
        sectionKey: 'banner',
        sectionType: 'page_banner',
        sortOrder: 1,
        content: {
          title: 'About Laurrel Services',
          breadcrumb: [
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
          ],
          imageSrc: '/assets/videos/moving-poster.jpg',
          altText: 'Laurrel Services moving specialist in Ottawa',
        },
      },
      {
        sectionKey: 'aboutCompany',
        sectionType: 'company_story',
        sortOrder: 2,
        content: {
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
            href: '/services',
          },
          imageSrc: '/assets/videos/cleaning-poster.jpg',
          altText:
            'Laurrel Services professional cleaning service in progress in an Ottawa residence',
        },
      },
      {
        sectionKey: 'whatWeDo',
        sectionType: 'core_pillars',
        sortOrder: 3,
        content: {
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
              href: '/services#cleaning',
            },
            {
              category: 'MOVING',
              displayWord: 'Move.',
              description:
                'Changing addresses involves more than transporting boxes. The belongings, access at each property and preferred date all matter when planning a move.',
              href: '/services#moving',
            },
            {
              category: 'STORAGE',
              displayWord: 'Store.',
              description:
                'Between properties, renovating or making extra room? Tell us what needs storing and how long you expect to need the space.',
              href: '/services#storage',
            },
          ],
        },
      },
      {
        sectionKey: 'whyLaurrel',
        sectionType: 'brand_values',
        sortOrder: 4,
        content: {
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
      },
      {
        sectionKey: 'marquee',
        sectionType: 'text_marquee',
        sortOrder: 5,
        content: {
          items: ['CLEANING', 'MOVING', 'STORAGE'],
        },
      },
      {
        sectionKey: 'faq',
        sectionType: 'faq',
        sortOrder: 6,
        content: {
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
      },
      {
        sectionKey: 'finalCta',
        sectionType: 'final_cta',
        sortOrder: 7,
        content: {
          headline: 'Tell us what you need done.',
          body:
            'Cleaning, moving or storage in Ottawa? Share a few details about the job and your preferred date.',
          ctaLabel: 'Request a Quote',
        },
      },
    ],
  },
  {
    id: 'services',
    name: 'Services',
    slug: '/services',
    template: 'services_detail',
    status: 'published',
    seo: {
      title: 'Cleaning, Moving & Storage Services Ottawa | Laurrel Services',
      description:
        'Explore cleaning, moving and storage services in Ottawa. Learn what to include in your enquiry and request availability and a quote from Laurrel Services.',
      canonical: 'https://laurrelservices.ca/services',
      ogTitle: 'Cleaning, Moving & Storage Services Ottawa | Laurrel Services',
      ogDescription:
        'Explore cleaning, moving and storage services in Ottawa. Learn what to include in your enquiry and request availability and a quote from Laurrel Services.',
      ogImage: '/assets/hero/laurrel-room.png',
      noIndex: false,
    },
    sections: [
      {
        sectionKey: 'banner',
        sectionType: 'page_banner',
        sortOrder: 1,
        content: {
          title: 'Our Services',
          breadcrumb: [
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
          ],
          imageSrc: '/assets/hero/laurrel-room.png',
          altText: 'Laurrel Services cleaning, moving and storage services in Ottawa, Canada',
        },
      },
      {
        sectionKey: 'articleIntro',
        sectionType: 'article_intro',
        sortOrder: 2,
        content: {
          h2: 'Cleaning, moving and storage services in Ottawa',
          paragraph1:
            'Getting a property ready, moving to a new address or finding room for belongings can involve different arrangements. Laurrel Services offers cleaning, moving and storage in Ottawa, with each request considered according to the work involved.',
          paragraph2:
            "Whether you need one service or several, start by telling us what needs doing, where and when. We'll use those details to discuss the available arrangements.",
        },
      },
      {
        sectionKey: 'servicesList',
        sectionType: 'services_list',
        sortOrder: 3,
        content: {
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
              imageAlt:
                'Laurrel Services cleaning specialist preparing a residential space in Ottawa',
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
              imageAlt:
                'Laurrel Services moving specialist transporting packaged boxes in Ottawa',
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
              extraNote:
                'If you also need cleaning or storage, mention that in the same enquiry.',
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
        },
      },
      {
        sectionKey: 'gettingStarted',
        sectionType: 'getting_started',
        sortOrder: 4,
        content: {
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
      },
      {
        sectionKey: 'faq',
        sectionType: 'faq',
        sortOrder: 5,
        content: {
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
      },
      {
        sectionKey: 'finalCta',
        sectionType: 'final_cta',
        sortOrder: 6,
        content: {
          eyebrow: 'READY TO GET STARTED?',
          headline: 'Tell us what needs doing.',
          body:
            'A cleaning job, a moving date or storage between addresses. Tell us about your plans and the service you need.',
          ctaLabel: 'Request a Quote',
        },
      },
      {
        sectionKey: 'sidebarForm',
        sectionType: 'sidebar_form',
        sortOrder: 7,
        content: {
          heading: 'Tell us what you need.',
          supportingText:
            "Share a few details about the service you're planning, and we'll review your enquiry.",
          submitButtonText: 'Send Enquiry',
        },
      },
      {
        sectionKey: 'sidebarInfoPanel',
        sectionType: 'sidebar_info_panel',
        sortOrder: 8,
        content: {
          heading: 'Planning more than one service?',
          body:
            "Moving out, cleaning a property or arranging storage between addresses? Tell us which services you need and the dates you're working with.",
          ctaText: 'Request a Quote',
        },
      },
    ],
  },
  {
    id: 'contact',
    name: 'Contact',
    slug: '/contact',
    template: 'contact',
    status: 'published',
    seo: {
      title: 'Contact Us | Laurrel Services Ottawa',
      description:
        'Get in touch with Laurrel Services for cleaning, moving and storage in Ottawa. Send an enquiry or discuss your property transition plans.',
      canonical: 'https://laurrelservices.ca/contact',
      ogTitle: 'Contact Us | Laurrel Services Ottawa',
      ogDescription:
        'Get in touch with Laurrel Services for cleaning, moving and storage in Ottawa. Send an enquiry or discuss your property transition plans.',
      ogImage: '/assets/hero/laurrel-room.png',
      noIndex: false,
    },
    sections: [
      {
        sectionKey: 'banner',
        sectionType: 'page_banner',
        sortOrder: 1,
        content: {
          title: 'Contact Us',
          breadcrumb: [
            { label: 'Home', href: '/' },
            { label: 'Contact Us', href: '/contact' },
          ],
          imageSrc: '/assets/hero/laurrel-room.png',
          altText: 'Laurrel Services clean Ottawa property and customer service',
        },
      },
      {
        sectionKey: 'contactInfo',
        sectionType: 'contact_info',
        sortOrder: 2,
        content: {
          eyebrow: "LET'S TALK",
          headline: 'Tell us what you need done.',
          supportingParagraph:
            "Need cleaning, moving or storage in Ottawa? Tell us about the job, where it's needed and your preferred date. We'll review your enquiry and respond with the next steps.",
          businessEmail: '',
          businessPhone: '',
          hasPublicOffice: false,
          officeAddress: '',
          locationHeading: 'Ottawa & National Capital Region',
          serviceRegionDescription:
            'Centrally coordinating cleaning, moving, and storage arrangements across Ottawa, Ontario and the National Capital Region.',
          confirmedServiceAreas: ['Ottawa', 'National Capital Region'],
        },
      },
      {
        sectionKey: 'form',
        sectionType: 'contact_form',
        sortOrder: 3,
        content: {
          heading: 'Send us a message.',
          buttonText: 'Send Message',
        },
      },
    ],
  },
];

export const defaultSiteSettings = {
  general: {
    companyName: 'LAURREL SERVICES',
    tagline: 'Clean spaces. Smooth moves. Secure storage.',
    location: 'Ottawa, Ontario',
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
  seo_defaults: {
    title: 'Cleaning, Moving & Storage in Ottawa | Laurrel Services',
    description:
      'Cleaning, moving and storage services in Ottawa. Explore Laurrel Services and request a quote for your home, property or business.',
    locale: 'en-CA',
    siteUrl: 'https://laurrelservices.ca',
  },
};
