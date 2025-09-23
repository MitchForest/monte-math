import type { RouterClient } from '@orpc/server'
import { createRouterClient } from '@orpc/server'
import { RPCLink } from '@orpc/client/fetch'

import { appContract } from '@monte/shared'

export type ApiClient = RouterClient<typeof appContract>

export interface CreateClientOptions {
  baseUrl?: string
  getHeaders?: () => HeadersInit | Promise<HeadersInit>
}

export function createApiClient(options: CreateClientOptions = {}): ApiClient {
  const { baseUrl = 'http://localhost:3001', getHeaders } = options

  const link = new RPCLink({
    url: `${baseUrl.replace(/\/$/, '')}/rpc`,
    headers: getHeaders
  })

  return createRouterClient(appContract, { link })
}
