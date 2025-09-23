import { useEffect } from 'react'
import {
  Router,
  RootRoute,
  Route,
  RouterProvider,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'

import { DashboardView } from './views/DashboardView'
import { LoginView } from './views/LoginView'
import { SignupView } from './views/SignupView'
import { StudentShell } from './components/student/StudentShell'
import { LoadingScreen } from './components/student/LoadingScreen'
import { useSessionStore } from './stores/session-store'

const rootRoute = new RootRoute({
  component: RootLayout,
})

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const signupRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupPage,
})

const routeTree = rootRoute.addChildren([dashboardRoute, loginRoute, signupRoute])

export const router = new Router({ routeTree })

function RootLayout() {
  return <Outlet />
}

function DashboardPage() {
  const status = useSessionStore((state) => state.status)
  const user = useSessionStore((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate({ to: '/login', replace: true })
    }
  }, [status, navigate])

  if (status === 'idle' || status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'unauthenticated' || !user) {
    return <LoadingScreen />
  }

  return (
    <StudentShell>
      <DashboardView />
    </StudentShell>
  )
}

function LoginPage() {
  const status = useSessionStore((state) => state.status)
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'authenticated') {
      navigate({ to: '/', replace: true })
    }
  }, [status, navigate])

  if (status === 'authenticated') {
    return <LoadingScreen />
  }

  return <LoginView />
}

function SignupPage() {
  const status = useSessionStore((state) => state.status)
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'authenticated') {
      navigate({ to: '/', replace: true })
    }
  }, [status, navigate])

  if (status === 'authenticated') {
    return <LoadingScreen />
  }

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
