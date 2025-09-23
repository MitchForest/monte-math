import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AppRouter } from './router'
import { SessionSynchronizer } from './components/session/SessionSynchronizer'

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SessionSynchronizer />
      <AppRouter />
    </QueryClientProvider>
  )
}
