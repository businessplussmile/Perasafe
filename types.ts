
export interface UserProfile {
  uid: string;
  email: string;
  role: 'ADMIN' | 'COMPANY_OWNER' | 'PARTNER';
  companyId?: string;
  subscriptionTier?: 'FREE' | 'STANDARD' | 'PRO' | 'BUSINESS';
  requestedTier?: 'FREE' | 'STANDARD' | 'PRO' | 'BUSINESS';
  subscriptionStatus?: 'NONE' | 'PENDING' | 'ACTIVE';
  onboardingCompleted?: boolean;
  onboardingData?: {
    companyName: string;
    phone: string;
    sector: string;
    jobTitle?: string;
  };
  onboardingSurvey?: {
    motivation: string;
    discovery: string;
  };
  name?: string;
  isBlocked?: boolean;
  createdAt: number;
  subscriptionExpiresAt?: number;
  hasSeenAdminTour?: boolean;
  hasSeenUserTour?: boolean;
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'TRIAL';
  subscriptionTier: 'STANDARD' | 'PREMIUM';
  createdAt: number;
}

export interface SecureDocument {
  id: string;
  title: string;
  content: string; // Encrypted content
  mimeType: string;
  accessCode: string;
  isConsumed: boolean;
  createdAt: number;
  companyId: string;
  uploaderId: string;
  partnerIds: string[]; // List of partner emails or UIDs
  lifespanStart?: number;
  lastCodeUsedAtOpening?: string;
  summary?: string;
  validityDuration?: number; // In milliseconds
  companyName?: string;
  keywords?: string[];
  isBlocked?: boolean;
}

export interface SecurityAlert {
  id: string;
  type: 'SCREENSHOT_ATTEMPT' | 'PHONE_DETECTED' | 'BLUR_LOSS' | 'CLIPBOARD_COPY';
  documentId: string;
  documentTitle: string;
  companyId: string;
  ownerId: string;
  readerEmail: string;
  readerUid: string;
  timestamp: number;
  details: string;
}

export type ViewMode = 'LANDING' | 'USER' | 'ADMIN' | 'VIEWER' | 'LOGIN' | 'ONBOARDING' | 'SUBSCRIPTION' | 'PROTOCOL' | 'PRIVACY';

export interface AuthorizedMember {
  name: string;
  phone: string;
}

export interface SystemSettings {
  landingImages?: {
    whiteBlockUrl?: string;
    blackBlockUrl?: string;
  };
}

export interface AppState {
  viewMode: ViewMode;
  documents: SecureDocument[];
  activeDocument: SecureDocument | null;
  isMemberAuthenticated: boolean;
}
