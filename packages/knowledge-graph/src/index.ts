// Knowledge graph domain logic will be implemented here.
// It will expose data loaders, validation utilities, and graph traversal helpers.

export type KnowledgeGraphNodeId = string

export interface KnowledgeGraphNodeMeta {
  id: KnowledgeGraphNodeId
  label: string
  description?: string
  gradeBand?: string
}

export const placeholderKnowledgeGraph = new Map<KnowledgeGraphNodeId, KnowledgeGraphNodeMeta>()
