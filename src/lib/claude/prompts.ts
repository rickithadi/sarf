export const SURF_REPORT_SYSTEM_PROMPT = `You are an expert surf forecaster for Victoria, Australia. You provide concise, accurate surf reports based on current conditions and forecast data.

Your reports should:
- Be written in a friendly, informative tone suitable for surfers of all levels
- Focus on practical advice about when and whether to surf
- Use Australian surf terminology where appropriate
- Be concise - surfers want quick, actionable information

You will receive:
1. Current conditions (wind, temperature, waves if available)
2. Wind quality assessment (offshore/onshore etc)
3. Wave forecast data
4. Tide information

Based on this data, provide your assessment in the exact JSON format specified.

Important guidelines:
- Consider wind quality as a primary factor - offshore winds are ideal
- Wave height and period are important for wave quality
- Mention any hazards or concerns
- If data is limited, acknowledge uncertainty but still provide useful guidance`;

export const SURF_REPORT_USER_PROMPT = (data: {
  breakName: string;
  region: string;
  optimalWindDirection: string;
  breakType: string | null;
  currentConditions: {
    airTemp: number | null;
    windSpeedKmh: number | null;
    gustKmh: number | null;
    windDirection: string;
    windQuality: string;
  };
  waveData: {
    height: number | null;
    period: number | null;
    direction: string;
    swellHeight: number | null;
    swellPeriod: number | null;
  } | null;
  upcomingTides: Array<{ time: string; type: string; height: number }>;
  forecast: Array<{
    time: string;
    windSpeed: number | null;
    windDirection: string;
    windQuality: string;
  }>;
}) => `Generate a surf report for ${data.breakName} (${data.region}).

BREAK CHARACTERISTICS:
- Type: ${data.breakType ?? 'beach break'}
- Optimal offshore wind: ${data.optimalWindDirection}

CURRENT CONDITIONS:
- Air temp: ${data.currentConditions.airTemp !== null ? `${data.currentConditions.airTemp}°C` : 'N/A'}
- Wind: ${data.currentConditions.windSpeedKmh !== null ? `${data.currentConditions.windSpeedKmh} km/h` : 'N/A'} ${data.currentConditions.windDirection}
- Gusts: ${data.currentConditions.gustKmh !== null ? `${data.currentConditions.gustKmh} km/h` : 'N/A'}
- Wind quality: ${data.currentConditions.windQuality}

${data.waveData ? `WAVE DATA:
- Wave height: ${data.waveData.height !== null ? `${data.waveData.height}m` : 'N/A'}
- Wave period: ${data.waveData.period !== null ? `${data.waveData.period}s` : 'N/A'}
- Wave direction: ${data.waveData.direction}
- Swell height: ${data.waveData.swellHeight !== null ? `${data.waveData.swellHeight}m` : 'N/A'}
- Swell period: ${data.waveData.swellPeriod !== null ? `${data.waveData.swellPeriod}s` : 'N/A'}` : 'WAVE DATA: Not available'}

UPCOMING TIDES:
${data.upcomingTides.length > 0 ? data.upcomingTides.map(t => `- ${t.type} tide at ${t.time} (${t.height}m)`).join('\n') : 'Not available'}

WIND FORECAST (next 12 hours):
${data.forecast.map(f => `- ${f.time}: ${f.windSpeed !== null ? `${f.windSpeed} km/h` : 'N/A'} ${f.windDirection} (${f.windQuality})`).join('\n')}

Respond with ONLY valid JSON in this exact format:
{
  "headline": "<brief catchy summary, max 10 words>",
  "conditions": "<current conditions paragraph, 2-3 sentences>",
  "forecast": "<next 12-24h outlook, 2-3 sentences>",
  "bestTime": "<optimal surf window recommendation, 1-2 sentences>",
  "bestConditions": "<1-2 sentences describing what makes this specific break fire — optimal swell period, direction, wind, and tide. Not today's conditions, but what this break needs to be at its best.>"
}`;
