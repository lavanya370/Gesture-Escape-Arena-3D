import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  RIDDLES_POOL,
  getNextSessionRiddle,
  type RiddleItem,
} from '../data/riddlesPool'

export type GameView =
  | 'start'
  | 'hub'
  | 'riddle-realm'
  | 'coin-catcher'
  | 'number-gate'
  | 'funny-trap'
  | 'boss-escape'

export interface HintItem {
  unlocked: boolean
  claimed: boolean
  text: string
  title: string
  sourceMiniGame: string
  requirement: string
}

export interface HintsState {
  hint1: HintItem
  hint2: HintItem
  hint3: HintItem
}

export type RiddleData = RiddleItem

function getHintsForRiddle(
  riddle: RiddleItem,
  savedHints?: Partial<HintsState>
): HintsState {
  return {
    hint1: {
      unlocked: Boolean(savedHints?.hint1?.unlocked),
      claimed: Boolean(savedHints?.hint1?.claimed),
      text: riddle.hints.hint1.text,
      title: riddle.hints.hint1.title,
      sourceMiniGame: riddle.hints.hint1.sourceMiniGame,
      requirement: riddle.hints.hint1.requirement,
    },
    hint2: {
      unlocked: Boolean(savedHints?.hint2?.unlocked),
      claimed: Boolean(savedHints?.hint2?.claimed),
      text: riddle.hints.hint2.text,
      title: riddle.hints.hint2.title,
      sourceMiniGame: riddle.hints.hint2.sourceMiniGame,
      requirement: riddle.hints.hint2.requirement,
    },
    hint3: {
      unlocked: Boolean(savedHints?.hint3?.unlocked),
      claimed: Boolean(savedHints?.hint3?.claimed),
      text: riddle.hints.hint3.text,
      title: riddle.hints.hint3.title,
      sourceMiniGame: riddle.hints.hint3.sourceMiniGame,
      requirement: riddle.hints.hint3.requirement,
    },
  }
}

interface SavedGameState {
  riddleId: string
  hints: HintsState
  isQuestionRevealed: boolean
  isOptionsRevealed: boolean
  isCompleted: boolean
  attemptsCount: number
  totalScore: number
  highScore: number
  coinCatcherHighScore: number
  numberGatePassed: boolean
  funnyTrapSurvived: boolean
  daresCompleted: Record<string, boolean>
  completedRiddleIds: string[]
}

const STORAGE_KEY = 'gesture_escape_arena_save_v8'

function loadSavedState(): SavedGameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as Partial<SavedGameState>
      // Verify stored riddle exists in active pool
      let matchedRiddle = RIDDLES_POOL.find((r) => r.id === data.riddleId)
      if (!matchedRiddle) {
        matchedRiddle = RIDDLES_POOL.find((r) => r.id === 'riddle-mirror') || RIDDLES_POOL[0]
      }

      const scoreNum = Number(data.coinCatcherHighScore) || 0
      return {
        riddleId: matchedRiddle.id,
        hints: getHintsForRiddle(matchedRiddle, data.hints),
        isQuestionRevealed: true, // Always revealed directly when player enters riddle screen
        isOptionsRevealed: false, // Answer options start locked until Coin Catcher 200 pts
        isCompleted: false, // Fresh game starts with mystery unsolved
        attemptsCount: Number(data.attemptsCount) || 0,
        totalScore: Number(data.totalScore) || 0,
        highScore: Number(data.highScore) || 0,
        coinCatcherHighScore: scoreNum,
        numberGatePassed: Boolean(data.numberGatePassed),
        funnyTrapSurvived: Boolean(data.funnyTrapSurvived),
        daresCompleted: data.daresCompleted || {},
        completedRiddleIds: Array.isArray(data.completedRiddleIds) ? data.completedRiddleIds : [],
      }
    }
  } catch (e) {
    console.warn('Failed to load saved state from localStorage:', e)
  }

  const initialRiddle = RIDDLES_POOL.find((r) => r.id === 'riddle-mirror') || RIDDLES_POOL[0]
  return {
    riddleId: initialRiddle.id,
    hints: getHintsForRiddle(initialRiddle),
    isQuestionRevealed: true, // Always revealed directly
    isOptionsRevealed: false,
    isCompleted: false,
    attemptsCount: 0,
    totalScore: 0,
    highScore: 0,
    coinCatcherHighScore: 0,
    numberGatePassed: false,
    funnyTrapSurvived: false,
    daresCompleted: {},
    completedRiddleIds: [],
  }
}

