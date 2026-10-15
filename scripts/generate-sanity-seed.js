/**
 * Generate Sanity NDJSON seed dataset from approved siteConfig content
 */
const fs = require('fs');
const path = require('path');

// Dynamically read compiled siteConfig or parse site.ts
const ts = require('typescript');
const siteTsPath = path.resolve(__dirname, '../src/content/site.ts');
const siteTsContent = fs.readFileSync(siteTsPath, 'utf8');

// Transpile site.ts to JavaScript in-memory
const transpiled = ts.transpileModule(siteTsContent, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

// Evaluate the exported siteConfig
const evalModule = { exports: {} };
const fn = new Function('module', 'exports', 'require', transpiled.outputText);
fn(evalModule, evalModule.exports, require);
const { siteConfig } = evalModule.exports;

const documents = [
  // 1. Global Site Settings
  {
    _id: 'siteSettings',
    _type: 'siteSettings',
    companyName: siteConfig.companyName,
    tagline: siteConfig.tagline,
    location: siteConfig.location,
    businessInfo: {
      phone: siteConfig.contactPage.businessPhone || '613-555-0199',
      email: siteConfig.contactPage.businessEmail || 'info@laurrelservices.ca',
      serviceArea: 'Ottawa & the National Capital Region (NCR)',
      officeAddress: siteConfig.contactPage.officeAddress || '',
    },
    footer: {
      aboutSummary:
        'Laurrel Services coordinates residential and commercial cleaning, careful moving, and secure storage arrangements across Ottawa and the surrounding National Capital Region.',
      serviceRegionLabel: 'Ottawa & NCR',
      coordinationLabel: '1 Point of Contact',
      estimatesLabel: 'Online Request',
      copyrightNotice: '© 2026 Laurrel Services. All rights reserved. Ottawa, Ontario, Canada.',
    },
    seo: {
      defaultMetaTitle: siteConfig.meta.title,
      defaultMetaDescription: siteConfig.meta.description,
    },
    navigation: siteConfig.navigation.links.map((link) => ({
      _key: 'nav_' + link.label.toLowerCase(),
      label: link.label,
      href: link.href,
    })),
  },

  // 2. Homepage Hero & Videos
  {
    _id: 'homeHero',
    _type: 'homeHero',
    eyebrow: siteConfig.hero.eyebrow,
    headline: {
      line1: siteConfig.hero.headline.line1,
      line2: siteConfig.hero.headline.line2,
      line3: siteConfig.hero.headline.line3,
    },
    body: siteConfig.hero.body,
    primaryCta: siteConfig.hero.primaryCta,
    secondaryCta: siteConfig.hero.secondaryCta,
    supportCard: siteConfig.hero.supportCard,
    cleaningVideoUrl: '/assets/videos/clean.mp4',
    movingVideoUrl: '/assets/videos/movinng.mp4',
    storageVideoUrl: '/assets/videos/storagge.mp4',
  },

  // 3. Homepage About
  {
    _id: 'homeAbout',
    _type: 'homeAbout',
    eyebrow: siteConfig.about.eyebrow,
    headline: siteConfig.about.headline,
    introParagraph: siteConfig.about.introParagraph,
    stat: siteConfig.about.stat,
    rightHeading: siteConfig.about.rightHeading,
    services: siteConfig.about.services.map((s, idx) => ({
      _key: 'about_s_' + idx,
      title: s.title,
      description: s.description,
    })),
    cta: siteConfig.about.cta,
  },

  // 4. Homepage Services Highlight
  {
    _id: 'homeServices',
    _type: 'homeServices',
    eyebrow: siteConfig.servicesHighlight.eyebrow,
    headline: siteConfig.servicesHighlight.headline,
    cta: siteConfig.servicesHighlight.cta,
    services: siteConfig.servicesHighlight.services.map((s) => ({
      _key: 'service_' + s.id,
      id: s.id,
      title: s.title,
      description: s.description,
      anchor: s.anchor,
      illustration: s.id,
    })),
  },

  // 5. Homepage Overlapping Plans
  {
    _id: 'homeOverlappingPlans',
    _type: 'homeOverlappingPlans',
    eyebrow: siteConfig.overlappingPlans.eyebrow,
    headline: siteConfig.overlappingPlans.headline,
    intro: siteConfig.overlappingPlans.intro,
    situations: siteConfig.overlappingPlans.situations.map((sit) => ({
      _key: 'sit_' + sit.id,
      id: sit.id,
      title: sit.title,
      description: sit.description,
      relatedServicesText: sit.relatedServicesText,
      preselectedServices: sit.preselectedServices,
      details: sit.details,
    })),
  },

  // 6. Dedicated About Page
  {
    _id: 'aboutPage',
    _type: 'aboutPage',
    banner: {
      title: siteConfig.aboutPage.banner.title,
      breadcrumbLabel: 'About Us',
    },
    aboutCompany: {
      eyebrow: siteConfig.aboutPage.aboutCompany.eyebrow,
      headline: siteConfig.aboutPage.aboutCompany.headline,
      paragraph1: siteConfig.aboutPage.aboutCompany.paragraph1,
      paragraph2: siteConfig.aboutPage.aboutCompany.paragraph2,
      emphasisPoints: (siteConfig.aboutPage.aboutCompany.emphasisPoints || []).map((pt) => ({
        _key: pt.id,
        id: pt.id,
        text: pt.text,
      })),
      cta: siteConfig.aboutPage.aboutCompany.cta,
    },
    whatWeDo: {
      eyebrow: siteConfig.aboutPage.whatWeDo.eyebrow,
      headline: siteConfig.aboutPage.whatWeDo.headline,
      intro: siteConfig.aboutPage.whatWeDo.intro,
      columns: siteConfig.aboutPage.whatWeDo.columns.map((col, idx) => ({
        _key: 'wwd_col_' + idx,
        category: col.category,
        displayWord: col.displayWord,
        description: col.description,
        href: col.href,
      })),
    },
    whyLaurrel: {
      eyebrow: siteConfig.aboutPage.whyLaurrel.eyebrow,
      headline: siteConfig.aboutPage.whyLaurrel.headline,
      intro: siteConfig.aboutPage.whyLaurrel.intro,
      items: siteConfig.aboutPage.whyLaurrel.items.map((item, idx) => ({
        _key: 'why_item_' + idx,
        title: item.title,
        description: item.description,
      })),
    },
    faq: {
      eyebrow: siteConfig.aboutPage.faq.eyebrow,
      headline: siteConfig.aboutPage.faq.headline,
      intro: siteConfig.aboutPage.faq.intro,
      items: siteConfig.aboutPage.faq.items.map((item, idx) => ({
        _key: 'faq_item_' + idx,
        question: item.question,
        answer: item.answer,
      })),
    },
    finalCta: siteConfig.aboutPage.finalCta,
    seo: {
      metaTitle: siteConfig.aboutPage.meta.title,
      metaDescription: siteConfig.aboutPage.meta.description,
    },
  },

  // 7. Dedicated Services Page
  {
    _id: 'servicesPage',
    _type: 'servicesPage',
    banner: {
      title: siteConfig.servicesPage.banner.title,
      breadcrumbLabel: 'Services',
    },
    articleIntro: siteConfig.servicesPage.articleIntro,
    services: siteConfig.servicesPage.services.map((s) => ({
      _key: 'svc_page_' + s.id,
      id: s.id,
      anchor: s.anchor,
      badge: s.badge,
      title: s.title,
      headline: s.headline,
      paragraphs: s.paragraphs,
      planningTitle: s.planningTitle,
      planningIntro: s.planningIntro,
      usefulInfoTitle: s.usefulInfoTitle,
      usefulInfo: s.usefulInfo,
      extraNote: s.extraNote,
      ctaLabel: s.ctaLabel,
    })),
    gettingStarted: siteConfig.servicesPage.gettingStarted,
    faq: siteConfig.servicesPage.faq,
    finalCta: siteConfig.servicesPage.finalCta,
    sidebarForm: siteConfig.servicesPage.sidebarForm,
    sidebarInfoPanel: siteConfig.servicesPage.sidebarInfoPanel,
  },

  // 8. Dedicated Contact Page
  {
    _id: 'contactPage',
    _type: 'contactPage',
    banner: {
      title: siteConfig.contactPage.banner.title,
    },
    eyebrow: siteConfig.contactPage.eyebrow,
    headline: siteConfig.contactPage.headline,
    supportingParagraph: siteConfig.contactPage.supportingParagraph,
    businessEmail: siteConfig.contactPage.businessEmail || 'info@laurrelservices.ca',
    businessPhone: siteConfig.contactPage.businessPhone || '613-555-0199',
    hasPublicOffice: siteConfig.contactPage.hasPublicOffice,
    officeAddress: siteConfig.contactPage.officeAddress || '',
    googleMapsPlaceId: siteConfig.contactPage.googleMapsPlaceId || '',
    locationHeading: siteConfig.contactPage.locationHeading,
    serviceRegionDescription: siteConfig.contactPage.serviceRegionDescription,
    confirmedServiceAreas: siteConfig.contactPage.confirmedServiceAreas,
    formHeading: siteConfig.contactPage.form.heading,
    formButtonText: siteConfig.contactPage.form.buttonText,
  },
];

// Write NDJSON output
const outputPath = path.resolve(__dirname, '../studio/seed-data.ndjson');
const ndjsonContent = documents.map((doc) => JSON.stringify(doc)).join('\n') + '\n';
fs.writeFileSync(outputPath, ndjsonContent, 'utf8');

console.log(`[Sanity Seed] Successfully generated ${documents.length} documents at: ${outputPath}`);
