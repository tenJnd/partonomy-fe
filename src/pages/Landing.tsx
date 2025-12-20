import {useEffect, useState} from "react";
import {
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    Languages,
    LightbulbIcon,
    Menu,
    TrendingUp,
    Upload,
    Zap
} from "lucide-react";
import {useAuth} from "../contexts/AuthContext";
import {Link, useLocation, useNavigate} from "react-router-dom";
import PricingPlans from "../components/PricingPlans";
import FaqItem from "../components/FaqItem";
import {useLang} from "../hooks/useLang";
import {type AppLang, SUPPORTED_LANGS} from "../i18n/lang";
import {useTranslation} from "react-i18next";

const DEMO_DOCUMENTS = [
    {
        name: "ANDR_02.pdf",
        company: "ANDR Corp",
        envelope: "150×100×50 mm",
        cls: "BLOCK",
        complexity: "HIGH",
        fit: "GOOD",
        status: "success"
    },
    {
        name: "RA2562_FR.tiff",
        company: "TechParts Inc",
        envelope: "200×80×30 mm",
        cls: "FLANGE",
        complexity: "MEDIUM",
        fit: "PARTIAL",
        status: "processing"
    },
    {
        name: "D52114230.tif",
        company: "Manufacturing Co",
        envelope: "120×120×80 mm",
        cls: "SHAFT",
        complexity: "HIGH",
        fit: "GOOD",
        status: "success"
    },
    {
        name: "D52114232.png",
        company: "Manufacturing Co",
        envelope: "120×120×80 mm",
        cls: "SHAFT",
        complexity: "MEDIUM",
        fit: "GOOD",
        status: "success"
    },
];

