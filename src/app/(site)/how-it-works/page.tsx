import Link from 'next/link';
import { format } from 'date-fns';

const periodGuide = [
  { label: '14s+', type: 'Ground Swell', description: 'Powerful, well-organized lines with long lulls.', badge: 'Best quality' },
  { label: '10-14s', type: 'Long Period', description: 'Consistent sets with plenty of push.', badge: 'Solid surf' },
  { label: '7-10s', type: 'Wind Swell', description: 'Locally generated energy, more frequent but less organized.', badge: 'Average' },
  { label: '<7s', type: 'Short Chop', description: 'Disorganized, choppy surf best for grovel sessions.', badge: 'Challenging' },
];

const steepnessGuide = [
  { label: 'Swell', value: '< 0.025', detail: 'Clean, lined-up faces — classic groundswell behavior.' },
  { label: 'Average', value: '0.025-0.04', detail: 'Reliable conditions with manageable texture.' },
  { label: 'Steep', value: '0.04-0.055', detail: 'Combo swells and wind bump; more variance.' },
  { label: 'Very Steep', value: '> 0.055', detail: 'Stormy or local wind swell; short, crumbly waves.' },
];

const confidenceGuide = [
  { label: '0-24h', confidence: '≈95%', usage: 'Dialing today’s session.' },
  { label: '1-3d', confidence: '≈85%', usage: 'Planning the week.' },
  { label: '3-5d', confidence: '≈70%', usage: 'Spotting trends.' },
  { label: '5-7d', confidence: '≈55%', usage: 'General outlook.' },
  { label: '7+d', confidence: '≈35%', usage: 'Long-range hints only.' },
];

const breakTypes = [
  {
    title: 'Beach breaks',
    description: 'Shifting sandbars mean multiple peaks and changing banks. Great for learners but shape depends on sand movement.',
  },
  {
    title: 'Reef breaks',
    description: 'Rock or coral ledges create consistent takeoff zones and powerful waves—mind the depth and entry channels.',
  },
  {
    title: 'Point breaks',
    description: 'Waves wrap around a headland, focusing energy for longer rides with a defined takeoff spot.',
  },
];

const surfChecklist = [
  'Offshore or light winds to hold the face upright.',
  'Primary swell 10s+ for power and longer rides.',
  'Wave height that matches your skill level (LINEUP’s surf range shows the spread).',
  'Low steepness / high consistency so sets are predictable.',
  'Awareness of set waves up to ~1.7× the forecast height.',
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-teal-50 px-6 py-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">How LINEUP Works</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">Inside the LINEUP Forecast Engine</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          We turn oceanographic standards—significant wave height, swell period, steepness, and confidence modeling—into the
          surf-specific insights you see on the dashboard. Here’s the playbook distilled from our internal forecasting guide.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to live conditions
          </Link>
          <Link
            href="/docs/how-forecasting-works.md"
            className="inline-flex items-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Read the full methodology
          </Link>
        </div>
      </header>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wave height</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Significant Wave Height & Surf Range</h2>
          <p className="mt-3 text-slate-600">
            LINEUP reports Significant Wave Height (Hs)—the average of the highest third of waves. About one in seven waves will
            exceed the headline height, and sneaker sets can reach 1.7×. We convert Hs into a surf range that factors in swell
            organization and steepness, so “3-4ft” means the majority of waves sit in that window while the biggest sets climb higher.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Average sets ≈ Hs</li>
            <li>• Occasional sets ≈ 1.3 × Hs</li>
            <li>• Sneaker sets ≈ 1.7 × Hs — keep your head on a swivel</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Swell type</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Ground vs Wind Swell</h2>
          <p className="mt-3 text-slate-600">
            Distant storms send organized ground swells (14s+) with long lulls and heavy push. Local wind swells (&lt;10s) break more
            often but lack power. When both arrive (bimodal seas) LINEUP lists each component and merges their energy so you know
            which pulse dominates the lineup.
          </p>
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
            Ground swell = long intervals + smooth faces. Wind swell = short period chop. Mixed = read both columns.
          </div>
        </article>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wave period</p>
            <h2 className="text-2xl font-semibold text-slate-900">Period quality guide</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Period controls energy. A 1m wave at 14s carries far more push than 1m at 7s.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {periodGuide.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{item.type}</p>
                </div>
                <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700">{item.badge}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Steepness</p>
              <h2 className="text-2xl font-semibold text-slate-900">Clean vs choppy</h2>
            </div>
            <span className="text-sm font-medium text-slate-500">Steepness = height / wavelength</span>
          </div>
          <div className="mt-4 space-y-3">
            {steepnessGuide.map((row) => (
              <div key={row.label} className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{row.detail}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wave power</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Energy &gt; height</h2>
          <p className="mt-3 text-slate-600">
            LINEUP’s power badge compares height and period to show how much force is in the swell. 1m @ 14s earns “High” while 1m @ 7s
            sits in “Low.” Combine this with the surf range to judge whether it’s punchy, playful, or gutless.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <p className="font-semibold text-slate-800">Epic</p>
              <p>Maximum energy, fast-moving sets, often long-period groundswell events.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <p className="font-semibold text-slate-800">High / Medium</p>
              <p>Everyday surf with enough push to keep you down the line.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <p className="font-semibold text-slate-800">Low</p>
              <p>Short-period windswell, longboards and fish thrive here.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Forecast skill</p>
            <h2 className="text-2xl font-semibold text-slate-900">Confidence horizon</h2>
          </div>
          <p className="text-sm text-slate-500">Last refreshed {format(new Date(), 'MMM d, yyyy')}</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {confidenceGuide.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{item.confidence}</p>
              <p className="mt-2 text-sm text-slate-600">{item.usage}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Accuracy climbs as you approach the surf window—refresh LINEUP the day-of for the sharpest call.
        </p>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Consistency</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Variance bands</h2>
          <p className="mt-3 text-slate-600">
            LINEUP’s consistency badge converts steepness into variance: “Very consistent” is ±12%, “Inconsistent” is ±40%. Use it to
            gauge how wide the surf range could swing.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Very consistent: lined-up groundswells, easy set timing.</li>
            <li>• Consistent: healthy organization with some variance.</li>
            <li>• Variable/Inconsistent: windswell mixing or stormy seas.</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Break types</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Know your canvas</h2>
          <div className="mt-4 space-y-4">
            {breakTypes.map((type) => (
              <div key={type.title} className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <p className="font-semibold text-slate-800">{type.title}</p>
                <p className="text-sm text-slate-600">{type.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-900 px-6 py-8 text-slate-100 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Session checklist</p>
        <h2 className="mt-2 text-3xl font-semibold">What makes a great LINEUP day?</h2>
        <ul className="mt-4 space-y-3 text-base text-slate-200">
          {surfChecklist.map((item) => (
            <li key={item} className="flex gap-3">
              <span>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900"
          >
            Explore live dashboard
          </Link>
          <Link
            href="/docs/how-forecasting-works.md"
            className="inline-flex items-center rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white"
          >
            Read the full methodology
          </Link>
        </div>
      </section>
    </div>
  );
}
