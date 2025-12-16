import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {AlertCircle, CheckCircle, Loader} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';
import {useTranslation} from 'react-i18next';
import { useLang } from '../hooks/useLang';

const AcceptInvite: React.FC = () => {
    const {token} = useParams<{ token: string }>();
    const navigate = useNavigate();
    const {user, refreshOrganizations} = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [orgName, setOrgName] = useState('');
    const {t} = useTranslation();
    const lang = useLang();

    useEffect(() => {
        // Pokud není user přihlášený → uložíme token a pošleme ho na signup
        if (!user && token) {
            sessionStorage.setItem('pendingInviteToken', token);
            navigate(`/${lang}/signup`, {replace: true});
            return;
        }

        // Pokud je user přihlášený → rovnou akceptujeme invite
        if (user && token) {
            const acceptInvite = async () => {
                try {
                    // nějaké jméno pro p_user_name (vezmeme full_name z metadata, fallback na email prefix)
                    const displayName =
                        (user.user_metadata && (user.user_metadata.full_name as string)) ||
                        (user.email ? user.email.split('@')[0] : null);

                    const {data, error: fnError} = await supabase.rpc(
                        'accept_organization_invite',
                        {
                            p_token: token,
                            p_user_name: displayName, // ✅ nový parametr
                        }
                    );

                    if (fnError) throw fnError;

                    if (data && data.length > 0) {
                        const result = data[0];
                        if (result.success) {
                            // Fetch org name
                            const {data: orgData, error: orgError} = await supabase
                                .from('organizations')
                                .select('name')
                                .eq('id', result.org_id)
                                .single();

                            if (!orgError && orgData) {
                                setOrgName(orgData.name);
                            }

                            setSuccess(true);

                            // ✅ refresh auth context orgs pro tohoto usera
                            try {
                                await refreshOrganizations(user.id);
                            } catch (e) {
                                console.error(
                                    '[AcceptInvite] Failed to refresh organizations after invite:',
                                    e
                                );
                            }

                            // Redirect after 2 seconds
                            setTimeout(() => navigate(`/${lang}/`), 2000);
                        } else {
                            setError(result.message || t('auth.failedToAcceptInvite'));
                        }
                    } else {
                        setError(t('auth.failedToAcceptInvite'));
                    }
                } catch (err: any) {
                    console.error('[AcceptInvite] Error:', err);
                    setError(err.message || t('auth.failedToAcceptInvite'));
                } finally {
                    setLoading(false);
                }
            };

            acceptInvite();
        }
    }, [user, token, navigate, refreshOrganizations]); // ✅ refetch pryč

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <p className="text-gray-600">{t('auth.redirectingToSignup')}</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-8 text-center">
                {loading && (
                    <>
                        <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin"/>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('auth.acceptingInvite')}
                        </h2>
                        <p className="text-sm text-gray-600">
                            {t('auth.pleaseWait')}
                        </p>
                    </>
                )}

                {success && !loading && (
                    <>
                        <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4"/>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('auth.welcomeTo', {orgName})}
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            {t('auth.successfullyJoined')}
                        </p>
                        <p className="text-xs text-gray-500">
                            {t('auth.redirectingToDashboard')}
                        </p>
                    </>
                )}

                {error && !loading && (
                    <>
                        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-4"/>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('auth.unableToAcceptInvite')}
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => navigate(`/${lang}/login`)}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                        >
                            {t('auth.goToLogin')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AcceptInvite;