const Landing = () => {
    const [scrolled, setScrolled] = useState(false);
    const [activeDemo, setActiveDemo] = useState(0);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const {user, loading} = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const lang = useLang();
    const {t} = useTranslation();

    const location = useLocation();

    const scrollToHash = (hash: string) => {
        const id = decodeURIComponent(hash.replace("#", ""));
        const el = document.getElementById(id);
        if (!el) return;

        // offset pro fixed header (u tebe cca 96px -> pt-24)
        const headerOffset = 96;
        const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({top: offsetPosition, behavior: "smooth"});
    };

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, {passive: true});
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveDemo((prev) => (prev + 1) % DEMO_DOCUMENTS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!location.hash) return;

        // počkej na render, ať element existuje
        setTimeout(() => {
            scrollToHash(location.hash);
        }, 0);
    }, [location.hash]);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMobileMenuOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [mobileMenuOpen]);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);


    if (loading) return null;

    const handleGetStarted = () => {
        navigate(user ? `/${lang}/app/documents` : `/${lang}/signup`);
    };

    const handleLogin = () => {
        navigate(`/${lang}/login`);
    };

    const handleLanguageSwitch = (newLang: AppLang) => {
        const currentPath = window.location.pathname;
        const newPath = currentPath.replace(`/${lang}`, `/${newLang}`);
        navigate(newPath);
        setShowLangMenu(false);
    };

    const goToSection = (hash: string) => {
        window.history.pushState(null, "", `${window.location.pathname}#${hash}`);
        scrollToHash(`#${hash}`);
        setMobileMenuOpen(false);
    };

    const goToInsights = () => {
        navigate(`/${lang}/insights`);
        setMobileMenuOpen(false);
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 text-slate-900">
            {/* Header stays the same... */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
            }`}>

                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">

                    <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity min-w-0">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-600 blur-md opacity-50 rounded-lg"></div>
                            <div
                                className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-lg">
                                P
                            </div>
                        </div>

                        <span
                            className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Partonomy
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <button
                            type="button"
                            onClick={() => {
                                window.history.pushState(null, "", "/#how-it-works");
                                scrollToHash("#how-it-works");
                            }}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            {t('landing.nav.howItWorks')}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                window.history.pushState(null, "", "/#features");
                                scrollToHash("#features");
                            }}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            {t('landing.nav.features')}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                window.history.pushState(null, "", "/#pricing");
                                scrollToHash("#pricing");
                            }}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            {t('landing.nav.pricing')}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                window.history.pushState(null, "", "/#faq");
                                scrollToHash("#faq");
                            }}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            {t('landing.nav.faq')}
                        </button>

                        <Link
                            to={`/${lang}/insights`}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            {t('landing.nav.insights')}
                        </Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowLangMenu(false);
                                setMobileMenuOpen(true);
                            }}
                            className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5"/>
                        </button>

                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    setShowLangMenu((v) => !v);
                                }}
                                className="h-9 px-3 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors"
                            >
                                <Languages className="w-4 h-4"/>
                                <span className="uppercase">{lang}</span>
                            </button>

                            {showLangMenu && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                                    {SUPPORTED_LANGS.map((l) => (
                                        <button
                                            key={l}
                                            type="button"
                                            onClick={() => handleLanguageSwitch(l)}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                                l === lang
                                                    ? "bg-blue-50 text-blue-700 font-medium"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            {l === "en" ? "English" : l === "cs" ? "Čeština" : "Deutsch"}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {!user && (
                            <button
                                onClick={handleLogin}
                                className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                            >
                                {t('landing.nav.login')}
                            </button>
                        )}

                        <button
                            onClick={handleGetStarted}
                            className="group px-3.5 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5">
                            {user ? t('landing.nav.goToApp') : t('landing.nav.tryFree')}
                            <ChevronRight
                                className="inline-block ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    {/* overlay */}
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close menu"
                    />

                    {/* panel */}
                    <div className="absolute top-0 left-0 right-0 bg-white shadow-xl border-b border-slate-200">
                        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                            <div className="font-semibold text-slate-900">Menu</div>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                aria-label="Close menu"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2"
                                          strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>

                        <div className="px-2 pb-4">
                            <button
                                type="button"
                                onClick={() => goToSection("how-it-works")}
                                className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                            >
                                {t("landing.nav.howItWorks")}
                            </button>

                            <button
                                type="button"
                                onClick={() => goToSection("features")}
                                className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                            >
                                {t("landing.nav.features")}
                            </button>

                            <button
                                type="button"
                                onClick={() => goToSection("pricing")}
                                className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                            >
                                {t("landing.nav.pricing")}
                            </button>

                            <button
                                type="button"
                                onClick={() => goToSection("faq")}
                                className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                            >
                                {t("landing.nav.faq")}
                            </button>

                            <button
                                type="button"
                                onClick={goToInsights}
                                className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                            >
                                {t("landing.nav.insights")}
                            </button>

                            {!user && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleLogin();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="mt-2 w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                                >
                                    {t("landing.nav.login")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Hero section */}
            <main className="pt-24">
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div
                            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
                        <div
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:py-28">
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                            {/* Left content */}
                            <div className="space-y-6 sm:space-y-8">
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100/50 shadow-sm">
                                  <span className="relative flex h-2 w-2">
                                        <span
                                            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                  </span>
                                    <span className="text-xs font-medium text-blue-900">
                                        {t('landing.hero.badge')}
                                        </span>
                                </div>

                                <h1 className="font-bold tracking-tight leading-[1.05] text-[clamp(32px,6vw,64px)]">
                                    <span
                                        className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                                        {t('landing.hero.headline1')}
                                    </span>
                                    <span className="block sm:inline"> </span>
                                    <span
                                        className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        {t('landing.hero.headline2')}
                                    </span>
                                </h1>


                                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                                    {t('landing.hero.description')}
                                </p>

                                <div className="flex flex-wrap items-center gap-4">
                                    <button
                                        onClick={handleGetStarted}
                                        className="group px-3.5 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-1">
                                        {user ? t('landing.nav.goToApp') : t('landing.hero.uploadFirstDrawing')}
                                        <Upload
                                            className="inline-block ml-2 w-5 h-5 group-hover:translate-y-0.5 transition-transform"/>
                                    </button>
                                    {!user && (
                                        <button
                                            onClick={handleLogin}
                                            className="px-8 py-4 text-base font-medium text-slate-700 hover:text-slate-900 transition-colors group">
                                            {t('landing.hero.loginToAccount')}
                                            <ChevronRight
                                                className="inline-block ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                                        </button>)}
                                </div>

                                <div className="flex flex-wrap gap-6 pt-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-600"/>
                                        <div>
                                            <div
                                                className="text-2xl font-bold text-slate-900">{t('landing.hero.stat1Value')}</div>
                                            <div className="text-xs text-slate-600">{t('landing.hero.stat1Label')}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-600"/>
                                        <div>
                                            <div
                                                className="text-2xl font-bold text-slate-900">{t('landing.hero.stat2Value')}</div>
                                            <div className="text-xs text-slate-600">{t('landing.hero.stat2Label')}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-purple-600"/>
                                        <div>
                                            <div
                                                className="text-2xl font-bold text-slate-900">{t('landing.hero.stat3Value')}</div>
                                            <div className="text-xs text-slate-600">{t('landing.hero.stat3Label')}</div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Right: Enhanced Documents Table Preview */}
                            <div className="relative">
                                <div
                                    className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-2xl"></div>

                                <div
                                    className="relative rounded-2xl bg-white shadow-2xl border border-slate-200/50 overflow-hidden transform transition-transform duration-300 lg:hover:scale-[1.02]">
                                    {/* Browser chrome */}
                                    <div
                                        className="hidden sm:flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        </div>
                                        <div
                                            className="flex-1 mx-3 h-7 rounded-md bg-white border border-slate-200 flex items-center px-3 text-xs text-slate-400">
                                            usepartonomy.com/app/documents
                                        </div>
                                    </div>

                                    {/* Documents Table */}
                                    <div className="p-4 sm:p-6 space-y-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
                                        </div>

                                        {/* Table-like rows with more columns */}
                                        <div className="space-y-2">
                                            {DEMO_DOCUMENTS.map((doc, idx) => (
                                                <div
                                                    key={doc.name}
                                                    className={`p-3 rounded-lg border transition-all duration-500 ${
                                                        activeDemo === idx
                                                            ? "bg-blue-50/50 border-blue-200 shadow-sm"
                                                            : "bg-white border-slate-200"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {/* Thumbnail */}
                                                        <div
                                                            className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                            <FileText className="w-5 h-5 text-slate-400"/>
                                                        </div>

                                                        {/* File info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className="font-medium text-xs text-slate-900 truncate">{doc.name}</div>
                                                            <div
                                                                className="text-[10px] text-slate-500 truncate">{doc.company}</div>
                                                        </div>

                                                        {/* Envelope */}
                                                        <div
                                                            className="hidden sm:block text-[9px] font-mono text-slate-600 w-24 flex-shrink-0">
                                                            {doc.envelope}
                                                        </div>

                                                        {/* Class */}
                                                        <div className="flex justify-center w-16 flex-shrink-0">
                              <span
                                  className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px]">
                                {doc.cls}
                              </span>
                                                        </div>

                                                        {/* Complexity */}
                                                        <div className="flex justify-center w-16 flex-shrink-0">
                              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${
                                  doc.complexity === 'HIGH'
                                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}>
                                {doc.complexity}
                              </span>
                                                        </div>

                                                        {/* Fit */}
                                                        <div className="flex justify-center w-16 flex-shrink-0">
                              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${
                                  doc.fit === 'GOOD'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : doc.fit === 'PARTIAL'
                                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                                          : 'bg-gray-50 text-gray-600 border-gray-300'
                              }`}>
                                {doc.fit}
                              </span>
                                                        </div>

                                                        {/* Status icon */}
                                                        <div className="flex justify-center w-8 flex-shrink-0">
                                                            {doc.status === "success" && (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600"/>
                                                            )}
                                                            {doc.status === "processing" && (
                                                                <div
                                                                    className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it works - with animations */}
                <section id="how-it-works" className="py-20 bg-white">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">{t('landing.howItWorks.title')}</h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                {t('landing.howItWorks.subtitle')}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {/* Connection lines */}
                            <div
                                className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>

                            {[
                                {
                                    step: "01",
                                    title: t('landing.howItWorks.step1'),
                                    desc: t('landing.howItWorks.step1Desc'),
                                    icon: Upload,
                                    color: "blue"
                                },
                                {
                                    step: "02",
                                    title: t('landing.howItWorks.step2'),
                                    desc: t('landing.howItWorks.step2Desc'),
                                    icon: Zap,
                                    color: "purple"
                                },
                                {
                                    step: "03",
                                    title: t('landing.howItWorks.step3'),
                                    desc: t('landing.howItWorks.step3Desc'),
                                    icon: CheckCircle2,
                                    color: "emerald"
                                }
                            ].map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <div key={idx} className="relative group">
                                        <div
                                            className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-slate-300 transition-all hover:shadow-xl hover:-translate-y-2 duration-300">
                                            <div
                                                className={`absolute -top-4 left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 flex items-center justify-center shadow-lg`}>
                                                <Icon className="w-6 h-6 text-white"/>
                                            </div>

                                            <div className="mt-6 space-y-4">
                                                <div className="text-sm font-bold text-slate-400">{item.step}</div>
                                                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Features with visual improvements */}
                <section id="features" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">{t('landing.features.title')}</h2>
                            <p className="text-lg text-slate-600">{t('landing.features.subtitle')}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {[
                                {
                                    title: t('landing.features.list.title'),
                                    desc: t('landing.features.list.desc'),
                                    icon: FileText,
                                    gradient: "from-blue-500 to-blue-600"
                                },
                                {
                                    title: t('landing.features.list.complexity'),
                                    desc: t('landing.features.list.complexityDesc'),
                                    icon: BarChart3,
                                    gradient: "from-purple-500 to-purple-600"
                                },
                                {
                                    title: t('landing.features.list.classification'),
                                    desc: t('landing.features.list.classificationDesc'),
                                    icon: Zap,
                                    gradient: "from-emerald-500 to-emerald-600"
                                },
                                {
                                    title: t('landing.features.list.customOutput'),
                                    desc: t('landing.features.list.customOutputDesc'),
                                    icon: CheckCircle2,
                                    gradient: "from-amber-500 to-amber-600"
                                },
                                {
                                    title: t('landing.features.list.revisions'),
                                    desc: t('landing.features.list.revisionsDesc'),
                                    icon: LightbulbIcon,
                                    gradient: "from-indigo-500 to-indigo-600"
                                },
                                {
                                    title: t('landing.features.list.projects'),
                                    desc: t('landing.features.list.projectsDesc'),
                                    icon: Clock,
                                    gradient: "from-blue-500 to-blue-600"
                                }


                            ].map((feature, idx) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={idx}
                                        className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-2xl transition-all duration-300"
                                    >
                                        <div
                                            className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-6`}
                                        >
                                            <Icon className="w-6 h-6 text-white"/>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                        <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-center mt-6 text-sm text-slate-500">
                            {t('landing.features.earlyAccess')}
                        </p>
                    </div>
                </section>

                {/* Pricing with enhanced cards */}
                <PricingPlans
                    mode="landing"
                    onStartFree={handleGetStarted}
                />

                {/* FAQ */}
                <section id="faq" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
                    <div className="mx-auto max-w-4xl px-6">
                        <div className="text-center mb-14">
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">
                                {t('landing.faq.title')}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {t('landing.faq.subtitle')}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <FaqItem
                                question={t('landing.faq.q1')}
                                answer={t('landing.faq.a1')}
                            />

                            <FaqItem
                                question={t('landing.faq.q2')}
                                answer={t('landing.faq.a2')}
                            />

                            <FaqItem
                                question={t('landing.faq.q3')}
                                answer={t('landing.faq.a3')}
                            />

                            <FaqItem
                                question={t('landing.faq.q4')}
                                answer={t('landing.faq.a4')}
                            />

                            <FaqItem
                                question={t('landing.faq.q5')}
                                answer={t('landing.faq.a5')}
                            />

                            <FaqItem
                                question={t('landing.faq.q6')}
                                answer={t('landing.faq.a6')}
                            />

                        </div>
                    </div>
                </section>

                {/* Insights / Pillar article links */}
                <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50/30">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                {t('landing.insights.title')}
                            </h2>

                            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                                {t('landing.insights.subtitle')}
                            </p>

                            <div className="mt-6">
                                <Link
                                    to={`/${lang}/insights`}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
                                >
                                    {t('landing.insights.openFullArticle')}
                                    <ChevronRight className="w-4 h-4"/>
                                </Link>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <Link
                                to={`/${lang}/insights#rfq-problem`}
                                className="group p-7 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div
                                    className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg mb-5">
                                    <BarChart3 className="w-6 h-6 text-white"/>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    {t('landing.insights.card1Title')}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {t('landing.insights.card1Desc')}
                                </p>
                                <div
                                    className="mt-4 text-sm font-semibold text-blue-700 group-hover:text-blue-800 inline-flex items-center gap-1">
                                    {t('landing.insights.card1Link')} <ChevronRight className="w-4 h-4"/>
                                </div>
                            </Link>

                            <Link
                                to={`/${lang}/insights#rastr-drawings`}
                                className="group p-7 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div
                                    className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg mb-5">
                                    <FileText className="w-6 h-6 text-white"/>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    {t('landing.insights.card2Title')}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {t('landing.insights.card2Desc')}
                                </p>
                                <div
                                    className="mt-4 text-sm font-semibold text-blue-700 group-hover:text-blue-800 inline-flex items-center gap-1">
                                    {t('landing.insights.card1Link')} <ChevronRight className="w-4 h-4"/>
                                </div>
                            </Link>

                            <Link
                                to={`/${lang}/insights#partonomy`}
                                className="group p-7 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div
                                    className="inline-flex p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg mb-5">
                                    <Zap className="w-6 h-6 text-white"/>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    {t('landing.insights.card3Title')}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {t('landing.insights.card3Desc')}
                                </p>
                                <div
                                    className="mt-4 text-sm font-semibold text-blue-700 group-hover:text-blue-800 inline-flex items-center gap-1">
                                    {t('landing.insights.card1Link')} <ChevronRight className="w-4 h-4"/>
                                </div>
                            </Link>
                        </div>

                        <div className="mt-8 text-sm text-slate-500">
                            {t('landing.insights.tip')}
                        </div>
                    </div>
                </section>


                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
                    <div
                        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"
                    ></div>

                    <div className="relative mx-auto max-w-4xl px-6 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            {t('landing.cta.title')}
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            {t('landing.cta.subtitle')}
                        </p>
                        <button
                            onClick={handleGetStarted}
                            className="group px-10 py-5 text-lg font-bold text-slate-900 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1"
                        >
                            {user ? t('landing.nav.goToApp') : t('landing.cta.startFree')}
                            <ChevronRight
                                className="inline-block ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform"
                            />
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800">
                <div className="mx-auto max-w-7xl px-6 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-xs font-bold text-white"
                            >
                                P
                            </div>
                            <span className="text-sm font-bold text-white">Partonomy</span>
                        </div>

                        <div className="flex gap-8 text-sm text-slate-400">
                            <a href="#" className="hover:text-white transition-colors">{t('landing.footer.privacy')}</a>
                            <a href="#" className="hover:text-white transition-colors">{t('landing.footer.terms')}</a>
                            <a href="#" className="hover:text-white transition-colors">{t('landing.footer.contact')}</a>
                        </div>

                        <div className="text-sm text-slate-400">
                            © {new Date().getFullYear()} Partonomy
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
