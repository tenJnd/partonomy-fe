export type AppLang = "en" | "cs" | "de";

export const SUPPORTED_LANGS: AppLang[] = ["en", "cs", "de"];

export function normalizeLang(input?: string | null): AppLang | null {
    if (!input) return null;
    const v = input.toLowerCase();
    if (v === "cz") return "cs"; // kdybys někde měl staré "cz"
    if (SUPPORTED_LANGS.includes(v as AppLang)) return v as AppLang;
    return null;
}

export function detectBrowserLang(): AppLang {
    // navigator.language: "cs-CZ", "de-DE", "en-US"...
    const raw = (navigator.language || "en").toLowerCase();
    const base = raw.split("-")[0];
    return normalizeLang(base) ?? "en";
}
