import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { AdminShell } from '@/components/admin/AdminShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LessonEditor } from '@/components/lessons/LessonEditor'

interface LessonRow {
  lessonId: string
  title: string
  status: 'draft' | 'published'
  updatedAt: string
}

const columnHelper = createColumnHelper<LessonRow>()

export function LessonsView() {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)

  const data = useMemo<LessonRow[]>(
    () => [
      {
        lessonId: 'lesson-07-column-addition-golden-beads',
        title: 'Golden Beads Addition',
        status: 'published',
        updatedAt: '2024-05-16',
      },
      {
        lessonId: 'lesson-08-column-subtraction-golden-beads',
        title: 'Golden Beads Subtraction',
        status: 'draft',
        updatedAt: '2024-05-10',
      },
    ],
    []
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('lessonId', {
        header: 'Lesson ID',
      }),
      columnHelper.accessor('title', {
        header: 'Title',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <span className={info.getValue() === 'published' ? 'text-emerald-600' : 'text-amber-600'}>
            {info.getValue() === 'published' ? 'Published' : 'Draft'}
          </span>
        ),
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Last updated',
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveLessonId(info.row.original.lessonId)}
          >
            Edit
          </Button>
        ),
      }),
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <AdminShell title="Lessons" description="Content management">
      <div className="relative">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Lesson catalog</CardTitle>
              <CardDescription>Track drafts, publishing state, and metadata.</CardDescription>
            </div>
            <Button variant="secondary" disabled>
              New lesson (soon)
            </Button>
          </CardHeader>
          <CardContent>
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-border/60 text-left">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {activeLessonId ? (
          <LessonEditor lessonId={activeLessonId} onClose={() => setActiveLessonId(null)} />
        ) : null}
      </div>
    </AdminShell>
  )
}
