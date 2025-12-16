import {Link, useLocation} from "react-router-dom";
import {useEffect, useState} from "react";

const InsightsRFQ = () => {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

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
                    <Link to="/" className="font-bold text-lg">
                        Partonomy.ai
                    </Link>

                    <Link
                        to="/"
                        className="text-sm text-slate-600 hover:text-slate-900"
                    >
                        Zpět na hlavní stránku
                    </Link>
                </div>
            </header>

            {/* Article */}
            <article className="mx-auto max-w-4xl px-6 py-16 space-y-16">
                {/* H1 */}
                <section>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Proč je zpracování RFQ výkresů ve strojírenství tak náročné
                        <br/>
                        <span className="text-slate-500 text-3xl font-semibold">
              (a jak se to dá výrazně zjednodušit)
            </span>
                    </h1>

                    <p className="text-lg text-slate-600 leading-relaxed">
                        Zpracování poptávek (RFQ) je ve strojírenských firmách často jedním
                        z největších úzkých míst. Ne proto, že by lidé nevěděli, co dělají,
                        ale proto, že objem práce roste, zatímco kapacity a nástroje
                        zůstávají stejné.
                    </p>
                </section>

                {/* RFQ problem */}
                <section id="rfq-problem" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">
                        Proč je dnes zpracování RFQ výkresů takový problém?
                    </h2>

                    <p className="leading-relaxed">
                        Ve většině výrobních firem platí podobný scénář. RFQ přicházejí
                        ve velkém objemu, často pod časovým tlakem, a každý výkres je jiný.
                        Rozhodnutí, zda se zakázkou vůbec zabývat, musí přijít rychle.
                    </p>

                    <p className="leading-relaxed">
                        Odpovědnost přitom často leží na jednom nebo dvou klíčových lidech –
                        technologovi, poptávkáři nebo seniorovi ve výrobě. Tito lidé se
                        stávají úzkým hrdlem celého procesu.
                    </p>

                    <p className="leading-relaxed">
                        Každé RFQ znamená otevřít výkres, pochopit ho, zasadit do kontextu
                        výroby a udělat první kvalifikované rozhodnutí. A to opakovaně,
                        několikrát denně.
                    </p>
                </section>

                {/* Raster drawings */}
                <section id="rastr-drawings" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">
                        Proč většina RFQ přichází jako rastrové výkresy v e-mailu?
                    </h2>

                    <p className="leading-relaxed">
                        V prezentacích se často mluví o CAD datech, digitálních dvojčatech
                        a propojených systémech. Realita RFQ procesů je ale výrazně
                        prozaičtější.
                    </p>

                    <p className="leading-relaxed">
                        Většina poptávek přijde e-mailem jako příloha – PDF, TIFF, PNG,
                        někdy i jako scan starší dokumentace. Tyto výkresy nejsou
                        strukturované a nejsou strojově čitelné.
                    </p>

                    <p className="leading-relaxed">
                        Nejde o ideální stav, ale o realitu dodavatelských řetězců.
                        A je velmi nepravděpodobné, že by se v dohledné době zásadně změnila.
                    </p>
                </section>

                {/* Manual rewrite */}
                <section id="manual-transcript" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">
                        Co všechno se dnes z výkresu ručně přepisuje?
                    </h2>

                    <p className="leading-relaxed">
                        Aby bylo možné se nad zakázkou rozhodnout, musí někdo z výkresu
                        ručně získat klíčové informace:
                    </p>

                    <ul className="list-disc pl-6 space-y-1">
                        <li>typ součástky</li>
                        <li>základní rozměry a obálku</li>
                        <li>materiál</li>
                        <li>tolerance a GD&amp;T</li>
                        <li>poznámky k povrchu nebo teplu</li>
                        <li>revizi výkresu</li>
                    </ul>

                    <p className="leading-relaxed">
                        Tyto informace se pak zapisují do ERP, Excelů nebo poznámek.
                        Každý jiným způsobem, bez jednotné struktury. Stejná práce se
                        opakuje znovu a znovu.
                    </p>
                </section>

                {/* Chaos */}
                <section id="chaos-in-drawings" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">
                        Proč jsou výkresy rozházené po složkách a nikdo se v nich nevyzná?
                    </h2>

                    <p className="leading-relaxed">
                        Po několika měsících provozu to ve firmách často vypadá stejně:
                        výkresy v e-mailech, lokálních složkách, na sdílených discích.
                    </p>

                    <p className="leading-relaxed">
                        Chybí jednotný přehled, historie rozhodnutí i možnost se k výkresům
                        rychle vrátit. Každá nová RFQ se řeší, jako by byla první v historii.
                    </p>
                </section>

                {/* Taxonomy */}
                <section id="taxonomy" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">
                        Proč chybí jednotná taxonomie a přehled o dílech?
                    </h2>

                    <p className="leading-relaxed">
                        Každý výkres je popsán trochu jinak. Někdo píše „hřídel“, jiný „osa“,
                        další „shaft“. Bez jednotné taxonomie není možné data analyzovat
                        ani se z nich učit.
                    </p>

                    <p className="leading-relaxed">
                        Přitom právě historie výkresů a rozhodnutí má obrovskou hodnotu.
                        Jen je zamčená v nestrukturovaných dokumentech.
                    </p>
                </section>

                {/* First minutes */}
                <section id="firts-minutes" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">
                        Co se dá rozhodnout už v prvních minutách nad výkresem?
                    </h2>

                    <p className="leading-relaxed">
                        Zkušený technolog často během několika minut ví, zda díl zapadá
                        do výroby, jestli je rizikový nebo jestli nemá smysl ho vůbec
                        nacenit.
                    </p>

                    <p className="leading-relaxed">
                        Problém není v rozhodování samotném, ale v tom, že každé rozhodnutí
                        stojí čas a mentální kapacitu – a těch rozhodnutí je denně mnoho.
                    </p>
                </section>

                {/* RFQ triage */}
                <section id="rfq-triage" className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">
                        Jak může automatizace zrychlit poptávkovou fázi (RFQ triage)?
                    </h2>

                    <p className="leading-relaxed">
                        Pokud by byl výkres automaticky analyzován, klíčové informace
                        strukturované a výsledek k dispozici během minut, změnil by se celý
                        charakter poptávkové fáze.
                    </p>

                    <p className="leading-relaxed">
                        Z ručního zpracování každého výkresu by se stalo rychlé
                        rozhodování nad hotovými informacemi.
                    </p>
                </section>

                {/* Partonomy */}
                <section id="partonomy" className="scroll-mt-24 space-y-6">
                    <h2 className="text-2xl font-bold">
                        Kde do toho zapadá Partonomy
                    </h2>

                    <p className="leading-relaxed">
                        Partonomy vzniklo přímo z této reality. Nezaměřuje se jen na
                        „přečtení“ výkresu, ale na skutečné porozumění součástce a jejím
                        výrobním dopadům.
                    </p>

                    <ul className="list-disc pl-6 space-y-2">
                        <li>shrnutí výkresu a hlavní highlights</li>
                        <li>identifikace kritických míst a cost driverů</li>
                        <li>předpokládaný výrobní postup</li>
                        <li>personalizovaná doporučení podle profilu firmy</li>
                        <li>detekce změn revizí výkresů</li>
                        <li>přehledný seznam výkresů a RFQ workflow</li>
                    </ul>

                    <p className="leading-relaxed">
                        Cílem není nahradit technologa, ale odstranit manuální přepisování,
                        snížit chaos a uvolnit kapacitu lidí pro rozhodnutí, která skutečně
                        vyžadují jejich zkušenost.
                    </p>
                </section>

                {/* CTA */}
                <section className="pt-10 border-t border-slate-200">
                    <Link
                        to="/"
                        className="inline-block text-blue-600 font-semibold hover:underline"
                    >
                        ← Zpět na hlavní stránku
                    </Link>
                </section>
            </article>
        </main>
    );
};

export default InsightsRFQ;
