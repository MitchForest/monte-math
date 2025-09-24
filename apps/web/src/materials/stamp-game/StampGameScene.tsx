import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'

import type { StampGameBoard, StampRowKey, PlaceValue } from './types'
import { copyRowKeys } from './types'

const columnOrder: PlaceValue[] = ['thousands', 'hundreds', 'tens', 'ones']
const columnLabels: Record<PlaceValue, string> = {
  thousands: 'Thousands',
  hundreds: 'Hundreds',
  tens: 'Tens',
  ones: 'Ones',
}

const stampPalette: Record<PlaceValue, { fill: number; stroke: number }> = {
  ones: { fill: 0x16a34a, stroke: 0x166534 },
  tens: { fill: 0x2563eb, stroke: 0x1d4ed8 },
  hundreds: { fill: 0xdc2626, stroke: 0xb91c1c },
  thousands: { fill: 0x117a42, stroke: 0x0f5130 },
}

const paperBackground = 0xf8fafc
const columnWidth = 170
const columnSpacing = 12
const stampSize = 26
const rowGap = 48
const baseYOffset = 36
const paperWidth = 220

const stampLabels: Record<PlaceValue, string> = {
  ones: '1',
  tens: '10',
  hundreds: '100',
  thousands: '1000',
}

type RowDescriptor = { key: StampRowKey; label: string }

function buildRows(activeCopies: number): RowDescriptor[] {
  const copies = copyRowKeys.slice(0, activeCopies)
  return [
    { key: 'carry', label: 'Carry' },
    { key: 'multiplicand', label: 'Build' },
    ...copies.map((copyKey, index) => ({
      key: copyKey,
      label: `Group ${index + 1}`,
    })),
    { key: 'workspace', label: 'Combine' },
    { key: 'result', label: 'Product' },
  ]
}

function drawStamp(container: PIXI.Container, place: PlaceValue, x: number, y: number) {
  const { fill, stroke } = stampPalette[place]
  const tile = new PIXI.Graphics()
  tile.roundRect(x - stampSize / 2, y - stampSize / 2, stampSize, stampSize, 6)
  tile.fill(fill)
  tile.stroke({ color: stroke, width: 2 })
  container.addChild(tile)

  const label = new PIXI.Text(stampLabels[place], {
    fontFamily: 'Inter, sans-serif',
    fontSize: place === 'thousands' ? 11 : 12,
    fontWeight: '700',
    fill: 0xffffff,
  })
  label.anchor.set(0.5)
  label.x = x
  label.y = y
  container.addChild(label)
}

function drawStampPile(
  container: PIXI.Container,
  count: number,
  place: PlaceValue,
  x: number,
  y: number
) {
  if (count <= 0) return
  const perRow = 5
  const spacing = 30
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    const tileX = x + col * spacing
    const tileY = y + row * spacing
    drawStamp(container, place, tileX, tileY)
  }
}

function drawColumn(
  stage: PIXI.Container,
  board: StampGameBoard,
  place: PlaceValue,
  index: number,
  rows: RowDescriptor[]
) {
  const columnContainer = new PIXI.Container()
  columnContainer.x = 40 + index * (columnWidth + columnSpacing)
  stage.addChild(columnContainer)

  const totalHeight = baseYOffset + rows.length * rowGap + 80
  const isHighlighted = board.highlightColumn === place

  const background = new PIXI.Graphics()
  background.roundRect(-columnWidth / 2, 0, columnWidth, totalHeight, 22)
  background.fill(isHighlighted ? 0xecfdf5 : 0xf8fafc)
  background.stroke({ color: isHighlighted ? 0x10b981 : 0xe2e8f0, width: isHighlighted ? 3 : 1 })
  columnContainer.addChild(background)

  const column = board.columns[place]

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
    columnContainer.addChild(label)

    const amount = column[row.key as keyof typeof column] as number
    drawStampPile(columnContainer, amount, place, -columnWidth / 2 + 92, rowY)
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
  columnContainer.addChild(footer)
}

function drawPaper(stage: PIXI.Container, board: StampGameBoard, rows: RowDescriptor[]) {
  const container = new PIXI.Container()
  const totalHeight = baseYOffset + rows.length * rowGap + 120
  container.x = 40 + columnOrder.length * (columnWidth + columnSpacing) + 20
  stage.addChild(container)

  const background = new PIXI.Graphics()
  background.roundRect(0, 0, paperWidth, totalHeight - 60, 28)
  background.fill(paperBackground)
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
    const carryValue = board.paper.carry[place]
    const topValue = board.paper.multiplicand[place]
    const bottomValue = board.paper.multiplier[place]
    const resultValue = board.paper.result[place]

    drawDigit(carryValue, x, carryY, { fontSize: 14, weight: '500', color: 0x64748b })
    drawDigit(topValue, x, topY)
    drawDigit(bottomValue, x, multiplierY, { fontSize: 20, weight: '600', color: 0x334155 })
    drawDigit(resultValue, x, resultY, { fontSize: 22, weight: '700', color: 0x0f172a })
  })

  const line = new PIXI.Graphics()
  line.moveTo(24, lineY)
  line.lineTo(paperWidth - 24, lineY)
  line.stroke({ color: 0xcbd5f5, width: 2 })
  container.addChild(line)
}

function drawBoard(app: PIXI.Application, board: StampGameBoard) {
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

export interface StampGameSceneProps {
  board: StampGameBoard
}

export function StampGameScene({ board }: StampGameSceneProps) {
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
