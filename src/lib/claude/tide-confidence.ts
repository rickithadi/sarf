import { z } from 'zod';
import { getAnthropicClient } from './client';
import { cacheKeys, cacheTTL, getCached, setCached } from '../cache/redis';

const TideConfidenceSchema = z.object({
  score: z.number().min(0).max(1),
  summary: z.string().min(4),
});

interface TidePoint {
  time: string;
  type: string;
  height: number;
}

interface TideConfidenceParams {
  breakId: string;
  breakName: string;
  region: string;
  tides: TidePoint[];
  currentTime?: string;
}

const SYSTEM_PROMPT = `You are LINEUP's tide analyst. Given upcoming tide events for an Australian surf spot, return a JSON object
{ "score": <0-1>, "summary": "short actionable sentence" }.
Guidelines:
- Incoming mid tides (rising from low toward mid) are usually best (score 0.75-1).
- Dead highs or dead lows often reduce power (score 0.3-0.5 unless waves are big).
- Rapid tide swings with mismatched height vs time should lower confidence.
- Reference the next 6-12 hours only.
- The summary must start with an action verb (e.g., "Incoming tide aligns...", "Slack high stalls...").
- If data is sparse, make a cautious call and mention uncertainty.
Respond with JSON only.`;

function buildUserPrompt(params: TideConfidenceParams) {
  const payload = {
    break: params.breakName,
    region: params.region,
    currentTime: params.currentTime ?? new Date().toISOString(),
    upcomingTides: params.tides.slice(0, 6),
  };

  return `Evaluate tide favorability for the next 12 hours using this data:\n${JSON.stringify(payload, null, 2)}\nReturn JSON.`;
}

export async function getTideConfidence(params: TideConfidenceParams) {
  const cacheKey = cacheKeys.tideConfidence(params.breakId);
  const cached = await getCached<z.infer<typeof TideConfidenceSchema>>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!params.tides || params.tides.length === 0) {
    return null;
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
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
      throw new Error('No text content in tide confidence response');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse tide confidence JSON');
    }

    const parsed = TideConfidenceSchema.parse(JSON.parse(jsonMatch[0]));
    await setCached(cacheKey, parsed, cacheTTL.tideConfidence);
    return parsed;
  } catch (error) {
    console.error('Failed to fetch tide confidence from Claude:', error);
    return null;
  }
}
