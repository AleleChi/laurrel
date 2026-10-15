import { siteConfig } from '@/content/site';
import { getServicesPageData, getAboutPageData } from '@/sanity/client';

export interface VerifiedServiceInfo {
  name: string;
  category: 'cleaning' | 'moving' | 'storage';
  summary: string;
  details: string[];
  serviceArea: string;
}

export interface AssistantKnowledge {
  companyName: string;
  tagline: string;
  serviceRegion: string;
  confirmedAreas: string[];
  services: VerifiedServiceInfo[];
  faqs: Array<{ question: string; answer: string }>;
  corePolicies: {
    pricing: string;
    booking: string;
    storageModel: string;
    contactProcedure: string;
    humanHandoff: string;
  };
}

export async function getAssistantKnowledge(): Promise<AssistantKnowledge> {
  // Fetch from Sanity with graceful fallback to centralized siteConfig
  let servicesData = siteConfig.servicesPage;
  let aboutData = siteConfig.aboutPage;

  try {
    const [sanityServices, sanityAbout] = await Promise.all([
      getServicesPageData(),
      getAboutPageData(),
    ]);
    if (sanityServices?.data) servicesData = sanityServices.data;
    if (sanityAbout?.data) aboutData = sanityAbout.data;
  } catch (err) {
    // Fallback cleanly to siteConfig
  }

  const services: VerifiedServiceInfo[] = [
    {
      name: 'Cleaning Services in Ottawa',
      category: 'cleaning',
      summary:
        'Tailored residential and workplace cleaning for move-ins, move-outs, property handovers, and routine maintenance across Ottawa.',
      details: [
        'Property preparation for move-out handovers, move-ins, and tenancy transitions.',
        'Attention tailored to the space: number of rooms, current condition, and critical handover dates.',
        'Workplace and office cleaning requirements accommodated upon request.',
        'Focused on real property specifications rather than rigid generic packages.',
      ],
      serviceArea: 'Ottawa and the National Capital Region',
    },
    {
      name: 'Moving Services in Ottawa',
      category: 'moving',
      summary:
        'Local residential and commercial moving coordination in Ottawa, handling belongings with care and practical logistics.',
      details: [
        'Local moves within Ottawa and the surrounding National Capital Region.',
        'Careful coordination of access factors: elevator bookings, stairwells, loading zones, and parking.',
        'Belongings assessed realistically by size and quantity to plan suitable vehicle and crew capacity.',
        'Integrated with handover cleaning and transitional storage when timelines require.',
      ],
      serviceArea: 'Ottawa and the National Capital Region',
    },
    {
      name: 'Storage Services in Ottawa',
      category: 'storage',
      summary:
        'Transitional storage arrangements for gaps between moving out and moving in, or during home renovations in Ottawa.',
      details: [
        'Ideal when moving dates do not line up: belongings stay safe between address handovers.',
        'Flexible duration based on real transition timelines.',
        'Coordinated seamlessly with Laurrel moving and cleaning teams under a unified enquiry.',
        'Arranged through vetted storage partnerships in the Ottawa area.',
      ],
      serviceArea: 'Ottawa and the National Capital Region',
    },
  ];

  const faqs = [
    ...(servicesData.faq?.items || []),
    ...(aboutData.faq?.items || []),
    {
      question: 'Can I combine cleaning, moving, and storage in a single request?',
      answer:
        'Yes. Laurrel Services specializes in overlapping plans. You can select any combination of cleaning, moving, and storage on the quote form or right here in the assistant.',
    },
    {
      question: 'How do quotes and pricing work?',
      answer:
        'Laurrel Services does not publish arbitrary flat rates because every property and move is different. We review your location, size, dates, and requirements, and provide a clear, transparent quote before any commitment.',
    },
    {
      question: 'What areas do you serve?',
      answer:
        'Laurrel Services operates throughout Ottawa, Ontario and the broader National Capital Region. Inquiries outside this region must be reviewed on a case-by-case basis.',
    },
    {
      question: 'How do I speak with a team member?',
      answer:
        'You can request a team follow-up at any time by selecting "Contact the team" or providing your contact details. A Laurrel representative will review your request and get in touch by email or phone.',
    },
  ];

  return {
    companyName: siteConfig.companyName || 'Laurrel Services',
    tagline: 'Cleaning, Moving & Storage in Ottawa',
    serviceRegion: 'Ottawa, Ontario and the National Capital Region',
    confirmedAreas: ['Ottawa', 'National Capital Region', 'Centretown', 'Kanata', 'Orléans', 'Barrhaven', 'Nepean'],
    services,
    faqs,
    corePolicies: {
      pricing:
        'Pricing is custom and calculated from verified job scope (property size, distance, dates, specific requirements). Never quote specific dollar amounts or guess rates.',
      booking:
        'Bookings are confirmed after the team reviews the enquiry and agrees upon schedule details with the customer. Never confirm an instant booking autonomously.',
      storageModel:
        'Storage is coordinated transitional holding between moves and renovations in the Ottawa region, arranged safely with vetted local facilities.',
      contactProcedure:
        'Online enquiries are received and reviewed by the Laurrel team. Customers receive follow-ups via email or phone.',
      humanHandoff:
        'Customers can request human contact at any point. Explain honestly that a team member will review their enquiry and reach out directly.',
    },
  };
}

