import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
} from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Edge,
  MarkerType,
  Node as RFNode,
  NodeProps,
  Panel,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import { graphlib, layout as dagreLayout } from 'dagre'

import { getStandardsGraph, type StandardNode, type StandardsGraph } from '../data/standards-graph'

const NODE_WIDTH = 260
const NODE_HEIGHT = 112
const COLUMN_GAP = 72
const ROW_GAP = 96
const ISOLATED_OFFSET_Y = 120
const TRANSLATE_PADDING = 720
const ALLOWED_GRADES = new Set(['K', '1', '2', '3', '4', '5'])

const proOptions = { hideAttribution: true }

const EDGE_DEFAULT_COLOR = '#475569'
const EDGE_CONNECTED_COLOR = '#4338ca'
const EDGE_SEARCH_COLOR = '#0284c7'
const EDGE_DEFAULT_OPACITY = 0.9

const CLUSTER_COLORS: Record<StandardNode['clusterType'], string> = {
  Major: '#22c55e',
  Supporting: '#38bdf8',
  Additional: '#f97316',
}

const DOMAIN_COLORS: Record<string, string> = {
  CC: '#facc15',
  OA: '#f97316',
  NBT: '#6366f1',
  NF: '#ec4899',
  G: '#fbbf24',
  MD: '#22d3ee',
  RP: '#10b981',
  EE: '#38bdf8',
  NS: '#a855f7',
  SP: '#14b8a6',
  SMP: '#f43f5e',
  'A-APR': '#fb7185',
  'A-CED': '#fb923c',
  'A-REI': '#f97316',
  'A-SSE': '#facc15',
  'F-BF': '#60a5fa',
  'F-IF': '#38bdf8',
  'F-LE': '#0ea5e9',
  'F-TF': '#22d3ee',
  'G-C': '#fde047',
  'G-CO': '#f59e0b',
  'G-GMD': '#fbbf24',
  'G-GMG': '#facc15',
  'G-GPE': '#fcd34d',
  'G-SRT': '#fb7185',
  'N-CN': '#8b5cf6',
  'N-Q': '#6366f1',
  'N-RN': '#7c3aed',
  'N-VM': '#a855f7',
  'S-CP': '#14b8a6',
  'S-ID': '#0f766e',
  'S-IC': '#0ea5e9',
  'S-MD': '#10b981',
}

const FALLBACK_COLORS = [
  '#38bdf8',
  '#f97316',
  '#22c55e',
  '#a855f7',
  '#f43f5e',
  '#fde047',
  '#0ea5e9',
  '#f472b6',
]

interface DomainOption {
  id: string
  label: string
  description: string
}

interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
  bounds: Bounds | null
}

interface DagreGraphMetadata {
  ranker?: string
  [key: string]: unknown
}

type DagreInternalGraph = graphlib.Graph & {
  graph(): DagreGraphMetadata
}

interface StandardNodeData {
  standard: StandardNode
  color: string
  clusterColor: string
  isSelected: boolean
  isSearchMatch: boolean
  isDimmed: boolean
}

const nodeTypes = {
  standard: StandardNodeCard,
}

/* eslint-disable no-unused-vars */
interface GraphViewportProps {
  nodes: RFNode<StandardNodeData>[]
  edges: Edge[]
  translateExtent?: [[number, number], [number, number]]
  onNodeSelect: (nodeId: string) => void
  onBackgroundClick: () => void
  selectedNodeId: string | null
}

interface FiltersOverlayProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
  onSearchClear: () => void
  queryActive: boolean
  matchCount: number
  gradeOptions: string[]
  activeGrades: string[] | null
  onToggleGrade: (grade: string) => void
  onResetGrades: () => void
  onClearGrades: () => void
  domainOptions: DomainOption[]
  activeDomains: string[] | null
  onToggleDomain: (domainId: string) => void
  onResetDomains: () => void
  onClearDomains: () => void
}

interface MultiSelectOption {
  value: string
  label: string
  hint?: string
}

interface MultiSelectDropdownProps {
  label: string
  options: MultiSelectOption[]
  selected: Set<string>
  onToggle: (value: string) => void
  onReset: () => void
  onClear: () => void
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  queryActive: boolean
  matchCount: number
}
/* eslint-enable no-unused-vars */

