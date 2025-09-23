Getting Started
oRPC (OpenAPI Remote Procedure Call) combines RPC (Remote Procedure Call) with OpenAPI, allowing you to define and call remote (or local) procedures through a type-safe API while adhering to the OpenAPI specification.

oRPC simplifies RPC service definition, making it easy to build scalable applications, from simple scripts to complex microservices.

This guide covers the basics: defining procedures, handling errors, and integrating with popular frameworks.

Prerequisites
Node.js 18+ (20+ recommended) | Bun | Deno | Cloudflare Workers
A package manager: npm | pnpm | yarn | bun | deno
A TypeScript project (strict mode recommended)
Installation

npm

yarn

pnpm

bun

deno

npm install @orpc/server@latest @orpc/client@latest
Define App Router
We'll use Zod for schema validation (optional, any standard schema is supported).

import type { IncomingHttpHeaders } from 'node:http'
import { ORPCError, os } from '@orpc/server'
import \* as z from 'zod'

const PlanetSchema = z.object({
id: z.number().int().min(1),
name: z.string(),
description: z.string().optional(),
})

export const listPlanet = os
.input(
z.object({
limit: z.number().int().min(1).max(100).optional(),
cursor: z.number().int().min(0).default(0),
}),
)
.handler(async ({ input }) => {
// your list code here
return [{ id: 1, name: 'name' }]
})

export const findPlanet = os
.input(PlanetSchema.pick({ id: true }))
.handler(async ({ input }) => {
// your find code here
return { id: 1, name: 'name' }
})

export const createPlanet = os
.$context<{ headers: IncomingHttpHeaders }>()
.use(({ context, next }) => {
const user = parseJWT(context.headers.authorization?.split(' ')[1])

    if (user) {
      return next({ context: { user } })
    }

    throw new ORPCError('UNAUTHORIZED')

})
.input(PlanetSchema.omit({ id: true }))
.handler(async ({ input, context }) => {
// your create code here
return { id: 1, name: 'name' }
})

export const router = {
planet: {
list: listPlanet,
find: findPlanet,
create: createPlanet
}
}
Create Server
Using Node.js as the server runtime, but oRPC also supports other runtimes like Bun, Deno, Cloudflare Workers, etc.

import { createServer } from 'node:http'
import { RPCHandler } from '@orpc/server/node'
import { CORSPlugin } from '@orpc/server/plugins'

const handler = new RPCHandler(router, {
plugins: [new CORSPlugin()]
})

const server = createServer(async (req, res) => {
const result = await handler.handle(req, res, {
context: { headers: req.headers }
})

if (!result.matched) {
res.statusCode = 404
res.end('No procedure matched')
}
})

server.listen(
3000,
'127.0.0.1',
() => console.log('Listening on 127.0.0.1:3000')
)
Learn more about RPCHandler.

Create Client

import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'

const link = new RPCLink({
url: 'http://127.0.0.1:3000',
headers: { Authorization: 'Bearer token' },
})

export const orpc: RouterClient<typeof router> = createORPCClient(link)
Supports both client-side clients and server-side clients.

Call Procedure
End-to-end type-safety and auto-completion out of the box.

const planet = await orpc.planet.find({ id: 1 })

orpc.planet.create
Next Steps
This guide introduced the RPC aspects of oRPC. To explore OpenAPI integration, visit the OpenAPI Guide.

Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Procedure in oRPC
In oRPC, a procedure like a standard function but comes with built-in support for:

Input/output validation
Middleware
Dependency injection
Other extensibility features
Overview
Here’s an example of defining a procedure in oRPC:

import { os } from '@orpc/server'

const example = os
.use(aMiddleware) // Apply middleware
.input(z.object({ name: z.string() })) // Define input validation
.use(aMiddlewareWithInput, input => input.name) // Use middleware with typed input
.output(z.object({ id: z.number() })) // Define output validation
.handler(async ({ input, context }) => { // Define execution logic
return { id: 1 }
})
.callable() // Make the procedure callable like a regular function
.actionable() // Server Action compatibility
INFO

The .handler method is the only required step. All other chains are optional.

Input/Output Validation
oRPC supports Zod, Valibot, Arktype, and any other Standard Schema library for input and output validation.

TIP

By explicitly specifying the .output or your handler's return type, you enable TypeScript to infer the output without parsing the handler's code. This approach can dramatically enhance both type-checking and IDE-suggestion speed.

type Utility
For simple use-case without external libraries, use oRPC’s built-in type utility. It takes a mapping function as its first argument:

import { os, type } from '@orpc/server'

const example = os
.input(type<{ value: number }>())
.output(type<{ value: number }, number>(({ value }) => value))
.handler(async ({ input }) => input)
Using Middleware
The .use method allows you to pass middleware, which must call next to continue execution.

const aMiddleware = os.middleware(async ({ context, next }) => next())

const example = os
.use(aMiddleware) // Apply middleware
.use(async ({ context, next }) => next()) // Inline middleware
.handler(async ({ context }) => { /_ logic _/ })
INFO

Middleware can be applied if the current context meets the middleware dependent context requirements and does not conflict with the current context.

Initial Configuration
Customize the initial input schema using .$input:

const base = os.$input(z.void())
const base = os.$input<Schema<void, unknown>>()
Unlike .input, the .$input method lets you redefine the input schema after its initial configuration. This is useful when you need to enforce a void input when no .input is specified.

