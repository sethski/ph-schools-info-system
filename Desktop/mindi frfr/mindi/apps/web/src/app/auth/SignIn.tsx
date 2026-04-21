// =============================================================================
// MINDI Phase 1 — SignIn Component
// Firebase Auth: Email + Google. Generic error messages (auth-patterns skill).
// =============================================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export default function SignIn() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signUp, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'signup') {
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      router.push('/');
    } catch {
      setError('Invalid credentials'); // Generic — never reveal email existence
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try { await signInWithGoogle(); router.push('/'); }
    catch { setError('Google sign-in failed. Please try again.'); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0f]">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            {mode === 'signup' ? 'Meet Mindi' : 'Welcome back'}
          </h1>
          <p className="text-white/40 text-sm">
            {mode === 'signup' ? 'Your adaptive AI companion starts here' : 'Your brain is waiting'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === 'signup' && (
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs text-white/40 uppercase tracking-wider">Your name</label>
              <input id="name" type="text" autoComplete="name" required value={name}
                onChange={e => setName(e.target.value)} placeholder="Juan dela Cruz"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors min-h-[44px]" />
            </div>
          )}
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs text-white/40 uppercase tracking-wider">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors min-h-[44px]" />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-xs text-white/40 uppercase tracking-wider">Password</label>
            <input id="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required
              value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors min-h-[44px]" />
          </div>

          {error && <p role="alert" className="text-xs text-red-400 px-1">{error}</p>}

          <button type="submit" disabled={loading || !email || !password}
            className="w-full py-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-all disabled:opacity-40 min-h-[44px]">
            {loading ? 'Loading…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/8" /><span className="text-xs text-white/20">or</span><div className="flex-1 h-px bg-white/8" />
        </div>

        <button onClick={handleGoogle} disabled={loading}
          className="w-full py-3 bg-white/5 border border-white/10 text-white/70 rounded-xl text-sm font-medium hover:bg-white/8 transition-all min-h-[44px]">
          Continue with Google
        </button>

        <p className="text-center text-xs text-white/30">
          {mode === 'signup' ? 'Already have an account? ' : 'No account? '}
          <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            className="text-indigo-400 hover:text-indigo-300 underline">
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </main>
  );
}
