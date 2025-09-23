import { useState } from 'react'

import { KnowledgeGraph } from './components/knowledge-graph/KnowledgeGraph'
import { SkillDetailPanel } from './components/knowledge-graph/SkillDetailPanel'
import { LessonEditor } from './components/lessons/LessonEditor'
import { Button } from './components/ui/button'
import { useSkillsStore } from './stores/skills-store'

export function App() {
  const { stats } = useSkillsStore()
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Monte Math Studio</h1>
              <p className="text-sm text-gray-600 mt-1">Knowledge Graph Editor</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {stats.numSkills} Skills • {stats.numEdges} Prerequisites
              </div>
              <Button size="sm" onClick={() => setActiveLessonId('lesson-07-column-addition-golden-beads')}>
                Edit Lesson 07
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <KnowledgeGraph />
        <SkillDetailPanel />
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg max-w-sm">
          <p className="text-xs font-medium text-gray-700 mb-1">Navigation</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Click and drag to pan the graph</li>
            <li>• Click a skill to see details and prerequisites</li>
            <li>• Blue highlights show connected skills</li>
            <li>• Edit skills using the detail panel</li>
          </ul>
        </div>

        {activeLessonId && (
          <LessonEditor lessonId={activeLessonId} onClose={() => setActiveLessonId(null)} />
        )}
      </main>
    </div>
  )
}
