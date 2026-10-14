export const aboutPageSchema = {
  name: 'aboutPage',
  title: 'Dedicated About Page',
  type: 'document',
  fields: [
    {
      name: 'hero',
      title: 'Hero Banner',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Page Title (H1)',
          type: 'string',
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'breadcrumbLabel',
          title: 'Breadcrumb Label',
          type: 'string',
        },
        {
          name: 'image',
          title: 'Banner Image',
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            },
          ],
        },
      ],
    },
    {
      name: 'intro',
      title: 'Section: Our Company',
      type: 'object',
      fields: [
        { name: 'label', title: 'Eyebrow Label', type: 'string' },
        { name: 'headline', title: 'Section Headline (H2)', type: 'string' },
        {
          name: 'paragraphs',
          title: 'Editorial Paragraphs',
          type: 'array',
          of: [{ type: 'text' }],
        },
        {
          name: 'image',
          title: 'Supporting Image',
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }],
        },
      ],
    },
    {
      name: 'work',
      title: 'Section: Our Work',
      type: 'object',
      fields: [
        { name: 'label', title: 'Eyebrow Label', type: 'string' },
        { name: 'headline', title: 'Headline (H2)', type: 'string' },
        { name: 'intro', title: 'Introduction', type: 'text' },
        {
          name: 'services',
          title: 'Editorial Services',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'title', title: 'Service Name', type: 'string' },
                { name: 'description', title: 'Description', type: 'text' },
                {
                  name: 'image',
                  title: 'Service Image',
                  type: 'image',
                  options: { hotspot: true },
                  fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'start',
      title: 'Section: Getting Started',
      type: 'object',
      fields: [
        { name: 'label', title: 'Eyebrow Label', type: 'string' },
        { name: 'headline', title: 'Headline (H2)', type: 'string' },
        { name: 'paragraph', title: 'Guidance Paragraph', type: 'text' },
        { name: 'closingLine', title: 'Closing Line', type: 'string' },
      ],
    },
    {
      name: 'location',
      title: 'Section: Where We Work',
      type: 'object',
      fields: [
        { name: 'label', title: 'Eyebrow Label', type: 'string' },
        { name: 'headline', title: 'Headline (H2)', type: 'string' },
        { name: 'body', title: 'Location Body Text', type: 'text' },
      ],
    },
    {
      name: 'finalCta',
      title: 'Section: Closing CTA',
      type: 'object',
      fields: [
        { name: 'headline', title: 'CTA Headline', type: 'string' },
        { name: 'body', title: 'CTA Body', type: 'text' },
        { name: 'ctaLabel', title: 'Button Label', type: 'string' },
      ],
    },
    {
      name: 'seo',
      title: 'Search Engine Optimization',
      type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text' },
      ],
    },
  ],
};
