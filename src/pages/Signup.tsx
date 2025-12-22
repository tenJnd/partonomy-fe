import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {AlertCircle, Building2, CheckCircle, Lock, Mail, UserPlus} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {useLang} from '../hooks/useLang';

type PendingAction =
    | { kind: 'invite'; token: string; userName: string }
    | { kind: 'create_org'; orgName: string; userName: string };

const PENDING_KEY = 'pending_actions_v1';

function pushPending(action: PendingAction) {
    try {
        const raw = localStorage.getItem(PENDING_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(arr) ? [...arr, action] : [action];
        localStorage.setItem(PENDING_KEY, JSON.stringify(next));
    } catch {
        localStorage.setItem(PENDING_KEY, JSON.stringify([action]));
    }
}

const RESEND_COOLDOWN_MS = 30_000;

const Signup: React.FC = () => {
    const location = useLocation();

    const inviteMode = useMemo(() => {
        const sp = new URLSearchParams(location.search);
        return sp.get('mode') === 'invite';
    }, [location.search]);

    const [step, setStep] = useState<'account' | 'organization'>('account');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(null);

    // Resend email UX
    const [resendLoading, setResendLoading] = useState(false);
    const [resendInfo, setResendInfo] = useState('');
    const [resendCooldownUntil, setResendCooldownUntil] = useState<number>(0);
    const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number>(0);

    const {signUp, resendSignupEmail} = useAuth();
    const {t} = useTranslation();
    const lang = useLang();

    useEffect(() => {
        const token = sessionStorage.getItem('pendingInviteToken');
        if (token) setPendingInviteToken(token);
    }, []);

    useEffect(() => {
        // live countdown for resend cooldown
        if (!resendCooldownUntil) {
            setCooldownSecondsLeft(0);
            return;
        }

        const update = () => {
            const diff = resendCooldownUntil - Date.now();
            const s = Math.max(0, Math.ceil(diff / 1000));
            setCooldownSecondsLeft(s);
        };

        update();

        const id = window.setInterval(update, 500);
        return () => window.clearInterval(id);
    }, [resendCooldownUntil]);

    const resendDisabled = useMemo(() => {
        return resendLoading || !email.trim() || Date.now() < resendCooldownUntil;
    }, [resendLoading, email, resendCooldownUntil]);

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!fullName.trim()) {
            setError(t('auth.pleaseEnterName') || 'Please enter your name');
            return;
        }

        if (password !== confirmPassword) {
            setError(t('auth.passwordsDoNotMatch') || 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError(t('auth.passwordMinLength') || 'Password must be at least 6 characters');
            return;
        }

        // ✅ Invite flow: never go to organization step
        if (pendingInviteToken || inviteMode) {
            await handleSignupWithInvite();
            return;
        }

        setStep('organization');
    };

    const handleResendEmail = async () => {
        setError('');
        setResendInfo('');

        const targetEmail = email.trim();
        if (!targetEmail) return;

        if (Date.now() < resendCooldownUntil) return;

        setResendLoading(true);
        try {
            const {error: resendError} = await resendSignupEmail(targetEmail);

            if (resendError) {
                setError(resendError.message || 'Failed to resend email');
                return;
            }

            setResendCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
            setResendInfo(
                t('auth.verificationEmailResent') ||
                'Verification email resent. Please check your inbox (and spam).'
            );
        } catch (err: any) {
            setError('An unexpected error occurred: ' + (err?.message ?? ''));
        } finally {
            setResendLoading(false);
        }
    };

    const handleSignupWithInvite = async () => {
        setError('');
        setSuccess(false);
        setResendInfo('');
        setLoading(true);

        try {
            const token = pendingInviteToken?.trim() || '';

            if (!token) {
                setError('Missing invite token');
                setLoading(false);
                return;
            }

            console.log('[Signup] Creating user account for invite...');
            const {data: authData, error: signUpError} = await signUp(email, password, fullName);

            if (signUpError) {
                setError(signUpError.message || 'Failed to create account');
                setLoading(false);
                return;
            }

            const user = authData?.user ?? authData?.session?.user;
            console.log('[Signup] Sign up OK, user:', user?.id);

            if (!user) {
                setError('Failed to create account (no user returned)');
                setLoading(false);
                return;
            }

            pushPending({
                kind: 'invite',
                token,
                userName: fullName.trim(),
            });

            // sjednotíme stav: token už je uložen v pending queue
            sessionStorage.removeItem('pendingInviteToken');
            setPendingInviteToken(null);

            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            console.error('[Signup] Error:', err);
            setError('An unexpected error occurred: ' + (err?.message ?? ''));
            setLoading(false);
        }
    };

    const handleOrganizationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setResendInfo('');

        if (!organizationName.trim()) {
            setError('Organization name is required');
            return;
        }

        if (!fullName.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);

        try {
            console.log('[Signup] Creating user account...');
            const {data: authData, error: signUpError} = await signUp(email, password, fullName);

            console.log('[Signup] Sign up result:', {authData, signUpError});

            if (signUpError) {
                setError(signUpError.message || 'Failed to create account');
                setLoading(false);
                return;
            }

            const user = authData?.user ?? authData?.session?.user;
            console.log('[Signup] Sign up OK, user:', user?.id);

            if (!user) {
                setError('Failed to create account (no user returned)');
                setLoading(false);
                return;
            }

            pushPending({
                kind: 'create_org',
                orgName: organizationName.trim(),
                userName: fullName.trim(),
            });

            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            console.error('[Signup] Error:', err);
            setError('An unexpected error occurred: ' + (err?.message ?? ''));
            setLoading(false);
        }
    };

    const resetToAccountStep = () => {
        setSuccess(false);
        setError('');
        setResendInfo('');
        setLoading(false);
        setResendLoading(false);
        setResendCooldownUntil(0);
        setStep('account');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                            {step === 'account' ? (
                                <UserPlus className="w-6 h-6 text-blue-600" strokeWidth={2}/>
                            ) : (
                                <Building2 className="w-6 h-6 text-blue-600" strokeWidth={2}/>
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                            {step === 'account' ? t('auth.createYourAccount') : t('auth.createYourOrganization')}
                        </h1>
                        <p className="text-sm text-gray-600">
                            {pendingInviteToken || inviteMode
                                ? t('auth.signUpToJoin')
                                : step === 'account'
                                    ? t('auth.getStartedToday')
                                    : t('auth.youWillBeOwner')}
                        </p>
                    </div>

                    {/* Progress indicator - only show if no invite */}
                    {!(pendingInviteToken || inviteMode) && (
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <div
                                className={`h-2 w-20 rounded-full transition-colors ${
                                    step === 'account' ? 'bg-blue-600' : 'bg-blue-400'
                                }`}
                            />
                            <div
                                className={`h-2 w-20 rounded-full transition-colors ${
                                    step === 'organization' ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2}/>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-rose-900">{t('auth.signUpError')}</p>
                                <p className="text-sm text-rose-700 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div
                            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2}/>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-emerald-900">
                                    {t('auth.accountCreatedSuccess')}
                                </p>
                                <p className="text-sm text-emerald-700 mt-1">
                                    {t('auth.checkEmailToVerify')}
                                </p>

                                {resendInfo && (
                                    <p className="text-sm text-emerald-700 mt-2">{resendInfo}</p>
                                )}

                                <div className="mt-3 flex flex-wrap items-center gap-4">
                                    {/* link na login */}
                                    {/*<Link*/}
                                    {/*    to={`/${lang}/login`}*/}
                                    {/*    className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"*/}
                                    {/*>*/}
                                    {/*    {t('auth.goToLogin') || 'Go to login'}*/}
                                    {/*</Link>*/}

                                    <button
                                        type="button"
                                        onClick={resetToAccountStep}
                                        className="inline-flex text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        {t('auth.changeEmail') || 'Change email'}
                                    </button>


                                    {/* resend email */}
                                    <button
                                        type="button"
                                        onClick={handleResendEmail}
                                        disabled={resendDisabled}
                                        className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-blue-300 transition-colors disabled:cursor-not-allowed"
                                    >
                                        {resendLoading
                                            ? (t('auth.sending') || 'Sending...')
                                            : (t('auth.resendEmail') || 'Resend email')}
                                    </button>

                                    {cooldownSecondsLeft > 0 && (
                                        <span className="text-xs text-gray-500">
                                            {(t('auth.tryAgainInSeconds') || 'Try again in {{s}}s').replace(
                                                '{{s}}',
                                                String(cooldownSecondsLeft)
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Step Form */}
                    {step === 'account' && !success && (
                        <form onSubmit={handleAccountSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('auth.fullName')}
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                                    placeholder={t('auth.namePlaceholder')}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('auth.emailAddress')}
                                </label>
                                <div className="relative">
                                    <Mail
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                        strokeWidth={1.5}
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                                        placeholder="you@company.com"
                                        required
                                        autoComplete="email"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('auth.password')}
                                </label>
                                <div className="relative">
                                    <Lock
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                        strokeWidth={1.5}
                                    />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                                        placeholder={t('auth.atLeastChar')}
                                        required
                                        autoComplete="new-password"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('auth.confirmPassword')}
                                </label>
                                <div className="relative">
                                    <Lock
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                        strokeWidth={1.5}
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                                        placeholder={t('auth.confirmPassword')}
                                        required
                                        autoComplete="new-password"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                            >
                                {loading ? t('auth.creating') : t('auth.continue')}
                            </button>
                        </form>
                    )}

                    {/* Organization Step Form */}
                    {step === 'organization' && !success && (
                        <form onSubmit={handleOrganizationSubmit} className="space-y-5">
                            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">{t('auth.accountEmail')}</p>
                                <p className="text-sm font-medium text-gray-900">{email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('auth.organizationName')}
                                </label>
                                <div className="relative">
                                    <Building2
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                        strokeWidth={1.5}
                                    />
                                    <input
                                        type="text"
                                        value={organizationName}
                                        onChange={e => setOrganizationName(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                                        placeholder="My Company Inc."
                                        required
                                        autoComplete="organization"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep('account')}
                                    disabled={loading}
                                    className="flex-1 h-11 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t('common.back')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                                >
                                    {loading ? t('auth.creating') : t('auth.createOrganization')}
                                </button>
                            </div>
                        </form>
                    )}

                    {!success && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                {t('auth.alreadyHaveAccount')}{' '}
                                <Link
                                    to={`/${lang}/login`}
                                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {t('auth.login')}
                                </Link>
                            </p>
                        </div>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-gray-500">
                    {t('auth.agreeToTerms')}{' '}
                    <a href="#" className="text-gray-700 hover:text-gray-900 underline">
                        {t('auth.termsOfService')}
                    </a>{' '}
                    {t('auth.and')}{' '}
                    <a href="#" className="text-gray-700 hover:text-gray-900 underline">
                        {t('auth.privacyPolicy')}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Signup;
