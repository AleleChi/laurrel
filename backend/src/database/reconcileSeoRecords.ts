import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
const origLookup = dns.lookup;
dns.lookup = function (hostname: any, options: any, callback: any) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      if (options && options.all) {
        return callback(
          null,
          addresses.map((a) => ({ address: a, family: 4 }))
        );
      }
      return callback(null, addresses[0], 4);
    }
    return origLookup(hostname, options, callback);
  });
} as any;

import { getDbPool } from './pool';
import { savePageDraft, publishPage } from './cmsRepo';

const editor = {
  id: 'admin_827cedc6017ec4b14c2625ba',
  name: 'Laurrel Owner Administrator',
  email: 'alelechi17@gmail.com',
};

const pageSeoUpdates: Record<string, any> = {
  home: {
    title: 'Cleaning, Moving & Storage in Ottawa | Laurrel Services',
    description:
      'Cleaning, moving and storage services in Ottawa and the National Capital Region. Tell Laurrel Services what you need and request a quote for your home or business.',
    canonical: 'https://laurrelservices.com/',
    ogTitle: 'Cleaning, Moving & Storage in Ottawa | Laurrel Services',
    ogDescription:
      'Cleaning, moving and storage services in Ottawa and the National Capital Region. Tell Laurrel Services what you need and request a quote for your home or business.',
    ogImage: '/assets/brand/og-image.jpg',
    noIndex: false,
  },
  about: {
    title: 'About Laurrel Services | Cleaning, Moving & Storage Ottawa',
    description:
      'Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Find out how to enquire about one service or several related jobs.',
    canonical: 'https://laurrelservices.com/about',
    ogTitle: 'About Laurrel Services | Cleaning, Moving & Storage Ottawa',
    ogDescription:
      'Learn about Laurrel Services and our cleaning, moving and storage services in Ottawa. Find out how to enquire about one service or several related jobs.',
    ogImage: '/assets/brand/og-image.jpg',
    noIndex: false,
  },
  services: {
    title: 'Cleaning, Moving & Storage Services in Ottawa | Laurrel',
    description:
      "Explore Laurrel's cleaning, moving and storage services in Ottawa. Find out what details to include when requesting a service estimate or discussing your plans.",
    canonical: 'https://laurrelservices.com/services',
    ogTitle: 'Cleaning, Moving & Storage Services in Ottawa | Laurrel',
    ogDescription:
      "Explore Laurrel's cleaning, moving and storage services in Ottawa. Find out what details to include when requesting a service estimate or discussing your plans.",
    ogImage: '/assets/brand/og-image.jpg',
    noIndex: false,
  },
  contact: {
    title: 'Contact Laurrel Services | Ottawa, Ontario',
    description:
      'Contact Laurrel Services about cleaning, moving or storage in Ottawa. Call (343) 843-3032 or send an enquiry with your location and preferred date.',
    canonical: 'https://laurrelservices.com/contact',
    ogTitle: 'Contact Laurrel Services | Ottawa, Ontario',
    ogDescription:
      'Contact Laurrel Services about cleaning, moving or storage in Ottawa. Call (343) 843-3032 or send an enquiry with your location and preferred date.',
    ogImage: '/assets/brand/og-image.jpg',
    noIndex: false,
  },
};

async function reconcile() {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('Database pool unavailable');
  }

  console.log('=== STARTING SEO CMS RECONCILIATION ===\n');

  for (const [pageId, seo] of Object.entries(pageSeoUpdates)) {
    console.log(`Processing page: ${pageId}...`);

    // 1. Save draft with new SEO
    const draftRes = await savePageDraft(pageId, {}, seo, editor);
    if (!draftRes) {
      console.error(`  [ERROR] Failed to save draft for ${pageId}`);
      continue;
    }
    console.log(`  Draft saved. New SEO:`, draftRes.seo);

    // 2. Publish page transactionally
    const pubRes = await publishPage(
      pageId,
      editor,
      'SEO upgrade: authoritative canonicals, meta titles, descriptions, and 1200x630 social preview image'
    );
    console.log(
      `  [SUCCESS] Published revision #${pubRes.revision.revisionNumber} (ID: ${pubRes.revision.id})`
    );
    console.log(`  Published SEO:`, pubRes.page.seo);
  }

  console.log('\n=== CMS RECONCILIATION COMPLETE ===');
  await pool.end();
}

reconcile().catch((err) => {
  console.error('Reconciliation error:', err);
  process.exit(1);
});
