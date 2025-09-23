import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/orpc-client'

interface GraphNode {
  id: string
  name: string
  depth: number
  x: number
  y: number
}

interface GraphEdge {
  from: string
  to: string
}

const additionFocus = new Set(['S031', 'S032', 'S033'])

const columnWidth = 220
const rowHeight = 90
const margin = 60

export function KnowledgeGraphView() {
  const [focusedSkill, setFocusedSkill] = useState<string | null>('S033')

  const { data, isLoading } = useQuery({
    queryKey: ['skills', 'list'],
    queryFn: () => apiClient.skills.list(),
  })

  const { nodes, edges, stats } = useMemo(() => {
    if (!data) {
      return {
        nodes: [] as GraphNode[],
        edges: [] as GraphEdge[],
        stats: { skills: 0, edges: 0, depth: 1, maxRows: 1 },
      }
    }

    const incoming = new Map<string, string[]>()
    data.prerequisites.forEach(({ skillId, prereqId }) => {
      const list = incoming.get(skillId) ?? []
      list.push(prereqId)
      incoming.set(skillId, list)
    })

    const memo = new Map<string, number>()
    const depthFor = (id: string): number => {
      if (memo.has(id)) return memo.get(id) as number
      const requires = incoming.get(id) ?? []
      if (requires.length === 0) {
        memo.set(id, 0)
        return 0
      }
      const depth = 1 + Math.max(...requires.map(depthFor))
      memo.set(id, depth)
      return depth
    }

    const baseNodes: GraphNode[] = data.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      depth: depthFor(skill.id),
      x: 0,
      y: 0,
    }))

    const byLevel = new Map<number, GraphNode[]>()
    baseNodes.forEach((node) => {
      const bucket = byLevel.get(node.depth) ?? []
      bucket.push(node)
      byLevel.set(node.depth, bucket)
    })

    byLevel.forEach((bucket) => bucket.sort((a, b) => a.id.localeCompare(b.id)))

    let maxRows = 0
    byLevel.forEach((bucket) => {
      if (bucket.length > maxRows) maxRows = bucket.length
    })
    maxRows = Math.max(1, maxRows)

    byLevel.forEach((bucket, depth) => {
      bucket.forEach((node, index) => {
        node.x = margin + depth * columnWidth
        node.y = margin + index * rowHeight
      })
    })

    const edges: GraphEdge[] = data.prerequisites.map(({ skillId, prereqId }) => ({
      from: prereqId,
      to: skillId,
    }))

    return {
      nodes: baseNodes,
      edges,
      stats: {
        skills: data.skills.length,
        edges: edges.length,
        depth: Math.max(1, byLevel.size),
        maxRows,
      },
    }
  }, [data])

  const width = margin * 2 + Math.max(0, stats.depth - 1) * columnWidth
  const height = margin * 2 + stats.maxRows * rowHeight

  const focusAncestors = useMemo(() => {
    if (!focusedSkill) return new Set<string>()
    const reverse = new Map<string, string[]>()
    edges.forEach((edge) => {
      const list = reverse.get(edge.to) ?? []
      list.push(edge.from)
      reverse.set(edge.to, list)
    })

    const visited = new Set<string>()
    const walk = (id: string) => {
      const prereq = reverse.get(id) ?? []
      prereq.forEach((p) => {
        if (!visited.has(p)) {
          visited.add(p)
          walk(p)
        }
      })
    }
    walk(focusedSkill)
    return visited
  }, [focusedSkill, edges])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading skill graph…
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
        Unable to load knowledge graph data.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Knowledge Graph Overview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Snapshot of {stats.skills} skills and {stats.edges} prerequisite links. Depth{' '}
            {stats.depth} ≈ scope from counting foundations through algebra.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
            Column Addition focus
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-700">
            Selected path ancestors
          </span>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <svg width={width} height={height} className="min-w-[960px]">
          {edges.map((edge) => {
            const from = nodes.find((node) => node.id === edge.from)
            const to = nodes.find((node) => node.id === edge.to)
            if (!from || !to) return null
            const isActive =
              additionFocus.has(edge.from) &&
              additionFocus.has(edge.to) &&
              additionFocus.has(focusedSkill ?? '')
            const isAncestor =
              focusAncestors.has(edge.from) &&
              (focusedSkill === edge.to || focusAncestors.has(edge.to))
            const stroke = isActive ? '#f59e0b' : isAncestor ? '#334155' : '#cbd5f5'
            const opacity = isActive || isAncestor ? 0.9 : 0.35
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x + 60}
                y1={from.y + 30}
                x2={to.x - 60}
                y2={to.y + 30}
                stroke={stroke}
                strokeWidth={isActive ? 3 : 1.5}
                opacity={opacity}
                markerEnd="url(#arrow)"
              />
            )
          })}

          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5f5" />
            </marker>
          </defs>

          {nodes.map((node) => {
            const isAddition = additionFocus.has(node.id)
            const isFocused = node.id === focusedSkill
            const isAncestor = focusAncestors.has(node.id)
            const fill = isFocused
              ? '#0f172a'
              : isAddition
                ? '#f97316'
                : isAncestor
                  ? '#e0e7ff'
                  : '#ffffff'
            const stroke = isFocused
              ? '#0f172a'
              : isAddition
                ? '#ea580c'
                : isAncestor
                  ? '#312e81'
                  : '#cbd5f5'

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setFocusedSkill((prev) => (prev === node.id ? null : node.id))}
                className="cursor-pointer"
              >
                <rect
                  width={120}
                  height={60}
                  rx={14}
                  ry={14}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isFocused ? 3 : 1.5}
                  opacity={isFocused ? 1 : 0.95}
                />
                <text
                  x={60}
                  y={24}
                  textAnchor="middle"
                  fontSize={14}
                  fontFamily="Inter, sans-serif"
                  fontWeight={600}
                  fill={isFocused ? '#f8fafc' : isAddition ? '#fff7ed' : '#1e293b'}
                >
                  {node.id}
                </text>
                <text
                  x={60}
                  y={42}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="Inter, sans-serif"
                  fill={isFocused ? '#c7d2fe' : '#475569'}
                >
                  {node.name.length > 28 ? `${node.name.slice(0, 25)}…` : node.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <aside className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Focused skill
          </h4>
          {focusedSkill ? (
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">{focusedSkill}</div>
              <div>{nodes.find((n) => n.id === focusedSkill)?.name}</div>
              <div className="text-xs text-slate-500">
                Depth level {nodes.find((n) => n.id === focusedSkill)?.depth ?? 0}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Click a node to inspect its incoming path.
            </p>
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Addition track
          </h4>
          <p className="mt-2 text-sm text-slate-600">
            Highlighted nodes trace the path toward <strong>Column Addition (with regroup)</strong>.
            Skills S032 and S033 are the targets for the golden bead lesson you&apos;ll see next.
          </p>
        </div>
      </aside>
    </div>
  )
}
