// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt', '@nuxt/image'],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  // Nitro server routes (auth redirect); backend API stays in ./server (Fastify)
  serverDir: 'nitro-server',
  // Inline jose so Nitro bundles it; otherwise "Cannot find package 'jose'" when server runs from .nuxt/dev/
  nitro: {
    externals: { inline: ['jose'] },
  },
  css: ['~/assets/css/main.css', '@fortawesome/fontawesome-free/css/all.min.css'],
  vite: { plugins: [tailwindcss()] },
  // No public Shopify login URL (no shopifyLoginUrl). Frontend must never use a direct Shopify URL.
  runtimeConfig: {
    public: {
      // Default '' = same-origin so /communities and /posts hit Nitro routes when Fastify is not running
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? '',
      shopifyShop: process.env.NUXT_PUBLIC_SHOPIFY_SHOP || 'thebarwardrobe.myshopify.com',
    },
    // redirect_uri MUST be our app callback so Shopify sends users back to us. Required so we never send
    // an empty or Shopify-owned URL (shopify.com/.../account/callback), which would leave users stuck on Shopify.
    private: {
      shopifyApiKey: process.env.SHOPIFY_API_KEY || '',
      shopifyApiSecret: process.env.SHOPIFY_API_SECRET || '',
      shopifyClientId: process.env.SHOPIFY_CLIENT_ID || '',
      shopifyShopId: process.env.SHOPIFY_SHOP_ID || '',
      shopifyShop: process.env.SHOPIFY_SHOP || 'thebarwardrobe.myshopify.com',
      shopifyRedirectUri: process.env.SHOPIFY_REDIRECT_URI || process.env.CALLBACK_URL || 'https://thready-ruby.vercel.app/auth/shopify/callback',
      jwtSecret: process.env.JWT_SECRET || '',
    },
  },
})
