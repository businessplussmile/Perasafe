
export const PARTNER_LIMITS = {
  STANDARD: 1,
  PRO: 10,
  BUSINESS: 100,
} as const;

export const DOC_LIMITS = {
  STANDARD: 1,
  PRO: 50,
  BUSINESS: 300,
} as const;

export const STORAGE_LIMITS = {
  STANDARD: 2 * 1024 * 1024,   // 2 MB
  PRO: 50 * 1024 * 1024,       // 50 MB
  BUSINESS: 500 * 1024 * 1024, // 500 MB
} as const;

export type SubscriptionTier = keyof typeof PARTNER_LIMITS;
