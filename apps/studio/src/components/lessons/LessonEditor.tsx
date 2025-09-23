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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-editor-title"
        className="flex h-full w-full max-h-[90vh] max-w-6xl flex-col overflow-hidden rounded-2xl border border-border/80 shadow-2xl"
      >
        <CardHeader className="flex flex-col gap-3 border-b bg-card/95 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle id="lesson-editor-title" className="text-2xl">
              Lesson script
            </CardTitle>
            <CardDescription className="font-mono text-xs text-muted-foreground/80">
              {lessonId}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Loading script…
            </div>
          ) : (
            <>
              <Textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="min-h-0 flex-1 resize-none overflow-auto rounded-lg border-border/70 bg-slate-950/5 font-mono text-xs leading-5"
              />
              <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button onClick={() => handleSave(false)}>Save draft</Button>
                  <Button variant="outline" onClick={() => handleSave(true)}>
                    Publish
                  </Button>
                </div>
                <div className="space-y-1 text-xs">
                  {error ? <p className="text-rose-600">{error}</p> : null}
                  {status ? <p className="text-emerald-600">{status}</p> : null}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