export function StandardsGraphCanvas() {
  const rawGraph = useMemo(() => getStandardsGraph(), [])
  const baseGraph = useMemo(() => {
    const nodes = rawGraph.nodes.filter((node) => ALLOWED_GRADES.has(node.grade))
    const allowedIds = new Set(nodes.map((node) => node.id))
    const edges = rawGraph.edges.filter(
      (edge) => allowedIds.has(edge.from) && allowedIds.has(edge.to),
    )

    return { nodes, edges }
  }, [rawGraph])
  const gradeOptions = useMemo(() => getGradeOptions(baseGraph.nodes), [baseGraph.nodes])
  const domainOptions = useMemo(() => getDomainOptions(baseGraph.nodes), [baseGraph.nodes])
  const allDomainIds = useMemo(
    () => domainOptions.map((option) => option.id),
    [domainOptions],
  )
  const domainColors = useMemo(() => buildDomainColors(baseGraph.nodes), [baseGraph.nodes])

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [activeGrades, setActiveGrades] = useState<string[] | null>(null)
  const [activeDomains, setActiveDomains] = useState<string[] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGraph = useMemo(() => {
    const gradeSet =
      activeGrades === null ? new Set(gradeOptions) : new Set(activeGrades)
    const domainSet =
      activeDomains === null ? new Set(allDomainIds) : new Set(activeDomains)

    const nodes = baseGraph.nodes.filter(
      (node) => gradeSet.has(node.grade) && domainSet.has(node.domainAbbreviation),
    )
    const allowedIds = new Set(nodes.map((node) => node.id))
    const edges = baseGraph.edges.filter(
      (edge) => allowedIds.has(edge.from) && allowedIds.has(edge.to),
    )

    return { nodes, edges }
  }, [baseGraph, activeGrades, activeDomains, gradeOptions, allDomainIds])

  useEffect(() => {
    if (
      selectedNodeId &&
      !filteredGraph.nodes.some((node) => node.id === selectedNodeId)
    ) {
      setSelectedNodeId(null)
    }
  }, [filteredGraph.nodes, selectedNodeId])

  const layout = useMemo(() => computeLayout(filteredGraph), [filteredGraph])
  const translateExtent = useMemo(
    () => computeTranslateExtent(layout.bounds),
    [layout.bounds],
  )

  const search = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    if (!term) {
      return { term: '', ids: [] as string[], set: new Set<string>() }
    }

    const ids = filteredGraph.nodes
      .filter((node) => {
        const haystack = [
          node.code,
          node.domainAbbreviation,
          node.domainName,
          node.clusterName,
        ]
          .join(' ')
          .toLowerCase()

        return haystack.includes(term)
      })
      .map((node) => node.id)

    return { term, ids, set: new Set(ids) }
  }, [searchQuery, filteredGraph.nodes])

  const queryActive = search.term.length > 0

  const selectedNode = useMemo(
    () => filteredGraph.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [filteredGraph.nodes, selectedNodeId],
  )

  const connectedEdgeIds = useMemo(() => {
    if (!selectedNodeId) {
      return new Set<string>()
    }
    const set = new Set<string>()
    filteredGraph.edges.forEach((edge) => {
      if (edge.from === selectedNodeId || edge.to === selectedNodeId) {
        set.add(edge.id)
      }
    })
    return set
  }, [filteredGraph.edges, selectedNodeId])

  const nodes = useMemo(() => {
    return filteredGraph.nodes.map((standard) => {
      const position = layout.positions.get(standard.id) ?? { x: 0, y: 0 }
      const color =
        domainColors.get(standard.domainAbbreviation) ??
        '#38bdf8'
      const clusterColor = CLUSTER_COLORS[standard.clusterType]
      const isSelected = selectedNodeId === standard.id
      const isSearchMatch = queryActive && search.set.has(standard.id)
      const isDimmed = queryActive && !isSearchMatch

      return {
        id: standard.id,
        type: 'standard',
        position,
        data: {
          standard,
          color,
          clusterColor,
          isSelected,
          isSearchMatch,
          isDimmed,
        },
        draggable: false,
        selectable: true,
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      } satisfies RFNode<StandardNodeData>
    })
  }, [
    filteredGraph.nodes,
    layout.positions,
    domainColors,
    selectedNodeId,
    queryActive,
    search.set,
  ])

  const edges = useMemo(() => {
    return filteredGraph.edges.map((edge) => {
      const isConnected = connectedEdgeIds.has(edge.id)
      const isSearchEdge =
        queryActive && search.set.has(edge.from) && search.set.has(edge.to)
      const stroke = isSearchEdge
        ? EDGE_SEARCH_COLOR
        : isConnected
          ? EDGE_CONNECTED_COLOR
          : EDGE_DEFAULT_COLOR
      const opacity = queryActive
        ? isSearchEdge || isConnected
          ? 1
          : 0.35
        : isConnected
          ? 1
          : EDGE_DEFAULT_OPACITY
      const strokeWidth = isConnected ? 2.6 : 2
      const strokeDasharray = isSearchEdge ? '4 4' : isConnected ? '8 6' : undefined

      return {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        type: 'smoothstep',
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: stroke,
          width: 18,
          height: 18,
        },
        style: {
          stroke,
          strokeWidth,
          opacity,
          strokeDasharray,
        },
        className: 'transition-[opacity,stroke,stroke-width] duration-300 drop-shadow-sm',
      } satisfies Edge
    })
  }, [filteredGraph.edges, connectedEdgeIds, queryActive, search.set])

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])

  const handleBackgroundClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const handleToggleGrade = useCallback(
    (grade: string) => {
      setActiveGrades((prev) => {
        const current = prev === null ? new Set(gradeOptions) : new Set(prev)
        if (current.has(grade)) {
          current.delete(grade)
        } else {
          current.add(grade)
        }
        if (current.size === gradeOptions.length) {
          return null
        }
        if (current.size === 0) {
          return []
        }
        return Array.from(current)
      })
    },
    [gradeOptions],
  )

  const handleResetGrades = useCallback(() => {
    setActiveGrades(null)
  }, [])

  const handleClearGrades = useCallback(() => {
    setActiveGrades([])
  }, [])

  const handleToggleDomain = useCallback(
    (domainId: string) => {
      setActiveDomains((prev) => {
        const current = prev === null ? new Set(allDomainIds) : new Set(prev)
        if (current.has(domainId)) {
          current.delete(domainId)
        } else {
          current.add(domainId)
        }
        if (current.size === allDomainIds.length) {
          return null
        }
        if (current.size === 0) {
          return []
        }
        return Array.from(current)
      })
    },
    [allDomainIds],
  )

  const handleResetDomains = useCallback(() => {
    setActiveDomains(null)
  }, [])

  const handleClearDomains = useCallback(() => {
    setActiveDomains([])
  }, [])

  const handleSearchSubmit = useCallback(() => {
    if (search.ids.length > 0) {
      setSelectedNodeId(search.ids[0])
    }
  }, [search.ids])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  return (
    <ReactFlowProvider>
      <div className="relative h-screen w-screen bg-[#f7f8fb] text-slate-800">
        <GraphViewport
          nodes={nodes}
          edges={edges}
          translateExtent={translateExtent}
          onNodeSelect={handleNodeSelect}
          onBackgroundClick={handleBackgroundClick}
          selectedNodeId={selectedNodeId}
        />
        <FiltersOverlay
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onSearchClear={handleClearSearch}
          queryActive={queryActive}
          matchCount={search.ids.length}
          gradeOptions={gradeOptions}
          activeGrades={activeGrades}
        onToggleGrade={handleToggleGrade}
        onResetGrades={handleResetGrades}
        onClearGrades={handleClearGrades}
        domainOptions={domainOptions}
        activeDomains={activeDomains}
        onToggleDomain={handleToggleDomain}
        onResetDomains={handleResetDomains}
        onClearDomains={handleClearDomains}
      />
        <DetailsPanel node={selectedNode} onClose={handleBackgroundClick} />
      </div>
    </ReactFlowProvider>
  )
}

