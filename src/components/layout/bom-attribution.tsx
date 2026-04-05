export function BomAttribution() {
  return (
    <footer className="border-t border-slate-200 bg-[#0B1F2A] text-slate-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">LINEUP</p>
          <p className="mt-1 text-2xl font-semibold text-white">Know when it’s on.</p>
          <p className="mt-2 text-sm text-white/70">Decision-first surf forecasting for Australia. Scores, calls, and AI-powered reports right when you need them.</p>
        </div>
        <div className="text-sm text-white/70">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Data sources</p>
          <p>Weather data © Commonwealth of Australia, Bureau of Meteorology.</p>
          <p>Marine conditions from Open-Meteo, tides from local harbors.</p>
          <a
            href="http://www.bom.gov.au/other/copyright.shtml"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex text-xs text-white/60 underline"
          >
            Bureau copyright notice
          </a>
        </div>
        <div className="text-sm text-white/80">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Stay in the lineup</p>
          <a href="mailto:team@lineup.app" className="text-white hover:text-[#2E8BC0]">team@lineup.app</a>
          <p className="text-xs text-white/60">© {new Date().getFullYear()} LINEUP</p>
        </div>
      </div>
    </footer>
  );
}
