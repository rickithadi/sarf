import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

/**
 * Get Anthropic client instance (singleton)
 */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY must be configured');
    }

    client = new Anthropic({
      apiKey,
    });
  }

  return client;
}
