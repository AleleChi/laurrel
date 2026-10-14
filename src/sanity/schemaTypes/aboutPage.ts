export const aboutPageSchema = {
  name: 'aboutPage',
  title: 'Dedicated About Page',
  type: 'document',
  fields: [
    {
      name: 'banner',
      title: 'Section 01: Hero Banner',
      type: 'object',
      fields: [
        { name: 'title', title: 'Page Title (H1)', type: 'string', validation: (Rule: any) => Rule.required() },
        { name: 'breadcrumbLabel', title: 'Breadcrumb Label', type: 'string' },
        {
          name: 'image',
          title: 'Banner Image',
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }],
        },
      ],
    },
    {
      name: 'aboutCompany',
      title: 'Section 02: About Our Company',
      type: 'object',
      fields: [
        { name: 'eyebrow', title: 'Eyebrow', type: 'string' },
        { name: 'headline', title: 'Headline (H2)', type: 'string' },
        { name: 'paragraph1', title: 'Paragraph 1', type: 'text' },
        { name: 'paragraph2', title: 'Paragraph 2', type: 'text' },
        {
          name: 'emphasisPoints',
          title: 'Emphasis Statements',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'id', title: 'Identifier', type: 'string' },
                { name: 'text', title: 'Statement Text', type: 'string' },
              ],
            },
          ],
        },
        {
          name: 'cta',
          title: 'Call to Action',
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'href', title: 'Destination', type: 'string' },
          ],
        },
        {
          name: 'image',
          title: 'Company Photograph',
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }],
        },
      ],
    },
    {
      name: 'whatWeDo',
      title: 'Section 03: What We Do',
      type: 'object',
      fields: [
        { name: 'eyebrow', title: 'Eyebrow', type: 'string' },
        { name: 'headline', title: 'Headline (H2)', type: 'string' },
        { name: 'intro', title: 'Introductory Statement', type: 'text' },
        { name: 'statNumber', title: 'Large Typographic Number (e.g. 03)', type: 'string' },
        { name: 'statLabel', title: 'Typographic Label (e.g. CORE SERVICE AREAS)', type: 'string' },
        {
          name: 'services',
          title: 'Core Services',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'number', title: 'Service Number (e.g. 01)', type: 'string' },
                { name: 'title', title: 'Service Name', type: 'string' },
                { name: 'description', title: 'Description', type: 'text' },
                { name: 'href', title: 'Destination Anchor', type: 'string' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'whyLaurrel',
      title: 'Section 04: Why Laurrel Services',
      type: 'object',
      fields: [
        { name: 'eyebrow', title: 'Eyebrow', type: 'string' },
        { name: 'headline', title: 'Headline (H2)', type: 'string' },
        { name: 'intro', title: 'Introduction', type: 'text' },
        {
          name: 'items',
          title: 'Information Blocks',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'id', title: 'ID', type: 'string' },
                { name: 'title', title: 'Block Title', type: 'string' },
                { name: 'description', title: 'Description', type: 'text' },
              ],
            },
          ],
        },
        {
          name: 'image',
          title: 'Supporting Image',
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }],
        },
        {
          name: 'cutoutImage',
          title: 'Standing Cutout Subject Image',
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }],
        },
      ],
    },
    {
      name: 'marquee',
      title: 'Section 05: Dark Typography Marquee',
      type: 'object',
      fields: [
        {
          name: 'items',
          title: 'Marquee Items',
          type: 'array',
          of: [{ type: 'string' }],
        },
      ],
    },
    {
      name: 'faq',
      title: 'Section 05: Frequently Asked Questions',
      type: 'object',
      fields: [
        { name: 'eyebrow', title: 'Eyebrow', type: 'string' },
        { name: 'headline', title: 'Headline (H2)', type: 'string' },
        { name: 'intro', title: 'Introduction', type: 'text' },
        {
          name: 'image',
          title: 'Supporting FAQ Photograph',
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }],
        },
        {
          name: 'items',
          title: 'Questions and Answers',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'question', title: 'Question', type: 'string' },
                { name: 'answer', title: 'Answer', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'finalCta',
      title: 'Section 06: Final CTA',
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
