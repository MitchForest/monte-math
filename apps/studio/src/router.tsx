import { useEffect } from 'react'
import { Router, RootRoute, Route, RouterProvider, Outlet, useNavigate } from '@tanstack/react-router'

import { KnowledgeView } from './views/KnowledgeView'
import { LessonsView } from './views/LessonsView'
import { LoginView } from './views/LoginView'
import { SignupView } from './views/SignupView'
import { useSessionStore } from './stores/session-store'
import { LoadingScreen } from './components/admin/LoadingScreen'

const rootRoute = new RootRoute({
  component: RootLayout
})

const knowledgeRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: KnowledgePage
})

const lessonsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/lessons',
  component: LessonsPage
})

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage
})

const signupRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupPage
})

const routeTree = rootRoute.addChildren([knowledgeRoute, lessonsRoute, loginRoute, signupRoute])

export const router = new Router({ routeTree })

function RootLayout() {
  return <Outlet />
}

function useAuthRedirect(target: 'auth' | 'guest') {
  const status = useSessionStore((state) => state.status)
  const user = useSessionStore((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'authenticated' && target === 'guest') {
      navigate({ to: '/' })
    }
    if (status === 'unauthenticated' && target === 'auth') {
      navigate({ to: '/login' })
    }
  }, [status, target, navigate])

  if (status === 'idle' || status === 'loading') {
    return { isReady: false, user: null }
  }

  if (target === 'auth' && (status !== 'authenticated' || !user)) {
    return { isReady: false, user: null }
  }

  return { isReady: true, user }
}

function KnowledgePage() {
  const { isReady } = useAuthRedirect('auth')
  if (!isReady) return <LoadingScreen />
  return <KnowledgeView />
}

function LessonsPage() {
  const { isReady } = useAuthRedirect('auth')
  if (!isReady) return <LoadingScreen />
  return <LessonsView />
}

function LoginPage() {
  const { isReady } = useAuthRedirect('guest')
  if (!isReady) return <LoadingScreen />
  return <LoginView />
}

function SignupPage() {
  const { isReady } = useAuthRedirect('guest')
  if (!isReady) return <LoadingScreen />
  return <SignupView />
}

export function AppRouter() {
  return <RouterProvider router={router} />
}

declare module '@tanstack/react-router' {
  interface RegisterRouter {
    router: typeof router
  }
}
