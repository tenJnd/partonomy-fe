import React, {useState} from 'react';
import {Building2, Save} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import SettingsShell from '../components/SettingsShell';
import MembersList from '../components/MembersList';
import InviteModal from '../components/InviteModal';

const OrganizationSettings: React.FC = () => {
    const {currentOrg, user} = useAuth();
    const canManageOrg = currentOrg?.role === 'owner' || currentOrg?.role === 'admin';

    const [orgName, setOrgName] = useState(currentOrg?.organization.name || '');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);

    if (!currentOrg || !user) {
        return <div className="p-6 max-w-4xl mx-auto">Loading...</div>;
    }

    const handleSaveOrgName = async () => {
        if (!currentOrg || !orgName.trim() || !canManageOrg) return;

        setSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        const {error} = await supabase
            .from('organizations')
            .update({name: orgName.trim()})
            .eq('id', currentOrg.org_id);

        setSaving(false);

        if (error) {
            setSaveError(error.message);
        } else {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            window.location.reload();
        }
    };

    return (
        <SettingsShell
            title="Organization"
            description="Manage organization name and team members."
            canManageOrg={canManageOrg}
            saveError={saveError}
            saveSuccess={saveSuccess}
        >
            <div className="space-y-6">
                {/* Organization Name */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Organization</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage organization details
                        </p>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-400" strokeWidth={1.5}/>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Organization Name</div>
                                <div className="text-xs text-gray-500">Update your organization name</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={orgName}
                                onChange={e => setOrgName(e.target.value)}
                                className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm min-w-[200px]"
                            />
                            <button
                                onClick={handleSaveOrgName}
                                disabled={
                                    saving ||
                                    !orgName.trim() ||
                                    orgName === currentOrg.organization.name
                                }
                                className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Save className="w-4 h-4"/>
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Members */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Members</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage team members and permissions
                        </p>
                    </div>
                    <div className="p-6 space-y-4">
                        <MembersList
                            orgId={currentOrg.org_id}
                            currentUserRole={currentOrg.role}
                            currentUserId={user.id}
                        />

                        <div className="pt-4 border-t border-gray-100 flex justify-center">
                            <button
                                onClick={() => setInviteModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                            >
                                Invite Member
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <InviteModal
                orgId={currentOrg.org_id}
                isOpen={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                onInviteCreated={() => {
                }}
            />
        </SettingsShell>
    );
};

export default OrganizationSettings;
