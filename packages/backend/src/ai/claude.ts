import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'
import { logger } from '../middleware/logger.js'

export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
  maxRetries: 3,
})

export async function createMessage(
  params: Anthropic.MessageCreateParamsNonStreaming
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    ...params,
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected non-text response from Claude')
  }

  logger.debug(
    { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
    'Claude API call completed'
  )

  return content.text
}

export function parseJsonFromResponse<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/```$/m, '')
    .trim()

  return JSON.parse(cleaned) as T
}
