/* eslint-disable */
declare module 'dagre' {
  interface DagreGraphLabel {
    rankdir?: string
    nodesep?: number
    ranksep?: number
    marginx?: number
    marginy?: number
  }

  interface DagreNodeSize {
    width: number
    height: number
  }

  interface DagreNodePosition {
    x: number
    y: number
  }

  interface DagreGraphInstance {
    setGraph(label: DagreGraphLabel): void
    setDefaultEdgeLabel(factory: () => Record<string, unknown>): void
    setNode(id: string, size: DagreNodeSize): void
    setEdge(source: string, target: string): void
    node(id: string): DagreNodePosition | undefined
  }

  namespace graphlib {
    interface GraphOptions {
      multigraph?: boolean
    }

    class Graph implements DagreGraphInstance {
      constructor(options?: GraphOptions)
      setGraph(label: DagreGraphLabel): void
      setDefaultEdgeLabel(factory: () => Record<string, unknown>): void
      setNode(id: string, size: DagreNodeSize): void
      setEdge(source: string, target: string): void
      node(id: string): DagreNodePosition | undefined
    }
  }

  function layout(graph: graphlib.Graph): void

  export { layout, graphlib }
}
