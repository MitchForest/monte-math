import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { RPCHandler } from '@orpc/server/fetch'
import { parse as parseCookie } from 'cookie'

import { appRouter } from './procedures'
import { buildClearSessionHeader, getSessionFromRequest } from './services/auth'
import { loadAuthEnvironment } from './config/auth'

const app = new Hono()

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
]

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const originAllowList = new Set([...defaultAllowedOrigins, ...allowedOrigins])

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return origin
      return originAllowList.has(origin) ? origin : ''
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    credentials: true,
  })
)

const rpcHandler = new RPCHandler(appRouter)
const authEnv = loadAuthEnvironment()

app.use('/rpc/*', async (c, next) => {
  const cookies = parseCookie(c.req.raw.headers.get('cookie') ?? '')
  const sessionCookie = cookies[authEnv.sessionCookieName]
  let authState = undefined
  try {
    authState = await getSessionFromRequest(sessionCookie)
  } catch {
    authState = undefined
  }
  const pendingCookies: string[] = []

  if (sessionCookie && !authState) {
    pendingCookies.push(buildClearSessionHeader())
  }

  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context: {
      headers: Object.fromEntries(c.req.raw.headers),
      session: authState?.session,
      user: authState?.user,
      setCookie: (value: string) => {
        pendingCookies.push(value)
      },
    },
  })

  if (matched && response) {
    pendingCookies.forEach((value) => {
      response.headers.append('set-cookie', value)
    })
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
      rpc: '/rpc',
    },
  })
)

app.get('/health', (c) => c.json({ status: 'healthy' }))

const port = Number(process.env.PORT ?? 3001)
console.log(`Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
