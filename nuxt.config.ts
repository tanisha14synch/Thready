// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/image'
  ],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
    '@fortawesome/fontawesome-free/css/all.min.css'
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  // Dev server configuration
  devServer: {
    port: 3000,
    host: 'localhost'
  },
  // Configure server directory for API routes
  // Nuxt will use server/api/ folder for serverless API routes
  nitro: {
    // Allow importing from server folder
    alias: {
      '~/server': './server'
    }
  }
})