Reusability
Each modification to a builder creates a completely new instance, avoiding reference issues. This makes it easy to reuse and extend procedures efficiently.

const pub = os.use(logMiddleware) // Base setup for procedures that publish
const authed = pub.use(authMiddleware) // Extends 'pub' with authentication

const pubExample = pub.handler(async ({ context }) => { /_ logic _/ })

const authedExample = pubExample.use(authMiddleware)
This pattern helps prevent duplication while maintaining flexibility.

Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Router in oRPC
Routers in oRPC are simple, nestable objects composed of procedures. They can also modify their own procedures, offering flexibility and modularity when designing your API.

Overview
Routers are defined as plain JavaScript objects where each key corresponds to a procedure. For example:

import { os } from '@orpc/server'

const ping = os.handler(async () => 'ping')
const pong = os.handler(async () => 'pong')

const router = {
ping,
pong,
nested: { ping, pong }
}
Extending Router
Routers can be modified to include additional features. For example, to require authentication on all procedures:

const router = os.use(requiredAuth).router({
ping,
pong,
nested: {
ping,
pong,
}
})
WARNING

If you apply middleware using .use at both the router and procedure levels, it may execute multiple times. This duplication can lead to performance issues. For guidance on avoiding redundant middleware execution, please see our best practices for middleware deduplication.

Lazy Router
In oRPC, routers can be lazy-loaded, making them ideal for code splitting and enhancing cold start performance. Lazy loading allows you to defer the initialization of routes until they are actually needed, which reduces the initial load time and improves resource management.

router.ts

planet.ts

const router = {
ping,
pong,
planet: os.lazy(() => import('./planet'))
}
TIP

Alternatively, you can use the standalone lazy helper from @orpc/server. This helper is faster for type inference, and doesn't require matching the Initial Context.

router.ts

import { lazy } from '@orpc/server'

const router = {
ping,
pong,
planet: lazy(() => import('./planet'))
}
Utilities
INFO

Every procedure is also a router, so you can apply these utilities to procedures as well.

Infer Router Inputs

import type { InferRouterInputs } from '@orpc/server'

export type Inputs = InferRouterInputs<typeof router>

type FindPlanetInput = Inputs['planet']['find']
Infers the expected input types for each procedure in the router.

Infer Router Outputs

import type { InferRouterOutputs } from '@orpc/server'

export type Outputs = InferRouterOutputs<typeof router>

type FindPlanetOutput = Outputs['planet']['find']
Infers the expected output types for each procedure in the router.

Infer Router Initial Contexts

import type { InferRouterInitialContexts } from '@orpc/server'

export type InitialContexts = InferRouterInitialContexts<typeof router>

type FindPlanetInitialContext = InitialContexts['planet']['find']
Infers the initial context types defined for each procedure.

Infer Router Current Contexts

import type { InferRouterCurrentContexts } from '@orpc/server'

export type CurrentContexts = InferRouterCurrentContexts<typeof router>

type FindPlanetCurrentContext = CurrentContexts['planet']['find']
Infers the current context types, which combine the initial context with the execution context and pass it to the handler.

Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Middleware in oRPC
Middleware is a powerful feature in oRPC that enables reusable and extensible procedures. It allows you to:

Intercept, hook into, or listen to a handler's execution.
Inject or guard the execution context.
Overview
Middleware is a function that takes a next function as a parameter and either returns the result of next or modifies the result before returning it.

const authMiddleware = os
.$context<{ something?: string }>() // <-- define dependent-context
.middleware(async ({ context, next }) => {
// Execute logic before the handler

    const result = await next({
      context: { // Pass additional context
        user: { id: 1, name: 'John' }
      }
    })

    // Execute logic after the handler

    return result

})

const example = os
.use(authMiddleware)
.handler(async ({ context }) => {
const user = context.user
})
Dependent context
Before .middleware, you can .$context to specify the dependent context, which must be satisfied when the middleware is used.

Inline Middleware
Middleware can be defined inline within .use, which is useful for simple middleware functions.

const example = os
.use(async ({ context, next }) => {
// Execute logic before the handler
return next()
})
.handler(async ({ context }) => {
// Handler logic
})
Middleware Context
Middleware can be used to inject or guard the context.

const setting = os
.use(async ({ context, next }) => {
return next({
context: {
auth: await auth() // <-- inject auth payload
}
})
})
.use(async ({ context, next }) => {
if (!context.auth) { // <-- guard auth
throw new ORPCError('UNAUTHORIZED')
}

    return next({
      context: {
        auth: context.auth // <-- override auth
      }
    })

})
.handler(async ({ context }) => {
console.log(context.auth) // <-- access auth
})
INFO

When you pass additional context to next, it will be merged with the existing context.

Middleware Input
Middleware can access input, enabling use cases like permission checks.

const canUpdate = os.middleware(async ({ context, next }, input: number) => {
// Perform permission check
return next()
})

const ping = os
.input(z.number())
.use(canUpdate)
.handler(async ({ input }) => {
// Handler logic
})

// Mapping input if necessary
const pong = os
.input(z.object({ id: z.number() }))
.use(canUpdate, input => input.id)
.handler(async ({ input }) => {
// Handler logic
})
INFO

