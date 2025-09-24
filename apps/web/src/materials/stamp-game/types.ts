import type { PlaceValue as GoldenPlaceValue } from '../golden-beads/types'

export type PlaceValue = GoldenPlaceValue

export const copyRowKeys = [
  'copy1',
  'copy2',
  'copy3',
  'copy4',
  'copy5',
  'copy6',
  'copy7',
  'copy8',
  'copy9',
] as const

export type CopyRowKey = (typeof copyRowKeys)[number]
export type StampRowKey = 'multiplicand' | CopyRowKey | 'workspace' | 'result' | 'carry'

export interface StampColumnState {
  multiplicand: number
  copy1: number
  copy2: number
  copy3: number
  copy4: number
  copy5: number
  copy6: number
  copy7: number
  copy8: number
  copy9: number
  workspace: number
  result: number
  carry: number
}

export interface StampPaperState {
  multiplicand: Record<PlaceValue, number | null>
  multiplier: Record<PlaceValue, number | null>
  result: Record<PlaceValue, number | null>
  carry: Record<PlaceValue, number | null>
}

export interface StampGameBoard {
  columns: Record<PlaceValue, StampColumnState>
  paper: StampPaperState
  highlightColumn?: PlaceValue
  activeCopies: number
}

export interface StampGameConfig {
  multiplicand: number
  multiplier: number
  startEmpty?: boolean
  prepopulateMultiplicand?: boolean
  prepopulateCopies?: boolean
}
