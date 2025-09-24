export {
  highToLowPlaces,
  lowToHighPlaces,
  copyRowKeys,
  splitDigits,
  createEmptyBoard,
  createBoardFromConfig,
  createBoardForConfig,
  populateCopies,
  populateMultiplicand,
  applyStampGameAction as applyGoldenBeadsMultiplicationAction,
  cloneBoard,
} from '../stamp-game/state'

export type { StampGameBoard as GoldenBeadsMultiplicationBoard } from '../stamp-game/types'
export type { StampGameConfig as GoldenBeadsMultiplicationConfig } from '../stamp-game/types'
