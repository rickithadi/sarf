export function BomAttribution() {
  return (
    <footer className="bg-surface-container-low" style={{ borderTop: '4px solid #001e40' }}>
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-4 py-10 sm:px-6 xl:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-2xl font-black tracking-tighter font-display text-primary">Lineup</p>
          <p className="mt-1 text-sm text-on-surface-variant">Decision-first surf forecasting for Victoria.</p>
        </div>
        <div className="text-xs text-on-surface-variant">
          <p>Weather data &copy; Commonwealth of Australia, Bureau of Meteorology.</p>
          <p>Marine conditions from Open-Meteo, tides from local harbors.</p>
          <a
            href="http://www.bom.gov.au/other/copyright.shtml"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex underline hover:text-primary"
          >
            Bureau copyright notice
          </a>
        </div>
        <nav className="flex flex-wrap gap-6">
          {['Privacy Policy', 'Terms of Service', 'Buoy Network', 'Global Forecasts'].map((label) => (
            <a
              key={label}
              href="#"
              className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary hover:underline transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
