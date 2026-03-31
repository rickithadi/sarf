export function BomAttribution() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-gray-500">
          Weather data © Commonwealth of Australia, Bureau of Meteorology.{' '}
          <a
            href="http://www.bom.gov.au/other/copyright.shtml"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            Copyright Notice
          </a>
          . Marine data from Open-Meteo.
        </p>
      </div>
    </footer>
  );
}
