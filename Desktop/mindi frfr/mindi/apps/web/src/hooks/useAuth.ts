// Compatibility wrapper so components that import from `src/hooks/useAuth`
// continue to work while the canonical hook lives at `src/app/auth/useAuth.ts`.
export { useAuth, type AuthState } from '../app/auth/useAuth';