function persistState(state: SavedGameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e)
  }
}

interface GameContextValue {
  currentView: GameView
  setCurrentView: (view: GameView) => void
  riddle: RiddleItem
  hints: HintsState
  isQuestionRevealed: boolean
  revealQuestion: () => void
  isOptionsRevealed: boolean
  revealOptions: () => void
  unlockHint: (hintKey: keyof HintsState) => void
  claimHint: (hintKey: keyof HintsState) => void
  submitAnswer: (answer: string) => { isCorrect: boolean }
  isCompleted: boolean
  attemptsCount: number
  totalScore: number
  highScore: number
  coinCatcherHighScore: number
  numberGatePassed: boolean
  funnyTrapSurvived: boolean
  recordCoinScore: (score: number) => void
  completeNumberGate: () => void
  completeFunnyTrap: () => void
  resetGameProgress: () => void
  startNewRiddleSession: () => void
  startNewGameSession: () => void
  returnToStartMenu: () => void
  getClaimedHintsCount: () => number
  daresCompleted: Record<string, boolean>
  completedRiddleIds: string[]
  recordDareCompleted: (riddleId: string) => void
  isDareCompleted: (riddleId: string) => boolean
}

const GameContext = createContext<GameContextValue | null>(null)

export const useGame = (): GameContextValue => {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return ctx
}

interface GameProviderProps {
  children: ReactNode
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState<GameView>('start')
  const [savedData, setSavedData] = useState<SavedGameState>(() => loadSavedState())

  // Look up current riddle from pool
  const currentRiddle =
    RIDDLES_POOL.find((r) => r.id === savedData.riddleId) || RIDDLES_POOL[0]

  // Sync to localStorage whenever savedData changes
  useEffect(() => {
    persistState(savedData)
  }, [savedData])

  const unlockHint = useCallback((hintKey: keyof HintsState) => {
    setSavedData((prev) => {
      if (prev.hints[hintKey].unlocked) return prev
      const nextHints = {
        ...prev.hints,
        [hintKey]: {
          ...prev.hints[hintKey],
          unlocked: true,
        },
      }
      return {
        ...prev,
        hints: nextHints,
      }
    })
  }, [])

  const claimHint = useCallback((hintKey: keyof HintsState) => {
    setSavedData((prev) => {
      const nextHints = {
        ...prev.hints,
        [hintKey]: {
          ...prev.hints[hintKey],
          unlocked: true,
          claimed: true,
        },
      }
      return {
        ...prev,
        hints: nextHints,
      }
    })
  }, [])

  const revealOptions = useCallback(() => {
    setSavedData((prev) => ({
      ...prev,
      isOptionsRevealed: true,
    }))
  }, [])

  const revealQuestion = useCallback(() => {
    setSavedData((prev) => ({
      ...prev,
      isQuestionRevealed: true,
    }))
  }, [])

