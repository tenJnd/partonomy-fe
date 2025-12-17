import {Link, useLocation} from "react-router-dom";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useLang} from "../hooks/useLang.ts";

const InsightsRFQ = () => {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const {t} = useTranslation();
    const lang = useLang();

    useEffect(() => {
        if (!location.hash) {
            window.scrollTo({top: 0, behavior: "smooth"});
            return;
        }

        const id = decodeURIComponent(location.hash.replace("#", ""));
        requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({behavior: "smooth", block: "start"});
            }
        });
    }, [location.hash]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const homePath = `/${lang}`;

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header */}
            <header
                className={`sticky top-0 z-40 transition-all ${
                    scrolled
                        ? "bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm"
                        : "bg-white"
                }`}
            >
                <div className="mx-auto max-w-4xl px-6 py-6 flex justify-between items-center">
                    <Link to={homePath} className="font-bold text-lg">
                        {t("insightsRFQ.header.brand")}
                    </Link>

                    <Link to={homePath} className="text-sm text-slate-600 hover:text-slate-900">
                        {t("insightsRFQ.header.back")}
                    </Link>
                </div>
            </header>

            {/* Article */}
            <article className="mx-auto max-w-4xl px-6 py-16 space-y-16">
                {/* H1 */}
                <section>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        {t("insightsRFQ.intro.title")}
                        <br/>
                        <span className="text-slate-500 text-3xl font-semibold">
              {t("insightsRFQ.intro.subtitle")}
            </span>
                    </h1>

                    <p className="text-lg text-slate-600 leading-relaxed">
                        {t("insightsRFQ.intro.lead")}
                    </p>
                </section>

                {/* RFQ problem */}
                <section id="rfq-problem" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">{t("insightsRFQ.sections.rfqProblem.title")}</h2>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.rfqProblem.p1")}</p>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.rfqProblem.p2")}</p>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.rfqProblem.p3")}</p>
                </section>

                {/* Raster drawings */}
                <section id="rastr-drawings" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">{t("insightsRFQ.sections.rasterDrawings.title")}</h2>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.rasterDrawings.p1")}</p>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.rasterDrawings.p2")}</p>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.rasterDrawings.p3")}</p>
                </section>

                {/* Manual rewrite */}
                <section id="manual-transcript" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">{t("insightsRFQ.sections.manualTranscript.title")}</h2>

                    <p className="leading-relaxed">{t("insightsRFQ.sections.manualTranscript.intro")}</p>

                    <ul className="list-disc pl-6 space-y-1">
                        <li>{t("insightsRFQ.sections.manualTranscript.list.item1")}</li>
                        <li>{t("insightsRFQ.sections.manualTranscript.list.item2")}</li>
                        <li>{t("insightsRFQ.sections.manualTranscript.list.item3")}</li>
                        <li>{t("insightsRFQ.sections.manualTranscript.list.item4")}</li>
                        <li>{t("insightsRFQ.sections.manualTranscript.list.item5")}</li>
                        <li>{t("insightsRFQ.sections.manualTranscript.list.item6")}</li>
                    </ul>

                    <p className="leading-relaxed">{t("insightsRFQ.sections.manualTranscript.outro")}</p>
                </section>

                {/* Chaos */}
                <section id="chaos-in-drawings" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">{t("insightsRFQ.sections.chaos.title")}</h2>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.chaos.p1")}</p>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.chaos.p2")}</p>
                </section>

                {/* Taxonomy */}
                <section id="taxonomy" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">{t("insightsRFQ.sections.taxonomy.title")}</h2>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.taxonomy.p1")}</p>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.taxonomy.p2")}</p>
                </section>

                {/* First minutes */}
                <section id="firts-minutes" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">{t("insightsRFQ.sections.firstMinutes.title")}</h2>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.firstMinutes.p1")}</p>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.firstMinutes.p2")}</p>
                </section>

                {/* RFQ triage */}
                <section id="rfq-triage" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">{t("insightsRFQ.sections.rfqTriage.title")}</h2>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.rfqTriage.p1")}</p>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.rfqTriage.p2")}</p>
                </section>

                {/* Partonomy */}
                <section id="partonomy" className="scroll-mt-24 space-y-6">
                    <h2 className="text-2xl font-bold">{t("insightsRFQ.sections.partonomy.title")}</h2>
                    <p className="leading-relaxed">{t("insightsRFQ.sections.partonomy.p1")}</p>

                    <ul className="list-disc pl-6 space-y-2">
                        <li>{t("insightsRFQ.sections.partonomy.list.item1")}</li>
                        <li>{t("insightsRFQ.sections.partonomy.list.item2")}</li>
                        <li>{t("insightsRFQ.sections.partonomy.list.item3")}</li>
                        <li>{t("insightsRFQ.sections.partonomy.list.item4")}</li>
                        <li>{t("insightsRFQ.sections.partonomy.list.item5")}</li>
                        <li>{t("insightsRFQ.sections.partonomy.list.item6")}</li>
                    </ul>

                    <p className="leading-relaxed">{t("insightsRFQ.sections.partonomy.outro")}</p>
                </section>

                {/* CTA */}
                <section className="pt-10 border-t border-slate-200">
                    <Link to={homePath} className="inline-block text-blue-600 font-semibold hover:underline">
                        {t("insightsRFQ.sections.cta.backLink")}
                    </Link>
                </section>
            </article>
        </main>
    );
};

export default InsightsRFQ;
