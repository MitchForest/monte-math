import type { StepAction } from '@monte/shared'

import {
  copyRowKeys,
  type PlaceValue,
  type StampGameBoard,
  type StampGameConfig,
  type StampRowKey,
} from './types'

export const highToLowPlaces: PlaceValue[] = ['thousands', 'hundreds', 'tens', 'ones']
export const lowToHighPlaces: PlaceValue[] = [...highToLowPlaces].reverse()

const placeToThingMap: Record<PlaceValue, 'unit' | 'ten' | 'hundred' | 'thousand'> = {
  ones: 'unit',
  tens: 'ten',
  hundreds: 'hundred',
  thousands: 'thousand',
}

const placeValues: PlaceValue[] = highToLowPlaces

export const splitDigits = (value: number): Record<PlaceValue, number> => {
  const str = Math.abs(value).toString().padStart(4, '0')
  return {
    thousands: Number(str[0]),
    hundreds: Number(str[1]),
    tens: Number(str[2]),
    ones: Number(str[3]),
  }
}

const emptyColumn = () => ({
  multiplicand: 0,
  copy1: 0,
  copy2: 0,
  copy3: 0,
  copy4: 0,
  copy5: 0,
  copy6: 0,
  copy7: 0,
  copy8: 0,
  copy9: 0,
  workspace: 0,
  result: 0,
  carry: 0,
})

const emptyPaperRow = () =>
  ({
    thousands: null,
    hundreds: null,
    tens: null,
    ones: null,
  }) as Record<PlaceValue, number | null>

export const createEmptyBoard = (): StampGameBoard => ({
  columns: {
    thousands: emptyColumn(),
    hundreds: emptyColumn(),
    tens: emptyColumn(),
    ones: emptyColumn(),
  },
  paper: {
    multiplicand: emptyPaperRow(),
    multiplier: emptyPaperRow(),
    result: emptyPaperRow(),
    carry: emptyPaperRow(),
  },
  highlightColumn: undefined,
  activeCopies: 1,
})

export const cloneBoard = (board: StampGameBoard): StampGameBoard => ({
  columns: {
    thousands: { ...board.columns.thousands },
    hundreds: { ...board.columns.hundreds },
    tens: { ...board.columns.tens },
    ones: { ...board.columns.ones },
  },
  paper: {
    multiplicand: { ...board.paper.multiplicand },
    multiplier: { ...board.paper.multiplier },
    result: { ...board.paper.result },
    carry: { ...board.paper.carry },
  },
  highlightColumn: board.highlightColumn,
  activeCopies: board.activeCopies,
})

const normalizeCopies = (config: StampGameConfig) =>
  Math.max(1, Math.min(copyRowKeys.length, Math.abs(config.multiplier)))

export const createBoardFromConfig = (config: StampGameConfig): StampGameBoard => {
  const base = createEmptyBoard()
  base.activeCopies = normalizeCopies(config)

  const digits = splitDigits(config.multiplicand)
  placeValues.forEach((place) => {
    base.paper.multiplicand[place] = digits[place]
    base.paper.result[place] = null
    base.paper.carry[place] = null
    base.paper.multiplier[place] = null
  })

  base.paper.multiplier.ones = Math.abs(config.multiplier)
  return base
}

const cloneAndClearBoard = (template: StampGameBoard): StampGameBoard => ({
  columns: {
    thousands: emptyColumn(),
    hundreds: emptyColumn(),
    tens: emptyColumn(),
    ones: emptyColumn(),
  },
  paper: {
    multiplicand: emptyPaperRow(),
    multiplier: emptyPaperRow(),
    result: emptyPaperRow(),
    carry: emptyPaperRow(),
  },
  highlightColumn: undefined,
  activeCopies: template.activeCopies,
})

export const createBoardForConfig = (config: StampGameConfig): StampGameBoard => {
  const board = createBoardFromConfig(config)
  if (config.startEmpty) {
    return cloneAndClearBoard(board)
  }

  let working = board
  if (config.prepopulateMultiplicand) {
    working = populateMultiplicand(working, config)
  }
  if (config.prepopulateCopies) {
    working = populateCopies(working, config)
  }
  return working
}

