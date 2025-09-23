import { useMemo, useState } from 'react'
import { GoldenBeadsScene } from '../materials/golden-beads/GoldenBeadsScene'
import {
  applyGoldenBeadsAction,
  cloneBoard,
  createBoardFromConfig,
  highToLowPlaces,
  lowToHighPlaces,
  SpawnThing,
} from '../materials/golden-beads/state'
import { GoldenBeadsBoard, PlaceValue } from '../materials/golden-beads/types'

const placeToThing: Record<PlaceValue, SpawnThing> = {
  thousands: 'thousand',
  hundreds: 'hundred',
  tens: 'ten',
  ones: 'unit',
}

const toDigits = (value: number) => {
  const str = value.toString().padStart(4, '0')
  return {
    thousands: Number(str[0]),
    hundreds: Number(str[1]),
    tens: Number(str[2]),
    ones: Number(str[3]),
  }
}

const clampFourDigit = (value: number) => Math.min(9999, Math.max(0, Math.floor(value)))

const nextPlaceMap: Partial<Record<PlaceValue, PlaceValue>> = {
  ones: 'tens',
  tens: 'hundreds',
  hundreds: 'thousands',
}

const formatNumber = (value: number) => value.toLocaleString('en-US')

export function GoldenBeadsMaterialView() {
  const [addendA, setAddendA] = useState(1824)
  const [addendB, setAddendB] = useState(2832)
  const [board, setBoard] = useState<GoldenBeadsBoard>(() =>
    createBoardFromConfig({ addends: [1824, 2832] })
  )
  const [status, setStatus] = useState('Enter numbers and build them on the mat.')

  const addendDigits = useMemo(
    () => ({
      first: toDigits(addendA),
      second: toDigits(addendB),
    }),
    [addendA, addendB]
  )

  const rebuildBoard = () => {
    setBoard(createBoardFromConfig({ addends: [addendA, addendB] }))
    setStatus('Mat reset with updated number cards.')
  }

  const buildNumbers = () => {
    let next = createBoardFromConfig({ addends: [addendA, addendB] })
    const actions: Array<{ kind: 'spawn'; thing: SpawnThing; qty: number; to: string }> = []
    highToLowPlaces.forEach((place) => {
      const firstCount = addendDigits.first[place]
      const secondCount = addendDigits.second[place]
      if (firstCount) {
        actions.push({
          kind: 'spawn',
          thing: placeToThing[place],
          qty: firstCount,
          to: `addend1.${place}`,
        })
      }
      if (secondCount) {
        actions.push({
          kind: 'spawn',
          thing: placeToThing[place],
          qty: secondCount,
          to: `addend2.${place}`,
        })
      }
    })

    actions.forEach((action) => {
      next = applyGoldenBeadsAction(next, action)
    })

    setBoard(next)
    setStatus('Numbers composed with golden beads.')
  }

  const autoSolve = () => {
    const digitsA = addendDigits.first
    const digitsB = addendDigits.second
    let carry = 0
    const next = cloneBoard(board)

    lowToHighPlaces.forEach((place) => {
      const columnSum = digitsA[place] + digitsB[place] + carry
      const workspaceTotal = digitsA[place] + digitsB[place]
      next.columns[place].workspace = workspaceTotal
      next.columns[place].result = columnSum % 10
      next.cards.result[place] = columnSum % 10
      if (carry) {
        next.cards.carry[place] = carry
        next.columns[place].carry = carry
      }
      carry = Math.floor(columnSum / 10)
      const nextPlace = nextPlaceMap[place]
      if (carry > 0 && nextPlace) {
        next.cards.carry[nextPlace] = (next.cards.carry[nextPlace] ?? 0) + carry
        next.columns[nextPlace].carry += carry
      }
    })

    setBoard(next)
    setStatus(`Sum ready: ${formatNumber(addendA + addendB)}.`)
  }

  const clearWorkspace = () => {
    setBoard(createBoardFromConfig({ addends: [addendA, addendB] }))
    setStatus('Workspace cleared; number cards remain in place.')
  }

  const highlightColumn = (place: PlaceValue) => {
    setBoard((prev) => ({
      ...cloneBoard(prev),
      highlightColumn: prev.highlightColumn === place ? undefined : place,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Golden Beads + Number Cards
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Programmatic PixiJS scene that composes four-digit numbers using Montessori bead
            material and color-coded number cards. Configure any numbers and animate the build-out.
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Column Addition (with regroup)
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[2fr_1fr]">
        <div>
          <GoldenBeadsScene board={board} />
        </div>
        <div className="space-y-4 text-sm text-slate-700">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Controls
            </h4>
            <div className="mt-3 space-y-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                First addend
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={addendA}
                  onChange={(event) => setAddendA(clampFourDigit(Number(event.target.value)))}
                  className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-800"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Second addend
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={addendB}
                  onChange={(event) => setAddendB(clampFourDigit(Number(event.target.value)))}
                  className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-800"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <button
                onClick={rebuildBoard}
                className="rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Reset Mat
              </button>
              <button
                onClick={buildNumbers}
                className="rounded-md bg-slate-900 px-3 py-2 font-semibold text-white transition hover:bg-slate-700"
              >
                Build Numbers with Beads
              </button>
              <button
                onClick={autoSolve}
                className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                Auto Solve (model regrouping)
              </button>
              <button
                onClick={clearWorkspace}
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 font-medium text-rose-700 transition hover:bg-rose-100"
              >
                Clear Workspace
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Highlight columns
            </h4>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {highToLowPlaces.map((place) => (
                <button
                  key={place}
                  onClick={() => highlightColumn(place)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition ${
                    board.highlightColumn === place
                      ? 'border-amber-500 bg-amber-100 text-amber-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {place}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-500">Status</p>
            <p className="mt-1 text-slate-700">{status}</p>
            <p className="mt-3">
              Use this panel to demo why the manipulative supports place-value reasoning. Change the
              addends, rebuild, and highlight the regroup steps as needed during stakeholder
              walkthroughs.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
        <p>
          Tip: The number cards stay in sync with the digits you enter. When you run{' '}
          <em>Auto Solve</em>, we calculate carries column-by-column (ones → thousands) and place
          the resulting digits on the card track, matching the manual lesson flow.
        </p>
      </div>
    </div>
  )
}