export function buildSystemPrompt(knowledge: AssistantKnowledge): string {
  const serviceSummaries = knowledge.services
    .map(
      (s) =>
        `- **${s.name}** (${s.category}): ${s.summary}\n  Details: ${s.details.join(' ')}`
    )
    .join('\n');

  const faqText = knowledge.faqs
    .slice(0, 8)
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n');

  return `You are Laurrel Assistant, an automated customer service assistant for LAURREL SERVICES in Ottawa, Ontario.

CORE IDENTITY & TRANSPARENCY:
- You are an automated assistant. Never pretend to be a human, staff member, or live chat representative.
- Write in concise, professional, calm Canadian English (e.g. colour, organise, neighbourhood).
- Maintain premium restraint: be helpful, clear, and direct. Avoid excessive exclamation marks, robotic clichés, or marketing hype.

FACTUAL INTEGRITY RULES (STRICT COMPLIANCE REQUIRED):
1. Geographic region: ONLY Ottawa, Ontario and the National Capital Region. If a customer asks about other cities (e.g. Toronto, Montreal, Vancouver), explain that Laurrel currently focuses on the Ottawa region and they can submit an enquiry for case-by-case review.
2. Pricing: NEVER INVENT PRICES, rates, hourly charges, or dollar amounts. If asked about cost, explain that Laurrel provides transparent, tailored quotes based on the property size, dates, and requirements, and offer to prepare a quote.
3. Availability & Bookings: NEVER GUARANTEE DATES or claim instant booking confirmation. Explain that dates are confirmed once the team reviews the enquiry.
4. Storage: Storage is transitional holding between moves or during renovations in Ottawa. Do not claim Laurrel owns physical multi-acre warehousing facilities.
5. Licences & Guarantees: Never invent unverified insurance numbers, bond certificates, or guarantees not listed in approved knowledge.

APPROVED SERVICES:
${serviceSummaries}

FREQUENTLY ASKED QUESTIONS:
${faqText}

GUIDED ENQUIRY WORKFLOW:
When a visitor expresses interest in hiring Laurrel or getting a quote:
1. Identify the service(s) needed: Cleaning, Moving, and/or Storage.
2. Ask for the location in Ottawa (neighbourhood or postal code).
3. Ask for the preferred date or timeframe.
4. Ask for key details (size of home, bedrooms, special items, elevator/stairs).
5. Ask for their Name and Email address so the Laurrel team can deliver the quote.
6. When all required information is gathered, present a concise summary and invite them to confirm submission.

HUMAN HANDOFF:
If a customer asks to speak with a human or has complex questions outside approved knowledge, offer a human handoff. Ask for their email and note, and explain that a team member will review their request and respond directly.`;
}
