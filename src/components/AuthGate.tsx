import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  LogOut, 
  Sun, 
  Moon, 
  Languages, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  UserCheck,
  RefreshCw,
  Copy,
  Check,
  Globe,
  ExternalLink,
  HelpCircle,
  Compass
} from 'lucide-react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { auth } from '../firebase';
import { AccessControlData } from '../types';
import { DEFAULT_OWNER_EMAIL } from '../services/firestoreService';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthGateProps {
  user: User | null;
  loading: boolean;
  accessControl: AccessControlData;
  lang: 'en' | 'ar';
  isDark: boolean;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  user,
  loading,
  accessControl,
  lang,
  isDark,
  onToggleTheme,
  onToggleLanguage,
  onSignOut,
  children,
}) => {
  const isAr = lang === 'ar';

  // Mode: 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authMethod, setAuthMethod] = useState<'google' | 'password'>('google');
  const [operationNotAllowed, setOperationNotAllowed] = useState<boolean>(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);
  
  // Form State
  const [email, setEmail] = useState<string>(DEFAULT_OWNER_EMAIL);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for any redirect auth result on mount (useful for mobile browsers or redirect logins)
  React.useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Redirect sign-in successful for:', result.user.email);
        }
      })
      .catch((err: any) => {
        if (err?.code === 'auth/unauthorized-domain') {
          const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'Netlify domain';
          setUnauthorizedDomain(currentHost);
        } else if (err?.code) {
          console.warn('Redirect sign-in notice:', err);
        }
      });
  }, []);

  const handleCopyCurrentDomain = (domainToCopy: string) => {
    try {
      navigator.clipboard.writeText(domainToCopy);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch (e) {
      console.warn('Failed to copy to clipboard', e);
    }
  };

  // Google Sign In via Popup
  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setUnauthorizedDomain(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed popup, do nothing
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'Netlify domain';
        setUnauthorizedDomain(currentHost);
        console.error('Google Sign-in Unauthorized Domain:', currentHost, err);
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage(
          isAr
            ? 'تم حظر النافذة المنبثقة من قبل متصفحك. يرجى السماح بالنوافذ المنبثقة (Popups) أو تجربة تسجيل الدخول عبر البريد وكلمة المرور.'
            : 'Popup was blocked by your browser. Please allow popups for this site or use the redirect/password option.'
        );
      } else {
        console.error('Google Sign-in Error:', err);
        setErrorMessage(
          isAr 
            ? `فشل تسجيل الدخول عبر Google (${err?.code || 'خطأ'}). يرجى المحاولة مرة أخرى أو استخدام البريد وكلمة المرور.` 
            : `Google Sign-in failed (${err?.code || 'error'}). Please try again or use email & password.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Sign In via Redirect (fallback for mobile/strict cookie blockers)
  const handleGoogleSignInRedirect = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setUnauthorizedDomain(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'Netlify domain';
        setUnauthorizedDomain(currentHost);
      } else {
        setErrorMessage(err?.message || 'Redirect error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Email & Password Submit
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage(isAr ? 'يرجى إدخال بريد إلكتروني صالح.' : 'Please enter a valid email address.');
      return;
    }
    if (authMode !== 'forgot' && (!password || password.length < 6)) {
      setErrorMessage(isAr ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف.' : 'Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (authMode === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMessage(
          isAr
            ? `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}. تفقد بريدك الوارد.`
            : `Password reset link sent to ${email}. Please check your inbox.`
        );
        return;
      }

      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        return;
      }

      // Default: Sign In with graceful auto-registration fallback if account doesn't exist yet
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (signInErr: any) {
        // If user not found, automatically register them with provided credentials
        if (
          signInErr.code === 'auth/user-not-found' || 
          signInErr.code === 'auth/invalid-credential' ||
          signInErr.code === 'auth/wrong-password'
        ) {
          // Attempt account creation if signing in for the first time
          try {
            await createUserWithEmailAndPassword(auth, email.trim(), password);
            return;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw signInErr; // Was actually a wrong password
            }
            throw createErr;
          }
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.warn('Auth notice:', err?.code || err);
      let msg = isAr ? 'حدث خطأ أثناء المصادقة.' : 'Authentication error occurred.';
      if (err.code === 'auth/operation-not-allowed') {
        setOperationNotAllowed(true);
        msg = isAr
          ? 'مزوّد تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في Firebase Console. يرجى استخدام "المتابعة بحساب Google" لتسجيل الدخول الفوري.'
          : 'Email & Password sign-in is not enabled in Firebase Console. Please use "Continue with Google" for instant one-click login.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = isAr ? 'كلمة المرور غير صحيحة لهذا الحساب.' : 'Incorrect password for this account.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = isAr ? 'هذا البريد مسجل بالفعل. يمكنك تسجيل الدخول به.' : 'Email is already registered. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        msg = isAr ? 'كلمة المرور ضعيفة جداً. استخدم 6 رموز على الأقل.' : 'Password is too weak. Minimum 6 characters.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. LOADING SCREEN
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FBFBFA] dark:bg-[#121316] text-[#2D3136] dark:text-[#F3F4F6] p-6 transition-colors">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
            <ShieldCheck size={32} className="animate-spin duration-1000" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold tracking-tight">Core Executive OS</h2>
            <p className="text-xs text-neutral-400 font-mono">
              {isAr ? 'جاري التحقق من أمان المنظومة السحابية...' : 'Synchronizing Secure Cloud Vault...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. UNAUTHENTICATED: LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#FBFBFA] dark:bg-[#121316] text-[#2D3136] dark:text-[#F3F4F6] transition-colors relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar with Brand & Quick Controls */}
        <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-[#1F2327] font-extrabold shadow-sm shadow-emerald-500/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#2D3136] dark:text-white flex items-center gap-1.5">
                Core Executive OS
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  v3.4
                </span>
              </span>
              <p className="text-[10px] text-neutral-400">
                {isAr ? 'منظومة الإدارة التنفيذية الخاصة' : 'Private Executive Operating System'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLanguage}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#18191D]/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
              title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Languages size={14} className="text-emerald-500" />
              <span className="text-[11px]">{isAr ? 'EN' : 'عربي'}</span>
            </button>
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#18191D]/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-all cursor-pointer shadow-3xs"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-600" />}
            </button>
          </div>
        </header>

        {/* Center Card */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
          <div className="w-full max-w-md bg-white dark:bg-[#18191D] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-scaleIn">
            
            {/* Header info */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                <Sparkles size={12} />
                <span>{isAr ? 'الوصول الآمن والمحمي' : 'Encrypted Executive Access'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2D3136] dark:text-white">
                {isAr ? 'تسجيل الدخول للمنظومة' : 'Sign in to Executive OS'}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                {isAr 
                  ? 'مساحة عمل خاصة ومزامنة سحابية حية عبر Firebase لـ itsmezaki77@gmail.com والشركاء.' 
                  : 'Private workspace with live Firebase sync for itsmezaki77@gmail.com and authorized collaborators.'}
              </p>
            </div>

            {/* Auth Method Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthMethod('google'); setErrorMessage(null); setOperationNotAllowed(false); }}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'google'
                    ? 'bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isAr ? 'حساب Google (سريع)' : 'Google (Fast)'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('password'); setErrorMessage(null); setOperationNotAllowed(false); }}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'password'
                    ? 'bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Mail size={14} className={authMethod === 'password' ? 'text-emerald-500' : ''} />
                <span>{isAr ? 'البريد وكلمة المرور' : 'Email & Password'}</span>
              </button>
            </div>

            {/* OPERATION NOT ALLOWED (Email/Password not active in console) QUICK FIX BANNER */}
            {operationNotAllowed && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2.5 animate-fadeIn">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {isAr ? 'استخدم تسجيل الدخول بحساب Google فوراً' : 'Use Instant Google Sign-In'}
                    </p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {isAr
                        ? 'حساب Google مفعّل ومجهّز في هذا المشروع دون الحاجة لأي إعداد. يمكنك الدخول فوراً بحساب itsmezaki77@gmail.com بنقرة واحدة:'
                        : 'Google Login is pre-configured and active in this project. You can sign in immediately with your Google account:'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isAr ? 'المتابعة والدخول بحساب Google' : 'Continue with Google Account'}</span>
                </button>
              </div>
            )}

            {/* UNAUTHORIZED DOMAIN (Netlify / External Domain not in Firebase Authorized Domains) */}
            {unauthorizedDomain && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-xs space-y-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <Globe size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-neutral-900 dark:text-white text-sm">
                      {isAr ? 'نطاق Netlify يتطلب الإضافة في Firebase' : 'Authorize Netlify Domain in Firebase'}
                    </p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {isAr
                        ? 'أمان Firebase يمنع تسجيل الدخول عبر Google من النطاقات الجديدة تلقائياً حتى يتم السماح بها.'
                        : 'Google Sign-in is restricted by Firebase until this hosting domain is added to your project authorized list.'}
                    </p>
                  </div>
                </div>

                {/* Domain Copy Box */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700/50 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider shrink-0">
                      {isAr ? 'النطاق:' : 'Domain:'}
                    </span>
                    <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {unauthorizedDomain}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCurrentDomain(unauthorizedDomain)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                  >
                    {copiedDomain ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copiedDomain ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ النطاق' : 'Copy')}</span>
                  </button>
                </div>

                {/* 3 Step Instructions */}
                <div className="space-y-1.5 pt-1 text-[11px] text-neutral-700 dark:text-neutral-300">
                  <p className="font-bold text-[11px] text-neutral-900 dark:text-white">
                    {isAr ? 'خطوات التفعيل (دقيقة واحدة):' : 'Quick 1-Minute Fix:'}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed ps-1 text-neutral-600 dark:text-neutral-400">
                    <li>
                      {isAr
                        ? 'انقر على زر "فتح إعدادات Firebase" بالأسفل.'
                        : 'Click "Open Firebase Console Settings" below.'}
                    </li>
                    <li>
                      {isAr
                        ? 'انزل لقسم "Authorized domains" واضغط "Add domain".'
                        : 'Scroll to "Authorized domains" and click "Add domain".'}
                    </li>
                    <li>
                      {isAr
                        ? `الصق النطاق (${unauthorizedDomain}) واضغط Add، ثم عُد واضغط تسجيل الدخول.`
                        : `Paste "${unauthorizedDomain}", click Add, and refresh or click retry below.`}
                    </li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all text-center"
                  >
                    <span>{isAr ? 'فتح إعدادات Firebase' : 'Open Firebase Console'}</span>
                    <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className="py-2.5 px-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isSubmitting ? 'animate-spin' : ''} />
                    <span>{isAr ? 'إعادة تجربة الدخول' : 'Retry Sign In'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ERROR / SUCCESS ALERTS */}
            {errorMessage && !operationNotAllowed && !unauthorizedDomain && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-500" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* TAB 1: GOOGLE SIGN-IN */}
            {authMethod === 'google' && (
              <div className="space-y-4 pt-1">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#2D3136] dark:bg-white text-white dark:text-[#18191D] hover:bg-black dark:hover:bg-neutral-100 font-bold text-xs flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>
                    {isSubmitting 
                      ? (isAr ? 'جاري الاتصال بـ Google...' : 'Connecting to Google...') 
                      : (isAr ? 'المتابعة بحساب Google' : 'Continue with Google')}
                  </span>
                </button>

                {/* Mobile / Redirect Fallback Button */}
                <div className="flex items-center justify-between text-[11px] px-1 text-neutral-500">
                  <span>{isAr ? 'تفضّل وضع التحويل المباشر؟' : 'Having popup issues?'}</span>
                  <button
                    type="button"
                    onClick={handleGoogleSignInRedirect}
                    disabled={isSubmitting}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    {isAr ? 'تسجيل الدخول بإعادة التوجيه' : 'Try Redirect Sign-in'}
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
                  <p className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    {isAr ? 'المصادقة الآمنة الفورية' : 'Instant Single-Sign-On'}
                  </p>
                  <p className="leading-relaxed">
                    {isAr 
                      ? 'يمكنك تسجيل الدخول بنقرة واحدة بحسابك itsmezaki77@gmail.com أو أي بريد مضاف في قائمة الشركاء.' 
                      : 'Log in seamlessly with your Gmail address (itsmezaki77@gmail.com) across any mobile or desktop browser.'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: EMAIL & PASSWORD SIGN-IN */}
            {authMethod === 'password' && (
              <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Mail size={13} className="text-neutral-400" />
                    <span>{isAr ? 'البريد الإلكتروني' : 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="itsmezaki77@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Password Field (Only when not forgot password) */}
                {authMode !== 'forgot' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <KeyRound size={13} className="text-neutral-400" />
                        <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#1F2327] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                  <span>
                    {authMode === 'forgot'
                      ? (isAr ? 'إرسال رابط استعادة كلمة المرور' : 'Send Reset Link')
                      : authMode === 'signup'
                      ? (isAr ? 'إنشاء حساب جديد والدخول' : 'Create Account & Enter')
                      : (isAr ? 'تسجيل الدخول إلى المنظومة' : 'Sign In to Workspace')}
                  </span>
                </button>

                {/* Mode Switcher */}
                <div className="text-center pt-1 text-[11px] text-neutral-500">
                  {authMode === 'signin' ? (
                    <span>
                      {isAr ? 'أو ترغب في تسجيل حساب جديد؟ ' : 'Or want to create a new credentials profile? '}
                      <button
                        type="button"
                        onClick={() => { setAuthMode('signup'); setErrorMessage(null); }}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        {isAr ? 'إنشاء حساب' : 'Sign Up'}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setErrorMessage(null); }}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      ← {isAr ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Security Guarantee Footer Note */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <span className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                <ShieldCheck size={11} className="text-emerald-500" />
                <span>
                  {isAr 
                    ? 'مشفر ومحمي بقواعد بيانات Firebase الحية' 
                    : 'Encrypted & protected by Firestore enterprise rules'}
                </span>
              </span>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // 3. AUTHENTICATED: ACCESS CHECK
  const userEmail = (user.email || '').toLowerCase().trim();
  const isWhitelisted = 
    userEmail === DEFAULT_OWNER_EMAIL.toLowerCase() ||
    userEmail === 'zakaworkproo@gmail.com' ||
    accessControl.allowedEmails.some(e => (e || '').toLowerCase().trim() === userEmail);

  // If authenticated but unauthorized:
  if (!isWhitelisted) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FBFBFA] dark:bg-[#121316] text-[#2D3136] dark:text-[#F3F4F6] p-6 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-[#18191D] rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-2xl p-6 sm:p-8 space-y-6 text-center animate-scaleIn">
          
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-500 mx-auto">
            <ShieldAlert size={28} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
              {isAr ? 'الوصول إلى المنظومة مقيد' : 'Workspace Access Restricted'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {isAr 
                ? 'أنت مسجل الدخول حالياً بالبريد الإلكتروني التالي ولكن لم يتم إضافتك إلى قائمة الشركاء المصرح لهم:' 
                : 'You are signed in with the following email, but it has not been granted access by the workspace owner:'}
            </p>
            <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200 break-all border border-neutral-200 dark:border-neutral-800">
              {user.email}
            </div>
            <p className="text-[11px] text-neutral-400">
              {isAr 
                ? `هذه المنظومة التنفيذية مخصصة لـ ${DEFAULT_OWNER_EMAIL} والشركاء المعتمدين. اطلب من المالك إضافتك عبر شاشة الإعدادات.` 
                : `This executive workspace is private to ${DEFAULT_OWNER_EMAIL} and authorized collaborators. Request access from the owner.`}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={onSignOut}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2D3136] dark:bg-white text-white dark:text-[#18191D] text-xs font-bold hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <LogOut size={14} />
              <span>{isAr ? 'تسجيل الخروج والتبديل إلى حساب آخر' : 'Sign Out & Switch Account'}</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // 4. USER IS AUTHENTICATED AND AUTHORIZED: RENDER APPLICATION
  return <>{children}</>;
};
