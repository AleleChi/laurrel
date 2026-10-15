import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from '../src/sanity/schemaTypes';

// Use environment variables or fallback to verified project ID
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '5nupsg0g';
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export default defineConfig({
  name: 'laurrel-services',
  title: 'Laurrel Services Studio',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
