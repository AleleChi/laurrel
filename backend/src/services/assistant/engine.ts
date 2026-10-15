import { GoogleGenAI } from '@google/genai';
import { getVerifiedKnowledge, buildSystemPrompt } from './knowledge';
import { createAiHandoff } from '../../database/enquiryRepo';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantEnquiryDraft {
  services: ('cleaning' | 'moving' | 'storage')[];
  serviceLocation?: string;
  preferredDate?: string;
  details?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface ActionChip {
  label: string;
  action: 'suggest_query' | 'start_quote' | 'human_handoff';
  payload?: string;
}

export interface AssistantChatResponse {
  reply: string;
  suggestedActions?: ActionChip[];
  draft?: AssistantEnquiryDraft;
  showConfirmation?: boolean;
  isHandoff?: boolean;
}

function processLocalGroundedResponse(
  userMessage: string,
  currentDraft: AssistantEnquiryDraft = { services: [] }
): AssistantChatResponse {
  const text = userMessage.toLowerCase().trim();
  const draft: AssistantEnquiryDraft = { ...currentDraft, services: [...(currentDraft.services || [])] };

  // Detect services
  if (text.includes('clean') && !draft.services.includes('cleaning')) draft.services.push('cleaning');
  if (text.includes('mov') && !draft.services.includes('moving')) draft.services.push('moving');
  if (text.includes('stor') && !draft.services.includes('storage')) draft.services.push('storage');

  // Human handoff
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
      reply: 'I would be happy to connect you with our Ottawa team. Please provide your email address and any specific note below, and a Laurrel representative will review your request and get in touch directly.',
      isHandoff: true,
      suggestedActions: [
        { label: 'Back to services', action: 'suggest_query', payload: 'What services do you offer?' },
        { label: 'Request a quote online', action: 'start_quote' },
      ],
      draft,
    };
  }

  // Pricing / Rates questions
  if (
    (text.includes('price') || text.includes('cost') || text.includes('rate') || text.includes('how much') || text.includes('quote')) &&
    draft.services.length === 0
  ) {
    return {
      reply: 'I can help you request a quote. Which service do you need: cleaning, moving, storage, or a combination?',
      suggestedActions: [
        { label: 'Cleaning', action: 'suggest_query', payload: 'I need cleaning' },
        { label: 'Moving', action: 'suggest_query', payload: 'I need moving' },
        { label: 'Storage', action: 'suggest_query', payload: 'I need transitional storage' },
        { label: 'Combined services', action: 'suggest_query', payload: 'I need combined services' },
      ],
      draft,
    };
  }

  // Service region questions
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

  // Postal code / address extraction
  const postalMatch = text.match(/[kK][0-9][a-zA-Z]\s?[0-9][a-zA-Z][0-9]/);
  if (postalMatch) {
    draft.serviceLocation = postalMatch[0].toUpperCase();
  } else if (text.includes('ottawa') || text.includes('kanata') || text.includes('nepean') || text.includes('orléans') || text.includes('centretown')) {
    draft.serviceLocation = userMessage;
  }

  // Email extraction
  const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  if (emailMatch) {
    draft.email = emailMatch[0];
    const rawParts = userMessage.split(/[,;\n]/);
    if (rawParts.length > 1) {
      const possibleName = rawParts.find((p) => !p.includes('@'))?.trim();
      if (possibleName && possibleName.length >= 2) {
        draft.name = possibleName;
      }
    }
  }

  if (draft.services.length === 0) {
    return {
      reply: 'I can help you prepare an enquiry. Which service or combination do you need: Cleaning, Moving, or Storage?',
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

  if (!draft.name || !draft.email) {
    return {
      reply: 'Almost ready! Please share your name and email address so our Ottawa team can send over your personalized quote.',
      draft,
    };
  }

  return {
    reply: 'I have compiled your enquiry details below. Please review the summary and confirm whenever you are ready to submit it to our team.',
    showConfirmation: true,
    draft,
    suggestedActions: [
      { label: 'Confirm & Submit Enquiry', action: 'start_quote' },
      { label: 'Talk to a human', action: 'human_handoff' },
    ],
  };
}

export async function processAssistantChat(params: {
  messages: ChatMessage[];
  draft?: AssistantEnquiryDraft;
  sessionId?: string;
}): Promise<AssistantChatResponse> {
  const { messages, draft, sessionId } = params;
  const lastUserMessage = messages.slice().reverse().find((m) => m.role === 'user')?.content || '';

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (apiKey) {
    try {
      const knowledge = getVerifiedKnowledge();
      const systemInstruction = buildSystemPrompt(knowledge);

      const ai = new GoogleGenAI({ apiKey });
      const contents = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 600,
        },
      });

      const replyText =
        response.text ||
        'Welcome to Laurrel Services. How can we help with your cleaning, moving, or storage in Ottawa?';

      const localAnalysis = processLocalGroundedResponse(lastUserMessage, draft);

      // If user provided email and asked for human handoff, persist to database
      if (localAnalysis.isHandoff && localAnalysis.draft?.email) {
        await createAiHandoff({
          sessionId,
          name: localAnalysis.draft.name,
          email: localAnalysis.draft.email,
          phone: localAnalysis.draft.phone,
          services: localAnalysis.draft.services,
          location: localAnalysis.draft.serviceLocation,
          reason: lastUserMessage,
        });
      }

      return {
        reply: replyText,
        suggestedActions: localAnalysis.suggestedActions,
        draft: localAnalysis.draft,
        showConfirmation: localAnalysis.showConfirmation,
        isHandoff: localAnalysis.isHandoff,
      };
    } catch (error) {
      console.warn('[Gemini Assistant warning] Falling back to local grounded engine:', error);
      return processLocalGroundedResponse(lastUserMessage, draft);
    }
  }

  const localAnalysis = processLocalGroundedResponse(lastUserMessage, draft);
  if (localAnalysis.isHandoff && localAnalysis.draft?.email) {
    await createAiHandoff({
      sessionId,
      name: localAnalysis.draft.name,
      email: localAnalysis.draft.email,
      phone: localAnalysis.draft.phone,
      services: localAnalysis.draft.services,
      location: localAnalysis.draft.serviceLocation,
      reason: lastUserMessage,
    });
  }

  return localAnalysis;
}
