import { Router, RootRoute, Route, RouterProvider, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { HomeView } from './views/HomeView'
import { KnowledgeGraphView } from './views/KnowledgeGraphView'
import { GoldenBeadsMaterialView } from './views/GoldenBeadsMaterialView'
import { GoldenBeadsLessonView } from './views/GoldenBeadsLessonView'

const rootRoute = new RootRoute({
  component: RootLayout
})

const homeRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeView
})

const knowledgeGraphRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/knowledge-graph',
  component: KnowledgeGraphView
})

const materialRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/materials/golden-beads',
  component: GoldenBeadsMaterialView
})

const lessonRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/lessons/golden-beads-addition',
  component: GoldenBeadsLessonView
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  knowledgeGraphRoute,
  materialRoute,
  lessonRoute
])

export const router = new Router({ routeTree })

function RootLayout() {
  const { location } = useRouterState()
  const links = [
    { to: '/', label: 'Overview' },
    { to: '/knowledge-graph', label: 'Knowledge Graph' },
    { to: '/materials/golden-beads', label: 'Golden Beads Material' },
    { to: '/lessons/golden-beads-addition', label: 'Lesson Flow' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Monte Math Prototyping Hub</h1>
            <p className="text-sm text-slate-500">Stakeholder preview of core flows</p>
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium">
            {links.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
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
