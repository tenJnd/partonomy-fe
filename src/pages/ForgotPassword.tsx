import React, {useState} from 'react';
import {supabase} from '../lib/supabase';
import {AlertCircle, CheckCircle, Mail} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {useLang} from '../hooks/useLang';

const ForgotPassword: React.FC = () => {
    const {t} = useTranslation();
    const lang = useLang();
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!email.trim()) {
            setError(t('auth.pleaseEnterEmail'));
            return;
        }

        setSending(true);

        const callback =
            import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/en/auth/callback`;

        // po callbacku chceme skončit na reset-password (s lang prefixem)
        const next = `/${lang}/reset-password`;

        const {error} = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${callback}?next=${encodeURIComponent(next)}`,
        });


        setSending(false);

        if (error) {
            setError(error.message || t('auth.failedToSendResetLink'));
        } else {
            setSuccess(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                            <Mail className="w-6 h-6 text-blue-600"/>
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                            {t('auth.forgotYourPassword')}
                        </h1>
                        <p className="text-sm text-gray-600">
                            {t('auth.enterEmailForReset')}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5"/>
                            <p className="text-xs text-rose-700">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div
                            className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5"/>
                            <p className="text-xs text-emerald-700">
                                {t('auth.resetLinkSent')}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('auth.emailAddress')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none"
                                placeholder={t('auth.emailPlaceholder')}
                                required
                                disabled={sending}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all active:scale-[0.98]"
                        >
                            {sending ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
