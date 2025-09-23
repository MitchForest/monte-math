import { AdminShell } from '@/components/admin/AdminShell'
import { KnowledgeGraph } from '@/components/knowledge-graph/KnowledgeGraph'
import { SkillDetailPanel } from '@/components/knowledge-graph/SkillDetailPanel'

export function KnowledgeView() {
  return (
    <AdminShell title="Knowledge Graph" description="Curriculum architecture">
      <div className="relative h-[calc(100vh-200px)] rounded-xl border border-border/70 bg-card shadow-[var(--shadow-soft)]">
        <KnowledgeGraph />
        <SkillDetailPanel />
        <div className="pointer-events-none absolute bottom-6 left-6 max-w-sm rounded-lg border border-border/60 bg-card/85 p-4 text-xs text-muted-foreground shadow-sm">
          <p className="mb-2 font-semibold text-foreground">Tips</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Drag the canvas to pan the graph.</li>
            <li>Select a node to edit metadata and dependencies.</li>
            <li>Blue highlights reveal prerequisite and dependent paths.</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  )
}
