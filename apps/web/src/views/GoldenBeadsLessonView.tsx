import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Stage, StepAction, PracticeTemplate } from '@monte/shared'
import { GoldenBeadsScene } from '../materials/golden-beads/GoldenBeadsScene'
import {
  applyGoldenBeadsAction,
  cloneBoard,
  createBoardForConfig,
  createBoardFromConfig,
  createEmptyBoard,
  lowToHighPlaces,
  populateAddends,
  splitDigits
} from '../materials/golden-beads/state'
import type { GoldenBeadsBoard, GoldenBeadsConfig, PlaceValue } from '../materials/golden-beads/types'
import { apiClient } from '@/lib/orpc-client'

const stageDescriptors: Record<Stage['mode'], string> = {
  tutorial: 'Tutorial',
  worked: 'Worked Example',
  practice: 'Practice'
}

const LESSON_ID = 'lesson-07-column-addition-golden-beads'

const nextPlaceMap: Partial<Record<PlaceValue, PlaceValue>> = {
  ones: 'tens',
  tens: 'hundreds',
  hundreds: 'thousands'
}

interface GateState {
  column: PlaceValue
  expectedDigit: number
  hint?: string
}

type PracticeProblem = { a: number; b: number; focus: string }

function computeBoardFor(stage: Stage, uptoStep: number): GoldenBeadsBoard {
  const config = stage.materialConfig as GoldenBeadsConfig | undefined
  let board = config ? createBoardForConfig(config) : createEmptyBoard()

  if (config?.prepopulateAddends) {
    board = populateAddends(board, config)
  }

  if (!stage.steps || uptoStep < 0) {
    return board
  }

  for (let i = 0; i <= uptoStep && i < stage.steps.length; i += 1) {
    const step = stage.steps[i]
    for (const action of step.actions) {
      if (action.kind === 'gate-do') continue
      board = applyGoldenBeadsAction(board, action)
    }
  }

  return board
}

function parseGateAction(action?: StepAction): GateState | null {
  if (!action || action.kind !== 'gate-do') return null
  const [column, digit] = action.expect.split('-')
  if (!column || digit === undefined) return null
  if (!['ones', 'tens', 'hundreds', 'thousands'].includes(column)) return null
  const parsedDigit = Number(digit)
  if (Number.isNaN(parsedDigit)) return null
  return {
    column: column as PlaceValue,
    expectedDigit: parsedDigit,
    hint: action.hint
  }
}

function deriveArithmetic(config: GoldenBeadsConfig) {
  const first = splitDigits(config.addends[0])
  const second = splitDigits(config.addends[1])
  let carry = 0
  const perPlace: Record<PlaceValue, { result: number; carryOut: number; carryIn: number }> = {
    ones: { result: 0, carryOut: 0, carryIn: 0 },
    tens: { result: 0, carryOut: 0, carryIn: 0 },
    hundreds: { result: 0, carryOut: 0, carryIn: 0 },
    thousands: { result: 0, carryOut: 0, carryIn: 0 }
  }

  lowToHighPlaces.forEach((place) => {
    const total = first[place] + second[place] + carry
    const result = total % 10
    const carryOut = Math.floor(total / 10)
    perPlace[place] = { result, carryOut, carryIn: carry }
    carry = carryOut
  })

  return perPlace
}

