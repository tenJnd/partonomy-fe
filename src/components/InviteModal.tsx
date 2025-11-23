import React, {useState} from 'react';
import {AlertCircle, Check, Copy, X} from 'lucide-react';
import {supabase} from '../lib/supabase';

interface InviteModalProps {
    orgId: string;
    isOpen: boolean;
    onClose: () => void;
    onInviteCreated?: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({
                                                     orgId,
                                                     isOpen,
                                                     onClose,
                                                     onInviteCreated
                                                 }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'member' | 'admin'>('member');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const {data, error: fnError} = await supabase.rpc(
                'create_organization_invite',
                {
                    p_org_id: orgId,
                    p_role: role,
                    p_invited_email: email || null,
                    p_expires_days: 7,
                }
            );

            if (fnError) throw fnError;

            if (data && data.length > 0) {
                const baseUrl = window.location.origin;
                const fullLink = `${baseUrl}/${data[0].invite_link}`;
                setInviteLink(fullLink);
                setEmail('');
                onInviteCreated?.();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create invite');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setInviteLink('');
        setEmail('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Invite Team Member</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5"/>
                            <p className="text-sm text-rose-700">{error}</p>
                        </div>
                    )}

                    {!inviteLink ? (
                        <form onSubmit={handleCreateInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (optional)
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Email is optional - just share the link
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none text-sm"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-all"
                            >
                                {loading ? 'Creating...' : 'Create Invite Link'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <p className="text-sm text-emerald-700 font-medium">✓ Invite created!</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Share this link:
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={inviteLink}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-600 truncate"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-emerald-600"/>
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-600"/>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                Link expires in 7 days. Share it with your team member.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={reset}
                                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-all"
                                >
                                    Create Another
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteModal;