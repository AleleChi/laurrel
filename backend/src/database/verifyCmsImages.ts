import { getDbPool } from './pool';

async function verify() {
  const pool = getDbPool();
  if (!pool) throw new Error('No DB pool');

  const { rows } = await pool.query(`
    SELECT page_id, section_key, content
    FROM cms_sections
    WHERE page_id IN ('home', 'about', 'services', 'contact')
    ORDER BY page_id, sort_order
  `);

  console.log('=== VERIFYING CMS SECTIONS PUBLISHED IMAGES ===');
  for (const r of rows) {
    const str = JSON.stringify(r.content);
    const matches = str.match(/\/assets\/[^\s'",]+/g) || [];
    if (matches.length > 0) {
      console.log(`${r.page_id.padEnd(8)} / ${r.section_key.padEnd(16)}: ${matches.join(', ')}`);
    }
  }

  const revs = await pool.query(`
    SELECT page_id, revision_number, id, notes, is_published, created_at
    FROM cms_revisions
    ORDER BY created_at DESC
    LIMIT 6
  `);

  console.log('\n=== LATEST CMS REVISIONS ===');
  for (const r of revs.rows) {
    console.log(`${r.page_id.padEnd(8)} rev#${r.revision_number} (${r.id}): "${r.notes}"`);
  }

  await pool.end();
}

verify().catch(console.error);
