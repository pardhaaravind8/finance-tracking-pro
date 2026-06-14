/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, Phone, User, Check, X, CheckCircle, Smartphone, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
  onSendSimulatedEmail: (recipient: string, otp: string, purpose: string) => void;
}

export default function AuthScreen({ onAuthSuccess, onSendSimulatedEmail }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signIn');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Input fields for Sign up
  const [suName, setSuName] = useState('');
  const [suContact, setSuContact] = useState('');
  const [suPw, setSuPw] = useState('');
  const [suPw2, setSuPw2] = useState('');
  
  // Input fields for Sign In
  const [siContact, setSiContact] = useState('');
  const [siPw, setSiPw] = useState('');

  // Password fields visibility
  const [showSiPw, setShowSiPw] = useState(false);
  const [showSuPw, setShowSuPw] = useState(false);

  // States for OTP verify flow
  const [showOtp, setShowOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // Google flow
  const [showGoogleFlow, setShowGoogleFlow] = useState(false);
  const [googleGmail, setGoogleGmail] = useState('');

  // Pending profiles
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);

  // Status banners
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Local storage "registered accounts" mock database
  const [registeredAccounts, setRegisteredAccounts] = useState<Record<string, { name: string; contact: string; pw: string }>>(() => {
    try {
      const data = localStorage.getItem('ft_accounts');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  });

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password rule tests
  const pwRules = {
    length: suPw.length >= 8,
    upper: /[A-Z]/.test(suPw),
    number: /[0-9]/.test(suPw),
    hasNumber: /[0-9]/.test(suPw),
    symbol: /[^A-Za-z0-9]/.test(suPw)
  };

  const getPasswordStrength = () => {
    let score = 0;
    if (pwRules.length) score++;
    if (pwRules.upper) score++;
    if (pwRules.hasNumber) score++;
    if (pwRules.symbol) score++;
    return score;
  };

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtp && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [showOtp, countdown]);

  const generateAndSendOtp = (recipient: string, name: string, isGoogle = false) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setCountdown(30);
    setIsResendDisabled(true);
    setOtpDigits(['', '', '', '', '', '']);

    // Call callback to log and deliver email
    onSendSimulatedEmail(recipient, otp, isGoogle ? 'Google Single Sign-On' : 'Security Authentication');
    
    setPendingProfile({
      name,
      contact: recipient.toLowerCase().trim(),
      isGoogle
    });

    setShowOtp(true);
    setErrorMessage('');
    setInfoMessage(`We've dispatched a security credentials code verification OTP.`);
    
    // Focus first input automatically
    setTimeout(() => {
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    }, 400);
  };

  const validateContact = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    if (emailRegex.test(val.trim())) return 'email';
    if (phoneRegex.test(val.trim())) return 'phone';
    return null;
  };

  // Auth operations
  const handleSignUpInit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!suName.trim()) {
      setErrorMessage('Full name field cannot be empty.');
      return;
    }

    const type = validateContact(suContact);
    if (!type) {
      setErrorMessage('Please enter a valid email address or 10-digit mobile number.');
      return;
    }

    const strength = getPasswordStrength();
    if (strength < 4) {
      setErrorMessage('Please improve password metrics security indicators first.');
      return;
    }

    if (suPw !== suPw2) {
      setErrorMessage('Passwords fields mismatches. Please double check.');
      return;
    }

    // Check pre-registered
    const key = suContact.toLowerCase().trim();
    if (registeredAccounts[key]) {
      setErrorMessage('This contact credentials are already registered on our server.');
      return;
    }

    // Enter signup OTP flow
    generateAndSendOtp(suContact, suName);
  };

  const handleSignInInit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const key = siContact.toLowerCase().trim();
    const type = validateContact(siContact);
    if (!type) {
      setErrorMessage('Invalid username. Use a valid email or 10-digit mobile number.');
      return;
    }

    if (!siPw) {
      setErrorMessage('Password field is required.');
      return;
    }

    const account = registeredAccounts[key];
    if (!account) {
      setErrorMessage('No record exists for this account. Create one first!');
      return;
    }

    if (account.pw !== siPw) {
      setErrorMessage('Incorrect password. Please verify credentials.');
      return;
    }

    // Initiate login verification OTP
    generateAndSendOtp(siContact, account.name);
  };

  const handleGoogleSignInClick = () => {
    setErrorMessage('');
    setInfoMessage('');
    setShowGoogleFlow(true);
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleGmail.toLowerCase().endsWith('gmail.com')) {
      setErrorMessage('A Google Single Sign-On requires a valid gmail.com account.');
      return;
    }

    // Extract name from gmail
    const baseName = googleGmail.split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    generateAndSendOtp(googleGmail, baseName, true);
  };

  const handleOtpInput = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const nextArr = [...otpDigits];
    nextArr[index] = cleanVal;
    setOtpDigits(nextArr);

    // Auto-advance
    if (cleanVal && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    setErrorMessage('');
    const typedOtp = otpDigits.join('');
    if (typedOtp.length !== 6) {
      setErrorMessage('Please type all 6 digits of the OTP security code.');
      return;
    }

    if (typedOtp !== generatedOtp) {
      setErrorMessage('Security code signature invalid. Please verify and retry.');
      return;
    }

    // OTP Correct! Commit registration / login state
    if (pendingProfile) {
      if (activeTab === 'signUp' && !pendingProfile.isGoogle) {
        // Register account in state database
        const updated = {
          ...registeredAccounts,
          [pendingProfile.contact]: {
            name: pendingProfile.name,
            contact: pendingProfile.contact,
            pw: suPw
          }
        };
        setRegisteredAccounts(updated);
        localStorage.setItem('ft_accounts', JSON.stringify(updated));
      }

      onAuthSuccess(pendingProfile);
    }
  };

  const handleResendOtp = () => {
    if (pendingProfile) {
      generateAndSendOtp(pendingProfile.contact, pendingProfile.name, pendingProfile.isGoogle);
    }
  };

  const handleBackToForms = () => {
    setShowOtp(false);
    setShowGoogleFlow(false);
    setPendingProfile(null);
    setErrorMessage('');
    setInfoMessage('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none text-zinc-300">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 -left-12 w-72 h-72 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-12 w-80 h-80 bg-teal-800/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Brand App Logo & Name */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-10 h-10 bg-emerald-950 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="currentColor" className="text-emerald-500" />
              <path d="M8 20V12M12 20V9M16 20V14M20 20V7" stroke="black" strokeWidth="2.3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-xl text-zinc-100 tracking-tight">Finance Tracker Pro</span>
        </div>

        {/* Status Alerts Banners */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="mb-4 bg-red-950/20 border border-red-500/30 rounded-xl p-3 flex gap-2.5 items-start text-xs text-red-300"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {infoMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="mb-4 bg-emerald-950/15 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5 items-start text-xs text-emerald-400"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── SCENARIO 1: OTP LOG VERIFICATION INTERFACE ─── */}
        {showOtp ? (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-4xl">🔐</span>
              <h3 className="text-lg font-bold text-zinc-100">Verifying Security Code</h3>
              <p className="text-xs text-zinc-400">
                A 6-digit verification code has been dispatched to:
              </p>
              <p className="font-mono text-xs text-emerald-400 font-bold bg-zinc-950 py-1.5 px-3 rounded-lg inline-block mt-2">
                {pendingProfile?.contact}
              </p>
            </div>

            {/* Verification Cells Grid */}
            <div className="flex justify-between gap-2.5 my-4">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpInput(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className={`w-12 h-14 bg-zinc-950 border text-center font-bold text-xl text-zinc-100 rounded-xl focus:outline-none focus:border-emerald-500 transition-all ${
                    digit ? 'border-emerald-500 bg-emerald-950/5' : 'border-zinc-800'
                  }`}
                />
              ))}
            </div>

            {/* Countdown or Resender */}
            <div className="text-center text-xs text-zinc-400">
              {isResendDisabled ? (
                <span>
                  Didn&apos;t get code? Resend option active in{' '}
                  <span className="text-zinc-200 font-mono font-bold">{countdown}</span> seconds
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline outline-none"
                >
                  Resend Security OTP Verification Email
                </button>
              )}
            </div>

            {/* CTA controls */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all transform active:scale-98"
              >
                Validate Verification Code & Login
              </button>
              <button
                type="button"
                onClick={handleBackToForms}
                className="w-full py-2 bg-transparent hover:text-zinc-200 text-zinc-500 text-xs font-semibold"
              >
                ← Back to configuration
              </button>
            </div>
          </div>
        ) : showGoogleFlow ? (
          /* ─── SCENARIO 2: GOOGLE EXPLICIT FORM WORKFLOW ─── */
          <form onSubmit={handleGoogleSubmit} className="space-y-4">
            <div className="text-center space-y-1.5 mb-2">
              <span className="text-4xl">🟢</span>
              <h3 className="font-bold text-md text-zinc-200">Google Authentication SSO</h3>
              <p className="text-xs text-zinc-400">
                Enter Gmail details below to trigger secure OTP delivery instantly to that real sandbox.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Your Gmail Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={googleGmail}
                  onChange={(e) => setGoogleGmail(e.target.value)}
                  placeholder="e.g. name@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-emerald-500 text-sm text-zinc-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all"
            >
              Request Google Sign-In verification OTP
            </button>

            <button
              type="button"
              onClick={handleBackToForms}
              className="w-full text-center hover:text-zinc-200 text-zinc-500 text-xs font-semibold block"
            >
              ← Back to login selection
            </button>
          </form>
        ) : (
          /* ─── SCENARIO 3: STANDALONE SIGN IN & SIGN UP FORMS ─── */
          <div>
            {/* Nav tabs */}
            <div className="flex bg-zinc-950 p-1 rounded-xl gap-1 mb-6 border border-zinc-855">
              <button
                onClick={() => { setActiveTab('signIn'); setErrorMessage(''); }}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'signIn'
                    ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('signUp'); setErrorMessage(''); }}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'signUp'
                    ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {activeTab === 'signIn' ? (
              /* SIGN IN MODE */
              <form onSubmit={handleSignInInit} className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  className="w-full group py-2.5 px-4 bg-zinc-950 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm font-semibold active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3 py-2 text-zinc-500 text-[10px] uppercase font-bold tracking-widest before:content-[''] before:flex-1 before:h-px before:bg-zinc-800 after:content-[''] after:flex-1 after:h-px after:bg-zinc-800">
                  Or use security key
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Email / Mobile Contact
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={siContact}
                        onChange={(e) => setSiContact(e.target.value)}
                        placeholder="you@email.com or 10-digit mobile"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none text-sm text-zinc-100"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                      <input
                        type={showSiPw ? 'text' : 'password'}
                        required
                        value={siPw}
                        onChange={(e) => setSiPw(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 pl-11 pr-11 focus:outline-none text-sm text-zinc-100"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSiPw(!showSiPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 pointer-events-auto"
                      >
                        {showSiPw ? <EyeOff className="w-4 h-4 animate-fade-in" /> : <Eye className="w-4 h-4 animate-fade-in" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all transform active:scale-98"
                >
                  Send OTP & Sign In →
                </button>
              </form>
            ) : (
              /* SIGN UP MODE */
              <form onSubmit={handleSignUpInit} className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  className="w-full group py-2.5 px-4 bg-zinc-950 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm font-semibold active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  <span>Sign Up with Google</span>
                </button>

                <div className="flex items-center gap-3 py-1.5 text-zinc-500 text-[10px] uppercase font-bold tracking-widest before:content-[''] before:flex-1 before:h-px before:bg-zinc-800 after:content-[''] after:flex-1 after:h-px after:bg-zinc-800">
                  Or register credentials
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={suName}
                        onChange={(e) => setSuName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none text-sm text-zinc-100"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Email / Mobile Contact
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={suContact}
                        onChange={(e) => setSuContact(e.target.value)}
                        placeholder="you@email.com or 10-digit mobile"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none text-sm text-zinc-100"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password + Security Metrics */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Secure Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                      <input
                        type={showSuPw ? 'text' : 'password'}
                        required
                        value={suPw}
                        onChange={(e) => setSuPw(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 pl-11 pr-11 focus:outline-none text-sm text-zinc-100"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSuPw(!showSuPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 pointer-events-auto"
                      >
                        {showSuPw ? <EyeOff className="w-4 h-4 animate-fade-in" /> : <Eye className="w-4 h-4 animate-fade-in" />}
                      </button>
                    </div>

                    {/* Progress Bar Indicators */}
                    <div className="pt-2">
                      <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full flex-1 transition-all ${suPw.length > 0 ? (getPasswordStrength() >= 1 ? 'bg-red-500' : 'bg-transparent') : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 transition-all ${suPw.length > 0 ? (getPasswordStrength() >= 2 ? 'bg-amber-500' : 'bg-transparent') : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 transition-all ${suPw.length > 0 ? (getPasswordStrength() >= 3 ? 'bg-emerald-600' : 'bg-transparent') : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 transition-all ${suPw.length > 0 ? (getPasswordStrength() >= 4 ? 'bg-emerald-400' : 'bg-transparent') : 'bg-transparent'}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        <span className={`text-[10px] flex items-center gap-1 ${pwRules.length ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {pwRules.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ Characters
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${pwRules.upper ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {pwRules.upper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase letter
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${pwRules.hasNumber ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {pwRules.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Contains number
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${pwRules.symbol ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {pwRules.symbol ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Special symbol
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={suPw2}
                      onChange={(e) => setSuPw2(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 focus:outline-none text-sm text-zinc-100"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all font-sans transform active:scale-98"
                >
                  Send OTP & Verify Identity →
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
