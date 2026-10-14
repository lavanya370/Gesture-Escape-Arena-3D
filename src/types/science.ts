export type ScienceSubject = 'Physics' | 'Chemistry' | 'Biology' | 'Modern Science'

export interface AnswerOption {
  letter: 'A' | 'B' | 'C' | 'D'
  text: string
  symbol: string
}

export interface GuardianDare {
  guardianName: string
  guardianTitle: string
  avatarEmoji: string
  reactionDialogue: string
  dareTitle: string
  dareDescription: string
}

export interface ScienceQuestion {
  id: string
  questionNumber: number
  subject: ScienceSubject
  subjectBadge: string
  topic: string
  question: string
  options: AnswerOption[]
  correctIndex: number // 0 = A, 1 = B, 2 = C, 3 = D
  hint: string
  explanation: string
  points: number
  guardianDare: GuardianDare
}
