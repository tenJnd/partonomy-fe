import {useEffect} from "react";
import {Navigate, Outlet, useLocation, useParams} from "react-router-dom";
import {type AppLang, detectBrowserLang, normalizeLang} from "../i18n/lang";
import {changeLanguage} from "../i18n/i18n";

const LANG_STORAGE_KEY = "ui_lang";

function setUiLanguage(lang: AppLang) {
    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
        // ignore (private mode / disabled storage / tests)
    }
    changeLanguage(lang);
}

function getStoredLang(): AppLang | null {
    try {
        return normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
    } catch {
        return null;
    }
}

// odstraní první segment cesty, pokud je to jazyk (en/cs/de/cz/xx...)
function stripFirstPathSegment(pathname: string) {
    const parts = pathname.split("/");
    // pathname "/en/app/x" => ["", "en", "app", "x"]
    if (parts.length <= 2) return "/";
    return "/" + parts.slice(2).join("/");
}

export default function LanguageLayout() {
    const {lang} = useParams();
    const location = useLocation();

    const normalized = normalizeLang(lang);

    // invalid nebo chybějící lang prefix → vyber best lang a přesměruj, ale BEZ duplicitního prefixu
    if (!normalized) {
        const stored = getStoredLang();
        const best = stored ?? detectBrowserLang();

        const restPath = stripFirstPathSegment(location.pathname);
        return <Navigate to={`/${best}${restPath}${location.search}`} replace/>;
    }

    useEffect(() => {
        setUiLanguage(normalized);
    }, [normalized]);

    return <Outlet/>;
}
