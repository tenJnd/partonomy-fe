import {useEffect, useState} from "react";
import {BarChart3, CheckCircle2, ChevronRight, Clock, FileText, TrendingUp, Upload, Zap} from "lucide-react";

const Landing = () => {
    const [scrollY, setScrollY] = useState(0);
    const [activeDemo, setActiveDemo] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveDemo((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const demoDocuments = [
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 text-slate-900">
            {/* Header stays the same... */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrollY > 50 ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
            }`}>
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
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
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">
                            Jak to funguje
                        </a>
                        <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">
                            Funkce
                        </a>
                        <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
                            Ceník
                        </a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                            Přihlásit
                        </button>
                        <button
                            className="group px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5">
                            Vyzkoušet zdarma
                            <ChevronRight
                                className="inline-block ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero section */}
            <main className="pt-24">
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div
                            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
                        <div
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    </div>

                    <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Left content */}
                            <div className="space-y-8">
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100/50 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                                    <span className="text-xs font-medium text-blue-900">
                    AI asistent pro zpracování obrázkových výkresů ve strojírenství
                  </span>
                                </div>

                                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  <span
                      className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                    Zkraťte zpracování RFQ výkresů
                  </span>
                                    <br/>
                                    <span
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    z 20 minut na 3
                  </span>
                                </h1>

                                <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                                    Partonomy automaticky přečte strojírenský výkres, vytáhne klíčové metadata,{" "}
                                    výrobní náročnost a další a pomůže vám rychle rozhodnout –{" "}
                                    <span className="font-semibold text-slate-900">vyplatí se nacenit, nebo rovnou odmítnout</span>.{" "}
                                    Každým nahraným výkresem si zároveň budujete databázi dílů v jednotném,
                                    serializovaném formátu.
                                </p>

                                <div className="flex flex-wrap items-center gap-4">
                                    <button
                                        className="group px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-1">
                                        Nahrát první výkres
                                        <Upload
                                            className="inline-block ml-2 w-5 h-5 group-hover:translate-y-0.5 transition-transform"/>
                                    </button>
                                    <button
                                        className="px-8 py-4 text-base font-medium text-slate-700 hover:text-slate-900 transition-colors group">
                                        Přihlásit se do účtu
                                        <ChevronRight
                                            className="inline-block ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-6 pt-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-600"/>
                                        <div>
                                            <div className="text-2xl font-bold text-slate-900">až 80%</div>
                                            <div className="text-xs text-slate-600">úspora času</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-600"/>
                                        <div>
                                            <div className="text-2xl font-bold text-slate-900">15–20h</div>
                                            <div className="text-xs text-slate-600">typicky ušetřeno / měsíc</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-purple-600"/>
                                        <div>
                                            <div className="text-2xl font-bold text-slate-900">až 90%</div>
                                            <div className="text-xs text-slate-600">výkresů bez ručního přepisu</div>
                                        </div>
                                    </div>
                                </div>

                                {/*<p className="text-xs text-slate-500 text-center">*/}
                                {/*  Než dopijete kafe, máte zpracované výkresy za celý týden.*/}
                                {/*</p>*/}
                            </div>

                            {/* Right: Enhanced Documents Table Preview */}
                            <div className="relative">
                                <div
                                    className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-2xl"></div>

                                <div
                                    className="relative rounded-2xl bg-white shadow-2xl border border-slate-200/50 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                                    {/* Browser chrome */}
                                    <div
                                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        </div>
                                        <div
                                            className="flex-1 mx-3 h-7 rounded-md bg-white border border-slate-200 flex items-center px-3 text-xs text-slate-400">
                                            partonomy.app/documents
                                        </div>
                                    </div>

                                    {/* Documents Table */}
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
                                        </div>

                                        {/* Table-like rows with more columns */}
                                        <div className="space-y-2">
                                            {demoDocuments.map((doc, idx) => (
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
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">Jak to funguje</h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Tři jednoduché kroky k rychlejšímu rozhodování.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {/* Connection lines */}
                            <div
                                className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>

                            {[
                                {
                                    step: "01",
                                    title: "Nahrajete výkresy",
                                    desc: "Jednoduše nahrajete výkresy jako PDF, TIFF, PNG nebo JPEG – funguje to i na běžné scany z mailu. Doporučujeme: 1 díl = 1 strana pro nejlepší výsledky.",
                                    icon: Upload,
                                    color: "blue"
                                },
                                {
                                    step: "02",
                                    title: "AI výkres přečte",
                                    desc: "Systém vytáhne materiál, rozměry, tolerance, GD&T a identifikuje kritická místa a cost drivery. Metadata ukládáme ve strukturované podobě, připravené pro další použití ve vašem systému.",
                                    icon: Zap,
                                    color: "purple"
                                },
                                {
                                    step: "03",
                                    title: "Rozhodnete okamžitě",
                                    desc: "Každý díl dostane přehledný report a jednoduché skóre. RFQ triage zabere minuty místo hodin. Zároveň vám z výkresů vzniká přehledná databáze dílů, se kterou můžete dál pracovat.",
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
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">Co získáte</h2>
                            <p className="text-lg text-slate-600">Řekněte sbohem manuálnímu přepisování z PDF a
                                TIFů!</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {[
                                {
                                    title: "Seznam výkresů",
                                    desc: "Všechny výkresy na jednom místě. Seřazené, označené stavem, připravené k rozhodnutí. Vidíte obálku dílu, základní popis, výrobní náročnost a to, jak dobře díl zapadá do vašich možností.",
                                    icon: FileText,
                                    gradient: "from-blue-500 to-blue-600"
                                },
                                {
                                    title: "Rychlé zhodnocení výrobní náročnosti",
                                    desc: "AI hledá kritické tolerance, GD&T, povrchové/tepelné úpravy a další typické nákladové faktory. Výsledkem je stručný, srozumitelný report pro každý díl – v jazyce vašeho týmu. Navíc, můžete report hned exportovat například do excelu.",
                                    icon: BarChart3,
                                    gradient: "from-purple-500 to-purple-600"
                                },
                                {
                                    title: "Automatická klasifikace dílů",
                                    desc: "Systém automaticky rozpozná taxonomii dílu a přiřadí score (náročnost, risk, alignment) podle obvyklých strojírenských kritérií. Všechny tyto informace ukládáme jako strukturovaná data – každým výkresem si tak budujete vlastní databázi dílů.",
                                    icon: Zap,
                                    gradient: "from-emerald-500 to-emerald-600"
                                },
                                {
                                    title: "Výstup nastavený přímo pro vaši firmu",
                                    desc: "Jednoduše slovně popíšete profil vaší dílny – jaké materiály obrábíte, jaké tolerance preferujete a v čem jste silní. Systém pak u každého dílu vyhodnotí shop alignment podle toho, jak dobře odpovídá vašim možnostem. 'Kooperacace nebo to zvládneme sami?'",
                                    icon: BarChart3,
                                    gradient: "from-amber-500 to-amber-600"
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
                            Partonomy je aktuálně v režimu <span
                            className="font-semibold text-slate-700">Early Access</span>. Zaměřujeme se na RFQ
                            (poptávky) pro
                            obrábění a výrobu a postupně přidáváme další funkce podle zpětné vazby od prvních uživatelů.
                        </p>
                    </div>
                </section>

                {/* Pricing with enhanced cards */}
                <section id="pricing" className="py-20 bg-white">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">Jednoduchý ceník</h2>
                            <p className="text-lg text-slate-600">Začněte zdarma, plaťte podle potřeby</p>
                            <p className="text-sm text-slate-500 mt-2">
                                Platíte jen za <span className="font-semibold">uživatele</span> a <span
                                className="font-semibold">počet zpracovaných výkresů/stránek</span>. Žádné skryté
                                moduly, žádné konzultační balíčky.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {/* Starter plan */}
                            <div
                                className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 hover:border-slate-300 transition-all hover:shadow-xl">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold text-slate-900">$99</span>
                                        <span className="text-slate-600">/ 80 výkresů</span>
                                    </div>
                                    <p className="mt-4 text-slate-600">
                                        Ideální pro menší dílny a pilotní provoz
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {[
                                        "80 výkresů/stránek měsíčně",
                                        "1 uživatel",
                                        "Analýza výkresů z rastrových PDF/obrázků",
                                        "Přehledný seznam zpracovaných dokumentů",
                                        "Rychlé shrnutí a report pro každý díl",
                                        "Email podpora"
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"/>
                                            <span className="text-slate-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className="w-full py-4 px-6 rounded-xl font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Začít se Starterem
                                </button>
                            </div>

                            {/* Pro plan - featured */}
                            <div
                                className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-500 shadow-2xl shadow-blue-600/30 transform md:scale-105">
                                <div
                                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 text-sm font-bold rounded-full">
                                    Nejoblíbenější
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold text-white">$449</span>
                                        <span className="text-blue-100">/ 500 výkresů</span>
                                    </div>
                                    <p className="mt-4 text-blue-100">
                                        Pro firmy s desítkami až stovkami výkresů měsíčně
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {[
                                        "Vše ze Starter plánu",
                                        "500 výkresů/stránek měsíčně",
                                        "10 uživatelů",
                                        // "API a SharePoint konektory",
                                        "Prioritní podpora",
                                        // "Custom branding"
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-blue-200 mt-0.5 flex-shrink-0"/>
                                            <span className="text-white">{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className="w-full py-4 px-6 rounded-xl font-semibold text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-lg"
                                >
                                    Přejít na Pro
                                </button>
                            </div>
                        </div>

                        <p className="text-center mt-12 text-sm text-slate-600">
                            Potřebujete větší objem nebo on-premise řešení?{" "}
                            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                                Kontaktujte nás →
                            </a>
                        </p>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
                    <div
                        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"
                    ></div>

                    <div className="relative mx-auto max-w-4xl px-6 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Připraveni ušetřit desítky hodin měsíčně?
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            Začněte analyzovat výkresy za 3 minuty místo 20.
                            První měsíc zdarma, žádná kreditka, žádné závazky.
                        </p>
                        <button
                            className="group px-10 py-5 text-lg font-bold text-slate-900 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1"
                        >
                            Začít zdarma
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
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
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
