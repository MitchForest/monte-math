import { Outlet, RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import { StandardsGraphCanvas } from './components/standards-graph'

const RootLayout = () => (
  <div className="min-h-screen bg-slate-950 text-slate-50">
    <Outlet />
  </div>
)

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: StandardsGraphCanvas,
})

const routeTree = rootRoute.addChildren([indexRoute])
const router = createRouter({ routeTree })

export function AppRouter() {
  return <RouterProvider router={router} />
}
