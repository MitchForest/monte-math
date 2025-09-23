# @monte/api-client – Typed RPC Client

This package wraps the shared oRPC contract with a transport suitable for browser and React usage. It centralizes all client configuration so apps don’t duplicate link logic.

## Responsibilities

- Create a `RouterClient` instance from `@monte/shared`’s `appContract`.
- Configure the fetch link (base URL, headers) for browser consumers.
- Provide a single `createApiClient` factory used by `apps/web` and `apps/studio`.

## API

```ts
import { createApiClient } from '@monte/api-client'

const client = createApiClient({
  baseUrl: 'https://api.monte.dev',
  getHeaders: () => ({ 'x-user-id': 'demo' }),
})

await client.skills.list()
```

## Boundaries

- Depends on `@monte/shared` for the contract definition.
- Must remain transport-focused; no schema definitions live here.
- Pure ESM/TypeScript module—consumers import directly into React or other environments.

If you need a different transport (e.g., server-side client), expose it here so both apps can reuse the configuration without bypassing the contract.
