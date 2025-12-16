import React, {useState} from 'react';
import {AlertCircle, Building2, Save} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import SettingsShell from '../components/SettingsShell';
import MembersList from '../components/MembersList';
import InviteModal from '../components/InviteModal';
import {useOrgBilling} from "../hooks/useOrgBilling";
import {useOrgMembersCount} from "../hooks/useOrgMembersCount";
import {formatTierLabel} from "../utils/tiers";

const OrganizationSettings: React.FC = () => {
    const {t} = useTranslation();
    const {currentOrg, user} = useAuth();
    const canManageOrg = currentOrg?.role === 'owner' || currentOrg?.role === 'admin';

    const {billing} = useOrgBilling();
    const {count: membersCount, loading: membersLoading} = useOrgMembersCount(
        currentOrg?.org_id
    );

    const maxUsers = billing?.tier?.max_users ?? null;

// můžou se přidávat další uživatelé?
    const canInviteMore =
        canManageOrg &&
        !membersLoading &&
        (maxUsers == null || membersCount < maxUsers);


    const [orgName, setOrgName] = useState(currentOrg?.organization.name || '');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);

    if (!currentOrg || !user) {
        return <div className="p-6 max-w-4xl mx-auto">{t('common.loading')}</div>;
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
            title={t('organizationSettings.title')}
            description={t('organizationSettings.description')}
            canManageOrg={canManageOrg}
            saveError={saveError}
            saveSuccess={saveSuccess}
        >
            <div className="space-y-6">
                {/* Organization Name */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.title')}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('organizationSettings.organizationDetails')}
                        </p>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-400" strokeWidth={1.5}/>
                            <div>
                                <div className="text-sm font-medium text-gray-900">{t('organizationSettings.organizationName')}</div>
                                <div className="text-xs text-gray-500">{t('organizationSettings.updateOrganizationName')}</div>
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
                                {saving ? t('common.saving') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Members */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.members')}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('organizationSettings.membersDescription')}
                        </p>
                    </div>
                    <div className="p-6 space-y-4">
                        <MembersList
                            orgId={currentOrg.org_id}
                            currentUserRole={currentOrg.role}
                            currentUserId={user.id}
                        />

                        <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
                            <button
                                onClick={() => canInviteMore && setInviteModalOpen(true)}
                                disabled={!canInviteMore}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    canInviteMore
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                }`}
                            >
                                {t('organizationSettings.inviteMember')}
                            </button>

                            {maxUsers != null && membersCount >= maxUsers && (
                                <div
                                    className="mb-2 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" strokeWidth={1.5}/>
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">
                                            {t('organizationSettings.reachedMemberLimit')}{" "}
                                            {billing?.tier ? formatTierLabel(billing.tier.code) : t('organizationSettings.plan')}.
                                        </p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            {t('organizationSettings.currentMembers')}: {membersCount} / {maxUsers}. {t('organizationSettings.upgradeToInvite')}
                                        </p>
                                    </div>
                                </div>
                            )}
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
