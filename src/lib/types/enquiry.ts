export type ServiceCategory = 'cleaning' | 'moving' | 'storage';

export type EnquiryIntent =
  | 'general_contact'
  | 'quote_request'
  | 'service_sidebar'
  | 'ai_assisted_enquiry'
  | 'human_handoff';

export type EnquiryStatus =
  | 'new'
  | 'under_review'
  | 'awaiting_information'
  | 'quoted'
  | 'accepted'
  | 'closed';

export interface CleaningServiceDetails {
  propertyType?: string;
  propertySize?: string;
  cleaningRequirements?: string;
}

export interface MovingServiceDetails {
  movingFrom?: string;
  movingTo?: string;
  belongingsSize?: string;
  accessConsiderations?: string;
}

export interface StorageServiceDetails {
  storageDuration?: string;
  storageItemsType?: string;
  accessRequirements?: string;
}

export interface ServiceSpecificDetails {
  cleaning?: CleaningServiceDetails;
  moving?: MovingServiceDetails;
  storage?: StorageServiceDetails;
}

export interface EnquiryPayload {
  // Routing & origin
  intent?: EnquiryIntent;
  source?: string;

  // Primary customer details
  name: string;
  email: string;
  phone?: string;

  // Service selections
  services?: ServiceCategory[];
  enquiryAbout?: string;

  // Location & timeline
  serviceLocation?: string;
  preferredDate?: string;

  // Core description
  message?: string;
  details?: string;

  // Conditional service specifics
  serviceDetails?: ServiceSpecificDetails;

  // Anti-spam honeypot
  website?: string;
  _hp_company?: string;
}

export interface StoredEnquiryRecord {
  id: string;
  intent: EnquiryIntent;
  source: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  services: (ServiceCategory | 'general')[];
  serviceLocation?: string;
  preferredTiming?: string;
  details: string;
  serviceSpecificDetails?: ServiceSpecificDetails;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
  internalNotes: {
    id: string;
    author: string;
    note: string;
    createdAt: string;
  }[];
}
