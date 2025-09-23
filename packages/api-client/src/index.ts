import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AppContractClient } from '@monte/shared'

export interface CreateClientOptions {
  baseUrl?: string
  getHeaders?: () => HeadersInit | Promise<HeadersInit>
}

function normalizeHeaders(init: HeadersInit): Headers {
  return init instanceof Headers ? init : new Headers(init)
}

export function createApiClient(options: CreateClientOptions = {}): AppContractClient {
  const { baseUrl = 'http://localhost:3001', getHeaders } = options

  const link = new RPCLink({
    url: `${baseUrl.replace(/\/$/, '')}/rpc`,
    ...(getHeaders
      ? {
          headers: async (_options, _path, _input) => {
            const resolved = await getHeaders()
            return normalizeHeaders(resolved)
          },
        }
      : {}),
    fetch: async (request, init, _options, _path, _input) =>
      fetch(request, {
        ...init,
        credentials: 'include',
      }),
  })

  return createORPCClient<AppContractClient>(link)
}

export type ApiClient = ReturnType<typeof createApiClient>