function PracticePanel({ template }: { template: PracticeTemplate }) {
  const problems = (template.inputs as { problems?: PracticeProblem[] }).problems ?? []
  const [responses, setResponses] = useState(() => problems.map(() => ({ value: '', correct: null as null | boolean })))

  useEffect(() => {
    setResponses(problems.map(() => ({ value: '', correct: null })))
  }, [template, problems])

  const checkAnswers = () => {
    setResponses((prev) =>
      prev.map((response, index) => {
        const problem = problems[index]
        const expected = problem.a + problem.b
        const numeric = Number(response.value)
        return {
          value: response.value,
          correct: !Number.isNaN(numeric) && numeric === expected
        }
      })
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-600">{template.prompt}</p>
      </div>
      <div className="space-y-3">
        {problems.map((problem: PracticeProblem, index) => {
          const response = responses[index]
          const correct = response?.correct
          return (
            <div
              key={`${problem.a}-${problem.b}`}
              className={`flex flex-col rounded-lg border p-3 text-sm transition ${
                correct === null
                  ? 'border-slate-200 bg-white'
                  : correct
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-rose-200 bg-rose-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>Focus: {problem.focus}</span>
                <span>Expected regroup? {problem.focus.includes('pen') ? 'No beads' : 'Yes'}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-3 text-lg font-semibold text-slate-800">
                <span>{problem.a.toLocaleString()}</span>
                <span className="text-slate-400">+</span>
                <span>{problem.b.toLocaleString()}</span>
                <span className="text-slate-300">=</span>
                <input
                  type="number"
                  className="min-w-[140px] rounded-md border border-slate-300 px-2 py-1 text-right text-lg"
                  value={response?.value ?? ''}
                  onChange={(event) => {
                    const value = event.target.value
                    setResponses((prev) => {
                      const next = [...prev]
                      next[index] = { value, correct: null }
                      return next
                    })
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <button
        onClick={checkAnswers}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Check answers
      </button>
    </div>
  )
}

export function GoldenBeadsLessonView() {
  const { data: script, isLoading, isError } = useQuery({
    queryKey: ['lessons', LESSON_ID, 'script'],
    queryFn: () => apiClient.lessons.getScript({ lessonId: LESSON_ID })
  })

  const stages = script?.stages ?? []
  const [stageIndex, setStageIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [board, setBoard] = useState<GoldenBeadsBoard>(() => createEmptyBoard())
  const [gateState, setGateState] = useState<GateState | null>(null)
  const [gateInput, setGateInput] = useState('')
  const [gateCorrect, setGateCorrect] = useState(false)
  const [gateError, setGateError] = useState<string | null>(null)

  useEffect(() => {
    if (!script || stages.length === 0) return
    setStageIndex(0)
    setStepIndex(0)
    setBoard(computeBoardFor(stages[0], 0))
  }, [script, stages.length])

  const currentStage = stages[stageIndex] ?? null
  const steps = currentStage?.steps ?? []
  const currentStep = steps[stepIndex] ?? null
  const gateAction = currentStep?.actions.find((action) => action.kind === 'gate-do')

  const practiceTemplate = useMemo(() => {
    if (!currentStage || currentStage.mode !== 'practice' || !currentStage.practiceTemplateId) return null
    return script?.practiceTemplates?.find((template) => template.id === currentStage.practiceTemplateId) ?? null
  }, [currentStage, script?.practiceTemplates])

  useEffect(() => {
    setStepIndex(0)
  }, [stageIndex])

  useEffect(() => {
    if (!currentStage) return

    if (currentStage.mode === 'practice') {
      setBoard(
        currentStage.materialConfig
          ? createBoardFromConfig(currentStage.materialConfig as GoldenBeadsConfig)
          : createEmptyBoard()
      )
      setGateState(null)
      setGateInput('')
      setGateCorrect(false)
      setGateError(null)
      return
    }

    const nextBoard = computeBoardFor(currentStage, stepIndex)
    setBoard(nextBoard)

    const parsedGate = parseGateAction(gateAction)
    setGateState(parsedGate)
    setGateInput('')
    setGateCorrect(false)
    setGateError(null)
  }, [currentStage, gateAction, stepIndex])

  const handleBack = () => {
    if (!currentStage) return

    if (currentStage.mode === 'practice') {
      if (stageIndex > 0) {
        const prevStage = stages[stageIndex - 1]
        const prevSteps = prevStage.steps?.length ?? 0
        setStageIndex(stageIndex - 1)
        setStepIndex(prevSteps > 0 ? prevSteps - 1 : 0)
      }
      return
    }

    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1)
    } else if (stageIndex > 0) {
      const prevStage = stages[stageIndex - 1]
      const prevSteps = prevStage.steps?.length ?? 0
      setStageIndex(stageIndex - 1)
      setStepIndex(prevSteps > 0 ? prevSteps - 1 : 0)
    }
  }

  const handleNext = () => {
    if (!currentStage) return

    if (currentStage.mode === 'practice') {
      if (stageIndex < stages.length - 1) {
        setStageIndex(stageIndex + 1)
      }
      return
    }

    if (gateState && !gateCorrect) {
      return
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1)
    } else if (stageIndex < stages.length - 1) {
      setStageIndex(stageIndex + 1)
    }
  }

  const columnArithmetic = useMemo(() => {
    if (!currentStage?.materialConfig) return null
    return deriveArithmetic(currentStage.materialConfig as GoldenBeadsConfig)
  }, [currentStage?.materialConfig])

  const resolveGate = () => {
    if (!gateState || !columnArithmetic) return
    if (gateInput.trim() !== String(gateState.expectedDigit)) {
      setGateCorrect(false)
      setGateError('Try again — count the beads including any carry above the column.')
      return
    }

    setBoard((prev) => {
      const next = cloneBoard(prev)
      next.columns[gateState.column].result = gateState.expectedDigit
      next.cards.result[gateState.column] = gateState.expectedDigit

      const carryOut = columnArithmetic[gateState.column]?.carryOut ?? 0
      const nextColumn = nextPlaceMap[gateState.column]
      if (nextColumn && carryOut > 0) {
        next.cards.carry[nextColumn] = carryOut
        next.columns[nextColumn].carry = carryOut
      }
      const carryIn = columnArithmetic[gateState.column]?.carryIn ?? 0
      if (carryIn > 0) {
        next.cards.carry[gateState.column] = carryIn
      }

      return next
    })
    setGateCorrect(true)
    setGateError(null)
  }

  const stageLabel = currentStage
    ? `${stageDescriptors[currentStage.mode]} ${stageIndex + 1}/${stages.length}`
    : 'Lesson overview'

  const prompts = currentStep
    ? currentStep.actions.filter((action) => action.kind === 'prompt').map((action) => action.text)
    : []

  if (isLoading || !script || !currentStage) {
    if (isError) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          Unable to load the lesson script.
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading lesson flow…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Golden Beads Lesson Flow</h2>
        <p className="text-sm text-slate-600">
          Aligned to <strong>Topic 07 · Column Addition (with regroup)</strong> covering skills S032–S033. Follow the
          staged experience: tutorial scaffolding, worked support, and independent practice.
        </p>
      </header>

      <nav className="flex flex-wrap gap-3">
        {stages.map((stage: Stage, index) => {
          const isActive = index === stageIndex
          return (
            <button
              key={stage.id}
              onClick={() => setStageIndex(index)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {stageDescriptors[stage.mode]} · {stage.heading ?? stage.id}
            </button>
          )
        })}
      </nav>

      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[3fr_2fr]">
        <div>
          <GoldenBeadsScene board={board} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stageLabel}</div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{currentStage.heading}</h3>
            {currentStep && (
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Step {stepIndex + 1} of {steps.length}</p>
            )}
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {prompts.length > 0 ? (
                prompts.map((text: string, index) => (
                  <li key={`${index}-${text}`} className="flex gap-2">
                    <span className="text-slate-400">•</span>
                    <span>{text}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">Use the controls to continue.</li>
              )}
            </ul>
          </div>

          {gateState && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-semibold text-amber-800">Your turn: what digit belongs in the {gateState.column} column?</p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={gateInput}
                  onChange={(event) => {
                    setGateInput(event.target.value)
                    setGateCorrect(false)
                  }}
                  className="w-24 rounded-md border border-amber-300 px-2 py-1 text-center text-base font-semibold text-amber-900"
                  placeholder="?"
                />
                <button
                  onClick={resolveGate}
                  className="rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                >
                  Check digit
                </button>
                {gateCorrect && <span className="text-xs font-semibold uppercase text-emerald-600">Correct!</span>}
              </div>
              {!gateCorrect && gateState.hint && (
                <p className="mt-2 text-xs text-amber-700">Hint: {gateState.hint}</p>
              )}
              {gateError && !gateCorrect && (
                <p className="mt-2 text-xs font-medium text-rose-600">{gateError}</p>
              )}
            </div>
          )}

          {currentStage.mode === 'practice' && practiceTemplate && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <PracticePanel template={practiceTemplate} />
            </div>
          )}

          <div className="mt-auto flex justify-between gap-2 text-sm">
            <button
              onClick={handleBack}
              className="rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!!gateState && !gateCorrect}
              className={`rounded-md px-4 py-2 font-semibold transition ${
                gateState && !gateCorrect
                  ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                  : 'bg-slate-900 text-white hover:bg-slate-700'
              }`}
            >
              {stageIndex === stages.length - 1 && currentStage.mode === 'practice' ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </section>

      <footer className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
        <p>
          Scripted with <code>@monte/shared</code> lesson schema. Materials respond to each <code>StepAction</code>, so the
          same configuration can run headless validations or render inside the Studio for authoring workflows.
        </p>
      </footer>
    </div>
  )
}
