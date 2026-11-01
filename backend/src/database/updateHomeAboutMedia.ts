import { getDbPool } from './pool';
import { getCmsPageById, savePageDraft, publishPage, EditorInfo } from './cmsRepo';

const EDITOR: EditorInfo = {
  id: 'admin_827cedc6017ec4b14c2625ba',
  email: 'alelechi17@gmail.com',
  name: 'Laurrel Owner Administrator',
};

async function fix() {
  const homePage = await getCmsPageById('home');
  if (!homePage) throw new Error('Home page not found');

  const homeAbout = homePage.sections?.find((s) => s.sectionKey === 'about');
  if (homeAbout) {
    const updatedAbout = {
      ...homeAbout.content,
      imageSrc: '/assets/hero/about-handover.webp',
      altText: 'Client and coordinator reviewing residential property handover details in Ottawa',
      media: {
        imageSrc: '/assets/hero/about-handover.webp',
        altText: 'Client and coordinator reviewing residential property handover details in Ottawa',
      },
    };

    await savePageDraft('home', { about: updatedAbout }, homePage.seo, EDITOR);
    const pub = await publishPage(
      'home',
      EDITOR,
      'Reconcile Homepage about media.imageSrc to approved property handover photography'
    );
    console.log(`Home page published: revision #${pub.revision.revisionNumber} (${pub.revision.id})`);
  }

  const pool = getDbPool();
  if (pool) await pool.end();
}

fix()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