  const submitAnswer = useCallback(
    (answer: string): { isCorrect: boolean } => {
      const cleanAnswer = answer.trim().toUpperCase()
      const target = currentRiddle.correctAnswer.toUpperCase()
      const isCorrect =
        cleanAnswer === target ||
        cleanAnswer.endsWith(target) ||
        cleanAnswer.includes(target) ||
        (target === 'MIRROR' && (cleanAnswer === 'B' || cleanAnswer === 'B. MIRROR' || cleanAnswer === 'OPTION B'))

      setSavedData((prev) => {
        const nextAttempts = prev.attemptsCount + 1
        const pointsAwarded = isCorrect && !prev.isCompleted ? 500 : 0
        const nextScore = prev.totalScore + pointsAwarded
        const nextHighScore = Math.max(prev.highScore, nextScore)

        let updatedCompleted = prev.completedRiddleIds || []
        if (isCorrect && !updatedCompleted.includes(currentRiddle.id)) {
          updatedCompleted = [...updatedCompleted, currentRiddle.id]
          // If all pool riddles completed, recycle pool
          if (updatedCompleted.length >= RIDDLES_POOL.length) {
            updatedCompleted = []
          }
        }

        return {
          ...prev,
          attemptsCount: nextAttempts,
          isCompleted: isCorrect ? true : prev.isCompleted,
          totalScore: nextScore,
          highScore: nextHighScore,
          completedRiddleIds: updatedCompleted,
        }
      })

      return { isCorrect }
    },
    [currentRiddle.id, currentRiddle.correctAnswer]
  )

  const recordCoinScore = useCallback((score: number) => {
    setSavedData((prev) => {
      const nextHighScore = Math.max(prev.coinCatcherHighScore, score)
      const shouldUnlock = score >= 100 || prev.hints.hint1.unlocked
      const optionsUnlocked = score >= 200 || prev.isOptionsRevealed
      return {
        ...prev,
        coinCatcherHighScore: nextHighScore,
        isQuestionRevealed: true,
        isOptionsRevealed: optionsUnlocked,
        hints: {
          ...prev.hints,
          hint1: {
            ...prev.hints.hint1,
            unlocked: shouldUnlock,
          },
        },
      }
    })
  }, [])

  const completeNumberGate = useCallback(() => {
    setSavedData((prev) => ({
      ...prev,
      numberGatePassed: true,
      hints: {
        ...prev.hints,
        hint2: {
          ...prev.hints.hint2,
          unlocked: true,
        },
      },
    }))
  }, [])

  const completeFunnyTrap = useCallback(() => {
    setSavedData((prev) => ({
      ...prev,
      funnyTrapSurvived: true,
      hints: {
        ...prev.hints,
        hint3: {
          ...prev.hints.hint3,
          unlocked: true,
        },
      },
    }))
  }, [])

  // Start a fresh game session from Start Menu or Reset
  const startNewGameSession = useCallback(() => {
    const nextRiddle = getNextSessionRiddle(
      savedData.completedRiddleIds || [],
      savedData.riddleId
    )
    const fresh: SavedGameState = {
      riddleId: nextRiddle.id,
      hints: getHintsForRiddle(nextRiddle),
      isQuestionRevealed: true, // Riddle question is revealed directly
      isOptionsRevealed: false, // Options start locked until 200 points in Coin Catcher
      isCompleted: false, // Fresh session starts with mystery unsolved
      attemptsCount: 0,
      totalScore: savedData.totalScore,
      highScore: savedData.highScore,
      coinCatcherHighScore: savedData.coinCatcherHighScore,
      numberGatePassed: false,
      funnyTrapSurvived: false,
      daresCompleted: savedData.daresCompleted,
      completedRiddleIds: savedData.completedRiddleIds || [],
    }
    setSavedData(fresh)
    persistState(fresh)
    setCurrentView('riddle-realm')
  }, [savedData, setCurrentView])

  // Safely return to the Start Menu clearing temporary session state
  const returnToStartMenu = useCallback(() => {
    setSavedData((prev) => {
      const updated: SavedGameState = {
        ...prev,
        isCompleted: false, // Clear completed state so previous victory overlay doesn't show
        isOptionsRevealed: false, // Reset locked state for next session
        attemptsCount: 0,
      }
      persistState(updated)
      return updated
    })
    setCurrentView('start')
  }, [setCurrentView])

