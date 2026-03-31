import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RatingBadge } from '@/components/ui/rating-badge';
import { format } from 'date-fns';

interface BreakDetail {
  break: {
    id: string;
    name: string;
    region: string;
    lat: number;
    lng: number;
  };
  currentConditions: {
    airTemp: number | null;
    windSpeedKmh: number | null;
    gustKmh: number | null;
    windDirCardinal: string;
    windQualityDescription: string;
    pressure: number | null;
    humidity: number | null;
    updatedAt: string;
  } | null;
  waveData: {
    height: number | null;
    period: number | null;
    directionCardinal: string;
    swellHeight: number | null;
    swellPeriod: number | null;
    swellDirectionCardinal: string;
  } | null;
  tides: Array<{
    time: string;
    type: string;
    height: number;
  }>;
}

interface SurfReport {
  rating: number;
  headline: string;
  conditions: string;
  forecast: string;
  bestTime: string;
}

async function getBreakDetail(breakId: string): Promise<BreakDetail | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/breaks/${breakId}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.error('Failed to fetch break:', res.statusText);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching break:', error);
    return null;
  }
}

async function getSurfReport(breakId: string): Promise<SurfReport | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/breaks/${breakId}/report`, {
      next: { revalidate: 300 }, // Cache for 5 minutes on the page level
    });

    if (!res.ok) {
      console.error('Failed to fetch report:', res.statusText);
      return null;
    }

    const data = await res.json();
    return data.report;
  } catch (error) {
    console.error('Error fetching report:', error);
    return null;
  }
}

export default async function BreakDetailPage({
  params,
}: {
  params: Promise<{ breakId: string }>;
}) {
  const { breakId } = await params;
  const [detail, report] = await Promise.all([
    getBreakDetail(breakId),
    getSurfReport(breakId),
  ]);

  if (!detail) {
    notFound();
  }

  const { break: breakData, currentConditions, waveData, tides } = detail;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-blue-600"
      >
        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to all breaks
      </Link>

      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{breakData.name}</h1>
            <p className="mt-1 text-gray-600">{breakData.region}</p>
          </div>
          {report && <RatingBadge rating={report.rating} size="lg" />}
        </div>
      </header>

      {report && (
        <section className="mb-8 rounded-lg border border-blue-100 bg-blue-50 p-6">
          <h2 className="mb-2 text-xl font-semibold text-blue-900">{report.headline}</h2>
          <div className="space-y-4 text-blue-800">
            <div>
              <h3 className="font-medium">Current Conditions</h3>
              <p className="text-sm">{report.conditions}</p>
            </div>
            <div>
              <h3 className="font-medium">Forecast</h3>
              <p className="text-sm">{report.forecast}</p>
            </div>
            <div>
              <h3 className="font-medium">Best Time to Surf</h3>
              <p className="text-sm">{report.bestTime}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-blue-600">AI-generated report based on current data</p>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Current Conditions</h2>
          {currentConditions ? (
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Wind</dt>
                <dd className="font-medium text-gray-900">
                  {currentConditions.windSpeedKmh ?? 'N/A'} km/h{' '}
                  {currentConditions.windDirCardinal}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Wind Quality</dt>
                <dd className="font-medium text-gray-900">
                  {currentConditions.windQualityDescription}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Gusts</dt>
                <dd className="font-medium text-gray-900">
                  {currentConditions.gustKmh ?? 'N/A'} km/h
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Air Temp</dt>
                <dd className="font-medium text-gray-900">
                  {currentConditions.airTemp ?? 'N/A'}°C
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Humidity</dt>
                <dd className="font-medium text-gray-900">
                  {currentConditions.humidity ?? 'N/A'}%
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Pressure</dt>
                <dd className="font-medium text-gray-900">
                  {currentConditions.pressure ?? 'N/A'} hPa
                </dd>
              </div>
              <div className="border-t border-gray-100 pt-2 text-xs text-gray-400">
                Updated: {format(new Date(currentConditions.updatedAt), 'h:mm a')}
              </div>
            </dl>
          ) : (
            <p className="text-gray-400">No observation data available</p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Wave Data</h2>
          {waveData && waveData.height !== null ? (
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Wave Height</dt>
                <dd className="font-medium text-gray-900">{waveData.height?.toFixed(1)}m</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Wave Period</dt>
                <dd className="font-medium text-gray-900">{waveData.period ?? 'N/A'}s</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Wave Direction</dt>
                <dd className="font-medium text-gray-900">{waveData.directionCardinal}</dd>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <h3 className="mb-2 text-sm font-medium text-gray-700">Swell</h3>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Swell Height</dt>
                <dd className="font-medium text-gray-900">
                  {waveData.swellHeight?.toFixed(1) ?? 'N/A'}m
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Swell Period</dt>
                <dd className="font-medium text-gray-900">{waveData.swellPeriod ?? 'N/A'}s</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Swell Direction</dt>
                <dd className="font-medium text-gray-900">{waveData.swellDirectionCardinal}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-gray-400">No wave data available</p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Tides</h2>
          {tides.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {tides.map((tide, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-4 py-2 ${
                    tide.type === 'high'
                      ? 'bg-blue-50 text-blue-800'
                      : 'bg-gray-50 text-gray-800'
                  }`}
                >
                  <p className="text-sm font-medium capitalize">{tide.type}</p>
                  <p className="text-lg font-bold">
                    {format(new Date(tide.time), 'h:mm a')}
                  </p>
                  <p className="text-xs">{tide.height.toFixed(2)}m</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No tide data available</p>
          )}
        </section>
      </div>
    </div>
  );
}
