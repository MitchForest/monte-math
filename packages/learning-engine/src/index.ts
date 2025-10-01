// Learning engine logic (mastery models, spaced repetition) will live here.
// Expose pure functions so APIs and background jobs can reuse them.

export interface MasteryEstimate {
  skillId: string
  probability: number
  updatedAt: Date
}

export const placeholderLearningEngine = {
  describe(): string {
    return 'Learning engine core not implemented yet.'
  },
}
