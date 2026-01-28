// Re-export server for Vercel compatibility
export { server } from './server.js'

// For local development, start the server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  import('./server.js').then(({ server }) => {
    const start = async () => {
      try {
        const port = Number(process.env.PORT || 3001)
        await server.listen({ port, host: '0.0.0.0' })
        console.log(`Server listening on http://localhost:${port}`)
      } catch (err) {
        server.log.error(err)
        process.exit(1)
      }
    }
    start()
  })
}
