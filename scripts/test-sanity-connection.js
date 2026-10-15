const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '5nupsg0g',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

async function testConnection() {
  try {
    const res = await client.fetch('*[_type in ["homeHero", "siteSettings"]]');
    console.log('--- SANITY LIVE DATASET CONNECTION TEST ---');
    console.log('Project ID: 5nupsg0g');
    console.log('Dataset:    production');
    console.log('Status:     Connected successfully to Sanity Content Lake.');
    console.log(`Documents found: ${res.length}`);
    if (res.length === 0) {
      console.log('Note: Dataset is currently empty. Next.js application will smoothly serve all approved static copy and media as fallbacks.');
    } else {
      console.log('Existing document IDs:', res.map((d) => d._id));
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

testConnection();
