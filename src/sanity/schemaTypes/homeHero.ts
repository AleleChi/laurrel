export const homeHeroSchema = {
  name: 'homeHero',
  title: 'Homepage Hero & Service Videos',
  type: 'document',
  fields: [
    {
      name: 'eyebrow',
      title: 'Eyebrow Text',
      type: 'string',
      description: 'Top pill label (e.g. CLEANING · MOVING · STORAGE IN OTTAWA)',
    },
    {
      name: 'headline',
      title: 'Main Headline (H1)',
      type: 'object',
      fields: [
        { name: 'line1', title: 'Headline Line 1', type: 'string', description: 'e.g. Clean spaces.' },
        { name: 'line2', title: 'Headline Line 2 (Accent Color)', type: 'string', description: 'e.g. Smooth moves.' },
        { name: 'line3', title: 'Headline Line 3', type: 'string', description: 'e.g. Secure storage.' },
      ],
    },
    {
      name: 'body',
      title: 'Introductory Body Copy',
      type: 'text',
      description: 'Overview paragraph under the headline',
    },
    {
      name: 'primaryCta',
      title: 'Primary Button',
      type: 'object',
      fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'href', title: 'Destination Anchor or URL', type: 'string' },
      ],
    },
    {
      name: 'secondaryCta',
      title: 'Secondary Button',
      type: 'object',
      fields: [
        { name: 'label', title: 'Label', type: 'string' },
        { name: 'href', title: 'Destination Anchor or URL', type: 'string' },
      ],
    },
    {
      name: 'supportCard',
      title: 'Compact Planning Support Card',
      type: 'object',
      fields: [
        { name: 'heading', title: 'Heading', type: 'string' },
        { name: 'body', title: 'Body Text', type: 'string' },
        { name: 'actionText', title: 'Action Link Label', type: 'string' },
      ],
    },
    // Service Video 1: Cleaning
    {
      name: 'cleaningVideo',
      title: '1. Cleaning Service Video (File Upload)',
      type: 'file',
      description: 'Upload an optimized browser-compatible MP4/WebM video (recommended < 5MB).',
      options: {
        accept: 'video/mp4,video/webm',
      },
    },
    {
      name: 'cleaningVideoUrl',
      title: '1b. Cleaning Video External URL (Alternative)',
      type: 'url',
      description: 'Direct HTTPS URL to an externally hosted MP4 video asset (e.g. CDN, S3, Cloudflare).',
    },
    {
      name: 'cleaningPoster',
      title: '1c. Cleaning Video Poster Image',
      type: 'image',
      description: 'Poster frame displayed before video plays or in reduced-motion mode.',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alternative Text', type: 'string' },
      ],
    },
    // Service Video 2: Moving
    {
      name: 'movingVideo',
      title: '2. Moving Service Video (File Upload)',
      type: 'file',
      description: 'Upload an optimized browser-compatible MP4/WebM video.',
      options: {
        accept: 'video/mp4,video/webm',
      },
    },
    {
      name: 'movingVideoUrl',
      title: '2b. Moving Video External URL (Alternative)',
      type: 'url',
      description: 'Direct HTTPS URL to an externally hosted MP4 video asset.',
    },
    {
      name: 'movingPoster',
      title: '2c. Moving Video Poster Image',
      type: 'image',
      description: 'Poster frame displayed before video plays or in reduced-motion mode.',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alternative Text', type: 'string' },
      ],
    },
    // Service Video 3: Storage
    {
      name: 'storageVideo',
      title: '3. Storage Service Video (File Upload)',
      type: 'file',
      description: 'Upload an optimized browser-compatible MP4/WebM video.',
      options: {
        accept: 'video/mp4,video/webm',
      },
    },
    {
      name: 'storageVideoUrl',
      title: '3b. Storage Video External URL (Alternative)',
      type: 'url',
      description: 'Direct HTTPS URL to an externally hosted MP4 video asset.',
    },
    {
      name: 'storagePoster',
      title: '3c. Storage Video Poster Image',
      type: 'image',
      description: 'Poster frame displayed before video plays or in reduced-motion mode.',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alternative Text', type: 'string' },
      ],
    },
    // Static Fallback Image
    {
      name: 'fallbackImage',
      title: 'Hero Static Fallback Photograph',
      type: 'image',
      description: 'Emergency fallback photo if videos fail to load or are disabled.',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alternative Text', type: 'string' },
      ],
    },
  ],
};
