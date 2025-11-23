import React, {useEffect, useState} from 'react';
import {AlertCircle, Building2, CheckCircle, CreditCard, Save} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import InviteModal from '../components/InviteModal';
import MembersList from '../components/MembersList';

const Settings: React.FC = () => {
    const {currentOrg, user} = useAuth();

    // --- state ---
    const [orgName, setOrgName] = useState(currentOrg?.organization.name || '');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [reportLang, setReportLang] = useState<string>('en');
    const [profileText, setProfileText] = useState<string>('');
    const [profileLoaded, setProfileLoaded] = useState(false);

    // původní hodnoty pro "dirty" check
    const [initialReportLang, setInitialReportLang] = useState<string>('en');
    const [initialProfileText, setInitialProfileText] = useState<string>('');

    const [inviteModalOpen, setInviteModalOpen] = useState(false);

    // --- load organization profile (lang + profile text) ---
    useEffect(() => {
        if (!currentOrg) return;

        const loadProfile = async () => {
            const {data, error} = await supabase
                .from('organization_profiles')
                .select('*')
                .eq('org_id', currentOrg.org_id)
                .single();

            if (!error && data) {
                const lang = data.report_lang || 'en';
                const profile = data.profile_text || '';

                setReportLang(lang);
                setInitialReportLang(lang);

                setProfileText(profile);
                setInitialProfileText(profile);
            }

            setProfileLoaded(true);
        };

        loadProfile();
    }, [currentOrg]);

    // --- save organization name ---
    const handleSaveOrgName = async () => {
        if (!currentOrg || !orgName.trim()) return;

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
            // Refresh the page to update org name in TopBar
            window.location.reload();
        }
    };

    // --- save organization profile (lang + profile text) ---
    const handleSaveProfile = async () => {
        if (!currentOrg || !profileLoaded) return;

        setSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        // Zkusíme najít existující záznam
        const {data: existing} = await supabase
            .from('organization_profiles')
            .select('*')
            .eq('org_id', currentOrg.org_id)
            .single();

        let error;

        if (existing) {
            // UPDATE
            const {error: updateError} = await supabase
                .from('organization_profiles')
                .update({
                    report_lang: reportLang,
                    profile_text: profileText
                })
                .eq('org_id', currentOrg.org_id);
            error = updateError;
        } else {
            // INSERT
            const {error: insertError} = await supabase
                .from('organization_profiles')
                .insert({
                    org_id: currentOrg.org_id,
                    report_lang: reportLang,
                    profile_text: profileText
                });
            error = insertError;
        }

        setSaving(false);

        if (error) {
            setSaveError(error.message);
        } else {
            // po úspěšném uložení posuneme "initial" hodnoty → tlačítka se zase disablují
            setInitialReportLang(reportLang);
            setInitialProfileText(profileText);

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    if (!currentOrg || !user) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <p className="text-gray-600">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            </div>

            {/* Global alerts (platí pro jakýkoliv save na stránce) */}
            <div className="mb-6 space-y-3">
                {saveError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2}/>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-rose-900">Error</p>
                            <p className="text-sm text-rose-700 mt-1">{saveError}</p>
                        </div>
                    </div>
                )}
                {saveSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2}/>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-emerald-900">Changes saved successfully!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">

                {/* Organization Settings */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Organization</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage organization details and preferences</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between py-3">
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
                                    onChange={(e) => setOrgName(e.target.value)}
                                    className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm min-w-[200px]"
                                    placeholder="Organization name"
                                />
                                <button
                                    onClick={handleSaveOrgName}
                                    disabled={saving || !orgName.trim() || orgName === currentOrg?.organization.name}
                                    className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all active:scale-[0.98] flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" strokeWidth={2}/>
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Language */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Report Language</h2>
                        <p className="text-sm text-gray-500 mt-1">Choose the language for the reports</p>
                    </div>

                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-400" strokeWidth={1.5}/>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Report Language</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={reportLang}
                                onChange={(e) => setReportLang(e.target.value)}
                                className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                            >
                                <option value="en">English</option>
                                <option value="de">German</option>
                                <option value="cz">Czech</option>
                            </select>

                            <button
                                onClick={handleSaveProfile}
                                disabled={saving || !profileLoaded || reportLang === initialReportLang}
                                className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" strokeWidth={2}/>
                                Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* Organization Profile */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Organization Profile</h2>
                        <p className="text-sm text-gray-500 mt-1">Your report will be personalized based on this
                            profile.</p>
                    </div>

                    <div className="p-6 space-y-4">
            <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                className="w-full min-h-[120px] p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none text-sm"
                placeholder="Describe your organization in your own words, capabilities, preferences, etc."
            />

                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving || !profileLoaded || profileText === initialProfileText}
                                className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" strokeWidth={2}/>
                                Save Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Members Settings */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Members</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage team members and permissions</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <MembersList
                            orgId={currentOrg.org_id}
                            currentUserRole={currentOrg.member_role}
                            currentUserId={user.id}
                        />

                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setInviteModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
                            >
                                Invite Member
                            </button>
                        </div>
                    </div>
                </div>

                {/* Billing Settings */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage subscription and billing information</p>
                    </div>
                    <div className="p-6">
                        <div className="text-center py-8">
                            <div
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-3">
                                <CreditCard className="w-4 h-4" strokeWidth={1.5}/>
                                Starter Plan
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Current plan includes basic features</p>
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-all active:scale-[0.98]">
                                Upgrade Plan
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
                    // Optional: refresh data or show success
                }}
            />
        </div>
    );
};

export default Settings;