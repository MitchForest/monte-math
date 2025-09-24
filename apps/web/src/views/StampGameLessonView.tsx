import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PracticeTemplate, Stage, StepAction } from '@monte/shared'

import { StampGameScene } from '../materials/stamp-game/StampGameScene'
import { GoldenBeadsMultiplicationScene } from '../materials/golden-beads-multiplication/GoldenBeadsMultiplicationScene'
import {
  applyStampGameAction,
  cloneBoard,
  createBoardForConfig,
  createBoardFromConfig,
  createEmptyBoard,
  lowToHighPlaces,
  splitDigits,
} from '../materials/stamp-game/state'
import type { PlaceValue, StampGameBoard, StampGameConfig } from '../materials/stamp-game/types'
import { apiClient } from '@/lib/orpc-client'

const stageDescriptors: Record<Stage['mode'], string> = {
  tutorial: 'Tutorial',
  worked: 'Worked Example',
  practice: 'Practice',
}

const nextPlaceMap: Partial<Record<PlaceValue, PlaceValue>> = {
  ones: 'tens',
  tens: 'hundreds',
  hundreds: 'thousands',
}

interface GateState {
  column: PlaceValue
  expectedDigit: number
  hint?: string
}

type PracticeProblem = { a: number; b: number; focus: string }

const isStampGameConfig = (config: unknown): config is StampGameConfig => {
  if (!config || typeof config !== 'object') return false
  return 'multiplicand' in config && 'multiplier' in config
}