You can adapt a middleware to accept a different input shape by using .mapInput.

const canUpdate = os.middleware(async ({ context, next }, input: number) => {
return next()
})

// Transform middleware to accept a new input shape
const mappedCanUpdate = canUpdate.mapInput((input: { id: number }) => input.id)
Middleware Output
Middleware can also modify the output of a handler, such as implementing caching mechanisms.

const cacheMid = os.middleware(async ({ context, next, path }, input, output) => {
const cacheKey = path.join('/') + JSON.stringify(input)

if (db.has(cacheKey)) {
return output(db.get(cacheKey))
}

const result = await next({})

db.set(cacheKey, result.output)

return result
})
Concatenation
Multiple middleware functions can be combined using .concat.

const concatMiddleware = aMiddleware
.concat(os.middleware(async ({ next }) => next()))
.concat(anotherMiddleware)
INFO

If you want to concatenate two middlewares with different input types, you can use .mapInput to align their input types before concatenation.

Built-in Middlewares
oRPC provides some built-in middlewares that can be used to simplify common use cases.

import { onError, onFinish, onStart, onSuccess } from '@orpc/server'

const ping = os
.use(onStart(() => {
// Execute logic before the handler
}))
.use(onSuccess(() => {
// Execute when the handler succeeds
}))
.use(onError(() => {
// Execute when the handler fails
}))
.use(onFinish(() => {
// Execute logic after the handler
}))
.handler(async ({ context }) => {
// Handler logic
})
Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Context in oRPC
oRPC’s context mechanism provides a type-safe dependency injection pattern. It lets you supply required dependencies either explicitly or dynamically through middleware. There are two types:

Initial Context: Provided explicitly when invoking a procedure.
Execution Context: Generated during procedure execution, typically by middleware.
Initial Context
Initial context is used to define required dependencies (usually environment-specific) that must be passed when calling a procedure.

const base = os.$context<{ headers: Headers, env: { DB_URL: string } }>()

const getting = base
.handler(async ({ context }) => {
console.log(context.env)
})

export const router = { getting }
When calling that requires initial context, pass it explicitly:

import { RPCHandler } from '@orpc/server/fetch'

const handler = new RPCHandler(router)

export default function fetch(request: Request) {
handler.handle(request, {
context: { // <-- you must pass initial context here
headers: request.headers,
env: {
DB_URL: '\*\*\*'
}
}
})
}
Execution context
Execution context is computed during the process lifecycle, usually via middleware. It can be used independently or combined with initial context.

import { cookies, headers } from 'next/headers'

const base = os.use(async ({ next }) => next({
context: {
headers: await headers(),
cookies: await cookies(),
},
}))

const getting = base.handler(async ({ context }) => {
context.cookies.set('key', 'value')
})

export const router = { getting }
When using execution context, you don’t need to pass any context manually:

import { RPCHandler } from '@orpc/server/fetch'

const handler = new RPCHandler(router)

export default function fetch(request: Request) {
handler.handle(request) // <-- no need to pass anything more
}
Combining Initial and Execution Context
Often you need both static and dynamic dependencies. Use initial context for environment-specific values (e.g., database URLs) and middleware (execution context) for runtime data (e.g., user authentication).

const base = os.$context<{ headers: Headers, env: { DB_URL: string } }>()

const requireAuth = base.middleware(async ({ context, next }) => {
const user = parseJWT(context.headers.get('authorization')?.split(' ')[1])

if (user) {
return next({ context: { user } })
}

throw new ORPCError('UNAUTHORIZED')
})

const dbProvider = base.middleware(async ({ context, next }) => {
const client = new Client(context.env.DB_URL)

try {
await client.connect()
return next({ context: { db: client } })
}
finally {
await client.disconnect()
}
})

const getting = base
.use(dbProvider)
.use(requireAuth)
.handler(async ({ context }) => {
console.log(context.db)
console.log(context.user)
})
Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Error Handling in oRPC
oRPC offers a robust error handling system. You can either throw standard JavaScript errors or, preferably, use the specialized ORPCError class to utilize oRPC features.

There are two primary approaches:

Normal Approach: Throw errors directly (using ORPCError is recommended for clarity).
Type‑Safe Approach: Predefine error types so that clients can infer and handle errors in a type‑safe manner.
WARNING

The ORPCError.data property is sent to the client. Avoid including sensitive information.

Normal Approach
In the traditional approach you may throw any JavaScript error. However, using the ORPCError class improves consistency and ensures that error codes and optional data are handled appropriately.

Key Points:

The first argument is the error code.
You may optionally include a message, additional error data, or any standard error options.

const rateLimit = os.middleware(async ({ next }) => {
throw new ORPCError('RATE_LIMITED', {
message: 'You are being rate limited',
data: { retryAfter: 60 }
})
return next()
})

const example = os
.use(rateLimit)
.handler(async ({ input }) => {
throw new ORPCError('NOT_FOUND')
throw new Error('Something went wrong') // <-- will be converted to INTERNAL_SERVER_ERROR
})
DANGER

Do not pass sensitive data in the ORPCError.data field.

Type‑Safe Error Handling
For a fully type‑safe error management experience, define your error types using the .errors method. This lets the client infer the error’s structure and handle it accordingly. You can use any Standard Schema library to validate error data.

