import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'

import type { GoldenBeadsMultiplicationBoard } from './state'
import type { PlaceValue } from '../stamp-game/types'
import { copyRowKeys } from '../stamp-game/types'

const columnOrder: PlaceValue[] = ['thousands', 'hundreds', 'tens', 'ones']
const columnLabels: Record<PlaceValue, string> = {
  thousands: 'Thousands',
  hundreds: 'Hundreds',
  tens: 'Tens',
  ones: 'Ones',
}

const beadColor = 0xfbbf24
const beadStroke = 0xb45309
const highlightFill = 0xfffbeb
const defaultFill = 0xf8fafc
const highlightBorder = 0xf97316
const defaultBorder = 0xe2e8f0

const columnWidth = 170
const columnSpacing = 12
const beadSpacing = 30
const rowGap = 48
const baseYOffset = 36
const paperWidth = 220

const rowLabels = {
  carry: 'Carry',
  multiplicand: 'Build',
  workspace: 'Combine',
  result: 'Product',
} as const

type CopyRow = (typeof copyRowKeys)[number]

type ExtendedRowKey = keyof GoldenBeadsMultiplicationBoard['columns']['ones'] | CopyRow

function buildRows(activeCopies: number): Array<{ key: ExtendedRowKey; label: string }> {
  const copies = copyRowKeys.slice(0, activeCopies)
  return [
    { key: 'carry', label: rowLabels.carry },
    { key: 'multiplicand', label: rowLabels.multiplicand },
    ...copies.map((copyKey, index) => ({ key: copyKey, label: `Group ${index + 1}` })),
    { key: 'workspace', label: rowLabels.workspace },
    { key: 'result', label: rowLabels.result },
  ]
}

function drawBead(container: PIXI.Container, place: PlaceValue, x: number, y: number) {
  const graphics = new PIXI.Graphics()
  graphics.fill(beadColor)
  graphics.stroke({ color: beadStroke, width: 1.5 })

  switch (place) {
    case 'ones':
      graphics.circle(0, 0, 8)
      break
    case 'tens':
      graphics.roundRect(-8, -22, 16, 44, 6)
      break
    case 'hundreds':
      graphics.roundRect(-20, -20, 40, 40, 8)
      break
    case 'thousands':
      graphics.roundRect(-22, -26, 44, 52, 10)
      break
  }

  graphics.x = x
  graphics.y = y
  container.addChild(graphics)
}

function drawBeadPile(
  container: PIXI.Container,
  count: number,
  place: PlaceValue,
  x: number,
  y: number
) {
  if (count <= 0) return
  const perRow = 5
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / perRow)
    const col = index % perRow
    drawBead(container, place, x + col * beadSpacing, y + row * beadSpacing)
  }
}

function drawColumn(
  stage: PIXI.Container,
  board: GoldenBeadsMultiplicationBoard,
  place: PlaceValue,
  index: number,
  rows: Array<{ key: ExtendedRowKey; label: string }>
) {
  const container = new PIXI.Container()
  container.x = 40 + index * (columnWidth + columnSpacing)
  stage.addChild(container)

  const totalHeight = baseYOffset + rows.length * rowGap + 80
  const isHighlighted = board.highlightColumn === place

  const background = new PIXI.Graphics()
  background.roundRect(-columnWidth / 2, 0, columnWidth, totalHeight, 22)
  background.fill(isHighlighted ? highlightFill : defaultFill)
  background.stroke({
    color: isHighlighted ? highlightBorder : defaultBorder,
    width: isHighlighted ? 3 : 1,
  })
  container.addChild(background)

  const columnData = board.columns[place]

  rows.forEach((row, rowIndex) => {
    const rowY = baseYOffset + rowIndex * rowGap
    const label = new PIXI.Text(row.label, {
      fontFamily: 'Inter, sans-serif',
      fontSize: 11,
      fontWeight: '600',
      fill: 0x475569,
    })
    label.anchor.set(0, 0.5)
    label.x = -columnWidth / 2 + 12
    label.y = rowY
    container.addChild(label)

    const beadCount = columnData[row.key as keyof typeof columnData] as number
    drawBeadPile(container, beadCount, place, -columnWidth / 2 + 92, rowY)
  })

  const footer = new PIXI.Text(columnLabels[place], {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: '600',
    fill: 0x1e293b,
  })
  footer.anchor.set(0.5)
  footer.x = 0
  footer.y = totalHeight - 32
  container.addChild(footer)
}

