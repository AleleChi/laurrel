/**
 * LAURREL SERVICES — Controlled Sanity Dataset Seeder
 * Safely seeds approved content documents into Sanity without overwriting existing edits.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

async function seedSanity() {
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '5nupsg0g';
  const dataset = process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN;

  const ndjsonPath = path.resolve(__dirname, '../studio/seed-data.ndjson');
  if (!fs.existsSync(ndjsonPath)) {
    console.error(`[Seed Error]: NDJSON seed file not found at: ${ndjsonPath}`);
    console.log('Run "node scripts/generate-sanity-seed.js" first.');
    process.exit(1);
  }

  const lines = fs.readFileSync(ndjsonPath, 'utf8').trim().split('\n');
  const documents = lines.map((l) => JSON.parse(l));

  console.log('====================================================');
  console.log('LAURREL SERVICES — SANITY CONTENT SEEDING UTILITY');
  console.log(`Project ID: ${projectId}`);
  console.log(`Dataset:    ${dataset}`);
  console.log(`Documents:  ${documents.length} approved schemas`);
  console.log('====================================================');

  if (!token) {
    console.log('\n[NOTICE] No SANITY_API_WRITE_TOKEN detected.');
    console.log('You can seed documents via either of two secure methods:\n');
    console.log('Option A — Using Sanity CLI with authenticated session:');
    console.log('  cd studio');
    console.log('  npx sanity dataset import seed-data.ndjson production --missing\n');
    console.log('Option B — Using an Editor API Token:');
    console.log('  1. Obtain an Editor/Admin token from https://www.sanity.io/manage/project/5nupsg0g/api#tokens');
    console.log('  2. Run: $env:SANITY_API_WRITE_TOKEN="your_token"; node scripts/seed-sanity.js\n');
    console.log('Your website automatically displays full approved content fallbacks until documents are seeded.');
    return;
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  });

  console.log('\nChecking existing documents in Sanity dataset...');
  let createdCount = 0;
  let preservedCount = 0;

  for (const doc of documents) {
    try {
      const existing = await client.getDocument(doc._id);
      if (existing) {
        console.log(` - Preserved: [${doc._id}] (Existing document left untouched to protect editor modifications)`);
        preservedCount++;
      } else {
        await client.create(doc);
        console.log(` + Created:   [${doc._id}] (Initial approved content populated)`);
        createdCount++;
      }
    } catch (err) {
      console.error(` ! Error processing [${doc._id}]:`, err.message);
    }
  }

  console.log('\n====================================================');
  console.log(`Seeding Summary: ${createdCount} created, ${preservedCount} preserved.`);
  console.log('====================================================');
}

seedSanity().catch((err) => {
  console.error('[Seeding Fatal Error]:', err.message);
  process.exit(1);
});
