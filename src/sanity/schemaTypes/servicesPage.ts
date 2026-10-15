export const servicesPageSchema = {
  name: 'servicesPage',
  title: 'Dedicated Services Page',
  type: 'document',
  fields: [
    {
      name: 'hero',
      title: 'Hero / Banner Section',
      type: 'object',
      fields: [
        { name: 'heading', title: 'Main Heading (H1)', type: 'string', validation: (Rule: any) => Rule.required() },
        { name: 'subtitle', title: 'Editorial Subtitle', type: 'string', validation: (Rule: any) => Rule.required() },
        { name: 'intro', title: 'Introduction Text', type: 'text', validation: (Rule: any) => Rule.required() },
        {
          name: 'primaryCta',
          title: 'Primary CTA Button',
          type: 'object',
          fields: [{ name: 'label', title: 'Label', type: 'string' }],
        },
        {
          name: 'secondaryCta',
          title: 'Secondary CTA Button',
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'href', title: 'Destination Anchor', type: 'string' },
          ],
        },
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
            { name: 'headline', title: 'Service Headline', type: 'string' },
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
