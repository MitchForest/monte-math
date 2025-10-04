import nodesJson from '../data/standards-nodes.json' assert { type: 'json' }
import edgesJson from '../data/standards-edges.json' assert { type: 'json' }
import ndEdgesJson from '../data/standards-nd-edges.json' assert { type: 'json' }
import clustersJson from '../data/standards-clusters.json' assert { type: 'json' }
import domainsJson from '../data/standards-domains.json' assert { type: 'json' }

export type StandardId = string

interface RawStandardNode {
  ccmathcluster_id: string
  desc: string
  id: string
  ordinal: string
}

interface RawStandardEdge {
  from: string
  to: string
}

interface RawStandardNdEdge {
  from: string
  to: string
}

interface RawCluster {
  ccmathdomain_id: string
  id: string
  ordinal: string
  name: string
  msa: string
}

interface RawDomain {
  id: string
  grade: string
  name: string
  ordinal: string
}

export interface StandardNode {
  id: StandardId
  code: string
  grade: string
  domainId: string
  domainName: string
  domainAbbreviation: string
  domainShort: string
  clusterId: string
  clusterName: string
  clusterOrdinal: string
  clusterType: ClusterKind
  descriptionHtml: string
}

export type ClusterKind = 'Major' | 'Supporting' | 'Additional'

export interface StandardEdge {
  id: string
  from: StandardId
  to: StandardId
}

export interface StandardsGraph {
  nodes: StandardNode[]
  edges: StandardEdge[]
}

export interface StandardsGraphOptions {
  grade?: string
}

type RawStandardNodes = Record<string, RawStandardNode>
const rawNodes = nodesJson as RawStandardNodes
const rawEdges = edgesJson as RawStandardEdge[]
const rawNdEdges = ndEdgesJson as RawStandardNdEdge[]
const clusters = clustersJson as Record<string, RawCluster>
const domains = domainsJson as Record<string, RawDomain>

const msaMap: Record<string, ClusterKind> = {
  '0': 'Major',
  '1': 'Supporting',
  '2': 'Additional',
}

const standardNodes: Record<string, StandardNode> = Object.fromEntries(
  Object.entries(rawNodes).map(([id, node]) => {
    const cluster = clusters[node.ccmathcluster_id]
    const domain = domains[cluster.ccmathdomain_id]

    if (!cluster || !domain) {
      throw new Error(`Missing cluster/domain for standard ${id}`)
    }

    const gradeLabel = domain.grade === 'K' ? 'K' : domain.grade
    const domainShort = domain.ordinal
    const domainAbbreviation = domainShort
    const code = `${gradeLabel}.${domainShort}.${cluster.ordinal}.${node.ordinal}`
    const clusterType = msaMap[cluster.msa] ?? 'Supporting'

    return [
      id,
      {
        id,
        code,
        grade: gradeLabel,
        domainId: domain.id,
        domainName: decodeHtml(domain.name),
        domainAbbreviation,
        domainShort,
        clusterId: cluster.id,
        clusterName: decodeHtml(cluster.name),
        clusterOrdinal: cluster.ordinal,
        clusterType,
        descriptionHtml: node.desc,
      } satisfies StandardNode,
    ]
  }),
)

const adjacency = new Map<StandardId, Set<StandardId>>()
Object.keys(rawNodes).forEach((id) => {
  adjacency.set(id, new Set())
})

const addEdge = (from: StandardId, to: StandardId) => {
  if (from === to) return
  if (!adjacency.has(from) || !adjacency.has(to)) return
  adjacency.get(from)!.add(to)
}

rawEdges.forEach((edge) => {
  addEdge(edge.from, edge.to)
})

rawNdEdges.forEach((edge) => {
  addEdge(edge.from, edge.to)
  addEdge(edge.to, edge.from)
})

const clusterRoots = new Map<string, StandardId[]>()
Object.entries(rawNodes).forEach(([id, node]) => {
  const rootOrdinal = node.ordinal.split('.')[0]
  const key = `${node.ccmathcluster_id}:${rootOrdinal}`
  const existing = clusterRoots.get(key)
  if (existing) {
    existing.push(id)
  } else {
    clusterRoots.set(key, [id])
  }
})

clusterRoots.forEach((memberIds) => {
  const sharedTargets = new Set<StandardId>()
  memberIds.forEach((memberId) => {
    adjacency.get(memberId)!.forEach((target) => {
      sharedTargets.add(target)
    })
  })

  if (sharedTargets.size === 0) return

  // Mirror ATC's frontend behaviour by rolling child connections up to the
  // cluster root so that summary standards inherit the same links as the
  // specific leaf standards. This prevents otherwise isolated parent nodes
  // from dropping out of the rendered graph.
  memberIds.forEach((memberId) => {
    sharedTargets.forEach((target) => {
      if (memberId === target) return
      adjacency.get(memberId)!.add(target)
    })
  })
})

const standardEdges: StandardEdge[] = []
const seenEdgeIds = new Set<string>()
adjacency.forEach((targets, from) => {
  targets.forEach((to) => {
    const id = `${from}-${to}`
    if (seenEdgeIds.has(id)) return
    seenEdgeIds.add(id)
    standardEdges.push({ id, from, to })
  })
})

export function getStandardsGraph(options: StandardsGraphOptions = {}): StandardsGraph {
  const { grade } = options
  if (!grade) {
    return {
      nodes: Object.values(standardNodes),
      edges: [...standardEdges],
    }
  }

  const allowed = new Set(
    Object.values(standardNodes)
      .filter((node) => node.grade === grade)
      .map((node) => node.id),
  )

  const nodes = [...allowed].map((id) => standardNodes[id])
  const edges = standardEdges.filter(
    (edge) => allowed.has(edge.from) && allowed.has(edge.to),
  )

  return { nodes, edges }
}

function decodeHtml(value: string): string {
  if (!value) return ''
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}
