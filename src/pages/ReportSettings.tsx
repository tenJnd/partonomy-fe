import React, {useEffect, useState} from 'react';
import {Building2, Save} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import SettingsShell from '../components/SettingsShell';

const REPORT_LANGUAGES = [
    {code: "en", label: "English"},
    {code: "de", label: "German (Deutsch)"},
    {code: "cs", label: "Czech (Čeština)"},
    {code: "pl", label: "Polish (Polski)"},
    {code: "sk", label: "Slovak (Slovenčina)"},
    {code: "it", label: "Italian (Italiano)"},
    {code: "fr", label: "French (Français)"},
    {code: "es", label: "Spanish (Español)"},
    {code: "nl", label: "Dutch (Nederlands)"}
];

const ReportSettings: React.FC = () => {
    const {t} = useTranslation();
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
        return <div className="p-6 max-w-4xl mx-auto">{t('common.loading')}</div>;
    }

    const isLangSaveDisabled =
        saving ||
        !profileLoaded ||
        reportLang === initialReportLang;

    const isProfileSaveDisabled =
        saving ||
        !profileLoaded ||
        profileText === initialProfileText;

    return (
        <SettingsShell
            title={t('reportSettings.title')}
            description={t('reportSettings.description')}
            canManageOrg={canManageOrg}
            saveError={saveError}
            saveSuccess={saveSuccess}
        >
            <div className="space-y-6">
                {/* Language */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">{t('reportSettings.reportLanguageTitle')}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('reportSettings.reportLanguageDescription')}
                        </p>
                    </div>

                    {/* Mobile-first: stack */}
                    <div className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 text-gray-400 mt-0.5" strokeWidth={1.5}/>
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    {t('reportSettings.reportLanguageLabel')}
                                </div>
                            </div>
                        </div>

                        {/* Controls: stack on mobile, inline on desktop */}
                        <div className="w-full sm:w-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                            <select
                                value={reportLang}
                                onChange={e => setReportLang(e.target.value)}
                                className="h-[44px] sm:h-[38px] w-full sm:w-auto px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                            >
                                {REPORT_LANGUAGES.map(l => (
                                    <option key={l.code} value={l.code}>
                                        {l.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleSaveProfile}
                                disabled={isLangSaveDisabled}
                                className="h-[44px] sm:h-[38px] w-full sm:w-auto px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4"/>
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile text */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('reportSettings.organizationProfileTitle')}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('reportSettings.organizationProfileDescription')}
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* EXPLANATION BLOCK */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                            <p className="font-medium text-gray-900 mb-2">{t('reportSettings.whyFillProfile')}</p>
                            <p className="mb-4">
                                {t('reportSettings.profileExplanation1')}
                            </p>

                            <p className="mb-4">
                                {t('reportSettings.profileExplanation2')}
                            </p>

                            <p className="mb-4 font-medium text-gray-900">
                                {t('reportSettings.profileExplanation3')}
                            </p>

                            <p className="font-medium text-gray-900 mb-2">{t('reportSettings.examplesTitle')}</p>

                            <ul className="space-y-3">
                                <li className="pl-3 border-l-2 border-blue-300">
                                    <p className="mb-1 font-medium">{t('reportSettings.example1Title')}</p>
                                    <p className="text-gray-600">
                                        "{t('reportSettings.example1Text')}"
                                    </p>
                                </li>

                                <li className="pl-3 border-l-2 border-blue-300">
                                    <p className="mb-1 font-medium">{t('reportSettings.example2Title')}</p>
                                    <p className="text-gray-600">
                                        "{t('reportSettings.example2Text')}"
                                    </p>
                                </li>

                                <li className="pl-3 border-l-2 border-blue-300">
                                    <p className="mb-1 font-medium">{t('reportSettings.example3Title')}</p>
                                    <p className="text-gray-600">
                                        "{t('reportSettings.example3Text')}"
                                    </p>
                                </li>
                            </ul>
                        </div>

                        {/* TEXTAREA */}
                        <textarea
                            value={profileText}
                            onChange={e => setProfileText(e.target.value)}
                            className="w-full min-h-[160px] p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none text-sm"
                            placeholder={t('reportSettings.profilePlaceholder')}
                        />

                        {/* SAVE BUTTON */}
                        <div className="flex justify-stretch sm:justify-end">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isProfileSaveDisabled}
                                className="h-[44px] sm:h-[38px] w-full sm:w-auto px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4"/>
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsShell>
    );
};

export default ReportSettings;
