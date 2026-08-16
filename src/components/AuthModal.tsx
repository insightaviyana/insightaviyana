import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus, Loader2, ShieldCheck } from 'lucide-react';
import { signInWithPassword, signUpGuest, signInWithGoogle } from '../lib/supabaseAuth';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Real authentication modal backed by Supabase Auth.
 * - Sign In: any account type (admin, staff, or guest) with email + password.
 * - Create Guest Account: self-registration, guest reader access only.
 *   Staff/Admin accounts are created BY an admin in User Management, not self-registered.
 * - Continue with Google: guest account via OAuth.
 */
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setSignupSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signInWithPassword(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      handleClose();
      // The App-level onAuthStateChange listener picks up the new session automatically.
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signUpGuest(email, password, name);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSignupSuccess(true);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
    // On success, the browser redirects away to Google and back — nothing more to do here.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-amber-400" />
            <h3 className="font-serif font-bold text-lg text-white">
              {mode === 'signin' ? 'Sign In' : 'Create a Reader Account'}
            </h3>
          </div>
          <button onClick={handleClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {!isSupabaseConfigured ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-300">
                Sign-in requires Supabase to be connected. Ask your admin to finish that setup first.
              </p>
            </div>
          ) : signupSuccess ? (
            <div className="text-center py-6 space-y-3">
              <UserPlus size={32} className="mx-auto text-emerald-400" />
              <h4 className="text-white font-bold">Account created</h4>
              <p className="text-sm text-slate-300">
                Check <strong className="text-amber-300">{email}</strong> to confirm your account, then sign in.
              </p>
              <button
                onClick={() => { setMode('signin'); setSignupSuccess(false); }}
                className="mt-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Mode Tabs */}
              <div className="flex bg-slate-950 rounded-xl p-1 mb-5 border border-slate-800">
                <button
                  onClick={() => { setMode('signin'); setError(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'signin' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode('signup'); setError(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'signup' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  Create Guest Account
                </button>
              </div>

              <button
                onClick={handleGoogle}
                className="w-full mb-4 flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl text-sm transition-all shadow"
              >
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9 39.4 15.9 45 24 45z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.8l6.2 5.2C40.8 36.5 45 30.9 45 24c0-1.4-.1-2.5-.4-3.5z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] text-slate-400 uppercase font-mono">or</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
                {mode === 'signup' && (
                  <div className="relative">
                    <UserIcon size={15} className="absolute left-3 top-3 text-slate-500" />
                    <input
                      required
                      type="text"
                      aria-label="Full name"
                      placeholder="Full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    required
                    type="email"
                    aria-label="Email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    required
                    type="password"
                    minLength={6}
                    aria-label="Password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {error && (
                  <div className="p-2.5 bg-red-950/50 border border-red-500/40 rounded-lg text-xs text-red-300">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : mode === 'signin' ? <LogIn size={16} /> : <UserPlus size={16} />}
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                </button>
              </form>

              {mode === 'signup' && (
                <p className="text-[11px] text-slate-400 mt-4 text-center leading-relaxed">
                  This creates a <strong className="text-amber-300/80">Guest Reader</strong> account (public tabs only).
                  Staff and Admin accounts are created by an administrator in User Management.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
