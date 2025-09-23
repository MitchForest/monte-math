export type PlaceValue = 'thousands' | 'hundreds' | 'tens' | 'ones'
export type RowKey = 'addend1' | 'addend2' | 'workspace' | 'result' | 'carry'

export interface ColumnState {
  addend1: number
  addend2: number
  workspace: number
  result: number
  carry: number
}

export interface CardsState {
  addend1: Record<PlaceValue, number | null>
  addend2: Record<PlaceValue, number | null>
  result: Record<PlaceValue, number | null>
  carry: Record<PlaceValue, number | null>
}

export interface GoldenBeadsBoard {
  columns: Record<PlaceValue, ColumnState>
  cards: CardsState
  highlightColumn?: PlaceValue
}

export interface GoldenBeadsConfig {
  addends: [number, number]
  startEmpty?: boolean
  prepopulateAddends?: boolean
}
