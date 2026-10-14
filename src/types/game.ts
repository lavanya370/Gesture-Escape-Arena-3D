export interface PortalsCompletionState {
  portal1: boolean // Portal 1: Riddle Realm
  portal2: boolean // Portal 2: Magic Coin Catcher
  portal3: boolean // Portal 3: Guardian's Funny Trap
  portal4: boolean // Final Portal: Boss Escape
}

export type GameView =
  | 'start'
  | 'hub'
  | 'riddle-realm'
  | 'coin-catcher'
  | 'number-gate'
  | 'funny-trap'
  | 'boss-escape'

export interface PortalConfig {
  id: 'portal1' | 'portal2' | 'portal3' | 'portal4'
  portalNumber: number
  title: string
  subtitle: string
  tag: string
  description: string
  reward: string
  color: string
  glowColor: string
  runeLetter: string
  theme: 'purple' | 'gold' | 'emerald' | 'ruby'
}

export const PORTALS_DATA: PortalConfig[] = [
  {
    id: 'portal1',
    portalNumber: 1,
    title: 'Riddle Realm',
    subtitle: 'The Arcane Enigma Vault',
    tag: 'THE CENTRAL MYSTERY RIDDLE',
    description: 'Investigate the ancient mystery! Read the riddle, analyze discovered hints, and solve the enigma with hand pinch or clicks.',
    reward: 'Victory Fanfare & Relic Freedom',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    runeLetter: 'ᚦ',
    theme: 'purple',
  },
  {
    id: 'portal2',
    portalNumber: 2,
    title: 'Magic Coin Catcher',
    subtitle: 'The Gilded Sky Cascades',
    tag: 'UNLOCKS HINT 1 (100 PTS IN 15S)',
    description: 'Catch falling gold coins & diamonds with your hand! Score 100 PTS in 15 seconds to unseal Hint 1.',
    reward: 'Hint 1 Unlocked & Arcade Points',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    runeLetter: 'ᚱ',
    theme: 'gold',
  },
  {
    id: 'portal3',
    portalNumber: 3,
    title: 'Number Gate Challenge',
    subtitle: 'Mathematical Obstacle Course',
    tag: 'UNLOCKS HINT 2 (3 GATES IN 15S)',
    description: 'Steer the blue stickman through 3 correct math gates (+, -, ×) in 15 seconds using gestures or clicks to unseal Hint 2.',
    reward: 'Hint 2 Unlocked & Number Master',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.55)',
    runeLetter: 'ᛉ',
    theme: 'emerald',
  },
  {
    id: 'portal4',
    portalNumber: 4,
    title: "Guardian's Funny Trap",
    subtitle: 'The Chaos Trial Grounds',
    tag: 'UNLOCKS HINT 3 (SURVIVE 15S)',
    description: 'Dodge wacky flying tomatoes, rolling cartoon bombs, and silly chickens for 15 seconds to unseal Hint 3.',
    reward: 'Hint 3 Unlocked & Trap Conquered',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.55)',
    runeLetter: 'ᛟ',
    theme: 'ruby',
  },
]

const HIGH_SCORE_KEY = 'gesture_escape_arena_high_score'

export function getStoredHighScore(): number {
  try {
    const val = localStorage.getItem(HIGH_SCORE_KEY)
    return val ? parseInt(val, 10) || 0 : 0
  } catch {
    return 0
  }
}

export function saveStoredHighScore(score: number): void {
  try {
    const current = getStoredHighScore()
    if (score > current) {
      localStorage.setItem(HIGH_SCORE_KEY, score.toString())
    }
  } catch {
    // Ignore storage issues in private browsing
  }
}
