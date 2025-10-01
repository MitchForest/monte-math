import { Outlet, RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

const RootLayout = () => (
  <div className="min-h-screen bg-slate-950 text-slate-50">
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Monte Math</h1>
        <p className="mt-2 text-base text-slate-300">
          Knowledge graph driven learning experiences coming soon.
        </p>
      </header>
      <Outlet />
    </main>
  </div>
)

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const routeTree = rootRoute.addChildren([indexRoute])
const router = createRouter({ routeTree })

export function AppRouter() {
  return <RouterProvider router={router} />
}

function HomePage() {
  return (
    <section className="space-y-4">
      <p className="text-lg text-slate-200">
        Explore the foundational skills, standards, and Montessori-aligned content that
        power mastery-based K-6 math. We&apos;re scaffolding the platform now—check back
        soon for interactive graph tooling, curriculum authoring, and adaptive
        learning features.
      </p>
      <p className="text-sm text-slate-400">
        Milestone 1 focuses on the knowledge graph service and visualization. Learn more in
        the project docs while we get the data pipeline online.
      </p>
    </section>
  )
}
