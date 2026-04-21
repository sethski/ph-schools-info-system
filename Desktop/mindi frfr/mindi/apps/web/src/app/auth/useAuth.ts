// =============================================================================
// MINDI Phase 1 — useAuth Hook
// Firebase Auth state + 2FA gate for sensitive actions.
// =============================================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  mfaEnrolled: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    mfaEnrolled: false,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const mfaEnrolled = snap.exists() ? (snap.data()?.mfaEnrolled ?? false) : false;
        setState({ user, loading: false, error: null, mfaEnrolled });
      } else {
        setState({ user: null, loading: false, error: null, mfaEnrolled: false });
      }
    });
    return unsub;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, email, displayName,
        locale: 'en', mfaEnrolled: false,
        style_fingerprint: {},
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Could not create account' }));
      throw new Error('Sign up failed');
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Invalid credentials' }));
      throw new Error('Sign in failed');
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid, email: user.email, displayName: user.displayName,
          photoURL: user.photoURL, locale: 'en', mfaEnrolled: false,
          style_fingerprint: {},
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
      }
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Google sign-in failed' }));
      throw new Error('Google sign-in failed');
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  return { ...state, signUp, signIn, signInWithGoogle, signOut };
}
