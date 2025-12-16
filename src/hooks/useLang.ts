import { useParams } from "react-router-dom";
import { normalizeLang, type AppLang } from "../i18n/lang";

export function useLang(): AppLang {
  const { lang } = useParams();
  return normalizeLang(lang) ?? "en";
}
