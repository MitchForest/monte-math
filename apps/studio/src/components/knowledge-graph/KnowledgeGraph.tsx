import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dagre from 'dagre'
import clsx from 'clsx'

import { useSkillsStore } from '@/stores/skills-store'

const NODE_WIDTH = 200
const NODE_HEIGHT = 96
const CANVAS_MARGIN = 100
const BASE_MIN_ZOOM = 0.35
const MAX_ZOOM = 2.6
const ZOOM_MULTIPLIER = 1.1

interface LayoutNode {
  id: string
  name: string
  description?: string
  x: number
  y: number
  width: number
  height: number
}

interface LayoutEdge {
  id: string
  fromId: string
  toId: string
  points: Array<{ x: number; y: number }>
}

interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface TransformState {
  scale: number
  pan: { x: number; y: number }
}

export function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const lastPointerPositionRef = useRef({ x: 0, y: 0 })
  const hasInteractedRef = useRef(false)
  const scaleRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const minScaleRef = useRef(BASE_MIN_ZOOM)

  const {
    skills,
    prerequisites,
    highlightedSkills,
    selectedSkillId,
    focusedSkillId,
    loadSkills,
    selectSkill,
    setFocusedSkill,
  } = useSkillsStore()

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [transform, setTransform] = useState<TransformState>({ scale: 1, pan: { x: 0, y: 0 } })
  const [defaultTransform, setDefaultTransform] = useState<TransformState | null>(null)

  scaleRef.current = transform.scale
  panRef.current = transform.pan

  useEffect(() => {
    void loadSkills().catch((error) => {
      console.error('Failed to load skills', error)
    })
  }, [loadSkills])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      if (!entry?.contentRect) return
      const { width, height } = entry.contentRect
      setContainerSize({ width, height })
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const { nodes, edges, bounds } = useMemo(() => {
    if (skills.size === 0) {
      return { nodes: [] as LayoutNode[], edges: [] as LayoutEdge[], bounds: null as Bounds | null }
    }

    const graph = new dagre.graphlib.Graph()
    graph.setGraph({
      rankdir: 'TB',
      nodesep: 120,
      edgesep: 40,
      ranksep: 140,
      marginx: CANVAS_MARGIN,
      marginy: CANVAS_MARGIN,
    })
    graph.setDefaultEdgeLabel(() => ({}))

    skills.forEach((skill) => {
      graph.setNode(skill.id, {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      })
    })

    prerequisites.forEach((edge) => {
      graph.setEdge(edge.fromId, edge.toId)
    })

    dagre.layout(graph)

    const layoutNodes: LayoutNode[] = []
    skills.forEach((skill) => {
      const position = graph.node(skill.id)
      if (!position) return
      layoutNodes.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        x: position.x,
        y: position.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      })
    })

    const layoutEdges: LayoutEdge[] = prerequisites.map((edge) => {
      const edgeData = graph.edge(edge.fromId, edge.toId)
      const points = edgeData?.points ?? []
      return {
        id: `${edge.fromId}->${edge.toId}`,
        fromId: edge.fromId,
        toId: edge.toId,
        points: points.length
          ? points
          : [
              { x: graph.node(edge.fromId)?.x ?? 0, y: graph.node(edge.fromId)?.y ?? 0 },
              { x: graph.node(edge.toId)?.x ?? 0, y: graph.node(edge.toId)?.y ?? 0 },
            ],
      }
    })

    if (layoutNodes.length === 0) {
      return { nodes: layoutNodes, edges: layoutEdges, bounds: null as Bounds | null }
    }

    const initialBounds: Bounds = {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }

    const computedBounds = layoutNodes.reduce((acc, node) => {
      const nodeMinX = node.x - node.width / 2
      const nodeMaxX = node.x + node.width / 2
      const nodeMinY = node.y - node.height / 2
      const nodeMaxY = node.y + node.height / 2

      return {
        minX: Math.min(acc.minX, nodeMinX),
        minY: Math.min(acc.minY, nodeMinY),
        maxX: Math.max(acc.maxX, nodeMaxX),
        maxY: Math.max(acc.maxY, nodeMaxY),
      }
    }, initialBounds)

    return { nodes: layoutNodes, edges: layoutEdges, bounds: computedBounds }
  }, [skills, prerequisites])

  const nodesById = useMemo(() => {
    const map = new Map<string, LayoutNode>()
    nodes.forEach((node) => {
      map.set(node.id, node)
    })
    return map
  }, [nodes])

  const neighborSkillIds = useMemo(() => {
    if (!selectedSkillId) return []

    const prereqIds = prerequisites
      .filter((edge) => edge.toId === selectedSkillId)
      .map((edge) => edge.fromId)

    const dependentIds = prerequisites
      .filter((edge) => edge.fromId === selectedSkillId)
      .map((edge) => edge.toId)

    return [
      ...prereqIds.map((id) => ({ id, relation: 'prerequisite' as const })),
      ...dependentIds.map((id) => ({ id, relation: 'dependent' as const })),
    ]
  }, [prerequisites, selectedSkillId])

  useEffect(() => {
    hasInteractedRef.current = false
  }, [skills, prerequisites])

  useEffect(() => {
    if (!bounds) return
    if (containerSize.width === 0 || containerSize.height === 0) return

    const contentWidth = bounds.maxX - bounds.minX
    const contentHeight = bounds.maxY - bounds.minY
    const paddedWidth = contentWidth + CANVAS_MARGIN * 2
    const paddedHeight = contentHeight + CANVAS_MARGIN * 2
    const fittedScale = Math.min(
      containerSize.width / paddedWidth,
      containerSize.height / paddedHeight,
      1
    )

    const centerX = bounds.minX + contentWidth / 2
    const centerY = bounds.minY + contentHeight / 2

    const initialTransform: TransformState = {
      scale: Number.isFinite(fittedScale) && fittedScale > 0 ? fittedScale : 1,
      pan: {
        x: containerSize.width / 2 - centerX * (Number.isFinite(fittedScale) ? fittedScale : 1),
        y: containerSize.height / 2 - centerY * (Number.isFinite(fittedScale) ? fittedScale : 1),
      },
    }

    setDefaultTransform(initialTransform)
    minScaleRef.current = Math.max(Math.min(initialTransform.scale, BASE_MIN_ZOOM), 0.05)

    if (!hasInteractedRef.current) {
      scaleRef.current = initialTransform.scale
      panRef.current = initialTransform.pan
      setTransform(initialTransform)
    }
  }, [bounds, containerSize])

  const applyZoom = useCallback(
    (targetScale: number, anchor?: { x: number; y: number }) => {
      if (!containerRef.current) return

      const newScale = Math.min(MAX_ZOOM, Math.max(minScaleRef.current, targetScale))
      if (!Number.isFinite(newScale) || newScale === scaleRef.current) return

      const anchorPoint = anchor ?? {
        x: containerSize.width / 2,
        y: containerSize.height / 2,
      }

      const currentScale = scaleRef.current
      const currentPan = panRef.current

      const graphX = (anchorPoint.x - currentPan.x) / currentScale
      const graphY = (anchorPoint.y - currentPan.y) / currentScale

      const nextPan = {
        x: anchorPoint.x - graphX * newScale,
        y: anchorPoint.y - graphY * newScale,
      }

      hasInteractedRef.current = true
      scaleRef.current = newScale
      panRef.current = nextPan
      setTransform({ scale: newScale, pan: nextPan })
    },
    [containerSize.width, containerSize.height]
  )

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!bounds) return
      event.preventDefault()

      const factor = event.deltaY < 0 ? ZOOM_MULTIPLIER : 1 / ZOOM_MULTIPLIER
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const anchor = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }

      applyZoom(scaleRef.current * factor, anchor)
    },
    [applyZoom, bounds]
  )

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      element.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const target = event.target as Element | null
    if (target?.closest('[data-node-id]')) {
      return
    }
    const element = event.currentTarget
    element.setPointerCapture(event.pointerId)
    isDraggingRef.current = true
    pointerIdRef.current = event.pointerId
    lastPointerPositionRef.current = { x: event.clientX, y: event.clientY }
    hasInteractedRef.current = true
  }, [])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    if (pointerIdRef.current !== event.pointerId) return

    const deltaX = event.clientX - lastPointerPositionRef.current.x
    const deltaY = event.clientY - lastPointerPositionRef.current.y
    if (deltaX === 0 && deltaY === 0) return

    lastPointerPositionRef.current = { x: event.clientX, y: event.clientY }

    setTransform((previous) => {
      const nextPan = { x: previous.pan.x + deltaX, y: previous.pan.y + deltaY }
      panRef.current = nextPan
      return { scale: previous.scale, pan: nextPan }
    })
  }, [])

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return
    const element = event.currentTarget
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId)
    }
    pointerIdRef.current = null
    isDraggingRef.current = false
  }, [])

  const handlePointerLeave = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    if (pointerIdRef.current !== event.pointerId) return
    const element = event.currentTarget
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId)
    }
    pointerIdRef.current = null
    isDraggingRef.current = false
  }, [])

  const handleZoomIn = useCallback(() => {
    applyZoom(scaleRef.current * ZOOM_MULTIPLIER)
  }, [applyZoom])

  const handleZoomOut = useCallback(() => {
    applyZoom(scaleRef.current / ZOOM_MULTIPLIER)
  }, [applyZoom])

  const handleResetView = useCallback(() => {
    if (!defaultTransform) return
    hasInteractedRef.current = false
    scaleRef.current = defaultTransform.scale
    panRef.current = defaultTransform.pan
    setTransform(defaultTransform)
  }, [defaultTransform])

  const handleNodeClick = useCallback(
    (skillId: string) => {
      if (skillId === selectedSkillId) {
        selectSkill(null)
        return
      }

      setFocusedSkill(skillId)
      selectSkill(skillId)
    },
    [selectSkill, selectedSkillId, setFocusedSkill]
  )

  useEffect(() => {
    if (!focusedSkillId) return
    if (containerSize.width === 0 || containerSize.height === 0) return

    const node = nodesById.get(focusedSkillId)
    if (!node) return

    const scale = scaleRef.current
    const nextPan = {
      x: containerSize.width / 2 - node.x * scale,
      y: containerSize.height / 2 - node.y * scale,
    }

    const previousPan = panRef.current
    if (Math.abs(previousPan.x - nextPan.x) < 0.5 && Math.abs(previousPan.y - nextPan.y) < 0.5) {
      return
    }

    hasInteractedRef.current = true
    panRef.current = nextPan
    setTransform({ scale, pan: nextPan })
  }, [focusedSkillId, containerSize.width, containerSize.height, nodesById])

  useEffect(() => {
    if (!selectedSkillId) return
    if (neighborSkillIds.length === 0) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null
      if (activeElement) {
        const tagName = activeElement.tagName
        if (
          activeElement.isContentEditable ||
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT'
        ) {
          return
        }
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const direction = event.key === 'ArrowDown' ? 1 : -1
        const currentIndex = neighborSkillIds.findIndex((item) => item.id === focusedSkillId)

        let nextIndex: number
        if (currentIndex === -1) {
          nextIndex = direction === 1 ? 0 : neighborSkillIds.length - 1
        } else {
          nextIndex = (currentIndex + direction + neighborSkillIds.length) % neighborSkillIds.length
        }

        const next = neighborSkillIds[nextIndex]
        if (next) {
          setFocusedSkill(next.id)
        }
      }

      if (event.key === 'Enter') {
        if (!focusedSkillId || focusedSkillId === selectedSkillId) {
          return
        }

        event.preventDefault()
        selectSkill(focusedSkillId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [focusedSkillId, neighborSkillIds, selectedSkillId, selectSkill, setFocusedSkill])

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="pointer-events-none absolute right-6 top-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleZoomIn}
          className="pointer-events-auto rounded-md border border-border/60 bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-slate-50"
        >
          Zoom in
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="pointer-events-auto rounded-md border border-border/60 bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-slate-50"
        >
          Zoom out
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="pointer-events-auto rounded-md border border-border/60 bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-slate-50"
        >
          Reset view
        </button>
      </div>
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden rounded-lg border border-border/60 bg-slate-50"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <svg className="h-full w-full" role="presentation">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
            <marker
              id="arrow-active"
              markerWidth="12"
              markerHeight="12"
              refX="8"
              refY="6"
              orient="auto"
            >
              <path d="M 0 0 L 12 6 L 0 12 z" fill="#3b82f6" />
            </marker>
          </defs>

          <rect className="fill-slate-100" x={0} y={0} width="100%" height="100%" />

          <g
            transform={`translate(${transform.pan.x}, ${transform.pan.y}) scale(${transform.scale})`}
          >
            {edges.map((edge) => {
              if (edge.points.length === 0) return null
              const highlighted =
                highlightedSkills.has(edge.fromId) && highlightedSkills.has(edge.toId)
              const stroke = highlighted ? '#3b82f6' : '#cbd5f5'
              const strokeWidth = highlighted ? 3 : 1.5
              const markerEnd = highlighted ? 'url(#arrow-active)' : 'url(#arrow)'

              const pathCommands = edge.points
                .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                .join(' ')

              return (
                <path
                  key={edge.id}
                  d={pathCommands}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  fill="none"
                  markerEnd={markerEnd}
                  className="transition-[stroke] duration-150"
                />
              )
            })}

            {nodes.map((node) => {
              const isSelected = node.id === selectedSkillId
              const isHighlighted = highlightedSkills.has(node.id)
              const isFocused = node.id === focusedSkillId

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}
                  className={clsx('cursor-pointer transition', {
                    'drop-shadow-[0_8px_20px_rgba(59,130,246,0.28)]': isSelected,
                  })}
                  data-node-id={node.id}
                  onClick={() => handleNodeClick(node.id)}
                >
                  <title>{node.name}</title>
                  <rect
                    width={node.width}
                    height={node.height}
                    rx={18}
                    ry={18}
                    className={clsx('stroke-[1.5px] transition-colors duration-200', {
                      'fill-white stroke-slate-200': !isSelected && !isHighlighted && !isFocused,
                      'fill-sky-50 stroke-sky-300': !isSelected && isHighlighted && !isFocused,
                      'fill-sky-100 stroke-sky-500 stroke-[2px]': !isSelected && isFocused,
                      'fill-sky-500 stroke-sky-600': isSelected,
                    })}
                  />
                  <text
                    x={node.width / 2}
                    y={34}
                    textAnchor="middle"
                    className={clsx('font-semibold tracking-wide transition-colors', {
                      'fill-slate-700': !isSelected && !isFocused,
                      'fill-sky-700': !isSelected && isFocused,
                      'fill-white': isSelected,
                    })}
                  >
                    {node.id}
                  </text>
                  <foreignObject
                    x={12}
                    y={node.height / 2 - 4}
                    width={node.width - 24}
                    height={node.height / 2}
                  >
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      className={clsx(
                        'flex h-full items-center justify-center px-2 text-center text-[11px] leading-5 transition-colors',
                        {
                          'text-slate-500': !isSelected && !isFocused,
                          'text-sky-700': !isSelected && isFocused,
                          'text-blue-50': isSelected,
                        }
                      )}
                      style={{ wordBreak: 'break-word' }}
                    >
                      {node.name}
                    </div>
                  </foreignObject>
                </g>
              )
            })}
          </g>
        </svg>
        {nodes.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No skills available in the knowledge graph.
          </div>
        ) : null}
      </div>
    </div>
  )
}
