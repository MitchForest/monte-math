import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ 
    name: 'Monte Math API',
    version: '0.0.1',
    status: 'ready'
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'healthy' })
})

const port = process.env.PORT || 3001
console.log(`Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}