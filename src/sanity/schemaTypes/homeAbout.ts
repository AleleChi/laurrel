export const homeAboutSchema = {
  name: 'homeAbout',
  title: 'Homepage About Section',
  type: 'document',
  fields: [
    {
      name: 'eyebrow',
      title: 'Eyebrow Label',
      type: 'string',
      description: 'Plain uppercase text at top-left (e.g. ABOUT LAURREL SERVICES)',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'headline',
      title: 'Main Headline (H2)',
      type: 'string',
      description: 'Large editorial headline spanning the section',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'introParagraph',
      title: 'Introductory Paragraph',
      type: 'text',
      description: 'Left column introductory paragraph describing the company in Ottawa',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'stat',
      title: 'Typographic Stat',
      type: 'object',
      fields: [
        {
          name: 'number',
          title: 'Oversized Number',
          type: 'string',
          description: 'Static typographic number representing core services (e.g. 03)',
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description: 'Plain uppercase caption below the number (e.g. CORE SERVICES)',
          validation: (Rule: any) => Rule.required(),
        },
      ],
    },
    {
      name: 'mainImage',
      title: 'Centre Service Photograph',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          description: 'Descriptive alt text for screen readers and SEO',
        },
      ],
    },
    {
      name: 'rightHeading',
      title: 'Right Column Heading',
      type: 'string',
      description: 'Substantial heading introducing services (e.g. Cleaning. Moving. Storage.)',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'services',
      title: 'Service Descriptions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Service Title', type: 'string' },
            { name: 'description', title: 'Editorial Description', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'cta',
      title: 'About Call to Action',
      type: 'object',
      fields: [
        { name: 'label', title: 'CTA Label', type: 'string' },
        { name: 'href', title: 'CTA Destination', type: 'string' },
      ],
    },
  ],
};
