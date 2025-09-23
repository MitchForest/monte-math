import { useState } from 'react'
import { X, Edit2, Save, Plus, Trash2 } from 'lucide-react'
import { useSkillsStore } from '@/stores/skills-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SkillDetailPanel() {
  const {
    skills,
    prerequisites,
    selectedSkillId,
    selectSkill,
    updateSkill,
    addPrerequisite,
    removePrerequisite,
  } = useSkillsStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [newPrereqId, setNewPrereqId] = useState('')

  if (!selectedSkillId) return null

  const skill = skills.get(selectedSkillId)
  if (!skill) return null

  // Get prerequisites and dependents
  const skillPrereqs = prerequisites.filter((p) => p.toId === selectedSkillId)
  const skillDependents = prerequisites.filter((p) => p.fromId === selectedSkillId)

  const handleEdit = () => {
    setEditedName(skill.name)
    setEditedDescription(skill.description || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    await updateSkill(selectedSkillId, {
      name: editedName,
      description: editedDescription,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedName('')
    setEditedDescription('')
  }

  const handleAddPrerequisite = async () => {
    if (newPrereqId && skills.has(newPrereqId)) {
      await addPrerequisite(newPrereqId, selectedSkillId)
      setNewPrereqId('')
    }
  }

  return (
    <Card className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto z-50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              {skill.id}
              {!isEditing && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleEdit}>
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </CardTitle>
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="mt-2"
                placeholder="Skill name"
              />
            ) : (
              <CardDescription className="mt-1">{skill.name}</CardDescription>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => selectSkill(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <div>
          <Label>Description</Label>
          {isEditing ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full mt-1 p-2 text-sm border rounded-md resize-none"
              rows={3}
              placeholder="Skill description..."
            />
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {skill.description || 'No description'}
            </p>
          )}
        </div>

        {/* Edit buttons */}
        {isEditing && (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}

        {/* Prerequisites */}
        <div>
          <Label className="flex items-center justify-between">
            Prerequisites ({skillPrereqs.length})
            {isEditing && (
              <div className="flex gap-1">
                <Input
                  value={newPrereqId}
                  onChange={(e) => setNewPrereqId(e.target.value.toUpperCase())}
                  placeholder="S###"
                  className="h-6 w-16 text-xs"
                />
                <Button size="icon" className="h-6 w-6" onClick={handleAddPrerequisite}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </Label>
          <div className="mt-2 space-y-1">
            {skillPrereqs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No prerequisites</p>
            ) : (
              skillPrereqs.map((prereq) => {
                const prereqSkill = skills.get(prereq.fromId)
                return (
                  <div
                    key={prereq.fromId}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs hover:bg-slate-100 transition-colors"
                  >
                    <button onClick={() => selectSkill(prereq.fromId)} className="flex-1 text-left">
                      <span className="font-medium">{prereq.fromId}</span>
                      <span className="text-muted-foreground ml-2">{prereqSkill?.name}</span>
                    </button>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={async () => {
                          await removePrerequisite(prereq.fromId, selectedSkillId)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Dependents */}
        <div>
          <Label>Leads to ({skillDependents.length})</Label>
          <div className="mt-2 space-y-1">
            {skillDependents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No dependent skills</p>
            ) : (
              skillDependents.map((dep) => {
                const depSkill = skills.get(dep.toId)
                return (
                  <button
                    key={dep.toId}
                    onClick={() => selectSkill(dep.toId)}
                    className="w-full flex items-center p-2 bg-blue-50 rounded text-xs hover:bg-blue-100 transition-colors text-left"
                  >
                    <span className="font-medium">{dep.toId}</span>
                    <span className="text-muted-foreground ml-2">{depSkill?.name}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