function drawPaper(
  stage: PIXI.Container,
  board: GoldenBeadsMultiplicationBoard,
  rows: Array<{ key: ExtendedRowKey; label: string }>
) {
  const container = new PIXI.Container()
  const totalHeight = baseYOffset + rows.length * rowGap + 120
  container.x = 40 + columnOrder.length * (columnWidth + columnSpacing) + 20
  stage.addChild(container)

  const background = new PIXI.Graphics()
  background.roundRect(0, 0, paperWidth, totalHeight - 60, 28)
  background.fill(0xf8fafc)
  background.stroke({ color: 0xe2e8f0, width: 1 })
  container.addChild(background)

  const title = new PIXI.Text('Pen & Paper', {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: '600',
    fill: 0x0f172a,
  })
  title.anchor.set(0.5)
  title.x = paperWidth / 2
  title.y = 28
  container.addChild(title)

  const baseX = paperWidth - 36
  const step = 44
  const digitsOrder: PlaceValue[] = ['thousands', 'hundreds', 'tens', 'ones']

  const carryY = 62
  const topY = 92
  const multiplierY = 128
  const lineY = 148
  const resultY = 186

  const multiplierLabel = new PIXI.Text('×', {
    fontFamily: 'Inter, sans-serif',
    fontSize: 20,
    fontWeight: '700',
    fill: 0x1e293b,
  })
  multiplierLabel.anchor.set(0, 0.5)
  multiplierLabel.x = baseX - digitsOrder.length * step - 18
  multiplierLabel.y = multiplierY
  container.addChild(multiplierLabel)

  const drawDigit = (
    value: number | null,
    x: number,
    y: number,
    options?: { fontSize?: number; weight?: string | number; color?: number }
  ) => {
    const text = new PIXI.Text(value === null ? '·' : String(value), {
      fontFamily: 'Inter, sans-serif',
      fontSize: options?.fontSize ?? 22,
      fontWeight: options?.weight ?? '600',
      fill: options?.color ?? 0x1f2937,
    })
    text.anchor.set(0.5)
    text.x = x
    text.y = y
    container.addChild(text)
  }

  digitsOrder.forEach((place, index) => {
    const x = baseX - index * step
    drawDigit(board.paper.carry[place], x, carryY, { fontSize: 14, weight: '500', color: 0x64748b })
    drawDigit(board.paper.multiplicand[place], x, topY)
    drawDigit(board.paper.multiplier[place], x, multiplierY, {
      fontSize: 20,
      weight: '600',
      color: 0x334155,
    })
    drawDigit(board.paper.result[place], x, resultY, {
      fontSize: 22,
      weight: '700',
      color: 0x0f172a,
    })
  })

  const line = new PIXI.Graphics()
  line.moveTo(24, lineY)
  line.lineTo(paperWidth - 24, lineY)
  line.stroke({ color: 0xcbd5f5, width: 2 })
  container.addChild(line)
}

function drawBoard(app: PIXI.Application, board: GoldenBeadsMultiplicationBoard) {
  const rows = buildRows(board.activeCopies)
  const height = baseYOffset + rows.length * rowGap + 160
  const width = columnOrder.length * (columnWidth + columnSpacing) + paperWidth + 80

  app.renderer.resize(width, height)

  app.stage.removeChildren()
  const stage = new PIXI.Container()
  app.stage.addChild(stage)

  columnOrder.forEach((place, index) => {
    drawColumn(stage, board, place, index, rows)
  })

  drawPaper(stage, board, rows)
}

export interface GoldenBeadsMultiplicationSceneProps {
  board: GoldenBeadsMultiplicationBoard
}

export function GoldenBeadsMultiplicationScene({ board }: GoldenBeadsMultiplicationSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const app = new PIXI.Application()
    app
      .init({
        width: 800,
        height: 520,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      .then(() => {
        containerRef.current?.appendChild(app.canvas)
        appRef.current = app
        drawBoard(app, board)
      })

    return () => {
      app.destroy(true, { children: true })
      appRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!appRef.current) return
    drawBoard(appRef.current, board)
  }, [board])

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow"
    />
  )
}
