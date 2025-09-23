import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { apiClient } from '@/lib/orpc-client'

export interface Skill {
  id: string
  name: string
  description?: string
  position?: { x: number; y: number } // For graph layout
}

export interface Prerequisite {
  fromId: string
  toId: string
}

interface SkillsState {
  // Data
  skills: Map<string, Skill>
  prerequisites: Prerequisite[]
  stats: {
    numSkills: number
    numEdges: number
  }
  
  // UI State
  selectedSkillId: string | null
  highlightedSkills: Set<string>
  editingSkillId: string | null
  
  // Actions
  loadSkills: () => Promise<void>
  selectSkill: (id: string | null) => void
  updateSkill: (id: string, updates: Partial<Skill>) => Promise<void>
  addPrerequisite: (fromId: string, toId: string) => Promise<void>
  removePrerequisite: (fromId: string, toId: string) => Promise<void>
  highlightPrerequisites: (skillId: string) => void
  clearHighlights: () => void
  setSkillPosition: (id: string, x: number, y: number) => void
}

export const useSkillsStore = create<SkillsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      skills: new Map(),
      prerequisites: [],
      stats: { numSkills: 0, numEdges: 0 },
      selectedSkillId: null,
      highlightedSkills: new Set(),
      editingSkillId: null,
      
      // Load skills from API
      loadSkills: async () => {
        const data = await apiClient.skills.list()

        const skillsMap = new Map<string, Skill>()
        data.skills.forEach((skill) => {
          skillsMap.set(skill.id, {
            id: skill.id,
            name: skill.name,
            description: skill.description ?? undefined
          })
        })

        const prerequisites: Prerequisite[] = data.prerequisites.map((edge) => ({
          fromId: edge.prereqId,
          toId: edge.skillId
        }))

        set({
          skills: skillsMap,
          prerequisites,
          stats: {
            numSkills: data.skills.length,
            numEdges: data.prerequisites.length
          }
        })
      },
      
      // Select a skill
      selectSkill: (id) => {
        set({ selectedSkillId: id })
        if (id) {
          get().highlightPrerequisites(id)
        } else {
          get().clearHighlights()
        }
      },
      
      // Update skill details
      updateSkill: async (id, updates) => {
        await apiClient.skills.update({
          id,
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.description !== undefined ? { description: updates.description } : {})
        })
        await get().loadSkills()
      },
      
      // Add prerequisite edge
      addPrerequisite: async (fromId, toId) => {
        await apiClient.skills.addPrerequisite({ prereqId: fromId, skillId: toId })
        await get().loadSkills()
      },
      
      // Remove prerequisite edge
      removePrerequisite: async (fromId, toId) => {
        await apiClient.skills.removePrerequisite({ prereqId: fromId, skillId: toId })
        await get().loadSkills()
      },
      
      // Highlight prerequisites and dependents
      highlightPrerequisites: (skillId) => {
        const highlighted = new Set<string>()
        highlighted.add(skillId)
        
        const prereqs = get().prerequisites
        
        // Find all prerequisites (skills that come before)
        prereqs.forEach(p => {
          if (p.toId === skillId) {
            highlighted.add(p.fromId)
          }
        })
        
        // Find all dependents (skills that come after)
        prereqs.forEach(p => {
          if (p.fromId === skillId) {
            highlighted.add(p.toId)
          }
        })
        
        set({ highlightedSkills: highlighted })
      },
      
      // Clear highlights
      clearHighlights: () => {
        set({ highlightedSkills: new Set() })
      },
      
      // Set position for graph layout
      setSkillPosition: (id, x, y) => {
        set(state => {
          const skills = new Map(state.skills)
          const skill = skills.get(id)
          if (skill) {
            skills.set(id, { ...skill, position: { x, y } })
          }
          return { skills }
        })
      }
    }),
    {
      name: 'skills-store'
    }
  )
)
