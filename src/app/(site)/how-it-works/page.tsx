import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="bg-surface text-on-surface">

      {/* ── Hero ── */}
      <section
        className="relative min-h-[560px] flex items-center justify-center overflow-hidden px-8 py-28"
        style={{ backgroundColor: '#e8eef6' }}
      >
        {/* Water ripple texture — repeating sine-wave lines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: [
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='28'%3E%3Cpath d='M0,14 C40,6 80,22 120,14 C160,6 200,22 240,14' stroke='rgba(0,30,64,0.07)' stroke-width='1.2' fill='none'/%3E%3C/svg%3E\")",
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='28'%3E%3Cpath d='M0,18 C30,10 60,26 90,18 C120,10 150,26 180,18' stroke='rgba(0,30,64,0.05)' stroke-width='1' fill='none'/%3E%3C/svg%3E\")",
            ].join(', '),
            backgroundRepeat: 'repeat',
            backgroundSize: '240px 28px, 180px 28px',
            backgroundPosition: '0 0, 60px 14px',
          }}
        />
        {/* Subtle vignette fade at bottom */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 z-0" style={{ background: 'linear-gradient(to bottom, transparent, rgba(232,238,246,0.6))' }} />

        <div className="relative z-10 max-w-3xl text-center">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-6 block opacity-70">Precision Intelligence</span>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-primary mb-8 leading-[1.05]">
            How Our Surf<br />Forecast Works
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Moving beyond basic swell heights. We combine oceanic models, BOM weather stations, and AI to give you scientifically-backed surf intelligence for Victoria.
          </p>
        </div>
      </section>

      {/* ── Significant Wave Height ── */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="font-display text-4xl font-bold text-primary">Significant Wave Height (Hs)</h2>
            <p className="text-on-surface-variant leading-relaxed text-lg">
              The forecast height follows the <strong className="text-on-surface">1/3 Rule</strong> — the average height of the highest one-third of waves in a swell group. This mirrors how an experienced observer naturally reads the surf from the shore.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-surface-container-low p-6 rounded-2xl" style={{ borderLeft: '4px solid var(--color-secondary, #1a60a4)' }}>
                <h4 className="font-bold text-primary mb-2">The 1 in 7 Rule</h4>
                <p className="text-sm text-on-surface-variant">Statistically, 1 in every 7 waves will exceed the forecast Hs height.</p>
              </div>
              <div className="bg-surface-container-low p-6 rounded-2xl" style={{ borderLeft: '4px solid var(--color-secondary, #1a60a4)' }}>
                <h4 className="font-bold text-primary mb-2">Set Waves</h4>
                <p className="text-sm text-on-surface-variant">Expect consistent set waves to be 1.5× to 2× the significant wave height.</p>
              </div>
            </div>
          </div>

          {/* Bar chart visual */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_20px_40px_rgba(0,30,64,0.06)]">
            <div className="flex items-end justify-between gap-3 h-48">
              {[
                { h: '40%', label: null, color: 'bg-secondary/30' },
                { h: '65%', label: 'Hs', color: 'bg-secondary/50' },
                { h: '30%', label: null, color: 'bg-secondary/20' },
                { h: '55%', label: null, color: 'bg-secondary/40' },
                { h: '90%', label: 'Set', color: 'bg-primary/60' },
                { h: '80%', label: null, color: 'bg-primary/40' },
                { h: '45%', label: null, color: 'bg-secondary/30' },
                { h: '35%', label: null, color: 'bg-secondary/20' },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                  {bar.label && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{bar.label}</span>
                  )}
                  <div className={`w-full rounded-t-md ${bar.color}`} style={{ height: bar.h }} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-on-surface-variant">Wave Height Distribution</p>
          </div>
        </div>
      </section>

      {/* ── Wave Period & Energy ── */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-display text-4xl font-bold text-primary mb-4">Wave Period &amp; Energy</h2>
            <p className="text-on-surface-variant max-w-2xl">Period is the interval between wave crests. Longer periods mean more energy, more speed, and cleaner organisation.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-5 font-display text-lg font-bold text-primary pr-8">Period</th>
                  <th className="py-5 font-display text-lg font-bold text-primary pr-8">Swell Type</th>
                  <th className="py-5 font-display text-lg font-bold text-primary">What to Expect</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/20">
                  <td className="py-7 font-bold text-primary pr-8">14s – 20s+</td>
                  <td className="py-7 pr-8">
                    <span className="bg-on-tertiary-container/10 text-on-tertiary-container px-3 py-1 rounded-full text-sm font-bold">Ground Swell</span>
                  </td>
                  <td className="py-7 text-on-surface-variant italic">Maximum power. Clean, long lines. Breaks far from shore.</td>
                </tr>
                <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/60">
                  <td className="py-7 font-bold text-primary pr-8">10s – 13s</td>
                  <td className="py-7 pr-8">
                    <span className="bg-secondary-container/20 text-on-secondary-container px-3 py-1 rounded-full text-sm font-bold">Mid-Period</span>
                  </td>
                  <td className="py-7 text-on-surface-variant italic">Quality surf. Good organisation. Typical for solid ocean pulses.</td>
                </tr>
                <tr>
                  <td className="py-7 font-bold text-primary pr-8">4s – 9s</td>
                  <td className="py-7 pr-8">
                    <span className="bg-error-container/40 text-error px-3 py-1 rounded-full text-sm font-bold">Wind Swell</span>
                  </td>
                  <td className="py-7 text-on-surface-variant italic">Choppy, weak, and disorganised. Generated by local winds.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Ground Swell vs Wind Swell ── */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Ground Swell */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,30,64,0.06)]">
            <div className="aspect-[16/10] relative" style={{ background: 'linear-gradient(160deg, #1a60a4 0%, #001e40 60%, #002504 100%)' }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,30,64,0.6) 0%, transparent 60%)' }} />
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                backgroundSize: '200px 200px',
              }} />
              <div className="absolute bottom-4 left-6">
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Long-distance energy</span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-display text-2xl font-bold text-primary mb-3">Ground Swell</h3>
              <p className="text-on-surface-variant leading-relaxed">Generated by storms thousands of miles away. Travelled waves sort themselves into clean, powerful lines of energy with long periods and organised sets.</p>
            </div>
          </div>

          {/* Wind Swell */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,30,64,0.06)]">
            <div className="aspect-[16/10] relative" style={{ background: 'linear-gradient(160deg, #737780 0%, #43474f 60%, #2d3133 100%)' }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(186,26,26,0.2) 0%, transparent 60%)' }} />
              <div className="absolute bottom-4 left-6">
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Local wind energy</span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-display text-2xl font-bold text-primary mb-3">Wind Swell</h3>
              <p className="text-on-surface-variant leading-relaxed">Created by local wind systems. Short-lived energy with peaks that are messy, crumbly, and hard to time. Low period, high steepness.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Wave Power Indicator (dark) ── */}
      <section className="py-24 px-8 bg-primary text-on-primary overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
            <h2 className="font-display text-4xl font-bold mb-8">Wave Power Indicator</h2>
            <div className="space-y-10">
              <div className="flex gap-6">
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#5ead5c' }}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-2">Wave Power (kW/m)</h4>
                  <p className="text-on-primary/60 leading-relaxed text-sm">We compute <span className="font-mono text-on-primary/80">P ≈ 0.5 × H² × T</span> — kilowatts per metre of wave crest — the standard oceanographic measure of how much energy the ocean is delivering to shore.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-2">Steepness Factor</h4>
                  <p className="text-on-primary/60 leading-relaxed text-sm">The ratio of height to wavelength. High steepness creates &ldquo;A-frame&rdquo; peaks; low steepness creates &ldquo;mushy&rdquo; slopes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
            <div className="flex justify-between items-end mb-10">
              <span className="font-display text-4xl font-black tracking-tighter">28 <span className="text-sm font-normal text-on-primary/50">kW/m</span></span>
              <span className="px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase text-white" style={{ backgroundColor: '#5ead5c' }}>High Power</span>
            </div>
            <div className="h-48 flex items-end gap-1">
              {[20, 35, 55, 85, 95, 90, 70, 40].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: h >= 85 ? '#5ead5c' : '#1a60a4',
                  }}
                />
              ))}
            </div>
            <p className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-on-primary/40">Wave Power (kW/m) — 24h Forecast</p>
          </div>
        </div>
      </section>

      {/* ── Statistical Probability ── */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-primary mb-4">Statistical Probability of Waves</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">The ocean isn&apos;t a metronome. It&apos;s a spectrum of probabilities.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-surface-container-low p-10 rounded-2xl text-center">
            <h3 className="font-display text-5xl font-black text-primary mb-2">3ft</h3>
            <p className="font-bold text-secondary uppercase tracking-widest text-xs mb-6">Average</p>
            <p className="text-on-surface-variant text-sm">Most waves you will see in the water today.</p>
          </div>
          <div className="bg-surface-container-low p-10 rounded-2xl text-center" style={{ borderTop: '4px solid #1a60a4' }}>
            <h3 className="font-display text-5xl font-black text-primary mb-2">5ft</h3>
            <p className="font-bold text-secondary uppercase tracking-widest text-xs mb-6">Occasional Set</p>
            <p className="text-on-surface-variant text-sm">Every 10–15 minutes, expect a pulse of higher energy.</p>
          </div>
          <div className="bg-primary p-10 rounded-2xl text-center text-on-primary">
            <h3 className="font-display text-5xl font-black mb-2">7ft</h3>
            <p className="font-bold text-on-primary/50 uppercase tracking-widest text-xs mb-6">Sneaker Set</p>
            <p className="text-on-primary/60 text-sm">Rare &ldquo;rogue&rdquo; pulses that can catch you inside.</p>
          </div>
        </div>
      </section>

      {/* ── Forecast Confidence Horizon ── */}
      <section className="py-24 bg-surface-container-low px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl font-bold text-primary mb-16 text-center">Forecast Confidence Horizon</h2>
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-outline-variant -translate-y-1/2" />
            <div className="grid lg:grid-cols-4 gap-6 relative">
              {[
                { reliability: '95% Reliable', label: '1 – 2 Days', desc: 'Precision accuracy. High confidence in local wind and tide interplay.', color: 'text-on-tertiary-container', opacity: '' },
                { reliability: '80% Reliable', label: '3 – 4 Days', desc: 'Solid trend indicators. Good for planning your week.', color: 'text-secondary', opacity: '' },
                { reliability: '50% Reliable', label: '5 – 7 Days', desc: 'Predictive models only. Subject to major shifts in storm tracks.', color: 'text-outline', opacity: '' },
                { reliability: 'Low Confidence', label: '7+ Days', desc: 'Mathematical speculation. Use only for broad seasonal trends.', color: 'text-outline', opacity: 'opacity-50' },
              ].map((item) => (
                <div key={item.label} className={`bg-surface-container-lowest p-6 rounded-2xl shadow-[0_20px_40px_rgba(0,30,64,0.06)] ${item.opacity}`}>
                  <span className={`text-xs font-bold uppercase tracking-widest mb-4 block ${item.color}`}>{item.reliability}</span>
                  <h4 className="font-display text-xl font-bold text-primary mb-2">{item.label}</h4>
                  <p className="text-sm text-on-surface-variant">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Know Your Break ── */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <h2 className="font-display text-4xl font-bold text-primary mb-12">Know Your Break</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              label: 'Sandy Peaks',
              title: 'Beach Break',
              desc: 'Sandbars shift constantly. Responsive to tide and requires lighter winds for quality.',
              bg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
            },
            {
              label: 'Headland Wrap',
              title: 'Point Break',
              desc: 'Predictable setup. Needs specific swell direction to "wrap" correctly into the point.',
              bg: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
            },
            {
              label: 'Coral / Rock',
              title: 'Reef Break',
              desc: 'Fixed take-off zone. Most powerful waves, but tide depth is critical for safety.',
              bg: 'linear-gradient(135deg, #14b8a6 0%, #1d4ed8 100%)',
            },
          ].map((b) => (
            <div key={b.title} className="flex flex-col gap-5">
              <div className="aspect-square rounded-2xl overflow-hidden relative" style={{ background: b.bg }}>
                <div className="absolute inset-0 flex items-end p-6" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)' }}>
                  <span className="text-white text-xs font-bold uppercase tracking-widest opacity-80">{b.label}</span>
                </div>
              </div>
              <h4 className="font-display text-2xl font-bold text-primary">{b.title}</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Great Surf Day / Red Flags ── */}
      <section className="py-24 px-8 bg-surface-container-low">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div className="bg-surface-container-lowest p-10 rounded-2xl shadow-[0_20px_40px_rgba(0,30,64,0.06)]">
            <h3 className="font-display text-2xl font-bold text-on-tertiary-container mb-8 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Great Surf Day
            </h3>
            <ul className="space-y-5">
              {[
                'Offshore winds (from land to sea)',
                'Period above 12 seconds',
                'Incoming mid-tide (usually)',
                'Primary swell matches break orientation',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-on-tertiary-container mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-on-surface-variant text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface-container-lowest p-10 rounded-2xl shadow-[0_20px_40px_rgba(0,30,64,0.06)]">
            <h3 className="font-display text-2xl font-bold text-error mb-8 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Red Flags
            </h3>
            <ul className="space-y-5">
              {[
                'Strong onshore winds',
                'Period below 7 seconds (disorganised)',
                'Dead low tide on a shallow reef',
                'Massive cross-swell interference',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-error mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-on-surface-variant text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-8 text-center bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-5xl md:text-6xl font-extrabold text-primary mb-8 tracking-tight">Ready to hunt the pulse?</h2>
          <p className="text-on-surface-variant mb-12 text-lg max-w-xl mx-auto leading-relaxed">
            Our data is aggregated from BOM (Australia), Open-Meteo, and processed with Claude AI to give you break-specific intelligence.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-primary text-on-primary px-10 py-4 rounded-full text-base font-bold transition-all hover:shadow-[0_20px_40px_rgba(0,30,64,0.2)] active:scale-[0.98]"
          >
            See the Forecast
          </Link>
          <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-30">
            {['BOM', 'Open-Meteo', 'Claude AI', 'Neon DB'].map((source) => (
              <span key={source} className="font-display font-black text-lg tracking-tighter text-on-surface">{source}</span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