export const populateMultiplicand = (
  board: StampGameBoard,
  config: StampGameConfig
): StampGameBoard => {
  let working = cloneBoard(board)
  const digits = splitDigits(config.multiplicand)
  placeValues.forEach((place) => {
    const amount = digits[place]
    if (amount > 0) {
      working = applyStampGameAction(working, {
        kind: 'spawn',
        thing: placeToThingMap[place],
        qty: amount,
        to: `multiplicand.${place}`,
      })
    }
  })
  return working
}

export const populateCopies = (board: StampGameBoard, config: StampGameConfig): StampGameBoard => {
  let working = cloneBoard(board)
  const digits = splitDigits(config.multiplicand)
  const copies = Math.min(board.activeCopies, normalizeCopies(config))

  copyRowKeys.slice(0, copies).forEach((copyKey) => {
    placeValues.forEach((place) => {
      const amount = digits[place]
      if (amount > 0) {
        working = applyStampGameAction(working, {
          kind: 'spawn',
          thing: placeToThingMap[place],
          qty: amount,
          to: `${copyKey}.${place}`,
        })
      }
    })
  })

  return working
}

type Target =
  | { kind: 'column'; row: StampRowKey; column: PlaceValue }
  | {
      kind: 'paper'
      area: keyof StampGameBoard['paper']
      column: PlaceValue
    }

const placeValueSet = new Set<PlaceValue>(placeValues)
const rowKeySet = new Set<StampRowKey>([
  'multiplicand',
  'workspace',
  'result',
  'carry',
  ...copyRowKeys,
])

const isPlaceValue = (value: string): value is PlaceValue => placeValueSet.has(value as PlaceValue)

const isRowKey = (value: string): value is StampRowKey => rowKeySet.has(value as StampRowKey)

const parseTarget = (location?: string): Target | null => {
  if (!location) return null
  const parts = location.split('.')
  if (parts.length < 2) return null

  if (parts[0] === 'card') {
    if (parts[1] !== 'paper' || parts.length < 4) return null
    const area = parts[2]
    const column = parts[3]
    if (
      (
        ['multiplicand', 'multiplier', 'result', 'carry'] as Array<keyof StampGameBoard['paper']>
      ).includes(area as keyof StampGameBoard['paper']) &&
      isPlaceValue(column)
    ) {
      return {
        kind: 'paper',
        area: area as keyof StampGameBoard['paper'],
        column,
      }
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

const normalizeColumn = (column: ExchangeColumn): PlaceValue =>
  column === 'units' ? 'ones' : column

const nextColumn = (column: PlaceValue): PlaceValue | null => {
  const index = placeValues.indexOf(column)
  if (index <= 0) return null
  return placeValues[index - 1] ?? null
}

export const applyStampGameAction = (board: StampGameBoard, action: StepAction): StampGameBoard => {
  const working = cloneBoard(board)

  switch (action.kind) {
    case 'spawn': {
      const target = parseTarget(action.to)
      if (!target) return working
      const qty = action.qty ?? 0

      if (action.thing === 'card') {
        if (target.kind === 'paper') {
          working.paper[target.area][target.column] = qty
        }
        return working
      }

      if (target.kind === 'column') {
        const column = working.columns[target.column]
        const key = target.row as keyof typeof column
        column[key] = Math.max(0, (column[key] as number) + qty)
      }
      return working
    }
    case 'move': {
      const from = parseTarget(action.target)
      const to = parseTarget(action.to)
      if (!from || !to) return working
      if (from.kind !== 'column' || to.kind !== 'column') return working

      const source = working.columns[from.column]
      const dest = working.columns[to.column]
      const fromKey = from.row as keyof typeof source
      const toKey = to.row as keyof typeof dest
      const available = source[fromKey] as number
      const qty = action.qty ?? available
      if (qty <= 0) return working
      const transfer = Math.min(available, qty)
      source[fromKey] = Math.max(0, available - transfer)
      dest[toKey] = (dest[toKey] as number) + transfer
      return working
    }
    case 'exchange': {
      const normalized = normalizeColumn(action.column as ExchangeColumn)
      const column = working.columns[normalized]
      if (!column) return working
      if (column.workspace < 10) return working
      column.workspace -= 10
      const next = nextColumn(normalized)
      if (!next) return working
      working.columns[next].carry += 1
      const existingCarry = working.paper.carry[next] ?? 0
      working.paper.carry[next] = (existingCarry ?? 0) + 1
      return working
    }
    case 'highlight':
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
