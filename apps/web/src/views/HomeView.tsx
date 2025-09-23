import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/orpc-client'

export function HomeView() {
  const { data } = useQuery({
    queryKey: ['skills', 'list'],
    queryFn: () => apiClient.skills.list()
  })

  const featureCards = useMemo(() => {
    const skills = data?.skills.length ?? 0
    const edges = data?.prerequisites.length ?? 0

    return [
      {
        title: 'Knowledge Graph Editor',
        description: 'Inspect the current skill dependencies sourced from the API-backed graph.',
        to: '/knowledge-graph',
        meta: `${skills} skills · ${edges} prerequisites`
      },
      {
        title: 'Golden Beads Material',
        description: 'Programmatic PixiJS scene for composing four-digit numbers with beads and number cards.',
        to: '/materials/golden-beads',
        meta: 'Interactive place-value mat'
      },
      {
        title: 'Addition Lesson Flow',
        description: 'Tutorial → worked examples → practice for 4-digit addition with regrouping.',
        to: '/lessons/golden-beads-addition',
        meta: 'Lesson 07 · Column Addition (with regroup)'
      }
    ]
  }, [data])

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Prototype Overview</h2>
        <p className="max-w-3xl text-base text-slate-600">
          Preview the shared architecture: the knowledge graph and lesson player now read from the oRPC API so we can
          validate data flow end-to-end while iterating on interactive materials.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {featureCards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>Prototype</span>
                <span>{card.meta}</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 group-hover:text-slate-700">{card.title}</h3>
              <p className="text-sm text-slate-600">{card.description}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 group-hover:text-slate-900">
              View prototype →
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