  // Start a new session with a different random riddle (in-game reload)
  const startNewRiddleSession = useCallback(() => {
    const nextRiddle = getNextSessionRiddle(
      savedData.completedRiddleIds || [],
      savedData.riddleId
    )
    const fresh: SavedGameState = {
      riddleId: nextRiddle.id,
      hints: getHintsForRiddle(nextRiddle),
      isQuestionRevealed: true,
      isOptionsRevealed: false,
      isCompleted: false,
      attemptsCount: 0,
      totalScore: savedData.totalScore,
      highScore: savedData.highScore,
      coinCatcherHighScore: savedData.coinCatcherHighScore,
      numberGatePassed: false,
      funnyTrapSurvived: false,
      daresCompleted: savedData.daresCompleted,
      completedRiddleIds: savedData.completedRiddleIds || [],
    }
    setSavedData(fresh)
    persistState(fresh)
  }, [savedData])

  // Reset progress for the current session (or pick fresh riddle if already completed)
  const resetGameProgress = useCallback(() => {
    const nextRiddle = savedData.isCompleted
      ? getNextSessionRiddle(savedData.completedRiddleIds || [], savedData.riddleId)
      : currentRiddle

    const fresh: SavedGameState = {
      riddleId: nextRiddle.id,
      hints: getHintsForRiddle(nextRiddle),
      isQuestionRevealed: true,
      isOptionsRevealed: false,
      isCompleted: false,
      attemptsCount: 0,
      totalScore: savedData.totalScore,
      highScore: savedData.highScore,
      coinCatcherHighScore: savedData.coinCatcherHighScore,
      numberGatePassed: false,
      funnyTrapSurvived: false,
      daresCompleted: savedData.daresCompleted,
      completedRiddleIds: savedData.completedRiddleIds || [],
    }
    setSavedData(fresh)
    persistState(fresh)
  }, [savedData, currentRiddle])

  const recordDareCompleted = useCallback((riddleId: string) => {
    setSavedData((prev) => {
      const nextDares = {
        ...prev.daresCompleted,
        [riddleId]: true,
      }
      return {
        ...prev,
        daresCompleted: nextDares,
      }
    })
  }, [])

  const isDareCompleted = useCallback(
    (riddleId: string) => {
      return Boolean(savedData.daresCompleted[riddleId])
    },
    [savedData.daresCompleted]
  )

  const getClaimedHintsCount = useCallback(() => {
    let count = 0
    if (savedData.hints.hint1.claimed) count++
    if (savedData.hints.hint2.claimed) count++
    if (savedData.hints.hint3.claimed) count++
    return count
  }, [savedData.hints])

  const contextValue: GameContextValue = {
    currentView,
    setCurrentView,
    riddle: currentRiddle,
    hints: savedData.hints,
    isQuestionRevealed: savedData.isQuestionRevealed,
    revealQuestion,
    isOptionsRevealed: savedData.isOptionsRevealed,
    revealOptions,
    unlockHint,
    claimHint,
    submitAnswer,
    isCompleted: savedData.isCompleted,
    attemptsCount: savedData.attemptsCount,
    totalScore: savedData.totalScore,
    highScore: savedData.highScore,
    coinCatcherHighScore: savedData.coinCatcherHighScore,
    numberGatePassed: savedData.numberGatePassed,
    funnyTrapSurvived: savedData.funnyTrapSurvived,
    recordCoinScore,
    completeNumberGate,
    completeFunnyTrap,
    resetGameProgress,
    startNewRiddleSession,
    startNewGameSession,
    returnToStartMenu,
    getClaimedHintsCount,
    daresCompleted: savedData.daresCompleted,
    completedRiddleIds: savedData.completedRiddleIds || [],
    recordDareCompleted,
    isDareCompleted,
  }

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
}