function GraphViewport({
  nodes,
  edges,
  translateExtent,
  onNodeSelect,
  onBackgroundClick,
  selectedNodeId,
}: GraphViewportProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  useEffect(() => {
    if (nodes.length === 0) {
      return
    }
    const frame = window.requestAnimationFrame(() => {
      fitView({ padding: 0.25, includeHiddenNodes: false })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [nodes, fitView])

  const handleReset = useCallback(() => {
    fitView({ padding: 0.25, includeHiddenNodes: false, duration: 400 })
  }, [fitView])

  const handleFocusSelected = useCallback(() => {
    if (!selectedNodeId) return
    fitView({ nodes: [{ id: selectedNodeId }], padding: 0.6, duration: 400 })
  }, [fitView, selectedNodeId])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        proOptions={proOptions}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        translateExtent={translateExtent}
        panOnDrag
        panOnScroll={false}
        selectionOnDrag={false}
        zoomOnScroll
        zoomOnDoubleClick={false}
        zoomOnPinch
        minZoom={0.05}
        maxZoom={2.5}
        onNodeClick={(_, node) => onNodeSelect(node.id)}
        onPaneClick={onBackgroundClick}
        className="h-full w-full cursor-grab"
        style={{ background: '#f7f9fc' }}
      >
        <Background
          id="grid"
          color="#94a3b8"
          gap={24}
          size={1.6}
          variant={BackgroundVariant.Dots}
        />
        <Panel position="bottom-right" className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-300/70 bg-white/90 px-3 py-2 text-sm shadow-lg backdrop-blur">
          <ControlButton aria-label="Zoom out" onClick={() => zoomOut()}>
            −
          </ControlButton>
          {selectedNodeId ? (
            <ControlButton aria-label="Focus selection" onClick={handleFocusSelected}>
              ◎
            </ControlButton>
          ) : null}
          <ControlButton aria-label="Reset view" onClick={handleReset}>
            ⟳
          </ControlButton>
          <ControlButton aria-label="Zoom in" onClick={() => zoomIn()}>
            ＋
          </ControlButton>
        </Panel>
      </ReactFlow>
    </div>
  )
}

function ControlButton({
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
      {...props}
    >
      {children}
    </button>
  )
}

function FiltersOverlay({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  queryActive,
  matchCount,
  gradeOptions,
  activeGrades,
  onToggleGrade,
  onResetGrades,
  onClearGrades,
  domainOptions,
  activeDomains,
  onToggleDomain,
  onResetDomains,
  onClearDomains,
}: FiltersOverlayProps) {
  return (
    <div className="pointer-events-none absolute left-6 top-6 z-20 flex flex-wrap items-center gap-3">
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        onSubmit={onSearchSubmit}
        onClear={onSearchClear}
        queryActive={queryActive}
        matchCount={matchCount}
      />
      <MultiSelectDropdown
        label="Grades"
        options={gradeOptions.map((grade) => ({
          value: grade,
          label: formatGradeBadge(grade),
          hint: formatGradeFull(grade),
        }))}
        selected={new Set(activeGrades ?? gradeOptions)}
        onToggle={onToggleGrade}
        onReset={onResetGrades}
        onClear={onClearGrades}
      />
      <MultiSelectDropdown
        label="Domains"
        options={domainOptions.map((option) => ({
          value: option.id,
          label: option.label,
          hint: option.description,
        }))}
        selected={new Set(activeDomains ?? domainOptions.map((option) => option.id))}
        onToggle={onToggleDomain}
        onReset={onResetDomains}
        onClear={onClearDomains}
      />
    </div>
  )
}

function SearchInput({
  value,
  onChange,
  onSubmit,
  onClear,
  queryActive,
  matchCount,
}: SearchInputProps) {
  return (
    <form
      className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-lg backdrop-blur"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search"
        className="w-48 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
      />
      {queryActive ? (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {matchCount} match{matchCount === 1 ? '' : 'es'}
        </span>
      ) : null}
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
        >
          Clear
        </button>
      ) : null}
    </form>
  )
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onToggle,
  onReset,
  onClear,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current) return
      const target = event.target
      if (target instanceof Node && !dropdownRef.current.contains(target)) {
        setOpen(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const total = options.length
  const selectedCount = selected.size
  const summary = selectedCount === 0 ? 'None' : selectedCount === total ? 'All' : `${selectedCount}`

  return (
    <div className="pointer-events-auto relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-lg transition hover:border-slate-300"
      >
        <span>{label}</span>
        <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
          {summary}
        </span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>{label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClear()
                  setOpen(false)
                }}
                className="rounded-full border border-transparent bg-slate-100 px-2 py-1 text-[10px] text-slate-500 transition hover:border-slate-200 hover:text-slate-700"
              >
                None
              </button>
              <button
                type="button"
                onClick={() => {
                  onReset()
                  setOpen(false)
                }}
                className="rounded-full border border-transparent bg-slate-100 px-2 py-1 text-[10px] text-slate-500 transition hover:border-slate-200 hover:text-slate-700"
              >
                All
              </button>
            </div>
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {options.map((option) => {
              const checked = selected.has(option.value)
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(option.value)}
                    className="mt-1 h-3.5 w-3.5 rounded border-slate-300 bg-white text-slate-600 focus:ring-slate-400"
                  />
                  <span className="flex flex-col">
                    <span className="font-medium text-slate-700">{option.label}</span>
                    {option.hint ? (
                      <span className="text-xs text-slate-400">{option.hint}</span>
                    ) : null}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DetailsPanel({ node, onClose }: { node: StandardNode | null; onClose: () => void }) {
  const isOpen = Boolean(node)
  return (
    <aside
      className={`absolute right-0 top-0 z-10 flex h-full w-96 flex-col border-l border-slate-200 bg-white/95 backdrop-blur transition-transform duration-300 ${
        isOpen ? 'pointer-events-auto translate-x-0' : 'pointer-events-none translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <p className="text-sm font-semibold text-slate-600">
          {node ? node.code : 'Standard details'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
        >
          Close
        </button>
      </div>
      {node ? (
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 text-sm text-slate-600">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Grade
            </p>
            <p>{formatGradeFull(node.grade)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Domain
            </p>
            <p className="font-medium text-slate-700">{node.domainName}</p>
            <p className="text-xs text-slate-400">{node.domainAbbreviation}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Cluster
            </p>
            <div className="space-y-2">
              <p>{node.clusterName}</p>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CLUSTER_COLORS[node.clusterType] }}
                />
                {node.clusterType}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Description
            </p>
            <div
              className="prose max-w-none text-sm leading-relaxed text-slate-600"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(node.descriptionHtml) }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-400">
          Select a standard to inspect its narrative and alignment notes.
        </div>
      )}
    </aside>
  )
}

function StandardNodeCard({ data }: NodeProps<StandardNodeData>) {
  const { standard, color, clusterColor, isSelected, isSearchMatch, isDimmed } = data

  const baseRing = isSelected
    ? 'border-slate-400 shadow-lg shadow-slate-300/50'
    : 'border-slate-200 shadow-sm'
  const searchGlow = isSearchMatch ? 'ring-2 ring-sky-300/70' : ''

  return (
    <div
      className={`flex h-full w-full flex-col rounded-2xl border bg-white px-4 py-3 transition-all duration-200 ${baseRing} ${searchGlow} ${
        isDimmed ? 'opacity-35' : 'opacity-100'
      }`}
    >
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="flex items-center gap-2 text-slate-500">
          <span
            className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          {standard.domainAbbreviation}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: clusterColor }}
          />
          {standard.clusterType}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="text-lg font-semibold text-slate-800">{standard.code}</p>
        <p className="text-sm font-medium leading-snug text-slate-500">
          {standard.clusterName}
        </p>
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {formatGradeFull(standard.grade)}
      </div>
    </div>
  )
}

function computeLayout(graph: StandardsGraph): LayoutResult {
  const dagreGraph = new graphlib.Graph({ multigraph: false })
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: NODE_WIDTH + COLUMN_GAP,
    ranksep: NODE_HEIGHT + ROW_GAP,
    marginx: 120,
    marginy: 120,
  })
  const dagreMeta = (dagreGraph as DagreInternalGraph).graph()
  dagreMeta.ranker = 'tight-tree'
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  graph.nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })
  graph.edges.forEach((edge) => {
    dagreGraph.setEdge(edge.from, edge.to)
  })

  dagreLayout(dagreGraph)

  const tempPositions = new Map<string, { x: number; y: number }>()
  const gradeOrder = getGradeOptions(graph.nodes)
  const gradeIndexMap = new Map(gradeOrder.map((grade, index) => [grade, index]))
  const isolatedCounts = new Map<string, number>()
  const degreeMap = new Map<string, number>(graph.nodes.map((node) => [node.id, 0]))

  graph.edges.forEach((edge) => {
    degreeMap.set(edge.from, (degreeMap.get(edge.from) ?? 0) + 1)
    degreeMap.set(edge.to, (degreeMap.get(edge.to) ?? 0) + 1)
  })

  graph.nodes.forEach((node) => {
    const layoutNode = dagreGraph.node(node.id) as { x: number; y: number } | undefined
    const degree = degreeMap.get(node.id) ?? 0

    if (layoutNode) {
      tempPositions.set(node.id, {
        x: layoutNode.x - NODE_WIDTH / 2,
        y: layoutNode.y - NODE_HEIGHT / 2,
      })
    } else if (degree === 0) {
      const gradeIndex = gradeIndexMap.get(node.grade) ?? 0
      const isolatedIndex = isolatedCounts.get(node.grade) ?? 0
      isolatedCounts.set(node.grade, isolatedIndex + 1)

      tempPositions.set(node.id, {
        x: gradeIndex * (NODE_WIDTH + COLUMN_GAP) + 80,
        y: isolatedIndex * (NODE_HEIGHT + ROW_GAP) + ISOLATED_OFFSET_Y,
      })
    } else {
      tempPositions.set(node.id, { x: 0, y: 0 })
    }
  })

  const rawBounds = computeBounds(tempPositions)
  if (!rawBounds) {
    return { positions: tempPositions, bounds: null }
  }

  const flippedPositions = new Map<string, { x: number; y: number }>()
  tempPositions.forEach((position, id) => {
    const invertedY =
      rawBounds.maxY - (position.y - rawBounds.minY) - NODE_HEIGHT
    flippedPositions.set(id, { x: position.x, y: invertedY })
  })

  const finalBounds = computeBounds(flippedPositions)
  return { positions: flippedPositions, bounds: finalBounds }
}

function computeBounds(
  positions: Map<string, { x: number; y: number }>,
): Bounds | null {
  let bounds: Bounds | null = null
  positions.forEach(({ x, y }) => {
    const maxX = x + NODE_WIDTH
    const maxY = y + NODE_HEIGHT
    if (!bounds) {
      bounds = { minX: x, minY: y, maxX, maxY }
    } else {
      bounds.minX = Math.min(bounds.minX, x)
      bounds.minY = Math.min(bounds.minY, y)
      bounds.maxX = Math.max(bounds.maxX, maxX)
      bounds.maxY = Math.max(bounds.maxY, maxY)
    }
  })
  return bounds
}

function computeTranslateExtent(bounds: Bounds | null) {
  if (!bounds) {
    return undefined
  }
  return [
    [bounds.minX - TRANSLATE_PADDING, bounds.minY - TRANSLATE_PADDING],
    [bounds.maxX + TRANSLATE_PADDING, bounds.maxY + TRANSLATE_PADDING],
  ] as [[number, number], [number, number]]
}

function getGradeOptions(nodes: StandardNode[]): string[] {
  const unique = Array.from(new Set(nodes.map((node) => node.grade)))
  return unique.sort((a, b) => gradeRank(a) - gradeRank(b))
}

function getDomainOptions(nodes: StandardNode[]): DomainOption[] {
  const map = new Map<string, DomainOption>()
  nodes.forEach((node) => {
    if (!map.has(node.domainAbbreviation)) {
      map.set(node.domainAbbreviation, {
        id: node.domainAbbreviation,
        label: node.domainAbbreviation,
        description: node.domainName,
      })
    }
  })
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
}

function gradeRank(grade: string): number {
  if (grade === 'K') return 0
  if (grade === 'HS') return 100
  const parsed = Number.parseInt(grade, 10)
  return Number.isFinite(parsed) ? parsed : 200
}

function formatGradeBadge(grade: string): string {
  if (grade === 'K') return 'K'
  if (grade === 'HS') return 'HS'
  return `G${grade}`
}

function formatGradeFull(grade: string): string {
  if (grade === 'K') return 'Kindergarten'
  if (grade === 'HS') return 'High School'
  return `Grade ${grade}`
}

function buildDomainColors(nodes: StandardNode[]): Map<string, string> {
  const colors = new Map<string, string>()
  let fallbackIndex = 0

  nodes.forEach((node) => {
    if (!colors.has(node.domainAbbreviation)) {
      const baseColor = DOMAIN_COLORS[node.domainShort]
      if (baseColor) {
        colors.set(node.domainAbbreviation, baseColor)
      } else {
        colors.set(
          node.domainAbbreviation,
          FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length],
        )
        fallbackIndex += 1
      }
    }
  })

  return colors
}

function sanitizeHtml(value: string): string {
  return value
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on[a-z]+="[^"]*"/gi, '')
}
