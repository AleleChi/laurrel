import { EnquiryPayload, ServiceCategory } from '@/lib/types/enquiry';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ActionChip {
  label: string;
  action: 'suggest_query' | 'start_quote' | 'human_handoff' | 'view_services' | 'fill_field';
  payload?: any;
}

export interface AssistantEnquiryDraft {
  services: ServiceCategory[];
  serviceLocation?: string;
  preferredDate?: string;
  details?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface AssistantMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  suggestedActions?: ActionChip[];
  enquiryDraft?: AssistantEnquiryDraft;
  showConfirmation?: boolean;
  isConfirmed?: boolean;
  referenceId?: string;
  isHandoff?: boolean;
  errorMessage?: string;
}

export interface AssistantChatRequest {
  messages: Array<{
    role: MessageRole;
    content: string;
  }>;
  draft?: AssistantEnquiryDraft;
  sessionId?: string;
}

export interface AssistantChatResponse {
  reply: string;
  suggestedActions?: ActionChip[];
  draft?: AssistantEnquiryDraft;
  showConfirmation?: boolean;
  isHandoff?: boolean;
  referenceId?: string;
}
