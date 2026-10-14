export type ScienceCategory = 'Physics' | 'Chemistry' | 'Biology' | 'Modern Science'
export type MysteryDifficulty = 'Class 11' | 'Class 12' | 'Expo Special'

export interface ScienceMystery {
  id: string
  title: string
  category: ScienceCategory
  difficulty: MysteryDifficulty
  story: string
  riddle: string
  options: string[]
  correctIndex: number
  hint1: string // Unlocked via Portal 2 (Coin Catcher score >= 200)
  hint2: string // Unlocked via Portal 3 (Funny Trap survival)
  finalClue: string // Unlocked via Portal 4 (Boss Escape victory)
  scientificExplanation: string
  interestingFact: string
  formulaOrConcept: string
}

export interface MysteryProgressState {
  currentMysteryId: string
  hint1Unlocked: boolean
  hint2Unlocked: boolean
  finalClueUnlocked: boolean
  isSolved: boolean
  solvedMethod: 'independent' | 'revealed' | null
  attemptsCount: number
  solvedMysteryIds: string[]
}

const MYSTERY_STORAGE_KEY = 'gesture_escape_arena_science_mystery_progress'

export function getStoredMysteryProgress(defaultId: string): MysteryProgressState {
  try {
    const raw = localStorage.getItem(MYSTERY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MysteryProgressState>
      return {
        currentMysteryId: parsed.currentMysteryId || defaultId,
        hint1Unlocked: Boolean(parsed.hint1Unlocked),
        hint2Unlocked: Boolean(parsed.hint2Unlocked),
        finalClueUnlocked: Boolean(parsed.finalClueUnlocked),
        isSolved: Boolean(parsed.isSolved),
        solvedMethod: parsed.solvedMethod || null,
        attemptsCount: parsed.attemptsCount || 0,
        solvedMysteryIds: Array.isArray(parsed.solvedMysteryIds) ? parsed.solvedMysteryIds : [],
      }
    }
  } catch {
    // Fallback if localStorage unavailable
  }

  return {
    currentMysteryId: defaultId,
    hint1Unlocked: false,
    hint2Unlocked: false,
    finalClueUnlocked: false,
    isSolved: false,
    solvedMethod: null,
    attemptsCount: 0,
    solvedMysteryIds: [],
  }
}

export function saveStoredMysteryProgress(state: MysteryProgressState): void {
  try {
    localStorage.setItem(MYSTERY_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors in private browsing
  }
}
