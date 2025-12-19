// src/pages/ResetPassword.tsx
import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {AlertCircle, CheckCircle, Lock} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {useTranslation} from 'react-i18next';
import {useLang} from '../hooks/useLang';

const ResetPassword: React.FC = () => {
    const {t} = useTranslation();
    const lang = useLang();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // ✅ nový stav: máme session pro reset?
    const [hasSession, setHasSession] = useState<boolean | null>(null);

    useEffect(() => {
        let isMounted = true;

        const check = async () => {
            try {
                const {data} = await supabase.auth.getSession();
                if (!isMounted) return;

                // Po reset callbacku musí existovat session (detekce z URL + callback page)
                setHasSession(!!data.session);

                if (!data.session) {
                    setError(
                        t('auth.resetLinkInvalidOrExpired') ||
                        'Reset link is invalid or expired. Please request a new one.'
                    );
                }
            } catch (e: any) {
                if (!isMounted) return;
                setHasSession(false);
                setError(e?.message ?? 'Failed to verify reset session');
            }
        };

        check();

        return () => {
            isMounted = false;
        };
    }, [t]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError(t('auth.passwordMinLength'));
            return;
        }
        if (password !== confirm) {
            setError(t('auth.passwordsDoNotMatch'));
            return;
        }

        setLoading(true);

        try {
            const {error} = await supabase.auth.updateUser({password});

            if (error) {
                // Typicky: "Auth session missing" / "Invalid JWT" / "Token expired"
                setError(
                    error.message ||
                    (t('auth.failedToUpdatePassword') as string) ||
                    'Failed to update password'
                );
            } else {
                setSuccess(t('auth.passwordUpdated'));
                // Volitelně: po resetu usera odhlaš a pošli na login (většinou OK)
                // await supabase.auth.signOut();
                setTimeout(() => navigate(`/${lang}/login`, {replace: true}), 1500);
            }
        } catch (err: any) {
            setError(err?.message || t('auth.failedToUpdatePassword'));
        } finally {
            setLoading(false);
        }
    };

    // Pokud session chybí, ukážeme CTA na forgot password
    const showForm = hasSession !== false;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                            <Lock className="w-6 h-6 text-blue-600"/>
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                            {t('auth.setNewPassword')}
                        </h1>
                        <p className="text-sm text-gray-600">
                            {t('auth.enterNewPasswordForAccount')}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5"/>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-rose-900">{t('common.error')}</p>
                                <p className="text-sm text-rose-700 mt-1">{error}</p>

                                {hasSession === false && (
                                    <div className="mt-3">
                                        <Link
                                            to={`/${lang}/forgot-password`}
                                            className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                        >
                                            {t('auth.requestNewResetLink') || 'Request a new reset link'}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {success && (
                        <div
                            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"/>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-emerald-900">
                                    {t('auth.passwordUpdatedTitle')}
                                </p>
                                <p className="text-sm text-emerald-700 mt-1">{success}</p>
                            </div>
                        </div>
                    )}

                    {showForm && !success && (
                        <form onSubmit={handleReset} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('auth.newPassword')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none"
                                        placeholder={t('auth.atLeast6Characters')}
                                        required
                                        disabled={loading || hasSession === null}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('auth.confirmPassword')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                                    <input
                                        type="password"
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none"
                                        placeholder={t('auth.repeatNewPassword')}
                                        required
                                        disabled={loading || hasSession === null}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || hasSession !== true}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                            >
                                {loading ? t('auth.updating') : t('auth.updatePassword')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
