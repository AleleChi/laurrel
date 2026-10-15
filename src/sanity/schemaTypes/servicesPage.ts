export const servicesPageSchema = {
  name: 'servicesPage',
  title: 'Dedicated Services Page',
  type: 'document',
  fields: [
    {
      name: 'banner',
      title: 'Photographic Page Banner',
      type: 'object',
      fields: [
        { name: 'title', title: 'Banner Title (H1)', type: 'string', validation: (Rule: any) => Rule.required() },
        {
          name: 'image',
          title: 'Banner Background Photograph',
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alternative Text', type: 'string' }],
        },
        { name: 'breadcrumbLabel', title: 'Breadcrumb Label', type: 'string' },
      ],
    },
    {
      name: 'articleIntro',
      title: 'Main Article Introduction',
      type: 'object',
      fields: [
        { name: 'h2', title: 'Main Editorial H2', type: 'string', validation: (Rule: any) => Rule.required() },
        { name: 'paragraph1', title: 'Paragraph 1', type: 'text', validation: (Rule: any) => Rule.required() },
        { name: 'paragraph2', title: 'Paragraph 2', type: 'text', validation: (Rule: any) => Rule.required() },
      ],
    },
    {
      name: 'services',
      title: 'Detailed Service Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'id', title: 'Identifier', type: 'string' },
            { name: 'anchor', title: 'Anchor Slug', type: 'string' },
            { name: 'badge', title: 'Eyebrow Badge', type: 'string' },
            { name: 'title', title: 'Service Title', type: 'string' },
            { name: 'headline', title: 'Service Headline (H2)', type: 'string' },
            {
              name: 'image',
              title: 'Service Horizontal Photograph',
              type: 'image',
              options: { hotspot: true },
              fields: [{ name: 'alt', title: 'Alternative Text', type: 'string' }],
            },
            { name: 'paragraphs', title: 'Descriptive Paragraphs', type: 'array', of: [{ type: 'text' }] },
            { name: 'planningTitle', title: 'Planning Subsection Title', type: 'string' },
            { name: 'planningIntro', title: 'Planning Subsection Intro', type: 'text' },
            { name: 'usefulInfoTitle', title: 'Checklist Title', type: 'string' },
            { name: 'usefulInfo', title: 'Checklist Items', type: 'array', of: [{ type: 'string' }] },
            { name: 'extraNote', title: 'Extra Note / Advisory', type: 'text' },
            { name: 'ctaLabel', title: 'CTA Button Label', type: 'string' },
          ],
        },
      ],
    },
    {
      name: 'gettingStarted',
      title: 'How to Get Started',
      type: 'object',
      fields: [
        { name: 'eyebrow', title: 'Eyebrow', type: 'string' },
        { name: 'headline', title: 'Headline', type: 'string' },
        {
          name: 'steps',
          title: 'Steps',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'number', title: 'Step Number', type: 'string' },
                { name: 'title', title: 'Step Title', type: 'string' },
                { name: 'description', title: 'Step Description', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'faq',
      title: 'Frequently Asked Questions',
      type: 'object',
      fields: [
        { name: 'eyebrow', title: 'Eyebrow', type: 'string' },
        { name: 'headline', title: 'Headline', type: 'string' },
        {
          name: 'items',
          title: 'FAQ Q&A Items',
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
      title: 'Final CTA Banner',
      type: 'object',
      fields: [
        { name: 'eyebrow', title: 'Eyebrow', type: 'string' },
        { name: 'headline', title: 'Headline', type: 'string' },
        { name: 'body', title: 'Body Copy', type: 'text' },
        { name: 'ctaLabel', title: 'CTA Label', type: 'string' },
      ],
    },
  ],
};
