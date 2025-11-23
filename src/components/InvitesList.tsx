import React, {useEffect, useState} from 'react';
import {supabase} from '../lib/supabase';
import {Copy, Trash2} from 'lucide-react';

interface Invite {
    id: string;
    token: string;
    invited_email: string | null;
    role: string;
    created_at: string;
    expires_at: string;
    is_expired: boolean;
    is_accepted: boolean;
}

interface InvitesListProps {
    orgId: string;
}

const InvitesList: React.FC<InvitesListProps> = ({orgId}) => {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInvites = async () => {
            try {
                const {data, error: fnError} = await supabase.rpc(
                    'get_organization_invites',
                    {p_org_id: orgId}
                );

                if (fnError) throw fnError;
                setInvites(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadInvites();
    }, [orgId]);

    const handleDelete = async (inviteId: string) => {
        try {
            const {error} = await supabase
                .from('organization_invites')
                .delete()
                .eq('id', inviteId);

            if (error) throw error;
            setInvites(invites.filter(i => i.id !== inviteId));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const copyInviteLink = (token: string) => {
        const link = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(link);
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading invites...</div>;
    }

    if (invites.length === 0) {
        return <div className="text-center py-8 text-gray-500">No invites yet</div>;
    }

    return (
        <div className="space-y-3">
            {invites.map(invite => (
                <div
                    key={invite.id}
                    className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                                {invite.invited_email || 'Link invite'}
                            </p>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {invite.role}
              </span>
                            {invite.is_accepted && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
                  Accepted
                </span>
                            )}
                            {invite.is_expired && !invite.is_accepted && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  Expired
                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Created {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    {!invite.is_accepted && !invite.is_expired && (
                        <button
                            onClick={() => copyInviteLink(invite.token)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Copy invite link"
                        >
                            <Copy className="w-4 h-4 text-gray-600"/>
                        </button>
                    )}

                    {!invite.is_accepted && (
                        <button
                            onClick={() => handleDelete(invite.id)}
                            className="p-2 hover:bg-rose-100 rounded transition-colors"
                            title="Delete invite"
                        >
                            <Trash2 className="w-4 h-4 text-rose-600"/>
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default InvitesList;