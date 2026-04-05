import { z } from 'zod';
import { getAnthropicClient } from './client';
import { cacheKeys, cacheTTL, getCached, setCached } from '../cache/redis';

const SummarySchema = z.object({
  summary: z.string().min(8).max(180),
});

interface SurfScoreSummaryParams {
  breakId: string;
  breakName: string;
  region: string;
  score: number;
  window: 'now' | 'upcoming';
  inputs: {
    height: number | null;
    period: number | null;
    windQuality: string | null;
    tideSummary?: string | null;
  };
}

const SYSTEM_PROMPT = `You are LINEUP's surf guide. Summaries must be short (<= 160 chars), actionable, and specific to the spot.
Return JSON {"summary": "..."}. Mention swell/period/wind/tide context using surfer language.
Avoid hype; be honest if marginal.
`;

function buildUserPrompt(params: SurfScoreSummaryParams) {
  const describeWind = params.inputs.windQuality ?? 'unknown wind';
  const heightLabel = params.inputs.height ? `${params.inputs.height.toFixed(1)}m` : 'flat';
  const periodLabel = params.inputs.period ? `${Math.round(params.inputs.period)}s` : 'N/A';

  return `Spot: ${params.breakName} (${params.region})
Surf score: ${params.score} (${params.window})
Height: ${heightLabel}
Period: ${periodLabel}
Wind: ${describeWind}
Tide: ${params.inputs.tideSummary ?? 'no tide note'}
Respond with JSON.`;
}

export async function getSurfScoreSummary(params: SurfScoreSummaryParams) {
  const cacheKey = cacheKeys.surfScoreSummary(`${params.breakId}:${params.window}`);
  const cached = await getCached<z.infer<typeof SummarySchema>>(cacheKey);
  if (cached) return cached.summary;

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(params),
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response for surf score summary');
    }
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Unable to parse JSON surf summary');
    }
    const parsed = SummarySchema.parse(JSON.parse(jsonMatch[0]));
    await setCached(cacheKey, parsed, cacheTTL.surfScoreSummary);
    return parsed.summary;
  } catch (error) {
    console.error('Failed to fetch surf score summary:', error);
    return null;
  }
}
