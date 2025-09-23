import { Hono } from 'hono'
import { RPCHandler } from '@orpc/server/fetch'

import { appRouter } from './procedures'

const app = new Hono()

const rpcHandler = new RPCHandler(appRouter)

app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context: {
      headers: Object.fromEntries(c.req.raw.headers),
      userId: c.req.header('x-user-id') ?? undefined
    }
  })

  if (matched && response) {
    return c.newResponse(response.body, response)
  }

  await next()
})

app.get('/', (c) =>
  c.json({
    name: 'Monte Math API',
    version: '0.0.1',
    status: 'ready',
    endpoints: {
      rpc: '/rpc'
    }
  })
)

app.get('/health', (c) => c.json({ status: 'healthy' }))

const port = Number(process.env.PORT ?? 3001)
console.log(`Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch
}
