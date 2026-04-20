
export interface UserProfile {
  uid: string;
  email: string;
  role: 'ADMIN' | 'COMPANY_OWNER' | 'PARTNER';
  companyId?: string;
  name?: string;
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
}

export type ViewMode = 'USER' | 'ADMIN' | 'VIEWER' | 'LOGIN' | 'ONBOARDING' | 'SUBSCRIPTION';

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
