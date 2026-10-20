import { getDbPool } from './pool';
import { defaultCmsPages, defaultSiteSettings } from './defaultContent';

export interface MigrationReport {
  pagesProcessed: number;
  sectionsProcessed: number;
  revisionsCreated: number;
  settingsProcessed: number;
  details: string[];
}

export async function seedCmsContent(): Promise<MigrationReport> {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('DATABASE_URL not configured. Cannot seed CMS content.');
  }

  const report: MigrationReport = {
    pagesProcessed: 0,
    sectionsProcessed: 0,
    revisionsCreated: 0,
    settingsProcessed: 0,
    details: [],
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Process Pages & Sections
    for (const pageData of defaultCmsPages) {
      const existingPage = await client.query('SELECT id, current_revision_id FROM cms_pages WHERE id = $1', [
        pageData.id,
      ]);

      let pageCurrentRev = existingPage.rows[0]?.current_revision_id || null;

      if (existingPage.rows.length === 0) {
        await client.query(
          `INSERT INTO cms_pages (id, name, slug, template, status, seo, published_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())`,
          [
            pageData.id,
            pageData.name,
            pageData.slug,
            pageData.template,
            pageData.status,
            JSON.stringify(pageData.seo),
          ]
        );
        report.details.push(`Created page: ${pageData.name} (${pageData.id})`);
      } else {
        report.details.push(`Verified existing page: ${pageData.name} (${pageData.id})`);
      }
      report.pagesProcessed++;

      const sectionSnapshots: Record<string, any> = {};

      for (const sec of pageData.sections) {
        const existingSection = await client.query(
          'SELECT id, content FROM cms_sections WHERE page_id = $1 AND section_key = $2',
          [pageData.id, sec.sectionKey]
        );

        if (existingSection.rows.length === 0) {
          const sectionId = `${pageData.id}-${sec.sectionKey}`;
          await client.query(
            `INSERT INTO cms_sections (id, page_id, section_key, section_type, sort_order, content, draft_content, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NULL, NOW(), NOW())`,
            [
              sectionId,
              pageData.id,
              sec.sectionKey,
              sec.sectionType,
              sec.sortOrder,
              JSON.stringify(sec.content),
            ]
          );
          sectionSnapshots[sec.sectionKey] = sec.content;
          report.details.push(`  + Created section '${sec.sectionKey}' [order: ${sec.sortOrder}]`);
        } else {
          sectionSnapshots[sec.sectionKey] = existingSection.rows[0].content;
          report.details.push(`  * Retained existing section '${sec.sectionKey}'`);
        }
        report.sectionsProcessed++;
      }

      // Check revision history
      const existingRevisions = await client.query(
        'SELECT revision_number FROM cms_revisions WHERE page_id = $1',
        [pageData.id]
      );

      if (existingRevisions.rows.length === 0) {
        const revId = `rev_${pageData.id}_1_init`;
        const revisionData = {
          seo: pageData.seo,
          sections: sectionSnapshots,
        };

        await client.query(
          `INSERT INTO cms_revisions (
            id, page_id, revision_number, data, is_published, author_email, author_name, notes, created_at
          ) VALUES ($1, $2, 1, $3, TRUE, 'system@laurrelservices.ca', 'System Initializer', 'Initial migration of approved website content', NOW())`,
          [revId, pageData.id, JSON.stringify(revisionData)]
        );

        await client.query('UPDATE cms_pages SET current_revision_id = $1 WHERE id = $2', [
          revId,
          pageData.id,
        ]);

        report.revisionsCreated++;
        report.details.push(`  + Initialized baseline Revision #1 for page '${pageData.id}'`);
      }
    }

    // 2. Process Site Settings
    for (const [key, value] of Object.entries(defaultSiteSettings)) {
      const existingSetting = await client.query('SELECT key FROM cms_site_settings WHERE key = $1', [key]);
      if (existingSetting.rows.length === 0) {
        await client.query(
          `INSERT INTO cms_site_settings (key, value, last_editor_email, updated_at)
           VALUES ($1, $2, 'system@laurrelservices.ca', NOW())`,
          [key, JSON.stringify(value)]
        );
        report.details.push(`Created site setting: ${key}`);
      } else {
        report.details.push(`Verified site setting: ${key}`);
      }
      report.settingsProcessed++;
    }

    await client.query('COMMIT');
    return report;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Standalone execution
const isDirectCall =
  (typeof require !== 'undefined' && require.main === module) ||
  (process.argv[1] && process.argv[1].includes('seedCms'));

if (isDirectCall) {
  seedCmsContent()
    .then((rep) => {
      console.log('=== CMS MIGRATION & SEED REPORT ===');
      console.log(`Pages Processed: ${rep.pagesProcessed}`);
      console.log(`Sections Processed: ${rep.sectionsProcessed}`);
      console.log(`Revisions Created: ${rep.revisionsCreated}`);
      console.log(`Site Settings: ${rep.settingsProcessed}`);
      rep.details.forEach((d) => console.log(d));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[CMS Migration Error]:', err.message);
      process.exit(1);
    });
}
