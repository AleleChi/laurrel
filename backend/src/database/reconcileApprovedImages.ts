import { getDbPool } from './pool';
import { getCmsPageById, savePageDraft, publishPage, EditorInfo } from './cmsRepo';

const EDITOR: EditorInfo = {
  id: 'admin_827cedc6017ec4b14c2625ba',
  email: 'alelechi17@gmail.com',
  name: 'Laurrel Owner Administrator',
};

async function reconcile() {
  console.log('=== STARTING CMS IMAGE RECONCILIATION WORKFLOW ===\n');

  // 1. CONTACT PAGE
  console.log('--- Reconciling Contact Page ---');
  const contactPage = await getCmsPageById('contact');
  if (!contactPage) throw new Error('Contact page not found');

  const contactBanner = contactPage.sections?.find((s) => s.sectionKey === 'banner');
  if (contactBanner) {
    const updatedBanner = {
      ...contactBanner.content,
      imageSrc: '/assets/hero/about-handover.webp',
      altText: 'Laurrel Services property handover and customer service coordination in Ottawa',
    };

    await savePageDraft('contact', { banner: updatedBanner }, contactPage.seo, EDITOR);
    const pubContact = await publishPage(
      'contact',
      EDITOR,
      'Reconcile Contact banner from stale laurrel-room to approved authentic property handover photography'
    );
    console.log(`Contact page published: revision #${pubContact.revision.revisionNumber} (${pubContact.revision.id})`);
  }

  // 2. SERVICES PAGE
  console.log('\n--- Reconciling Services Page ---');
  const servicesPage = await getCmsPageById('services');
  if (!servicesPage) throw new Error('Services page not found');

  const servicesBanner = servicesPage.sections?.find((s) => s.sectionKey === 'banner');
  const servicesList = servicesPage.sections?.find((s) => s.sectionKey === 'servicesList');

  const servicesUpdates: Record<string, any> = {};

  if (servicesBanner) {
    servicesUpdates.banner = {
      ...servicesBanner.content,
      imageSrc: '/assets/hero/cleaning-hero.webp',
      altText: 'Laurrel Services cleaning, moving and storage services in Ottawa',
    };
  }

  if (servicesList) {
    const listContent = { ...servicesList.content };
    if (Array.isArray(listContent.services)) {
      listContent.services = listContent.services.map((item: any) => {
        if (item.id === 'cleaning') {
          return {
            ...item,
            imageSrc: '/assets/hero/cleaning-hero.webp',
            imageAlt: 'Professional cleaner wearing yellow protective gloves detailing bright kitchen surfaces in an Ottawa home',
          };
        }
        if (item.id === 'moving') {
          return {
            ...item,
            imageSrc: '/assets/hero/moving-hero.webp',
            imageAlt: 'Professional moving specialists in uniform carrying moving boxes in an Ottawa residence',
          };
        }
        if (item.id === 'storage') {
          return {
            ...item,
            imageSrc: '/assets/hero/storage-hero.webp',
            imageAlt: 'Clean, modern, and secure storage facility corridor with private locked units',
          };
        }
        return item;
      });
    }
    servicesUpdates.servicesList = listContent;
  }

  await savePageDraft('services', servicesUpdates, servicesPage.seo, EDITOR);
  const pubServices = await publishPage(
    'services',
    EDITOR,
    'Reconcile Services banner and service list to approved authentic photography'
  );
  console.log(`Services page published: revision #${pubServices.revision.revisionNumber} (${pubServices.revision.id})`);

  // 3. ABOUT PAGE
  console.log('\n--- Reconciling About Page ---');
  const aboutPage = await getCmsPageById('about');
  if (!aboutPage) throw new Error('About page not found');

  const aboutBanner = aboutPage.sections?.find((s) => s.sectionKey === 'banner');
  const aboutCompany = aboutPage.sections?.find((s) => s.sectionKey === 'aboutCompany');
  const whyLaurrel = aboutPage.sections?.find((s) => s.sectionKey === 'whyLaurrel');
  const aboutFaq = aboutPage.sections?.find((s) => s.sectionKey === 'faq');

  const aboutUpdates: Record<string, any> = {};

  if (aboutBanner) {
    aboutUpdates.banner = {
      ...aboutBanner.content,
      imageSrc: '/assets/hero/about-handover.webp',
      altText: 'Laurrel Services residential handover and consultation in Ottawa',
    };
  }

  if (aboutCompany) {
    aboutUpdates.aboutCompany = {
      ...aboutCompany.content,
      imageSrc: '/assets/about/about-company-work.webp',
      altText: 'Laurrel Services professional moving specialists carefully handling and positioning items in an Ottawa residence',
    };
  }

  if (whyLaurrel) {
    aboutUpdates.whyLaurrel = {
      ...whyLaurrel.content,
      imageSrc: '/assets/about/about-how-we-work.webp',
      altText: 'Professional team carefully preparing, packing, and organizing household belongings in a bright Ottawa residence',
      cutoutImageSrc: '/assets/about/about-how-we-work.webp',
      cutoutAltText: 'Professional team carefully preparing, packing, and organizing household belongings in a bright Ottawa residence',
    };
  }

  if (aboutFaq) {
    aboutUpdates.faq = {
      ...aboutFaq.content,
      imageSrc: '/assets/hero/about-handover.webp',
      altText: 'Ottawa customer discussing service arrangements with Laurrel Services',
    };
  }

  await savePageDraft('about', aboutUpdates, aboutPage.seo, EDITOR);
  const pubAbout = await publishPage(
    'about',
    EDITOR,
    'Reconcile About page imagery to approved authentic photography'
  );
  console.log(`About page published: revision #${pubAbout.revision.revisionNumber} (${pubAbout.revision.id})`);

  // 4. HOME PAGE
  console.log('\n--- Reconciling Home Page ---');
  const homePage = await getCmsPageById('home');
  if (!homePage) throw new Error('Home page not found');

  const homeHero = homePage.sections?.find((s) => s.sectionKey === 'hero');
  const homeAbout = homePage.sections?.find((s) => s.sectionKey === 'about');
  const homeOverlapping = homePage.sections?.find((s) => s.sectionKey === 'overlappingPlans');

  const homeUpdates: Record<string, any> = {};

  if (homeHero) {
    const heroContent = { ...homeHero.content };
    heroContent.media = {
      ...heroContent.media,
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
          altText: 'Professional moving specialists in uniform carrying moving boxes in an Ottawa residence',
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
          altText: 'Clean, modern, and secure storage facility corridor with private locked units',
          badge: 'Interim & Flexible',
        },
      ],
    };
    homeUpdates.hero = heroContent;
  }

  if (homeAbout) {
    homeUpdates.about = {
      ...homeAbout.content,
      imageSrc: '/assets/hero/about-handover.webp',
      altText: 'Client and coordinator reviewing residential property handover details in Ottawa',
    };
  }

  if (homeOverlapping) {
    const overlappingContent = { ...homeOverlapping.content };
    if (Array.isArray(overlappingContent.situations)) {
      overlappingContent.situations = overlappingContent.situations.map((sit: any) => {
        if (sit.id === 'handback-keys') {
          return {
            ...sit,
            imageSrc: '/assets/hero/cleaning-hero.webp',
            imageAlt: 'Cleaner detailing residential surfaces in an apartment ready for lease handover',
          };
        }
        if (sit.id === 'moving-dates-gap') {
          return {
            ...sit,
            imageSrc: '/assets/hero/storage-hero.webp',
            imageAlt: 'Clean, modern storage holding unit with private locked units',
          };
        }
        if (sit.id === 'property-renovation') {
          return {
            ...sit,
            imageSrc: '/assets/hero/moving-hero.webp',
            imageAlt: 'Professional movers carefully handling moving boxes in an Ottawa residence',
          };
        }
        return sit;
      });
    }
    homeUpdates.overlappingPlans = overlappingContent;
  }

  await savePageDraft('home', homeUpdates, homePage.seo, EDITOR);
  const pubHome = await publishPage(
    'home',
    EDITOR,
    'Reconcile Homepage hero media, about teaser, and overlapping plans to approved authentic photography'
  );
  console.log(`Home page published: revision #${pubHome.revision.revisionNumber} (${pubHome.revision.id})`);

  console.log('\n=== CMS IMAGE RECONCILIATION COMPLETE ===');
  const pool = getDbPool();
  if (pool) await pool.end();
}

reconcile()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Reconciliation failed:', err);
    process.exit(1);
  });
