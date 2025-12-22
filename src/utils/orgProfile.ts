export type OrgProfileLike = {
    report_lang?: string | null;
    profile_text?: string | null;
};

export function normalizeReportLang(lang?: string | null): string {
    return (lang ?? "en").trim().toLowerCase() || "en";
}

export function isOrgProfileComplete(profile?: OrgProfileLike | null): boolean {
    // pro personalizaci je klíčový text profilu
    return Boolean(profile?.profile_text && profile.profile_text.trim().length > 0);
}

export function isReportLangSet(profile?: OrgProfileLike | null): boolean {
    // bereme "en" jako default i když není záznam v DB
    const l = normalizeReportLang(profile?.report_lang);
    return l.length > 0; // vždy true, ale nechávám sem pro budoucí logiku
}
