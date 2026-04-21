// =============================================================================
// MINDI Phase 1 — Shared Types: User + Auth
// =============================================================================

export type SupportedLocale = 'en' | 'tl';

export interface MindiUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  locale: SupportedLocale;
  mfaEnrolled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: MindiUser | null;
  loading: boolean;
  error: string | null;
}
