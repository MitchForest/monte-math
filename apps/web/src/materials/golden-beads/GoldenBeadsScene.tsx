import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { GoldenBeadsBoard, PlaceValue } from './types'

const columnOrder: PlaceValue[] = ['thousands', 'hundreds', 'tens', 'ones']
const columnLabels: Record<PlaceValue, string> = {
  thousands: 'Thousands',
  hundreds: 'Hundreds',
  tens: 'Tens',
  ones: 'Ones',
}

const cardPalette: Record<PlaceValue, number> = {
  thousands: 0x047857,
  hundreds: 0xdc2626,
  tens: 0x2563eb,
  ones: 0x16a34a,
}

const beadColor = 0xfbbf24
const beadStroke = 0xb45309
const columnWidth = 180

const rowPositions = {
  carry: 18,
  addend1: 70,
  addend2: 130,
  workspace: 210,
  result: 300,
  resultCard: 352,
} as const

function drawCard(
  container: PIXI.Container,
  value: number | null,
  x: number,
  y: number,
  color: number
) {
  const card = new PIXI.Graphics()
  card.roundRect(x - 36, y - 26, 72, 44, 10)
  card.fill(0xffffff, value === null ? 0.3 : 0.95)
  card.stroke({ color, width: 2, alpha: value === null ? 0.2 : 1 })
  container.addChild(card)

  const text = new PIXI.Text(value === null ? '·' : String(value), {
    fontFamily: 'Inter, sans-serif',
    fontSize: 24,
    fontWeight: '600',
    fill: value === null ? 0xd1d5db : color,
  })
  text.anchor.set(0.5)
  text.x = x
  text.y = y - 6
  container.addChild(text)
}

function drawBeads(
  container: PIXI.Container,
  count: number,
  place: PlaceValue,
  x: number,
  y: number
) {
  if (count <= 0) return
  const perRow = 4
  const spacing = 26
  for (let i = 0; i < count; i += 1) {
    const bead = new PIXI.Graphics()
    bead.fill(beadColor)
    bead.stroke({ color: beadStroke, width: 1.2 })

    switch (place) {
      case 'ones':
        bead.circle(0, 0, 7)
        break
      case 'tens':
        bead.roundRect(-7, -16, 14, 32, 5)
        break
      case 'hundreds':
        bead.roundRect(-14, -14, 28, 28, 6)
        break
      case 'thousands':
        bead.roundRect(-16, -20, 32, 40, 8)
        break
    }

    const row = Math.floor(i / perRow)
    const col = i % perRow
    bead.x = x + col * spacing
    bead.y = y + row * spacing
    container.addChild(bead)
  }
}

function drawColumn(
  app: PIXI.Application,
  board: GoldenBeadsBoard,
  place: PlaceValue,
  index: number
) {
  const columnContainer = new PIXI.Container()
  const baseX = 60 + index * columnWidth
  columnContainer.x = baseX
  app.stage.addChild(columnContainer)

  const isHighlighted = board.highlightColumn === place
  const columnBackground = new PIXI.Graphics()
  columnBackground.roundRect(-50, 0, columnWidth - 40, 380, 24)
  columnBackground.fill(isHighlighted ? 0xfffbeb : 0xf8fafc)
  columnBackground.stroke({
    color: isHighlighted ? 0xf97316 : 0xe2e8f0,
    width: isHighlighted ? 3 : 1,
  })
  columnContainer.addChild(columnBackground)

  const column = board.columns[place]
  const cards = board.cards

  // Carry card
  drawCard(columnContainer, cards.carry[place], 0, rowPositions.carry, cardPalette[place])
  drawBeads(columnContainer, column.carry, place, -16, rowPositions.carry)

  drawBeads(columnContainer, column.addend1, place, -30, rowPositions.addend1)
  drawCard(columnContainer, cards.addend1[place], 46, rowPositions.addend1 + 4, cardPalette[place])

  drawBeads(columnContainer, column.addend2, place, -30, rowPositions.addend2)
  drawCard(columnContainer, cards.addend2[place], 46, rowPositions.addend2 + 4, cardPalette[place])

  drawBeads(columnContainer, column.workspace, place, -30, rowPositions.workspace)
  drawBeads(columnContainer, column.result, place, -30, rowPositions.result)
  drawCard(columnContainer, cards.result[place], 0, rowPositions.resultCard, cardPalette[place])

  const label = new PIXI.Text(columnLabels[place], {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: '600',
    fill: 0x1e293b,
  })
  label.anchor.set(0.5)
  label.x = 0
  label.y = 360
  columnContainer.addChild(label)
}

function drawBoard(app: PIXI.Application, board: GoldenBeadsBoard) {
  app.stage.removeChildren()
  const stage = new PIXI.Container()
  app.stage.addChild(stage)

  columnOrder.forEach((place, index) => {
    drawColumn(app, board, place, index)
  })
}

export interface GoldenBeadsSceneProps {
  board: GoldenBeadsBoard
}

export function GoldenBeadsScene({ board }: GoldenBeadsSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const app = new PIXI.Application()
    app
      .init({
        width: columnWidth * columnOrder.length + 120,
        height: 420,
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
