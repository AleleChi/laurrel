import { GoogleGenAI } from '@google/genai';
import {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantEnquiryDraft,
  ActionChip,
} from './types';
import { getAssistantKnowledge, buildSystemPrompt } from './knowledge';
import { ServiceCategory } from '../types/enquiry';

/**
 * Fallback rule-based grounded engine for resilient offline/local operation
 * or when GEMINI_API_KEY is not configured or temporarily unreachable.
 */
function processLocalGroundedResponse(
  userMessage: string,
  currentDraft: AssistantEnquiryDraft = { services: [] }
): AssistantChatResponse {
  const text = userMessage.toLowerCase().trim();
  const draft: AssistantEnquiryDraft = { ...currentDraft, services: [...(currentDraft.services || [])] };

  // 1. Detect service keywords and update draft
  if (text.includes('clean') && !draft.services.includes('cleaning')) {
    draft.services.push('cleaning');
  }
  if (text.includes('mov') && !draft.services.includes('moving')) {
    draft.services.push('moving');
  }
  if (text.includes('stor') && !draft.services.includes('storage')) {
    draft.services.push('storage');
  }

  // 2. Human handoff intent
  if (
    text.includes('human') ||
    text.includes('person') ||
    text.includes('agent') ||
    text.includes('representative') ||
    text.includes('speak with someone') ||
    text.includes('contact team') ||
    text.includes('call me')
  ) {
    return {
      reply:
        'I would be happy to connect you with our Ottawa team. Please provide your email address and any specific note below, and a Laurrel representative will review your request and get in touch directly.',
      isHandoff: true,
      suggestedActions: [
        { label: 'Back to services', action: 'suggest_query', payload: 'What services do you offer?' },
        { label: 'Request a quote online', action: 'start_quote' },
      ],
      draft,
    };
  }

  // 3. Pricing & Rates questions
  if (text.includes('price') || text.includes('cost') || text.includes('rate') || text.includes('how much') || text.includes('quote')) {
    return {
      reply:
        'Laurrel Services does not publish generic flat rates because every home, office, and transition in Ottawa is different. We calculate clear, transparent quotes based on the size of the property, specific requirements, and schedule. Would you like to provide a few details so we can prepare an accurate quote for you?',
      suggestedActions: [
        { label: 'Start a quote here', action: 'start_quote' },
        { label: 'Cleaning details', action: 'suggest_query', payload: 'What is included in cleaning?' },
        { label: 'Moving details', action: 'suggest_query', payload: 'How does moving coordination work?' },
      ],
      draft,
    };
  }

  // 4. Service Region questions
  if (text.includes('area') || text.includes('region') || text.includes('where') || text.includes('location') || text.includes('toronto') || text.includes('montreal')) {
    const isOutside = text.includes('toronto') || text.includes('montreal') || text.includes('vancouver');
    const reply = isOutside
      ? 'Laurrel Services currently focuses its operations within Ottawa, Ontario and the National Capital Region. For requests outside this region, please contact our team directly so we can review the feasibility of your schedule.'
      : 'We provide cleaning, moving, and storage coordination across Ottawa, Ontario and the National Capital Region (including Kanata, Nepean, Centretown, Orléans, and Barrhaven). What Ottawa neighbourhood are you located in?';

    return {
      reply,
      suggestedActions: [
        { label: 'Request a quote for Ottawa', action: 'start_quote' },
        { label: 'Contact the team', action: 'human_handoff' },
      ],
      draft,
    };
  }

  // 5. Cleaning questions
  if (text.includes('clean') && !text.includes('quote') && !text.includes('book')) {
    return {
      reply:
        'Our cleaning services in Ottawa focus on practical space preparation: move-in, move-out handovers, tenancy transitions, and office cleaning. We focus on the rooms, condition, and key dates rather than rigid generic packages.\n\nYou can explore our [Cleaning Services](/services#cleaning) overview or let me know what type of space you are preparing.',
      suggestedActions: [
        { label: 'Move-out handover clean', action: 'suggest_query', payload: 'I need a move-out clean' },
        { label: 'Move-in preparation', action: 'suggest_query', payload: 'I need a move-in clean' },
        { label: 'Request a cleaning quote', action: 'start_quote' },
      ],
      draft,
    };
  }

  // 6. Moving questions
  if (text.includes('mov') && !text.includes('quote') && !text.includes('book')) {
    return {
      reply:
        'Laurrel Services coordinates local residential and office moves throughout Ottawa. We manage vehicle capacity, crew allocation, and building access details like elevators and loading zones.\n\nYou can review our [Moving Services](/services#moving) details or tell me where in Ottawa you are moving.',
      suggestedActions: [
        { label: 'Moving within Ottawa', action: 'suggest_query', payload: 'Moving within Ottawa' },
        { label: 'Combine move with storage', action: 'suggest_query', payload: 'Can I store items during my move?' },
        { label: 'Get a moving estimate', action: 'start_quote' },
      ],
      draft,
    };
  }

  // 7. Storage questions
  if (text.includes('stor') && !text.includes('quote')) {
    return {
      reply:
        'Our storage service provides transitional holding between moving dates or during home renovations in Ottawa. If your move-out and move-in dates don’t line up, we coordinate safe holding so your belongings stay protected.\n\nLearn more about our [Transitional Storage](/services#storage) options or tell me what timeframe you have in mind.',
      suggestedActions: [
        { label: 'A few days to weeks', action: 'suggest_query', payload: 'I need short-term transitional storage' },
        { label: 'One month or longer', action: 'suggest_query', payload: 'I need storage for a month or more' },
        { label: 'Request storage quote', action: 'start_quote' },
      ],
      draft,
    };
  }

  // 8. Overlapping plans / All services
  if (text.includes('overlap') || (text.includes('both') && text.includes('move'))) {
    return {
      reply:
        'Specializing in overlapping transitions is central to Laurrel Services. We frequently coordinate moving out, safe transitional storage, and handover cleaning under a single coordinated schedule. Would you like to map out your upcoming dates?',
      suggestedActions: [
        { label: 'Plan combined services', action: 'start_quote' },
        { label: 'Speak to a coordinator', action: 'human_handoff' },
      ],
      draft,
    };
  }

  // 9. Guided Enquiry Progressive Collection
  // Extract potential postal code or Ottawa address
  const postalMatch = text.match(/[kK][0-9][a-zA-Z]\s?[0-9][a-zA-Z][0-9]/);
  if (postalMatch) {
    draft.serviceLocation = postalMatch[0].toUpperCase();
  } else if (text.includes('ottawa') || text.includes('kanata') || text.includes('nepean') || text.includes('orléans') || text.includes('centretown')) {
    draft.serviceLocation = userMessage;
  }

  // Extract email and name if typed
  const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (emailMatch) {
    draft.email = emailMatch[0];
    const rawParts = userMessage.split(/[,;\n]/);
    if (rawParts.length > 1) {
      const possibleName = rawParts.find((p) => !p.includes('@'))?.trim();
      if (possibleName && possibleName.length >= 2) {
        draft.name = possibleName;
      }
    } else {
      const remaining = userMessage.replace(emailMatch[0], '').trim();
      if (remaining.length >= 2) {
        draft.name = remaining;
      } else if (!draft.name) {
        draft.name = 'Laurrel Customer';
      }
    }
  }

  // Check what's missing in the guided enquiry flow
  if (draft.services.length === 0) {
    return {
      reply:
        'I can help you prepare an enquiry. Which service or combination do you need: Cleaning, Moving, or Storage?',
      suggestedActions: [
        { label: 'Cleaning', action: 'suggest_query', payload: 'I need Cleaning' },
        { label: 'Moving', action: 'suggest_query', payload: 'I need Moving' },
        { label: 'Storage', action: 'suggest_query', payload: 'I need Storage' },
        { label: 'Cleaning & Moving', action: 'suggest_query', payload: 'I need Cleaning and Moving' },
      ],
      draft,
    };
  }

  if (!draft.serviceLocation) {
    return {
      reply: `Got it (${draft.services.join(' & ')}). What is the location or postal code in Ottawa for this job?`,
      suggestedActions: [
        { label: 'Centretown / Downtown', action: 'suggest_query', payload: 'Location: Centretown, Ottawa' },
        { label: 'Kanata', action: 'suggest_query', payload: 'Location: Kanata, Ottawa' },
        { label: 'Nepean', action: 'suggest_query', payload: 'Location: Nepean, Ottawa' },
      ],
      draft,
    };
  }

  if (!draft.preferredDate) {
    // If user provided a date/timing response
    if (
      text.includes('month') ||
      text.includes('week') ||
      text.includes('today') ||
      text.includes('tomorrow') ||
      text.includes('asap') ||
      text.includes('flexible') ||
      text.includes('timing') ||
      text.match(/\b\d{1,2}\b/) ||
      (text.length >= 3 && !text.includes('clean') && !text.includes('mov') && !text.includes('human'))
    ) {
      draft.preferredDate = userMessage.replace(/^timing:\s*/i, '');
    } else {
      return {
        reply: `Thanks. What date or timeframe do you have in mind for your ${draft.services.join(' & ')} in ${draft.serviceLocation}?`,
        suggestedActions: [
          { label: 'End of this month', action: 'suggest_query', payload: 'Timing: End of this month' },
          { label: 'Next month', action: 'suggest_query', payload: 'Timing: Next month' },
          { label: 'Flexible timing', action: 'suggest_query', payload: 'Timing: Flexible within 30 days' },
        ],
        draft,
      };
    }
  }

  if (!draft.details) {
    if (text.length >= 5 && !emailMatch) {
      draft.details = userMessage;
    } else {
      return {
        reply:
          'Could you share a brief description of the job (e.g. number of bedrooms, approximate size, or specific requirements)?',
        draft,
      };
    }
  }

  if (!draft.name || !draft.email) {
    return {
      reply:
        'Almost ready! Please share your name and email address so our team can send over your personalized quote.',
      draft,
    };
  }

  // All core details present -> Show confirmation summary card!
  return {
    reply:
      'I have compiled your enquiry details below. Please review the summary and confirm whenever you are ready to submit it to our team.',
    showConfirmation: true,
    draft,
    suggestedActions: [
      { label: 'Confirm & Submit Enquiry', action: 'start_quote' },
      { label: 'Talk to a human', action: 'human_handoff' },
    ],
  };
}

