/**
 * Expose runtime apiBase to Pinia stores so they hit same-origin /communities and /posts
 * when NUXT_PUBLIC_API_BASE is unset (no separate Fastify backend).
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const base = config.public.apiBase ?? ''
  if (typeof window !== 'undefined') {
    ;(window as unknown as { __API_BASE__?: string }).__API_BASE__ = base
  }
})
