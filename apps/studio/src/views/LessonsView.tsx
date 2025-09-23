import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { AdminShell } from '@/components/admin/AdminShell'
import { Card, CardContent } from '@/components/ui/card'
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
    <AdminShell
      title="Lessons"
      description="Content management"
      headerAction={
        <Button variant="secondary" disabled>
          New lesson (soon)
        </Button>
      }
    >
      <div className="relative">
        <Card>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-auto border-collapse text-sm">
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
                  <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 align-top">
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
