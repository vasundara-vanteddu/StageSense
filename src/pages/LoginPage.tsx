import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';
import { SignalTimeline } from '../components/shared/SignalTimeline';
import { PRODUCT_PITCH_SAMPLE } from '../mocks/samples';
import { IS_MOCK_MODE } from '../lib/api';
import { getErrorCopy } from '../content/errors';
import { Eye, EyeOff, Check, X, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, continueAsGuest } = useAuth();

  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const next = searchParams.get('next') || '/upload';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorObj, setErrorObj] = useState<{ title: string; hint: string } | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Password validation rules for sign up
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setIsForgotPassword(false);
    setErrorObj(null);
    setSearchParams({ mode: newMode, ...(next ? { next } : {}) });
  };

  const handleFillDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmail('demo@stagesense.dev');
    setPassword('Rehearse!2026');
    setErrorObj(null);
    toast.info('Filled demo credentials.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorObj(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await login(email, password);
        toast.success('Signed in successfully.');
      } else {
        if (!isPasswordValid) {
          setErrorObj(getErrorCopy('WEAK_PASSWORD'));
          setIsSubmitting(false);
          return;
        }
        await register(name, email, password);
        toast.success('Account created successfully.');
      }
      navigate(next);
    } catch (err: any) {
      const code = err?.error?.code || 'INVALID_CREDENTIALS';
      const msg = err?.error?.message;
      const hint = err?.error?.hint;
      setErrorObj(getErrorCopy(code, msg, hint));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    toast.success('Continuing as guest presenter.');
    navigate(next);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
  };

  return (
    <div className="min-h-screen pt-20 pb-16 flex items-center justify-center px-4 sm:px-6 select-none">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: 440px Auth Panel */}
        <div className="lg:col-span-5 bg-[#0B1A2D]/90 backdrop-blur-2xl border border-[#17324F] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          {/* Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-[#07111F] border border-[#17324F]">
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className={`flex-1 py-2 text-xs font-mono font-medium rounded-lg transition-colors ${
                mode === 'signin' && !isForgotPassword
                  ? 'bg-[#10243B] text-[#DCEFF8] font-bold shadow'
                  : 'text-[#7C93A9] hover:text-[#F7FAFC]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className={`flex-1 py-2 text-xs font-mono font-medium rounded-lg transition-colors ${
                mode === 'signup' && !isForgotPassword
                  ? 'bg-[#10243B] text-[#DCEFF8] font-bold shadow'
                  : 'text-[#7C93A9] hover:text-[#F7FAFC]'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F7FAFC]">
              {isForgotPassword
                ? 'Reset password'
                : mode === 'signin'
                ? 'Welcome back.'
                : 'Start with one rehearsal.'}
            </h1>
            <p className="text-xs text-[#9AAFC2]">
              {isForgotPassword
                ? 'Enter your email to receive instructions.'
                : mode === 'signin'
                ? 'Sign in to access your presentation history.'
                : 'Free research access for student and faculty rehearsals.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorObj && (
            <div className="p-3.5 rounded-xl bg-[#F2766B]/15 border border-[#F2766B]/40 flex flex-col gap-0.5 text-xs">
              <span className="font-bold text-[#F8978D]">{errorObj.title}</span>
              <span className="text-[#DCEFF8]">{errorObj.hint}</span>
            </div>
          )}

          {/* Forgot Password Flow */}
          {isForgotPassword ? (
            resetSent ? (
              <div className="flex flex-col gap-4 text-xs">
                <p className="text-[#DCEFF8]">
                  If an account exists for {email}, a reset link is on its way.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-[#79C8DF] font-mono hover:underline text-left"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-[#DCEFF8]">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="speaker@university.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-[#17324F] text-xs text-[#F7FAFC] focus:border-[#79C8DF] focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#F7FAFC] text-[#07111F] font-semibold text-xs hover:bg-[#DCEFF8] transition-colors"
                >
                  Send reset link
                </button>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-xs font-mono text-[#7C93A9] hover:text-[#DCEFF8] text-center"
                >
                  Back to sign in
                </button>
              </form>
            )
          ) : (
            /* Main Sign in / Sign up Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-[#DCEFF8]">Full name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Elena Rostova"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-[#17324F] text-xs text-[#F7FAFC] focus:border-[#79C8DF] focus:outline-none"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-[#DCEFF8]">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@stagesense.dev"
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-[#17324F] text-xs text-[#F7FAFC] focus:border-[#79C8DF] focus:outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#DCEFF8]">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[11px] font-mono text-[#79C8DF] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#07111F] border border-[#17324F] text-xs text-[#F7FAFC] focus:border-[#79C8DF] focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C93A9] hover:text-[#F7FAFC]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password checklist for signup */}
              {mode === 'signup' && (
                <div className="p-3 rounded-xl bg-[#07111F] border border-[#17324F] flex flex-col gap-1 text-[11px] font-mono">
                  <span className="text-[#7C93A9] mb-0.5">Password requirements:</span>
                  <div className="flex items-center gap-1.5">
                    {hasMinLength ? <Check className="w-3 h-3 text-[#6FE3B8]" /> : <X className="w-3 h-3 text-[#7C93A9]" />}
                    <span className={hasMinLength ? 'text-[#8FEBC9]' : 'text-[#7C93A9]'}>8+ characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasLetter ? <Check className="w-3 h-3 text-[#6FE3B8]" /> : <X className="w-3 h-3 text-[#7C93A9]" />}
                    <span className={hasLetter ? 'text-[#8FEBC9]' : 'text-[#7C93A9]'}>Contains a letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasNumber ? <Check className="w-3 h-3 text-[#6FE3B8]" /> : <X className="w-3 h-3 text-[#7C93A9]" />}
                    <span className={hasNumber ? 'text-[#8FEBC9]' : 'text-[#7C93A9]'}>Contains a number</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-[#F7FAFC] text-[#07111F] font-semibold text-xs hover:bg-[#DCEFF8] transition-all flex items-center justify-center gap-2 mt-1"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting
                  ? mode === 'signin'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
              </button>

              {/* Divider & Guest / Demo options */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-[1px] bg-[#17324F]" />
                <span className="text-[11px] font-mono text-[#7C93A9]">or</span>
                <div className="flex-1 h-[1px] bg-[#17324F]" />
              </div>

              <button
                type="button"
                onClick={handleGuest}
                className="w-full py-2.5 rounded-full border border-[#17324F] hover:border-[#79C8DF] text-xs font-mono text-[#DCEFF8] hover:bg-[#10243B] transition-colors flex items-center justify-center gap-2"
              >
                <span>Continue as guest</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono text-center text-[#537FA5]">
                History stays on this device only
              </span>

              {IS_MOCK_MODE && (
                <div className="pt-2 border-t border-[#17324F]/70 flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-xs font-mono text-[#79C8DF] hover:underline"
                  >
                    Use demo account (demo@stagesense.dev)
                  </button>
                  <span className="text-[10px] font-mono text-[#7C93A9]">
                    Demo mode: accounts stored in this browser only
                  </span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Right Side: Atmosphere & Sample Timeline Stage */}
        <div className="hidden lg:flex lg:col-span-7 flex-col gap-6 pl-6">
          <div className="flex flex-col gap-2">
            <span className="font-['Fraunces'] text-3xl font-light italic text-[#DCEFF8]">
              "Every rehearsal, moment by moment."
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-[#79C8DF]">
              Indicators of delivery, not grades.
            </span>
          </div>

          <div className="bg-[#0B1A2D]/60 border border-[#17324F] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#7C93A9]">
              <span>Sample Rehearsal Skyline (Product Pitch)</span>
              <span className="text-[#6FE3B8]">74 Solid</span>
            </div>
            <SignalTimeline
              windows={PRODUCT_PITCH_SAMPLE.windows}
              events={PRODUCT_PITCH_SAMPLE.events}
              duration={PRODUCT_PITCH_SAMPLE.meta.duration_s}
              mode="skyline"
              height={100}
              interactive={false}
              currentTime={125}
            />
          </div>

          <p className="text-xs text-[#7C93A9] leading-relaxed max-w-lg">
            Your videos are processed exclusively by the StageSense backend you are connected to.
            We never store unanonymized media longer than your analysis session, and you can delete any rehearsal from the History archive at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
