import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {AlertCircle, CheckCircle, Loader} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';

const AcceptInvite: React.FC = () => {
    const {token} = useParams<{ token: string }>();
    const navigate = useNavigate();
    const {user, refreshOrganizations} = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [orgName, setOrgName] = useState('');

    useEffect(() => {
        // Pokud není user přihlášený → uložíme token a pošleme ho na signup
        if (!user && token) {
            sessionStorage.setItem('pendingInviteToken', token);
            navigate('/signup', {replace: true});
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
                            setTimeout(() => navigate('/'), 2000);
                        } else {
                            setError(result.message || 'Failed to accept invite');
                        }
                    } else {
                        setError('Failed to accept invite: No data returned');
                    }
                } catch (err: any) {
                    console.error('[AcceptInvite] Error:', err);
                    setError(err.message || 'Failed to accept invite');
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
                <p className="text-gray-600">Redirecting to signup...</p>
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
                            Accepting invite...
                        </h2>
                        <p className="text-sm text-gray-600">
                            Please wait while we process your request.
                        </p>
                    </>
                )}

                {success && !loading && (
                    <>
                        <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4"/>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            Welcome to {orgName}!
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            You've successfully joined the organization.
                        </p>
                        <p className="text-xs text-gray-500">
                            Redirecting you to dashboard...
                        </p>
                    </>
                )}

                {error && !loading && (
                    <>
                        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-4"/>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            Unable to Accept Invite
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                        >
                            Go to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AcceptInvite;
