import {Link as RouterLink, LinkProps, useNavigate} from 'react-router-dom';
import {useLang} from '../hooks/useLang';
import type {AppLang} from '../i18n/lang';

/**
 * Language-aware Link component
 * Automatically prepends current language prefix to all internal links
 */
export function LangLink({to, ...props}: LinkProps) {
  const lang = useLang();
  const prefixedTo = typeof to === 'string' && !to.startsWith('/')
    ? `/${lang}/${to}`
    : typeof to === 'string'
      ? `/${lang}${to}`
      : to;

  return <RouterLink to={prefixedTo} {...props} />;
}

/**
 * Hook for language-aware navigation
 */
export function useLangNavigate(): (path: string) => void {
  const lang = useLang();
  const navigate = useNavigate();

  return (path: string) => {
    const prefixedPath = path.startsWith('/') ? `/${lang}${path}` : `/${lang}/${path}`;
    navigate(prefixedPath);
  };
}

/**
 * Utility to build language-aware paths
 */
export function buildLangPath(lang: AppLang, path: string): string {
  return path.startsWith('/') ? `/${lang}${path}` : `/${lang}/${path}`;
}