const base = os.errors({ // <-- common errors
RATE_LIMITED: {
data: z.object({
retryAfter: z.number(),
}),
},
UNAUTHORIZED: {},
})

const rateLimit = base.middleware(async ({ next, errors }) => {
throw errors.RATE_LIMITED({
message: 'You are being rate limited',
data: { retryAfter: 60 }
})
return next()
})

const example = base
.use(rateLimit)
.errors({
NOT_FOUND: {
message: 'The resource was not found', // <-- default message
},
})
.handler(async ({ input, errors }) => {
throw errors.NOT_FOUND()
})
DANGER

Again, avoid including any sensitive data in the error data since it will be exposed to the client.

Learn more about Client Error Handling.

Combining Both Approaches
You can combine both strategies seamlessly. When you throw an ORPCError instance, if the code, status and data match with the errors defined in the .errors method, oRPC will treat it exactly as if you had thrown errors.[code] using the type‑safe approach.

const base = os.errors({ // <-- common errors
RATE_LIMITED: {
data: z.object({
retryAfter: z.number().int().min(1).default(1),
}),
},
UNAUTHORIZED: {},
})

const rateLimit = base.middleware(async ({ next, errors }) => {
throw errors.RATE_LIMITED({
message: 'You are being rate limited',
data: { retryAfter: 60 }
})
// OR --- both are equivalent
throw new ORPCError('RATE_LIMITED', {
message: 'You are being rate limited',
data: { retryAfter: 60 }
})
return next()
})

const example = base
.use(rateLimit)
.handler(async ({ input }) => {
throw new ORPCError('BAD_REQUEST') // <-- unknown error
})
DANGER

Remember: Since ORPCError.data is transmitted to the client, do not include any sensitive information.

Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Event Iterator (SSE)
oRPC provides built‑in support for streaming responses, real‑time updates, and server-sent events (SSE) without any extra configuration. This functionality is ideal for applications that require live updates, such as AI chat responses, live sports scores, or stock market data.

Overview
The event iterator is defined by an asynchronous generator function. In the example below, the handler continuously yields a new event every second:

const example = os
.handler(async function\* ({ input, lastEventId }) {
while (true) {
yield { message: 'Hello, world!' }
await new Promise(resolve => setTimeout(resolve, 1000))
}
})
Learn how to consume the event iterator on the client here

Validate Event Iterator
oRPC includes a built‑in eventIterator helper that works with any Standard Schema library to validate events.

import { eventIterator } from '@orpc/server'

const example = os
.output(eventIterator(z.object({ message: z.string() })))
.handler(async function\* ({ input, lastEventId }) {
while (true) {
yield { message: 'Hello, world!' }
await new Promise(resolve => setTimeout(resolve, 1000))
}
})
Last Event ID & Event Metadata
Using the withEventMeta helper, you can attach additional event meta (such as an event ID or a retry interval) to each event.

INFO

When used with Client Retry Plugin or EventSource, the client will reconnect with the last event ID. This value is made available to your handler as lastEventId, allowing you to resume the stream seamlessly.

import { withEventMeta } from '@orpc/server'

const example = os
.handler(async function\* ({ input, lastEventId }) {
if (lastEventId) {
// Resume streaming from lastEventId
}
else {
while (true) {
yield withEventMeta({ message: 'Hello, world!' }, { id: 'some-id', retry: 10_000 })
await new Promise(resolve => setTimeout(resolve, 1000))
}
}
})
Stop Event Iterator
To signal the end of the stream, simply use a return statement. When the handler returns, oRPC marks the stream as successfully completed.

WARNING

This behavior is exclusive to oRPC. Standard SSE clients, such as those using EventSource will automatically reconnect when the connection closes.