function computeBoardFor(stage: Stage, uptoStep: number): StampGameBoard {
  const config = isStampGameConfig(stage.materialConfig) ? stage.materialConfig : undefined
  let board = config ? createBoardForConfig(config) : createEmptyBoard()

  if (!stage.steps || uptoStep < 0) {
    return board
  }

  for (let i = 0; i <= uptoStep && i < stage.steps.length; i += 1) {
    const step = stage.steps[i]
    for (const action of step.actions) {
      if (action.kind === 'gate-do') continue
      board = applyStampGameAction(board, action)
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
    hint: action.hint,
  }
}

interface ColumnArithmetic {
  result: number
  carryOut: number
  carryIn: number
}

function deriveMultiplication(config: StampGameConfig) {
  const digits = splitDigits(config.multiplicand)
  const multiplier = Math.abs(config.multiplier)
  let carry = 0
  const perPlace: Record<PlaceValue, ColumnArithmetic> = {
    ones: { result: 0, carryOut: 0, carryIn: 0 },
    tens: { result: 0, carryOut: 0, carryIn: 0 },
    hundreds: { result: 0, carryOut: 0, carryIn: 0 },
    thousands: { result: 0, carryOut: 0, carryIn: 0 },
  }

  lowToHighPlaces.forEach((place) => {
    const partial = digits[place] * multiplier + carry
    const result = partial % 10
    const carryOut = Math.floor(partial / 10)
    perPlace[place] = { result, carryOut, carryIn: carry }
    carry = carryOut
  })

  return perPlace
}

function PracticePanel({ template }: { template: PracticeTemplate }) {
  const problems = (template.inputs as { problems?: PracticeProblem[] }).problems ?? []
  const [responses, setResponses] = useState(() =>
    problems.map(() => ({ value: '', correct: null as null | boolean }))
  )

  useEffect(() => {
    setResponses(problems.map(() => ({ value: '', correct: null })))
  }, [template, problems])

  const checkAnswers = () => {
    setResponses((prev) =>
      prev.map((response, index) => {
        const problem = problems[index]
        const expected = problem.a * problem.b
        const numeric = Number(response.value)
        return {
          value: response.value,
          correct: !Number.isNaN(numeric) && numeric === expected,
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
                <span>{problem.focus.includes('pen') ? 'Pen & paper' : 'Material supported'}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-3 text-lg font-semibold text-slate-800">
                <span>{problem.a.toLocaleString()}</span>
                <span className="text-slate-400">×</span>
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

interface ColumnMultiplicationLessonViewProps {
  lessonId: string
  title: string
  description: string
  badge: string
  Scene: React.ComponentType<{ board: StampGameBoard }>
}

function ColumnMultiplicationLessonView({
  lessonId,
  title,
  description,
  badge,
  Scene,
}: ColumnMultiplicationLessonViewProps) {
  const {
    data: script,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['lessons', lessonId, 'script'],
    queryFn: () => apiClient.lessons.getScript({ lessonId }),
  })

  const stages = script?.stages ?? []
  const [stageIndex, setStageIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [board, setBoard] = useState<StampGameBoard>(() => createEmptyBoard())
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
    if (!currentStage || currentStage.mode !== 'practice' || !currentStage.practiceTemplateId)
      return null
    return (
      script?.practiceTemplates?.find(
        (template) => template.id === currentStage.practiceTemplateId
      ) ?? null
    )
  }, [currentStage, script?.practiceTemplates])

  useEffect(() => {
    setStepIndex(0)
  }, [stageIndex])

  useEffect(() => {
    if (!currentStage) return

    if (currentStage.mode === 'practice') {
      setBoard(
        currentStage.materialConfig && isStampGameConfig(currentStage.materialConfig)
          ? createBoardFromConfig(currentStage.materialConfig)
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
    if (!currentStage?.materialConfig || !isStampGameConfig(currentStage.materialConfig))
      return null
    return deriveMultiplication(currentStage.materialConfig)
  }, [currentStage?.materialConfig])

  const resolveGate = () => {
    if (!gateState || !columnArithmetic) return
    if (gateInput.trim() !== String(gateState.expectedDigit)) {
      setGateCorrect(false)
      setGateError('Try again — count the pieces including any carry above the column.')
      return
    }

    const { column } = gateState
    const arithmetic = columnArithmetic[column]

    setBoard((prev) => {
      const next = cloneBoard(prev)
      next.columns[column].result = gateState.expectedDigit
      next.paper.result[column] = gateState.expectedDigit

      const nextColumn = nextPlaceMap[column]
      if (nextColumn) {
        if (arithmetic.carryOut > 0) {
          next.paper.carry[nextColumn] = arithmetic.carryOut
          next.columns[nextColumn].carry = arithmetic.carryOut
        } else {
          next.paper.carry[nextColumn] = null
          next.columns[nextColumn].carry = 0
        }
      }

      if (arithmetic.carryIn > 0) {
        next.paper.carry[column] = arithmetic.carryIn
      } else {
        next.paper.carry[column] = null
      }

      return next
    })
    setGateCorrect(true)
    setGateError(null)
  }

  const stageLabel = currentStage
    ? `${stageDescriptors[currentStage.mode]} ${stageIndex + 1}/${stages.length}`
    : 'Lesson overview'

  const topicLabel = useMemo(() => {
    const topicId = script?.topicId
    if (!topicId) return 'Lesson Topic'
    const readable = topicId.replace(/^topic-/, '').replace(/-/g, ' ')
    return readable.replace(/\b\w/g, (ch) => ch.toUpperCase())
  }, [script?.topicId])

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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">{topicLabel}</p>
        </div>
        <span className="inline-flex rounded-full bg-slate-900/5 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {badge}
        </span>
      </header>

      <nav className="flex flex-wrap gap-3">
        {stages.map((stage: Stage, index) => {
          const isActive = index === stageIndex
          return (
            <button
              key={stage.id}
              onClick={() => setStageIndex(index)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {stageDescriptors[stage.mode]} · {stage.heading ?? stage.id}
            </button>
          )
        })}
      </nav>

      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[3fr_2fr]">
        <div>
          <Scene board={board} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {stageLabel}
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{currentStage.heading}</h3>
            {currentStep && (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {prompts.map((prompt) => (
                  <p key={prompt}>{prompt}</p>
                ))}
              </div>
            )}
          </div>

          {gateState ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Check your digit
              </div>
              <p className="mt-2 text-sm text-emerald-900">
                Enter the digit for the {gateState.column} place.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  value={gateInput}
                  onChange={(event) => {
                    setGateInput(event.target.value)
                    setGateCorrect(false)
                    setGateError(null)
                  }}
                  type="number"
                  className="w-24 rounded-md border border-emerald-300 px-2 py-1 text-center text-lg font-semibold text-emerald-900"
                />
                <button
                  onClick={resolveGate}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Check digit
                </button>
              </div>
              {gateCorrect ? (
                <p className="mt-2 text-sm font-medium text-emerald-800">Great! Digit locked in.</p>
              ) : null}
              {gateError ? <p className="mt-2 text-sm text-emerald-900/80">{gateError}</p> : null}
              {gateState.hint ? (
                <p className="mt-2 text-xs text-emerald-900/70">Hint: {gateState.hint}</p>
              ) : null}
            </div>
          ) : null}

          {currentStage.mode === 'practice' && practiceTemplate ? (
            <PracticePanel template={practiceTemplate} />
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export function StampGameLessonView(props: { lessonId: string }) {
  return (
    <ColumnMultiplicationLessonView
      lessonId={props.lessonId}
      title="Stamp Game Multiplication Lesson"
      description="Follow the staged experience to connect stamp tiles with the written algorithm for single-digit multiplication."
      badge="Stamp Game"
      Scene={StampGameScene}
    />
  )
}

export function GoldenBeadsMultiplicationLessonView(props: { lessonId: string }) {
  return (
    <ColumnMultiplicationLessonView
      lessonId={props.lessonId}
      title="Golden Beads Multiplication Lesson"
      description="Use bead material to bridge concrete grouping with the column multiplication algorithm."
      badge="Golden Beads"
      Scene={GoldenBeadsMultiplicationScene}
    />
  )
}
