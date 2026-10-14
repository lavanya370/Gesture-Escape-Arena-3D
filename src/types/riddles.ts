export type DareType = 'robot' | 'frog' | 'wizard' | 'chicken' | 'dance'

export interface RiddleOption {
  letter: 'A' | 'B' | 'C' | 'D'
  text: string
  symbol: string
}

export interface GuardianDare {
  dareType: DareType
  guardianName: string
  guardianTitle: string
  avatarEmoji: string
  reactionDialogue: string
  dareTitle: string
  dareDescription: string
  characterCaption: string
}

export interface RiddleQuestion {
  id: string
  riddleNumber: number
  categoryBadge: string
  riddleTitle: string
  question: string
  options: RiddleOption[]
  correctIndex: number // 0 = A, 1 = B, 2 = C, 3 = D
  hint: string
  successMessage: string
  funFact: string
  points: number
  guardianDare: GuardianDare
  actionDare?: ActionDare
}

export interface ActionDare {
  id: string
  riddleId: string
  title: string
  actionPrompt: string
  themeEmoji: string
  category: string
  durationSeconds: number
  cheerMessage: string
  badgeText: string
  characterAnimation?: DareType | 'hero' | 'freeze' | 'guitar' | 'penguin' | 'drums'
}

export type HandActionType =
  | 'thumbs_up'
  | 'raise_hands'
  | 'clap_hands'
  | 'wave_hands'
  | 'open_palms'
  | 'peace_sign'
  | 'point_finger'
  | 'wiggle_fingers'

export interface FunDare {
  id: string
  riddleId: string
  riddleNumber: number
  title: string
  instruction: string
  icon: string
  hint: string
  actionType: HandActionType
  durationSeconds?: number
}
