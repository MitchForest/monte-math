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
import { HomeView } from './views/HomeView'
import { LoginView } from './views/LoginView'
import { SignupView } from './views/SignupView'
import { StudentShell } from './components/student/StudentShell'
import { LoadingScreen } from './components/student/LoadingScreen'
import { useSessionStore } from './stores/session-store'
import {
  GoldenBeadsMultiplicationLessonView,
  StampGameLessonView,
} from './views/StampGameLessonView'

const rootRoute = new RootRoute({
  component: RootLayout,
})

const homeRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
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

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: DashboardPage,
})

const columnMultiplicationRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/prototype/column-multiplication/$material/$mode',
  component: ColumnMultiplicationPrototypePage,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  signupRoute,
  dashboardRoute,
  columnMultiplicationRoute,
])

export const router = new Router({ routeTree })

function RootLayout() {
  return <Outlet />
}

function HomePage() {
  return <HomeView />
}

function useAuthRedirect(target: 'auth' | 'guest') {
  const status = useSessionStore((state) => state.status)
  const user = useSessionStore((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'authenticated' && target === 'guest') {
      navigate({ to: '/app' })
    }
    if (status === 'unauthenticated' && target === 'auth') {
      navigate({ to: '/login' })
    }
  }, [status, navigate])

  if (target === 'guest') {
    if (status === 'authenticated') {
      return { ready: false, user }
    }
    return { ready: true, user }
  }

  if (status === 'idle' || status === 'loading') {
    return { ready: false, user: null }
  }

  if (status !== 'authenticated' || !user) {
    return { ready: false, user: null }
  }

  return { ready: true, user }
}

function LoginPage() {
  const { ready } = useAuthRedirect('guest')
  if (!ready) return <LoadingScreen />
  return <LoginView />
}

function SignupPage() {
  const { ready } = useAuthRedirect('guest')
  if (!ready) return <LoadingScreen />
  return <SignupView />
}

const lessonLookup = {
  'golden-beads': {
    static: 'lesson-11-column-multiplication-golden-beads-static',
    dynamic: 'lesson-12-column-multiplication-golden-beads-dynamic',
  },
  'stamp-game': {
    static: 'lesson-13-column-multiplication-stamp-game-static',
    dynamic: 'lesson-14-column-multiplication-stamp-game-dynamic',
  },
} as const

type MaterialKey = keyof typeof lessonLookup
type ModeKey = keyof (typeof lessonLookup)[MaterialKey]

function DashboardPage() {
  const { ready, user } = useAuthRedirect('auth')
  if (!ready || !user) return <LoadingScreen />

  return (
    <StudentShell>
      <DashboardView />
    </StudentShell>
  )
}

function ColumnMultiplicationPrototypePage() {
  const { material, mode } = columnMultiplicationRoute.useParams() as {
    material: MaterialKey
    mode: ModeKey
  }

  const materialEntry = lessonLookup[material]
  const lessonId = materialEntry?.[mode]

  if (!lessonId) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
            Unknown lesson variant.
          </div>
        </div>
      </div>
    )
  }

  const ViewComponent =
    material === 'golden-beads' ? GoldenBeadsMultiplicationLessonView : StampGameLessonView

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <ViewComponent lessonId={lessonId} />
      </div>
    </div>
  )
}

export function AppRouter() {
  return <RouterProvider router={router} />
}

declare module '@tanstack/react-router' {
  interface RegisterRouter {
    router: typeof router
  }
}
