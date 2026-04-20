
export interface UserProfile {
  uid: string;
  email: string;
  role: 'ADMIN' | 'COMPANY_OWNER' | 'PARTNER';
  companyId?: string;
  subscriptionTier?: 'STANDARD' | 'PRO' | 'BUSINESS';
  requestedTier?: 'STANDARD' | 'PRO' | 'BUSINESS';
  subscriptionStatus?: 'NONE' | 'PENDING' | 'ACTIVE';
  onboardingCompleted?: boolean;
  onboardingData?: {
    companyName: string;
    phone: string;
    sector: string;
  };
  name?: string;
  isBlocked?: boolean;
  createdAt: number;
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
}

export type ViewMode = 'LANDING' | 'USER' | 'ADMIN' | 'VIEWER' | 'LOGIN' | 'ONBOARDING' | 'SUBSCRIPTION' | 'PROTOCOL' | 'PRIVACY';

export interface AuthorizedMember {
  name: string;
  phone: string;
}

export interface AppState {
  viewMode: ViewMode;
  documents: SecureDocument[];
  activeDocument: SecureDocument | null;
  isMemberAuthenticated: boolean;
}
