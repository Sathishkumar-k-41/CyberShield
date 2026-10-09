/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend endpoint for the AI Security Copilot. POST { messages } -> { reply } */
  readonly VITE_COPILOT_API_URL?: string
  /** Backend endpoint for reputation lookups. POST { indicators } -> { results } */
  readonly VITE_THREAT_INTEL_API_URL?: string
  /** Backend endpoint for the Threat Intelligence page feed. GET -> { indicators, updatedAt } */
  readonly VITE_THREAT_FEED_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
