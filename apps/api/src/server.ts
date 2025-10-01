import { Hono } from 'hono'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT ?? 3001)

if (typeof Bun !== 'undefined') {
  Bun.serve({
    fetch: app.fetch,
    port,
  })
  console.info(`[api] listening on http://localhost:${port}`)
} else {
  void (async () => {
    const { serve } = await import('@hono/node-server')
    serve({
      fetch: app.fetch,
      port,
    })
    console.info(`[api] listening on http://localhost:${port}`)
  })()
}

export type AppType = typeof app
export default app
