import {useEffect} from "react";
import {Navigate, Outlet, useLocation, useParams} from "react-router-dom";
import {type AppLang, detectBrowserLang, normalizeLang} from "../i18n/lang";
import {changeLanguage} from "../i18n/i18n";

function setUiLanguage(lang: AppLang) {
    localStorage.setItem("ui_lang", lang);
    changeLanguage(lang);
}

export default function LanguageLayout() {
    const {lang} = useParams();
    const location = useLocation();

    const normalized = normalizeLang(lang);
    if (!normalized) {
        const stored = normalizeLang(localStorage.getItem("ui_lang"));
        const best = stored ?? detectBrowserLang();
        return <Navigate to={`/${best}${location.pathname}${location.search}`} replace/>;
    }

    useEffect(() => {
        setUiLanguage(normalized);
    }, [normalized]);

    return <Outlet/>;
}
