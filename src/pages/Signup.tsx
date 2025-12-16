import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {AlertCircle, Building2, CheckCircle, Lock, Mail, UserPlus,} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {useTranslation} from 'react-i18next';
import { useLang } from '../hooks/useLang';

const Signup: React.FC = () => {
    const [step, setStep] = useState<'account' | 'organization'>('account');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState(''); // ✅ NEW: jméno / nickname
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(
        null
    );
    const {signUp, refreshOrganizations} = useAuth();

    const navigate = useNavigate();
    const {t} = useTranslation();
    const lang = useLang();

    useEffect(() => {
        const token = sessionStorage.getItem('pendingInviteToken');
        if (token) {
            setPendingInviteToken(token);
        }
    }, []);

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

        if (pendingInviteToken) {
            await handleSignupWithInvite();
        } else {
            setStep('organization');
        }
    };

    const handleSignupWithInvite = async () => {
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            console.log('[Signup] Creating user account for invite...');
            const {data: authData, error: signUpError} = await signUp(
                email,
                password,
                fullName // ✅ posíláme jméno do signUp (user_metadata)
            );

            if (signUpError) {
                setError(signUpError.message || 'Failed to create account');
                setLoading(false);
                return;
            }

            const session = authData?.session;
            console.log('[Signup] Account created:', session?.user?.id);

            if (!session?.user) {
                setError('Failed to get user session');
                setLoading(false);
                return;
            }

            console.log('[Signup] Accepting invite token...');
            const {data: inviteData, error: inviteError} = await supabase.rpc(
                'accept_organization_invite',
                {
                    p_token: pendingInviteToken,
                    p_user_name: fullName, // ✅ nové param jméno do funkce v DB
                }
            );

            if (inviteError) {
                setError('Failed to accept invite: ' + inviteError.message);
                setLoading(false);
                return;
            }

            if (inviteData && inviteData.length > 0) {
                const result = inviteData[0];
                if (result.success) {
                    console.log(
                        '[Signup] Successfully joined organization:',
                        result.org_id
                    );
                    setSuccess(true);

                    sessionStorage.removeItem('pendingInviteToken');

                    try {
                        await refreshOrganizations(session.user.id);
                    } catch (e) {
                        console.error(
                            '[Signup] Failed to refresh organizations after invite:',
                            e
                        );
                    }

                    setTimeout(() => {
                        setLoading(false);
                        navigate('/');
                    }, 1500);
                } else {
                    setError('Failed to accept invite: ' + result.message);
                    setLoading(false);
                }
            } else {
                setError('Failed to accept invite: No data returned');
                setLoading(false);
            }
        } catch (err: any) {
            console.error('[Signup] Error:', err);
            setError('An unexpected error occurred: ' + err.message);
            setLoading(false);
        }
    };

    const handleOrganizationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!organizationName.trim()) {
            setError('Organization name is required');
            return;
        }

        if (!fullName.trim()) {
            // pojistka – kdyby se někdo proklikal
            setError('Please enter your name');
            return;
        }

        setLoading(true);

        try {
            console.log('[Signup] Creating user account...');
            const {data: authData, error: signUpError} = await signUp(
                email,
                password,
                fullName // ✅ signUp s jménem
            );
            console.log('[Signup] Sign up result:', {authData, signUpError});

            if (signUpError) {
                setError(signUpError.message || 'Failed to create account');
                setLoading(false);
                return;
            }

            const session = authData?.session;
            console.log('[Signup] Session from signup:', session?.user?.id);

            if (!session?.user) {
                setError('Failed to get user session');
                setLoading(false);
                return;
            }

            const userId = session.user.id;

            console.log('[Signup] Calling create_organization_with_owner RPC...');

            const rpcPromise = supabase.rpc('create_organization_with_owner', {
                p_org_name: organizationName.trim(),
                p_user_id: userId,
                p_user_name: fullName, // ✅ nové param jméno do create_organization_with_owner
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('RPC timeout after 10s')), 10000)
            );

            const {data: orgData, error: orgError} = (await Promise.race([
                rpcPromise,
                timeoutPromise,
            ]).catch(err => {
                console.error('[Signup] RPC error or timeout:', err);
                return {data: null, error: err};
            })) as any;

            console.log('[Signup] RPC completed:', {orgData, orgError});

            if (orgError) {
                setError(
                    'Failed to create organization: ' +
                    (orgError.message || JSON.stringify(orgError))
                );
                setLoading(false);
                return;
            }

            if (!orgData || orgData.length === 0) {
                setError('Failed to create organization: No data returned');
                setLoading(false);
                return;
            }

            console.log('[Signup] Organization created successfully!');
            setSuccess(true);

            try {
                await refreshOrganizations(userId);
            } catch (e) {
                console.error(
                    '[Signup] Failed to refresh organizations after creation:',
                    e
                );
            }

            setTimeout(() => {
                setLoading(false);
                navigate('/');
            }, 500);
        } catch (err: any) {
            console.error('[Signup] Error:', err);
            setError('An unexpected error occurred');
            setLoading(false);
        }
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
                                <Building2
                                    className="w-6 h-6 text-blue-600"
                                    strokeWidth={2}
                                />
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                            {step === 'account'
                                ? t('auth.createYourAccount')
                                : t('auth.createYourOrganization')}
                        </h1>
                        <p className="text-sm text-gray-600">
                            {pendingInviteToken
                                ? t('auth.signUpToJoin')
                                : step === 'account'
                                    ? t('auth.getStartedToday')
                                    : t('auth.youWillBeOwner')}
                        </p>
                    </div>

                    {/* Progress indicator - only show if no invite */}
                    {!pendingInviteToken && (
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
                            <AlertCircle
                                className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5"
                                strokeWidth={2}
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-rose-900">
                                    {t('auth.signUpError')}
                                </p>
                                <p className="text-sm text-rose-700 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div
                            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                            <CheckCircle
                                className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                                strokeWidth={2}
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-emerald-900">
                                    {pendingInviteToken
                                        ? t('auth.successfullyJoined')
                                        : t('auth.accountCreatedSuccess')}
                                </p>
                                <p className="text-sm text-emerald-700 mt-1">
                                    {pendingInviteToken
                                        ? t('auth.redirectingToOrganization')
                                        : t('auth.checkEmailToVerify')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Account Step Form */}
                    {step === 'account' && (
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
                                    placeholder="How should we call you?"
                                    required
                                    disabled={loading || success}
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
                                        disabled={loading || success}
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
                                        placeholder="At least 6 characters"
                                        required
                                        autoComplete="new-password"
                                        disabled={loading || success}
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
                                        placeholder="Confirm your password"
                                        required
                                        autoComplete="new-password"
                                        disabled={loading || success}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || success}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                            >
                                {loading ? t('auth.creating') : success ? t('auth.success') : t('auth.continue')}
                            </button>
                        </form>
                    )}

                    {/* Organization Step Form */}
                    {step === 'organization' && (
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
                                        disabled={loading || success}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep('account')}
                                    disabled={loading || success}
                                    className="flex-1 h-11 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t('common.back')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                                >
                                    {loading ? t('auth.creating') : success ? t('auth.success') : t('auth.createOrganization')}
                                </button>
                            </div>
                        </form>
                    )}

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
