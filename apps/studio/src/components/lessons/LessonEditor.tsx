import { useEffect, useState } from 'react'
import type { LessonScript } from '@monte/shared'

import { apiClient } from '@/lib/orpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface LessonEditorProps {
  lessonId: string
  onClose: () => void
}

export function LessonEditor({ lessonId, onClose }: LessonEditorProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const script = await apiClient.lessons.getScript({ lessonId })
        if (!cancelled) {
          setValue(JSON.stringify(script, null, 2))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [lessonId])

  const handleSave = async (publish: boolean) => {
    setError(null)
    setStatus(null)
    try {
      const parsed: LessonScript = JSON.parse(value)
      if (parsed.lessonId !== lessonId) {
        throw new Error(`Lesson ID mismatch. Expected ${lessonId} but found ${parsed.lessonId}`)
      }
      await apiClient.lessons.saveScript({ script: parsed, publish })
      setStatus(publish ? 'Lesson published and synced to database.' : 'Draft saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="absolute inset-y-0 right-0 z-50 w-[420px] border-l bg-white shadow-xl">
      <Card className="h-full rounded-none">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Lesson Script</CardTitle>
            <CardDescription>Editing {lessonId}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardContent className="flex h-full flex-col gap-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading script…</p>
          ) : (
            <>
              <Textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="flex-1 font-mono text-xs"
              />
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button onClick={() => handleSave(false)}>Save Draft</Button>
                  <Button variant="outline" onClick={() => handleSave(true)}>
                    Publish
                  </Button>
                </div>
                {error && <p className="text-xs text-rose-600">{error}</p>}
                {status && <p className="text-xs text-emerald-600">{status}</p>}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
