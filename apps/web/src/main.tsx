import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppRouter } from './router'
import './styles.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root was not found')
}

createRoot(container).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
