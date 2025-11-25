import React, { useState, useEffect } from "react";
import { ChevronRight, CheckCircle2, Zap, Shield, Clock, TrendingUp, FileText, BarChart3, Upload } from "lucide-react";

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
    { name: "AKM2.pdf", cls: "BLOCK", risk: "high", status: "analyzed" },
    { name: "FR20517_RA.pdf", cls: "FLANGE", risk: "medium", status: "analyzing" },
    { name: "D52114231.pdf", cls: "SHAFT", risk: "high", status: "pending" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 text-slate-900">
      {/* Floating nav with blur effect */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 blur-md opacity-50 rounded-lg"></div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-lg">
                P
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
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
            <button className="hidden sm:block px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Přihlásit
            </button>
            <button className="group px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5">
              Vyzkoušet zdarma
              <ChevronRight className="inline-block ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero section with enhanced visuals */}
      <main className="pt-24">
        <section className="relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100/50 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  <span className="text-xs font-medium text-blue-900">
                    AI asistent pro CNC strojírenství
                  </span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                    Zkraťte zpracování RFQ výkresů
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    z 20 minut na 3
                  </span>
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                  Partonomy automaticky přečte strojírenský výkres, vytáhne klíčové parametry
                  a rizika a pomůže vám rychle rozhodnout – <span className="font-semibold text-slate-900">vyrobit nebo nevyrobit</span>.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button className="group px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-1">
                    Nahrát první výkres
                    <Upload className="inline-block ml-2 w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                  <button className="px-8 py-4 text-base font-medium text-slate-700 hover:text-slate-900 transition-colors group">
                    Přihlásit se do účtu
                    <ChevronRight className="inline-block ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-slate-900">85%</div>
                      <div className="text-xs text-slate-600">úspora času</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-2xl font-bold text-slate-900">20-25h</div>
                      <div className="text-xs text-slate-600">ušetřeno / měsíc</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold text-slate-900">95%</div>
                      <div className="text-xs text-slate-600">přesnost</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Enhanced app preview */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-2xl"></div>

                <div className="relative rounded-2xl bg-white shadow-2xl border border-slate-200/50 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 mx-3 h-7 rounded-md bg-white border border-slate-200 flex items-center px-3 text-xs text-slate-400">
                      partonomy.app/documents
                    </div>
                  </div>

                  {/* App content */}
                  <div className="p-6 space-y-6">
                    {/* Documents list */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">Recent Drawings</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                          3 new
                        </span>
                      </div>

                      <div className="space-y-2">
                        {demoDocuments.map((doc, idx) => (
                          <div
                            key={doc.name}
                            className={`p-4 rounded-lg border transition-all duration-500 ${
                              activeDemo === idx
                                ? "bg-blue-50 border-blue-200 shadow-md scale-[1.02]"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <FileText className={`w-4 h-4 ${activeDemo === idx ? "text-blue-600" : "text-slate-400"}`} />
                                <span className="font-medium text-sm text-slate-900">{doc.name}</span>
                              </div>
                              {doc.status === "analyzed" && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              )}
                              {doc.status === "analyzing" && (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {doc.cls}
                              </span>
                              <span className={`px-2 py-0.5 rounded ${
                                doc.risk === "high"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {doc.risk === "high" ? "High risk" : "Medium risk"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                        <BarChart3 className="w-4 h-4 text-blue-600 mb-1" />
                        <div className="text-lg font-bold text-slate-900">127</div>
                        <div className="text-xs text-slate-600">Analyzed</div>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
                        <Zap className="w-4 h-4 text-emerald-600 mb-1" />
                        <div className="text-lg font-bold text-slate-900">3min</div>
                        <div className="text-xs text-slate-600">Avg time</div>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
                        <Shield className="w-4 h-4 text-purple-600 mb-1" />
                        <div className="text-lg font-bold text-slate-900">94%</div>
                        <div className="text-xs text-slate-600">Accuracy</div>
                      </div>
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
                Tři jednoduché kroky k rychlejšímu rozhodování o RFQ
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection lines */}
              <div className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>

              {[
                {
                  step: "01",
                  title: "Nahrajete výkresy",
                  desc: "Drag & drop PDF, TIFF, PNG nebo JPEG výkresů. Nebo napojte SharePoint / API pro automatický import.",
                  icon: Upload,
                  color: "blue"
                },
                {
                  step: "02",
                  title: "AI výkres přečte",
                  desc: "Systém vytáhne materiál, rozměry, tolerance, GD&T a identifikuje kritická místa a cost drivery.",
                  icon: Zap,
                  color: "purple"
                },
                {
                  step: "03",
                  title: "Rozhodnete okamžitě",
                  desc: "Každý díl dostane přehledný report a complexity score. RFQ triage zabere minuty místo hodin.",
                  icon: CheckCircle2,
                  color: "emerald"
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="relative group">
                    <div className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-slate-300 transition-all hover:shadow-xl hover:-translate-y-2 duration-300">
                      <div className={`absolute -top-4 left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
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
              <p className="text-lg text-slate-600">Kompletní řešení pro zpracování RFQ výkresů</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "RFQ Drawing Inbox",
                  desc: "Všechny výkresy z mailu, SharePointu a API v jednom místě. Seřazené, označené stavem, připravené k rozhodnutí. Vidíte materiál, obálku dílu, základní popis a úroveň rizika v jedné tabulce.",
                  icon: FileText,
                  gradient: "from-blue-500 to-blue-600"
                },
                {
                  title: "Rychlé zhodnocení výrobní náročnosti",
                  desc: "AI hledá kritické tolerance, GD&T, malé závity, povrchové úpravy a další typické cost drivery. Výsledkem je stručné shrnutí pro rychlé rozhodnutí.",
                  icon: BarChart3,
                  gradient: "from-purple-500 to-purple-600"
                },
                {
                  title: "Automatická klasifikace dílů",
                  desc: "Systém automaticky rozpozná typ dílu (BLOCK, SHAFT, FLANGE...) a přiřadí complexity score podle kritérií vaší firmy.",
                  icon: Zap,
                  gradient: "from-emerald-500 to-emerald-600"
                },
                {
                  title: "Týmová spolupráce",
                  desc: "Sdílejte reporty s kolegy, přidávejte poznámky a sledujte historii změn. Všichni vidí aktuální stav každého RFQ.",
                  icon: Shield,
                  gradient: "from-amber-500 to-amber-600"
                }
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-2xl transition-all duration-300">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-6`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing with enhanced cards */}
        <section id="pricing" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Jednoduchý ceník</h2>
              <p className="text-lg text-slate-600">Začněte zdarma, plaťte podle potřeby</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Starter plan */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 hover:border-slate-300 transition-all hover:shadow-xl">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">$100</span>
                    <span className="text-slate-600">/ 80 výkresů</span>
                  </div>
                  <p className="mt-4 text-slate-600">
                    Ideální pro menší dílny a pilotní provoz
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Analýza PDF/obrázků výkresů",
                    "RFQ Drawing Inbox pro celý tým",
                    "Základní report pro každý díl",
                    "Email podpora"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full py-4 px-6 rounded-xl font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Začít se Starterem
                </button>
              </div>

              {/* Pro plan - featured */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-500 shadow-2xl shadow-blue-600/30 transform md:scale-105">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 text-sm font-bold rounded-full">
                  Nejoblíbenější
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">$449</span>
                    <span className="text-blue-100">/ 500 výkresů</span>
                  </div>
                  <p className="mt-4 text-blue-100">
                    Pro firmy s desítkami až stovkami RFQ měsíčně
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Vše ze Starter plánu",
                    "Vyšší limity výkresů",
                    "API a SharePoint konektory",
                    "Prioritní podpora",
                    "Custom branding"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-200 mt-0.5 flex-shrink-0" />
                      <span className="text-white">{item}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full py-4 px-6 rounded-xl font-semibold text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-lg">
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
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Připraveni ušetřit 10+ hodin měsíčně?
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Začněte analyzovat RFQ výkresy za 3 minuty místo 20.
              První měsíc zdarma, žádná kreditka.
            </p>
            <button className="group px-10 py-5 text-lg font-bold text-slate-900 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1">
              Začít zdarma
              <ChevronRight className="inline-block ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-xs font-bold text-white">
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