import type { StepAction } from '@monte/shared'
import { GoldenBeadsBoard, GoldenBeadsConfig, PlaceValue, RowKey } from './types'

export const highToLowPlaces: PlaceValue[] = ['thousands', 'hundreds', 'tens', 'ones']
export const lowToHighPlaces: PlaceValue[] = [...highToLowPlaces].reverse()

const placeValues: PlaceValue[] = highToLowPlaces
export type SpawnThing = 'unit' | 'ten' | 'hundred' | 'thousand' | 'card'

const placeToThingMap: Record<PlaceValue, SpawnThing> = {
  thousands: 'thousand',
  hundreds: 'hundred',
  tens: 'ten',
  ones: 'unit'
}

export const splitDigits = (value: number) => {
  const str = value.toString().padStart(4, '0')
  return {
    thousands: Number(str[0]),
    hundreds: Number(str[1]),
    tens: Number(str[2]),
    ones: Number(str[3])
  } as Record<PlaceValue, number>
}

const emptyColumn = () => ({
  addend1: 0,
  addend2: 0,
  workspace: 0,
  result: 0,
  carry: 0
})

const emptyCardRow = () => ({
  thousands: null,
  hundreds: null,
  tens: null,
  ones: null
} as Record<PlaceValue, number | null>)

export const createEmptyBoard = (): GoldenBeadsBoard => ({
  columns: {
    thousands: emptyColumn(),
    hundreds: emptyColumn(),
    tens: emptyColumn(),
    ones: emptyColumn()
  },
  cards: {
    addend1: emptyCardRow(),
    addend2: emptyCardRow(),
    result: emptyCardRow(),
    carry: emptyCardRow()
  },
  highlightColumn: undefined
})

export const createBoardFromConfig = (config: GoldenBeadsConfig): GoldenBeadsBoard => {
  const board = createEmptyBoard()
  const [first, second] = config.addends

  const firstDigits = splitDigits(first)
  const secondDigits = splitDigits(second)

  placeValues.forEach((place) => {
    board.cards.addend1[place] = firstDigits[place]
    board.cards.addend2[place] = secondDigits[place]
  })

  return board
}

export const createBoardForConfig = (config: GoldenBeadsConfig): GoldenBeadsBoard =>
  config.startEmpty ? createEmptyBoard() : createBoardFromConfig(config)

export const populateAddends = (board: GoldenBeadsBoard, config: GoldenBeadsConfig): GoldenBeadsBoard => {
  let working = cloneBoard(board)
  const [first, second] = config.addends
  const firstDigits = splitDigits(first)
  const secondDigits = splitDigits(second)

  placeValues.forEach((place) => {
    const amountA = firstDigits[place]
    const amountB = secondDigits[place]
    if (amountA) {
      working = applyGoldenBeadsAction(working, {
        kind: 'spawn',
        thing: placeToThingMap[place],
        qty: amountA,
        to: `addend1.${place}`
      })
    }
    if (amountB) {
      working = applyGoldenBeadsAction(working, {
        kind: 'spawn',
        thing: placeToThingMap[place],
        qty: amountB,
        to: `addend2.${place}`
      })
    }
  })

  return working
}

export const cloneBoard = (board: GoldenBeadsBoard): GoldenBeadsBoard => ({
  columns: {
    thousands: { ...board.columns.thousands },
    hundreds: { ...board.columns.hundreds },
    tens: { ...board.columns.tens },
    ones: { ...board.columns.ones }
  },
  cards: {
    addend1: { ...board.cards.addend1 },
    addend2: { ...board.cards.addend2 },
    result: { ...board.cards.result },
    carry: { ...board.cards.carry }
  },
  highlightColumn: board.highlightColumn
})

type Target =
  | { kind: 'column'; row: RowKey; column: PlaceValue }
  | { kind: 'card'; row: 'addend1' | 'addend2' | 'result' | 'carry'; column: PlaceValue }

const isPlaceValue = (value: string): value is PlaceValue =>
  (placeValues as string[]).includes(value)

const isRowKey = (value: string): value is RowKey =>
  ['addend1', 'addend2', 'workspace', 'result', 'carry'].includes(value)

const parseTarget = (location?: string): Target | null => {
  if (!location) return null
  const parts = location.split('.')
  if (parts.length < 2) return null

  if (parts[0] === 'card') {
    const row = parts[1]
    const column = parts[2]
    if ((['addend1', 'addend2', 'result', 'carry'] as string[]).includes(row) && isPlaceValue(column)) {
      return { kind: 'card', row: row as 'addend1' | 'addend2' | 'result' | 'carry', column }
    }
    return null
  }

  const row = parts[0]
  const column = parts[1]
  if (isRowKey(row) && isPlaceValue(column)) {
    return { kind: 'column', row, column }
  }
  return null
}

type ExchangeColumn = 'units' | PlaceValue

const normalizeColumn = (column: ExchangeColumn): PlaceValue => (column === 'units' ? 'ones' : column)

const nextColumn = (column: PlaceValue): PlaceValue | null => {
  const index = placeValues.indexOf(column)
  if (index <= 0) return null
  return placeValues[index - 1] ?? null
}

export const applyGoldenBeadsAction = (
  board: GoldenBeadsBoard,
  action: StepAction
): GoldenBeadsBoard => {
  const working = cloneBoard(board)

  switch (action.kind) {
    case 'spawn': {
      const target = parseTarget(action.to)
      if (!target) return working
      const qty = action.qty ?? 0
      if (action.thing === 'card') {
        if (target.kind === 'card') {
          working.cards[target.row][target.column] = qty
        }
        return working
      }
      if (target.kind === 'column') {
        const column = working.columns[target.column]
        column[target.row] += qty
      }
      return working
    }
    case 'move': {
      const from = parseTarget(action.target)
      const to = parseTarget(action.to)
      if (!from || !to) return working
      if (from.kind !== 'column' || to.kind !== 'column') return working
      const sourceColumn = working.columns[from.column]
      const destColumn = working.columns[to.column]
      const available = sourceColumn[from.row]
      const qty = action.qty ?? available
      if (qty <= 0) return working
      sourceColumn[from.row] = Math.max(0, available - qty)
      destColumn[to.row] += qty
      return working
    }
    case 'exchange': {
      const normalizedColumn = normalizeColumn(action.column as ExchangeColumn)
      const column = working.columns[normalizedColumn]
      if (!column) return working
      if (column.workspace < 10) return working
      column.workspace -= 10
      const next = nextColumn(normalizedColumn)
      if (!next) return working
      working.columns[next].carry += 1
      const currentCarry = working.cards.carry[next] ?? 0
      working.cards.carry[next] = currentCarry + 1
      return working
    }
    case 'highlight': {
      const target = parseTarget(action.target)
      if (target?.kind === 'column') {
        working.highlightColumn = target.column
      }
      return working
    }
    case 'focus': {
      const target = parseTarget(action.target)
      if (target?.kind === 'column') {
        working.highlightColumn = target.column
      }
      return working
    }
    default:
      return working
  }
}
