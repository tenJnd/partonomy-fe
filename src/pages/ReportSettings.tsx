import React, {useEffect, useState} from 'react';
import {Building2, Save} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import SettingsShell from '../components/SettingsShell';

const ReportSettings: React.FC = () => {
    const {currentOrg} = useAuth();
    const canManageOrg = currentOrg?.role === 'owner' || currentOrg?.role === 'admin';

    const [reportLang, setReportLang] = useState('en');
    const [profileText, setProfileText] = useState('');
    const [initialReportLang, setInitialReportLang] = useState('en');
    const [initialProfileText, setInitialProfileText] = useState('');
    const [profileLoaded, setProfileLoaded] = useState(false);

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (!currentOrg || !canManageOrg) {
            setProfileLoaded(true);
            return;
        }

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
    }, [currentOrg, canManageOrg]);

    const handleSaveProfile = async () => {
        if (!currentOrg || !profileLoaded || !canManageOrg) return;

        setSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        const {data: existing} = await supabase
            .from('organization_profiles')
            .select('*')
            .eq('org_id', currentOrg.org_id)
            .single();

        let error;
        if (existing) {
            const {error: updateError} = await supabase
                .from('organization_profiles')
                .update({
                    report_lang: reportLang,
                    profile_text: profileText,
                })
                .eq('org_id', currentOrg.org_id);
            error = updateError;
        } else {
            const {error: insertError} = await supabase
                .from('organization_profiles')
                .insert({
                    org_id: currentOrg.org_id,
                    report_lang: reportLang,
                    profile_text: profileText,
                });
            error = insertError;
        }

        setSaving(false);

        if (error) {
            setSaveError(error.message);
        } else {
            setInitialReportLang(reportLang);
            setInitialProfileText(profileText);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    if (!currentOrg) {
        return <div className="p-6 max-w-4xl mx-auto">Loading...</div>;
    }

    return (
        <SettingsShell
            title="Report Settings"
            description="Configure report language and profile used to personalize outputs."
            canManageOrg={canManageOrg}
            saveError={saveError}
            saveSuccess={saveSuccess}
        >
            <div className="space-y-6">
                {/* Language */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Report Language</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Choose the language for the reports
                        </p>
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
                                onChange={e => setReportLang(e.target.value)}
                                className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                            >
                                <option value="en">English</option>
                                <option value="de">German</option>
                                <option value="cz">Czech</option>
                            </select>

                            <button
                                onClick={handleSaveProfile}
                                disabled={
                                    saving ||
                                    !profileLoaded ||
                                    reportLang === initialReportLang
                                }
                                className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Save className="w-4 h-4"/>
                                Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile text */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Organization Profile
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Your report will be personalized based on this profile.
                        </p>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* EXPLANATION BLOCK */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                            <p className="font-medium text-gray-900 mb-2">Why fill the profile?</p>
                            <p className="mb-4">
                                This information helps the system analyze how well each part <strong>aligns
                                with </strong>
                                your machining capabilities. The profile is used directly in the <strong>Shop
                                Alignment </strong>
                                section of every report (GOOD / PARTIAL / COOPERATION / LOW / UNKNOWN).
                            </p>

                            <p className="mb-4">
                                By telling us, for example, what materials you machine, what tolerances you prefer,
                                and what operations you specialize in, the system can generate more accurate and
                                realistic
                                recommendations — and your entire team will get consistent RFQ evaluations.
                            </p>

                            <p className="mb-4 font-medium text-gray-900">
                                You can write the profile in <span className="underline">your native language</span>.
                            </p>

                            <p className="font-medium text-gray-900 mb-2">Examples:</p>

                            <ul className="space-y-3">

                                <li className="pl-3 border-l-2 border-blue-300">
                                    <p className="mb-1 font-medium">Precision CNC Machining Shop</p>
                                    <p className="text-gray-600">
                                        “We specialize in high-precision CNC milling and turning of aluminum and
                                        stainless steel.
                                        We avoid tolerances below 0.01 mm.
                                        We have CMM for inspection but no grinding capabilities.”
                                    </p>
                                </li>

                                <li className="pl-3 border-l-2 border-blue-300">
                                    <p className="mb-1 font-medium">Prototype / Small-Batch Machining</p>
                                    <p className="text-gray-600">
                                        “Prototype machining 1–20 pcs. We accept complex geometries but not high-volume
                                        production.
                                        No hardened steels or grinding operations.”
                                    </p>
                                </li>

                                <li className="pl-3 border-l-2 border-blue-300">
                                    <p className="mb-1 font-medium">General CNC Turning & Milling</p>
                                    <p className="text-gray-600">
                                        “CNC turning and milling of aluminum, brass, and mild steel. Typical tolerances
                                        ±0.05 mm.
                                        No 5-axis or welding.”
                                    </p>
                                </li>

                            </ul>
                        </div>


                        {/* TEXTAREA */}
                        <textarea
                            value={profileText}
                            onChange={e => setProfileText(e.target.value)}
                            className="w-full min-h-[140px] p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none text-sm"
                            placeholder="Describe your shop: capabilities, materials, machines, tolerances, volume preferences, etc."
                        />

                        {/* SAVE BUTTON */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveProfile}
                                disabled={
                                    saving ||
                                    !profileLoaded ||
                                    profileText === initialProfileText
                                }
                                className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Save className="w-4 h-4"/>
                                Save
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </SettingsShell>
    );
};

export default ReportSettings;