/**
 * Main Assistant Chat processing function
 */
export async function processAssistantChat(
  request: AssistantChatRequest
): Promise<AssistantChatResponse> {
  const { messages, draft } = request;
  const lastUserMessage =
    messages
      .slice()
      .reverse()
      .find((m) => m.role === 'user')?.content || '';

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  // If Gemini API Key is present, attempt LLM generation with grounding
  if (apiKey) {
    try {
      const knowledge = await getAssistantKnowledge();
      const systemInstruction = buildSystemPrompt(knowledge);

      const ai = new GoogleGenAI({ apiKey });

      // Build conversation history for Gemini
      const contents = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3, // Low temperature for high factual restraint
          maxOutputTokens: 600,
        },
      });

      const replyText =
        response.text ||
        'Welcome to Laurrel Services. How can we help with your cleaning, moving, or storage in Ottawa?';

      // Parse structured intent / draft updates from the interaction
      const localAnalysis = processLocalGroundedResponse(lastUserMessage, draft);

      return {
        reply: replyText,
        suggestedActions: localAnalysis.suggestedActions,
        draft: localAnalysis.draft,
        showConfirmation: localAnalysis.showConfirmation,
        isHandoff: localAnalysis.isHandoff,
      };
    } catch (error) {
      console.warn('[Gemini Assistant warning] Falling back to local grounded engine:', error);
      // Fallback gracefully to local grounding engine
      return processLocalGroundedResponse(lastUserMessage, draft);
    }
  }

  // No API key provided — operate smoothly via local grounded engine
  return processLocalGroundedResponse(lastUserMessage, draft);
}