const example = os
.handler(async function\* ({ input, lastEventId }) {
while (true) {
if (done) {
return
}

      yield { message: 'Hello, world!' }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

})
Cleanup Side-Effects
If the client closes the connection or an unexpected error occurs, you can use a finally block to clean up any side effects (for example, closing database connections or stopping background tasks):

const example = os
.handler(async function\* ({ input, lastEventId }) {
try {
while (true) {
yield { message: 'Hello, world!' }
await new Promise(resolve => setTimeout(resolve, 1000))
}
}
finally {
console.log('Cleanup logic here')
}
})
Event Publisher
oRPC includes a built-in EventPublisher for real-time features like chat, notifications, or live updates. It supports broadcasting and subscribing to named events.

Static Events

Dynamic Events

import { EventPublisher } from '@orpc/server'

const publisher = new EventPublisher<{
'something-updated': {
id: string
}
}>()

const livePlanet = os
.handler(async function\* ({ input, signal }) {
for await (const payload of publisher.subscribe('something-updated', { signal })) {
// handle payload here and yield something to client
}
})

const update = os
.input(z.object({ id: z.string() }))
.handler(({ input }) => {
publisher.publish('something-updated', { id: input.id })
})
Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Server Action
React Server Actions let client components invoke asynchronous server functions. With oRPC, you simply append the .actionable modifier to enable Server Action compatibility.

Server Side
Define your procedure with .actionable for Server Action support.

'use server'

import { redirect } from 'next/navigation'

export const ping = os
.input(z.object({ name: z.string() }))
.handler(async ({ input }) => `Hello, ${input.name}`)
.actionable({
context: async () => ({}), // Optional: provide initial context if needed
interceptors: [
onSuccess(async output => redirect(`/some-where`)),
onError(async error => console.error(error)),
],
})
TIP

We recommend using Runtime Context instead of Initial Context when working with Server Actions.

Client Side
On the client, import and call your procedure as follows:

'use client'

import { ping } from './actions'

export function MyComponent() {
const [name, setName] = useState('')

const handleSubmit = async (e: FormEvent) => {
e.preventDefault()
const [error, data] = await ping({ name })
console.log(error, data)
}

return (
<form onSubmit={handleSubmit}>
<input value={name} onChange={e => setName(e.target.value)} />
<button type="submit">Submit</button>
</form>
)
}
This approach seamlessly integrates server-side procedures with client components via Server Actions.

Type‑Safe Error Handling
The .actionable modifier supports type-safe error handling with a JSON-like error object.

'use client'

const [error, data] = await someAction({ name: 'John' })

if (error) {
if (error.defined) {
console.log(error.data)
// ^ Typed error data
}
// Handle unknown errors
}
else {
// Handle success
console.log(data)
}
@orpc/react Package
The @orpc/react package offers utilities to integrate oRPC with React and React Server Actions.

Installation

npm

yarn

pnpm

bun

deno

npm install @orpc/react@latest
useServerAction Hook
The useServerAction hook simplifies invoking server actions in React.

'use client'

import { useServerAction } from '@orpc/react/hooks'
import { isDefinedError, onError } from '@orpc/client'

export function MyComponent() {
const { execute, data, error, status } = useServerAction(someAction, {
interceptors: [
onError((error) => {
if (isDefinedError(error)) {
console.error(error.data)
// ^ Typed error data
}
}),
],
})

const action = async (form: FormData) => {
const name = form.get('name') as string
execute({ name })
}

return (
<form action={action}>
<input type="text" name="name" required />
<button type="submit">Submit</button>
{status === 'pending' && <p>Loading...</p>}
</form>
)
}
useOptimisticServerAction Hook
The useOptimisticServerAction hook enables optimistic UI updates while a server action executes. This provides immediate visual feedback to users before the server responds.

import { useOptimisticServerAction } from '@orpc/react/hooks'
import { onSuccessDeferred } from '@orpc/react'

export function MyComponent() {
const [todos, setTodos] = useState<Todo[]>([])
const { execute, optimisticState } = useOptimisticServerAction(someAction, {
optimisticPassthrough: todos,
optimisticReducer: (currentState, newTodo) => [...currentState, newTodo],
interceptors: [
onSuccessDeferred(({ data }) => {
setTodos(prevTodos => [...prevTodos, data])
}),
],
})

const handleSubmit = (form: FormData) => {
const todo = form.get('todo') as string
execute({ todo })
}

return (
<div>
<ul>
{optimisticState.map(todo => (
<li key={todo.todo}>{todo.todo}</li>
))}
</ul>
<form action={handleSubmit}>
<input type="text" name="todo" required />
<button type="submit">Add Todo</button>
</form>
</div>
)
}
INFO

The onSuccessDeferred interceptor defers execution, useful for updating states.

createFormAction Utility
The createFormAction utility accepts a procedure and returns a function to handle form submissions. It uses Bracket Notation to deserialize form data.

import { createFormAction } from '@orpc/react'

const dosomething = os
.input(
z.object({
user: z.object({
name: z.string(),
age: z.coerce.number(),
}),
})
)
.handler(({ input }) => {
console.log('Form action called!')
console.log(input)
})

export const redirectSomeWhereForm = createFormAction(dosomething, {
interceptors: [
onSuccess(async () => {
redirect('/some-where')
}),
],
})

export function MyComponent() {
return (
<form action={redirectSomeWhereForm}>
<input type="text" name="user[name]" required />
<input type="number" name="user[age]" required />
<button type="submit">Submit</button>
</form>
)
}
By moving the redirect('/some-where') logic into createFormAction rather than the procedure, you enhance the procedure's reusability beyond Server Actions.

INFO

When using createFormAction, any ORPCError with a status of 401, 403, or 404 is automatically converted into the corresponding Next.js error responses: unauthorized, forbidden, and not found.

Form Data Utilities
The @orpc/react package re-exports Form Data Helpers for seamless form data parsing and validation error handling with bracket notation support.

import { getIssueMessage, parseFormData } from '@orpc/react'

export function MyComponent() {
const { execute, data, error, status } = useServerAction(someAction)

return (
<form action={(form) => { execute(parseFormData(form)) }}>
<label>
Name:
<input name="user[name]" type="text" />
<span>{getIssueMessage(error, 'user[name]')}</span>
</label>

      <label>
        Age:
        <input name="user[age]" type="number" />
        <span>{getIssueMessage(error, 'user[age]')}</span>
      </label>

      <label>
        Images:
        <input name="images[]" type="file" multiple />
        <span>{getIssueMessage(error, 'images[]')}</span>
      </label>

      <button disabled={status === 'pending'}>
        Submit
      </button>
    </form>

)
}
Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Metadata
oRPC procedures support metadata, simple key-value pairs that provide extra information to customize behavior.

Basic Example

interface ORPCMetadata {
cache?: boolean
}

const base = os
.$meta<ORPCMetadata>({}) // require define initial context
.use(async ({ procedure, next, path }, input, output) => {
if (!procedure['~orpc'].meta.cache) {
return await next()
}

    const cacheKey = path.join('/') + JSON.stringify(input)

    if (db.has(cacheKey)) {
      return output(db.get(cacheKey))
    }

    const result = await next()

    db.set(cacheKey, result.output)

    return result

})

const example = base
.meta({ cache: true })
.handler(() => {
// Implement your procedure logic here
})
INFO

The .meta can be called multiple times; each call spread merges the new metadata with the existing metadata or the initial metadata.

Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Getting Started
OpenAPI is a widely adopted standard for describing RESTful APIs. With oRPC, you can easily publish OpenAPI-compliant APIs with minimal effort.

oRPC is inherently compatible with OpenAPI, but you may need additional configurations such as path prefixes, custom routing, or including headers, parameters, and queries in inputs and outputs. This guide explains how to make your oRPC setup fully OpenAPI-compatible. It assumes basic knowledge of oRPC or familiarity with the Getting Started guide.

Prerequisites
Node.js 18+ (20+ recommended) | Bun | Deno | Cloudflare Workers
A package manager: npm | pnpm | yarn | bun | deno
A TypeScript project (strict mode recommended)
Installation

npm

yarn

pnpm

bun

deno

npm install @orpc/server@latest @orpc/client@latest @orpc/openapi@latest
Defining Routes
This snippet is based on the Getting Started guide. Please read it first.

import type { IncomingHttpHeaders } from 'node:http'
import { ORPCError, os } from '@orpc/server'
import \* as z from 'zod'

const PlanetSchema = z.object({
id: z.number().int().min(1),
name: z.string(),
description: z.string().optional(),
})

export const listPlanet = os
.route({ method: 'GET', path: '/planets' })
.input(z.object({
limit: z.number().int().min(1).max(100).optional(),
cursor: z.number().int().min(0).default(0),
}))
.output(z.array(PlanetSchema))
.handler(async ({ input }) => {
// your list code here
return [{ id: 1, name: 'name' }]
})

export const findPlanet = os
.route({ method: 'GET', path: '/planets/{id}' })
.input(z.object({ id: z.coerce.number().int().min(1) }))
.output(PlanetSchema)
.handler(async ({ input }) => {
// your find code here
return { id: 1, name: 'name' }
})

export const createPlanet = os
.$context<{ headers: IncomingHttpHeaders }>()
.use(({ context, next }) => {
const user = parseJWT(context.headers.authorization?.split(' ')[1])

    if (user) {
      return next({ context: { user } })
    }

    throw new ORPCError('UNAUTHORIZED')

})
.route({ method: 'POST', path: '/planets' })
.input(PlanetSchema.omit({ id: true }))
.output(PlanetSchema)
.handler(async ({ input, context }) => {
// your create code here
return { id: 1, name: 'name' }
})

export const router = {
planet: {
list: listPlanet,
find: findPlanet,
create: createPlanet
}
}
Key Enhancements:
.route defines HTTP methods and paths.
.output enables automatic OpenAPI spec generation.
z.coerce ensures correct parameter parsing.
For handling headers, queries, etc., see Input/Output Structure. For auto-coercion, see Zod Smart Coercion Plugin. For more .route options, see Routing.

Creating a Server

import { createServer } from 'node:http'
import { OpenAPIHandler } from '@orpc/openapi/node'
import { CORSPlugin } from '@orpc/server/plugins'

const handler = new OpenAPIHandler(router, {
plugins: [new CORSPlugin()]
})

const server = createServer(async (req, res) => {
const result = await handler.handle(req, res, {
context: { headers: req.headers }
})

if (!result.matched) {
res.statusCode = 404
res.end('No procedure matched')
}
})

server.listen(
3000,
'127.0.0.1',
() => console.log('Listening on 127.0.0.1:3000')
)
Important Changes:
Use OpenAPIHandler instead of RPCHandler.
Learn more in OpenAPIHandler.
Accessing APIs

curl -X GET http://127.0.0.1:3000/planets
curl -X GET http://127.0.0.1:3000/planets/1
curl -X POST http://127.0.0.1:3000/planets \
 -H 'Authorization: Bearer token' \
 -H 'Content-Type: application/json' \
 -d '{"name": "name"}'
Just a small tweak makes your oRPC API OpenAPI-compliant!

Generating OpenAPI Spec

import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { router } from './shared/planet'

const generator = new OpenAPIGenerator({
schemaConverters: [
new ZodToJsonSchemaConverter()
]
})

const spec = await generator.generate(router, {
info: {
title: 'Planet API',
version: '1.0.0'
}
})

console.log(JSON.stringify(spec, null, 2))
Run the script above to generate your OpenAPI spec.

INFO

oRPC supports a wide range of Standard Schema for OpenAPI generation. See the full list here

Edit on GitHub
Last updated: 9/17/25, 9:33 PM

Pager

Define Contract
Contract-first development is a design pattern where you define the API contract before writing any implementation code. This methodology promotes a well-structured codebase that adheres to best practices and facilitates easier maintenance and evolution over time.

In oRPC, a contract specifies the rules and expectations for a procedure. It details the input, output, errors,... types and can include constraints or validations to ensure that both client and server share a clear, consistent interface.

Installation

npm

yarn

pnpm

bun

deno

npm install @orpc/contract@latest
Procedure Contract
A procedure contract in oRPC is similar to a standard procedure definition, but with extraneous APIs removed to better support contract-first development.

import { oc } from '@orpc/contract'

export const exampleContract = oc
.input(
z.object({
name: z.string(),
age: z.number().int().min(0),
}),
)
.output(
z.object({
id: z.number().int().min(0),
name: z.string(),
age: z.number().int().min(0),
}),
)
Contract Router
Similar to the standard router in oRPC, the contract router organizes your defined contracts into a structured hierarchy. The contract router is streamlined by removing APIs that are not essential for contract-first development.

export const routerContract = {
example: exampleContract,
nested: {
example: exampleContract,
},
}
Full Example
Below is a complete example demonstrating how to define a contract for a simple "Planet" service. This example extracted from our Getting Started guide.

export const PlanetSchema = z.object({
id: z.number().int().min(1),
name: z.string(),
description: z.string().optional(),
})

export const listPlanetContract = oc
.input(
z.object({
limit: z.number().int().min(1).max(100).optional(),
cursor: z.number().int().min(0).default(0),
}),
)
.output(z.array(PlanetSchema))

export const findPlanetContract = oc
.input(PlanetSchema.pick({ id: true }))
.output(PlanetSchema)

export const createPlanetContract = oc
.input(PlanetSchema.omit({ id: true }))
.output(PlanetSchema)

export const contract = {
planet: {
list: listPlanetContract,
find: findPlanetContract,
create: createPlanetContract,
},
}
Utilities
Infer Contract Router Input

import type { InferContractRouterInputs } from '@orpc/contract'

export type Inputs = InferContractRouterInputs<typeof contract>

type FindPlanetInput = Inputs['planet']['find']
This snippet automatically extracts the expected input types for each procedure in the router.

Infer Contract Router Output

import type { InferContractRouterOutputs } from '@orpc/contract'

export type Outputs = InferContractRouterOutputs<typeof contract>

type FindPlanetOutput = Outputs['planet']['find']
Similarly, this utility infers the output types, ensuring that your application correctly handles the results from each procedure.

Implement Contract
After defining your contract, the next step is to implement it in your server code. oRPC enforces your contract at runtime, ensuring that your API consistently adheres to its specifications.

Installation

npm

yarn

pnpm

bun

deno

npm install @orpc/server@latest
The Implementer
The implement function converts your contract into an implementer instance. This instance compatible with the original os from @orpc/server provides a type-safe interface to define your procedures and supports features like Middleware and Context.

import { implement } from '@orpc/server'

const os = implement(contract) // fully replaces the os from @orpc/server
Implementing Procedures
Define a procedure by attaching a .handler to its corresponding contract, ensuring it adheres to the contract’s specifications.

export const listPlanet = os.planet.list
.handler(({ input }) => {
// Your logic for listing planets
return []
})
Building the Router
To assemble your API, create a router at the root level using .router. This ensures that the entire router is type-checked and enforces the contract at runtime.

const router = os.router({ // <-- Essential for full contract enforcement
planet: {
list: listPlanet,
find: findPlanet,
create: createPlanet,
},
})
Full Implementation Example
Below is a complete implementation of the contract defined in the previous section.

const os = implement(contract)

export const listPlanet = os.planet.list
.handler(({ input }) => {
return []
})

export const findPlanet = os.planet.find
.handler(({ input }) => {
return { id: 123, name: 'Planet X' }
})

export const createPlanet = os.planet.create
.handler(({ input }) => {
return { id: 123, name: 'Planet X' }
})

export const router = os.router({
planet: {
list: listPlanet,
find: findPlanet,
create: createPlanet,
},
})

Router to Contract
A normal router works as a contract router as long as it does not include a lazy router. This guide not only shows you how to unlazy a router to make it compatible with contracts, but also how to minify it and prevent internal business logic from being exposed to the client.

Unlazy the Router
If your router includes a lazy router, you need to fully resolve it to make it compatible with contract.

import { unlazyRouter } from '@orpc/server'

const resolvedRouter = await unlazyRouter(router)
Minify & Export the Contract Router for the Client
Sometimes, you'll need to import the contract on the client - for example, to use OpenAPILink or define request methods in RPCLink.

If you're using Contract First, this is safe: your contract is already lightweight and free of business logic.

However, if you're deriving the contract from a router, importing it directly can be heavy and may leak internal logic. To prevent this, follow the steps below to safely minify and export your contract.

Minify the Contract Router and Export to JSON

import fs from 'node:fs'
import { minifyContractRouter } from '@orpc/contract'

const minifiedRouter = minifyContractRouter(router)

fs.writeFileSync('./contract.json', JSON.stringify(minifiedRouter))
WARNING

minifyContractRouter preserves only the metadata and routing information necessary for the client, all other data will be stripped out.

Import the Contract JSON on the Client Side

import contract from './contract.json'

const link = new OpenAPILink(contract as typeof router, {
url: 'http://localhost:3000/api',
})
WARNING

Cast contract to typeof router to ensure type safety, since standard schema types cannot be serialized to JSON so we must manually cast them.

HTTP
oRPC includes built-in HTTP support, making it easy to expose RPC endpoints in any environment that speaks HTTP.

Server Adapters
Adapter Target
fetch MDN Fetch API (Browser, Bun, Deno, Cloudflare Workers, etc.)
node Node.js built-in http/http2
aws-lambda AWS Lambda

node

bun

cloudflare

deno

aws-lambda

import { createServer } from 'node:http' // or 'node:http2'
import { RPCHandler } from '@orpc/server/node'
import { CORSPlugin } from '@orpc/server/plugins'

const handler = new RPCHandler(router, {
plugins: [
new CORSPlugin()
]
})

const server = createServer(async (req, res) => {
const { matched } = await handler.handle(req, res, {
prefix: '/rpc',
context: {} // Provide initial context if needed
})

if (matched) {
return
}

res.statusCode = 404
res.end('Not found')
})

server.listen(3000, '127.0.0.1', () => console.log('Listening on 127.0.0.1:3000'))
INFO

The handler can be any supported oRPC handler, such as RPCHandler, OpenAPIHandler, or another custom handler.

Client Adapters
Adapter Target
fetch MDN Fetch API (Browser, Node, Bun, Deno, Cloudflare Workers, etc.)

import { RPCLink } from '@orpc/client/fetch'

const link = new RPCLink({
url: 'http://localhost:3000/rpc',
headers: () => ({
'x-api-key': 'my-api-key'
}),
// fetch: <-- polyfill fetch if needed
})
INFO

The link can be any supported oRPC link, such as RPCLink, OpenAPILink, or another custom handler.

INFO

This only shows how to configure the http link. For full client examples, see Client-Side Clients.

Hono Adapter
Hono is a high-performance web framework built on top of Fetch API. For additional context, refer to the HTTP Adapter guide.

Basic

import { Hono } from 'hono'
import { RPCHandler } from '@orpc/server/fetch'

const app = new Hono()

const handler = new RPCHandler(router)

app.use('/rpc/\*', async (c, next) => {
const { matched, response } = await handler.handle(c.req.raw, {
prefix: '/rpc',
context: {} // Provide initial context if needed
})

if (matched) {
return c.newResponse(response.body, response)
}

await next()
})

export default app
INFO

The handler can be any supported oRPC handler, such as RPCHandler, OpenAPIHandler, or another custom handler.

Next.js Adapter
Next.js is a leading React framework for server-rendered apps. oRPC works with both the App Router and Pages Router. For additional context, refer to the HTTP Adapter guide.

INFO

oRPC also provides out-of-the-box support for Server Action with no additional configuration required.

Server
You set up an oRPC server inside Next.js using its Route Handlers.

app/rpc/[[...rest]]/route.ts

import { RPCHandler } from '@orpc/server/fetch'

const handler = new RPCHandler(router)

async function handleRequest(request: Request) {
const { response } = await handler.handle(request, {
prefix: '/rpc',
context: {}, // Provide initial context if needed
})

return response ?? new Response('Not found', { status: 404 })
}

export const HEAD = handleRequest
export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
INFO

The handler can be any supported oRPC handler, such as RPCHandler, OpenAPIHandler, or another custom handler.

Client
By leveraging headers from next/headers, you can configure the RPC link to work seamlessly in both browser and server environments:

lib/orpc.ts

import { RPCLink } from '@orpc/client/fetch'

const link = new RPCLink({
url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/rpc`,
headers: async () => {
if (typeof window !== 'undefined') {
return {}
}

    const { headers } = await import('next/headers')
    return await headers()

},
})
INFO

This only shows how to configure the link. For full client examples, see Client-Side Clients.

Optimize SSR
To reduce HTTP requests and improve latency during SSR, you can utilize a Server-Side Client during SSR. Below is a quick setup, see Optimize SSR for more details.

lib/orpc.ts

lib/orpc.server.ts

instrumentation.ts

app/layout.tsx

import type { RouterClient } from '@orpc/server'
import { RPCLink } from '@orpc/client/fetch'
import { createORPCClient } from '@orpc/client'

declare global {
var $client: RouterClient<typeof router> | undefined
}

const link = new RPCLink({
url: () => {
if (typeof window === 'undefined') {
throw new Error('RPCLink is not allowed on the server side.')
}

    return `${window.location.origin}/rpc`

},
})

/\*\*

- Fallback to client-side client if server-side client is not available.
  \*/
  export const client: RouterClient<typeof router> = globalThis.$client ?? createORPCClient(link)

Web Workers Adapter
Web Workers allow JavaScript code to run in background threads, separate from the main thread of a web page. This prevents blocking the UI while performing computationally intensive tasks. Web Workers are also supported in modern runtimes like Bun, Deno, etc.

With oRPC, you can establish type-safe communication channels between your main thread and Web Workers. For additional context, see the Message Port Adapter guide.

Web Worker
Configure your Web Worker to handle oRPC requests by upgrading it with a message port handler:

import { RPCHandler } from '@orpc/server/message-port'

const handler = new RPCHandler(router)

handler.upgrade(self, {
context: {}, // Provide initial context if needed
})
Main Thread
Create a link to communicate with your Web Worker:

import { RPCLink } from '@orpc/client/message-port'

export const link = new RPCLink({
port: new Worker('some-worker.ts')
})
INFO

This only shows how to configure the link. For full client examples, see Client-Side Clients.
