/**
 * Runtime configuration from Vite environment variables.
 * Only public endpoints belong here — never put API secrets in frontend env vars.
 * Keys should live on your backend, which these URLs point to.
 */
const env = import.meta.env

export const config = {
  /** POST { messages: {role, content}[] } -> { reply: string } */
  copilotApiUrl: (env.VITE_COPILOT_API_URL as string | undefined)?.trim() || '',
  /** POST { indicators: string[] } -> { results: IntelLookup[] } */
  threatIntelApiUrl: (env.VITE_THREAT_INTEL_API_URL as string | undefined)?.trim() || '',
  /** GET -> { indicators: IntelIndicator[], updatedAt: string } */
  threatFeedApiUrl: (env.VITE_THREAT_FEED_API_URL as string | undefined)?.trim() || '',
}

export const isCopilotConnected = () => Boolean(config.copilotApiUrl)
export const isThreatIntelConnected = () => Boolean(config.threatIntelApiUrl)
export const isThreatFeedConnected = () => Boolean(config.threatFeedApiUrl)
