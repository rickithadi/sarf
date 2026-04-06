import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="bg-surface text-on-surface">
      {/* ── Hero ── */}
      <section className="px-8 md:px-24 py-20 bg-surface flex flex-col items-start">
        <span className="text-secondary font-bold tracking-[0.2em] uppercase text-xs mb-4">Science of the Swell</span>
        <h1 className="font-display text-6xl md:text-8xl font-extrabold text-on-primary-fixed leading-[1.1] max-w-4xl tracking-tighter mb-8">
          How Our Surf Forecast Works
        </h1>
        <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl leading-relaxed font-light">
          We translate raw bathymetric data and oceanic atmospheric pressure into surfable reality. Precision isn&apos;t just a goal; it&apos;s our maritime standard.
        </p>
      </section>

      {/* ── Significant Wave Height: Bento ── */}
      <section className="px-8 md:px-24 py-16 grid grid-cols-1 md:grid-cols-12 gap-6 bg-surface-container-low">
        {/* Left: explanation + SVG chart */}
        <div className="md:col-span-8 bg-surface-container-lowest p-10 rounded-2xl">
          <h2 className="font-display text-4xl font-bold text-primary mb-6">Significant Wave Height (Hs)</h2>
          <p className="text-on-surface-variant mb-10 text-lg leading-relaxed">
            The Hs metric represents the average height of the highest one-third of waves in a swell. This isn&apos;t just an average; it&apos;s a weighted perspective that mirrors what a seasoned observer actually sees from the shoreline.
          </p>
          {/* Diagram */}
          <div className="relative h-52 w-full bg-surface-container rounded-xl overflow-hidden">
            <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a60a4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1a60a4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,150 Q100,20 200,150 T400,150 T600,80 T800,150 T1000,50" fill="none" stroke="#1a60a4" strokeWidth="4" />
              <path d="M0,150 Q100,20 200,150 T400,150 T600,80 T800,150 T1000,50 L1000,200 L0,200 Z" fill="url(#waveGrad)" />
            </svg>
            <div className="absolute top-6 right-8 flex flex-col items-end">
              <span className="font-display text-4xl font-extrabold text-primary tabular">6.5 <span className="text-base font-medium text-outline">ft</span></span>
              <span className="text-xs uppercase tracking-widest text-secondary font-bold">Current Hs</span>
            </div>
          </div>
        </div>

        {/* Right: Surf Range card */}
        <div
          className="md:col-span-4 p-10 rounded-2xl text-on-primary flex flex-col justify-between"
          style={{ background: 'linear-gradient(180deg, #001e40 0%, #1a60a4 100%)' }}
        >
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">Surf Range</h3>
            <p className="text-on-primary/70 leading-relaxed text-sm">
              Our algorithm factors in local bathymetry—how the seafloor shapes the wave—to convert deep-water swell height into the actual face-height you&apos;ll encounter.
            </p>
          </div>
          <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="font-display text-5xl font-black block mb-2 tabular">3-5<span className="text-xl">ft</span></span>
            <span className="text-sm tracking-widest uppercase text-on-primary/70">Estimated Break Height</span>
          </div>
        </div>
      </section>

      {/* ── Period Quality Guide ── */}
      <section className="px-8 md:px-24 py-24 bg-surface">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl font-bold text-primary mb-4">Period Quality Guide</h2>
            <p className="text-on-surface-variant">The interval between wave crests determines the energy density and the &quot;cleanliness&quot; of the sets.</p>
          </div>
          <span className="text-xs font-bold bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full whitespace-nowrap">Essential Metric</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 4-7s */}
          <div className="bg-surface-container-lowest p-8 rounded-2xl transition-all hover:-translate-y-1">
            <div className="text-4xl mb-6">〰️</div>
            <h4 className="font-display text-xl font-bold text-primary mb-2">4 – 7 Seconds</h4>
            <span className="inline-block px-2 py-1 bg-error-container text-on-error-container text-[10px] font-bold uppercase rounded mb-4">Wind Swell</span>
            <p className="text-sm text-on-surface-variant leading-relaxed">Choppy, disorganized waves. High frequency often results in multiple waves breaking simultaneously.</p>
          </div>
          {/* 8-12s */}
          <div className="bg-surface-container-lowest p-8 rounded-2xl transition-all hover:-translate-y-1">
            <div className="text-4xl mb-6 text-secondary">≋</div>
            <h4 className="font-display text-xl font-bold text-primary mb-2">8 – 12 Seconds</h4>
            <span className="inline-block px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase rounded mb-4">Transition</span>
            <p className="text-sm text-on-surface-variant leading-relaxed">Developing power. Sets become more defined with moderate gaps between pulses.</p>
          </div>
          {/* 13-20s */}
          <div className="bg-surface-container-lowest p-8 rounded-2xl transition-all hover:-translate-y-1">
            <div className="text-4xl mb-6" style={{ color: '#5ead5c' }}>⟿</div>
            <h4 className="font-display text-xl font-bold text-primary mb-2">13 – 20+ Seconds</h4>
            <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase rounded mb-4 text-white" style={{ backgroundColor: '#5ead5c' }}>Ground Swell</span>
            <p className="text-sm text-on-surface-variant leading-relaxed">Elite energy. These waves have traveled thousands of miles, focusing power into massive, clean sets.</p>
          </div>
        </div>
      </section>

      {/* ── Ground Swell vs Wind Swell ── */}
      <section className="px-8 md:px-24 py-24 bg-surface-container-high grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left: gradient placeholder as "ocean image" */}
        <div className="relative rounded-2xl overflow-hidden aspect-[4/5] flex flex-col justify-end"
          style={{ background: 'linear-gradient(160deg, #1a60a4 0%, #001e40 60%, #002504 100%)' }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,30,64,0.8) 0%, transparent 60%)' }} />
          <div className="relative z-10 p-10">
            <h3 className="font-display text-3xl font-bold text-white mb-3">Ground Swell</h3>
            <p className="text-secondary-fixed text-sm leading-relaxed">Long-distance energy generated by remote storm systems. High period, high power, structured sets.</p>
          </div>
        </div>

        {/* Right: stacked cards */}
        <div className="flex flex-col gap-8">
          {/* Wind Swell */}
          <div className="bg-surface-container-lowest p-10 rounded-2xl">
            <h3 className="font-display text-2xl font-bold text-primary mb-4">Wind Swell</h3>
            <p className="text-on-surface-variant mb-6 leading-relaxed">Local winds pushing the water surface. Short period, erratic, and generally weaker than ground swells.</p>
            <div className="flex gap-4">
              <div className="bg-surface-container p-4 rounded-xl flex-1">
                <span className="text-[10px] uppercase font-bold text-outline block mb-1">Steepness</span>
                <span className="font-display text-xl font-bold text-primary">High</span>
              </div>
              <div className="bg-surface-container p-4 rounded-xl flex-1">
                <span className="text-[10px] uppercase font-bold text-outline block mb-1">Predictability</span>
                <span className="font-display text-xl font-bold text-primary">Low</span>
              </div>
            </div>
          </div>

          {/* Pulse Ratio */}
          <div
            className="p-10 rounded-2xl text-on-primary"
            style={{ background: 'linear-gradient(135deg, #001e40 0%, #1a60a4 100%)' }}
          >
            <div className="text-3xl mb-4">📡</div>
            <h3 className="font-display text-2xl font-bold mb-2">The Pulse Ratio</h3>
            <p className="text-on-primary/70 text-sm leading-relaxed">We use spectral analysis to separate overlapping swell trains, allowing you to see the ground swell hiding beneath local chop.</p>
          </div>
        </div>
      </section>

      {/* ── Wave Steepness & Technical Power ── */}
      <section className="px-8 md:px-24 py-24 bg-surface">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-1">
            <h2 className="font-display text-4xl font-extrabold text-primary leading-tight mb-6">Wave Steepness &amp; Technical Power</h2>
            <p className="text-on-surface-variant leading-relaxed">Energy is more than height. It&apos;s the volume of water moving forward and the velocity at which it meets the reef.</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-l-4 border-secondary p-6 bg-surface-container-low rounded-r-xl">
              <span className="font-display text-3xl font-black text-primary block">1,200+</span>
              <span className="text-sm font-bold uppercase tracking-widest text-secondary">Joules/m²</span>
              <p className="mt-4 text-xs text-on-surface-variant">Exceptional Power Level. Recommended for advanced surfers only.</p>
            </div>
            <div className="border-l-4 border-outline p-6 bg-surface-container-low rounded-r-xl">
              <span className="font-display text-3xl font-black text-primary block">0.021</span>
              <span className="text-sm font-bold uppercase tracking-widest text-outline">Steepness Ratio</span>
              <p className="mt-4 text-xs text-on-surface-variant">Moderate verticality. Predictable breaking point on most reefs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Set Wave Reality (dark) ── */}
      <section className="px-8 md:px-24 py-24 bg-primary text-on-primary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 className="font-display text-4xl font-bold mb-8">The Set Wave Reality</h2>
            <p className="text-on-primary/70 text-lg mb-8 leading-relaxed">
              Waves don&apos;t travel alone; they travel in groups. Our &ldquo;Confidence Interval&rdquo; tracks the likelihood of consistent 5-wave sets based on wind-fetch data.
            </p>
            <div className="bg-primary-container p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-white">Forecast Confidence</span>
                <span className="font-black" style={{ color: '#5ead5c' }}>92%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="h-full w-[92%] rounded-full" style={{ backgroundColor: '#5ead5c' }} />
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-display text-xl font-bold mb-2">Historical Back-Testing</h4>
                <p className="text-on-primary/70 text-sm leading-relaxed">We compare our predictions against real-time buoy data and satellite imagery every 15 minutes to refine our models.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <h4 className="font-display text-xl font-bold mb-2">Atmospheric Pressure</h4>
                <p className="text-on-primary/70 text-sm leading-relaxed">Changes in barometric pressure alert our system to shifting wind patterns before they hit the coast.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Oceanic Environments ── */}
      <section className="px-8 md:px-24 py-24 bg-surface">
        <h2 className="font-display text-center text-4xl font-extrabold text-primary mb-16 uppercase tracking-tighter">Oceanic Environments</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Beach Break */}
          <div className="group cursor-pointer">
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 transition-transform duration-700 group-hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}
            >
              <div className="w-full h-full flex items-end p-6"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }}
              >
                <span className="text-white text-sm font-bold uppercase tracking-widest opacity-80">Sandy Peaks</span>
              </div>
            </div>
            <h5 className="font-display text-xl font-bold text-primary">Beach Break</h5>
            <p className="text-on-surface-variant text-sm mt-2">Shifting sandbars creating versatile, ever-changing peaks.</p>
          </div>

          {/* Reef Break */}
          <div className="group cursor-pointer">
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 transition-transform duration-700 group-hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #1d4ed8 100%)' }}
            >
              <div className="w-full h-full flex items-end p-6"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }}
              >
                <span className="text-white text-sm font-bold uppercase tracking-widest opacity-80">Coral / Rock</span>
              </div>
            </div>
            <h5 className="font-display text-xl font-bold text-primary">Reef Break</h5>
            <p className="text-on-surface-variant text-sm mt-2">Static rock or coral structures providing mechanical consistency.</p>
          </div>

          {/* Point Break */}
          <div className="group cursor-pointer">
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 transition-transform duration-700 group-hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}
            >
              <div className="w-full h-full flex items-end p-6"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }}
              >
                <span className="text-white text-sm font-bold uppercase tracking-widest opacity-80">Headland Wrap</span>
              </div>
            </div>
            <h5 className="font-display text-xl font-bold text-primary">Point Break</h5>
            <p className="text-on-surface-variant text-sm mt-2">Waves wrapping around a headland, creating exceptionally long rides.</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="mx-8 md:mx-24 my-24 rounded-[2rem] p-16 text-center text-on-primary relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a60a4 0%, #001e40 100%)' }}
      >
        <h2 className="font-display text-5xl md:text-7xl font-extrabold mb-8 tracking-tight">Ready to hunt the pulse?</h2>
        <p className="text-xl text-on-primary/70 mb-12 max-w-2xl mx-auto">
          Stop guessing. Start surfing. Get the most accurate maritime data delivered directly to your dashboard.
        </p>
        <Link
          href="/"
          className="inline-block bg-on-primary text-primary px-12 py-5 rounded-full text-lg font-black uppercase tracking-widest transition-all hover:shadow-2xl active:scale-95"
        >
          See the Forecast
        </Link>
      </section>
    </div>
  );
}
