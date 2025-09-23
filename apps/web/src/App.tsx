import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AppRouter } from './router'

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  )
}
