
export const PARTNER_LIMITS = {
  FREE: 1,
  STANDARD: 3,
  PRO: 10,
  BUSINESS: 100,
} as const;

export const DOC_LIMITS = {
  FREE: 1,
  STANDARD: 5,
  PRO: 50,
  BUSINESS: 300,
} as const;

export const STORAGE_LIMITS = {
  FREE: 0.05 * 1024 * 1024,    // 0.05 MB (Approx. 10 pages of text)
  STANDARD: 2 * 1024 * 1024,   // 2 MB
  PRO: 50 * 1024 * 1024,       // 50 MB
  BUSINESS: 500 * 1024 * 1024, // 500 MB
} as const;

export type SubscriptionTier = keyof typeof PARTNER_LIMITS;
