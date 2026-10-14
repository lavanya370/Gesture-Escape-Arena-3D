import type { FunDare } from '../types/riddles'
export type { FunDare }


/**
 * Predefined, unique fun action dares assigned to each existing riddle.
 *
 * Requirements:
 * - Simple English immediately understandable by Class 12 students.
 * - Clear visual icon (emoji) and animation for each dare.
 * - No dance activities or dance-related text.
 * - Each riddle has its own unique, deterministic dare.
 * - Timed dares have a clear countdown (e.g., 5 seconds or 3 seconds).
 */
export const FUN_DARES_BY_RIDDLE_ID: Record<string, FunDare> = {
  // Riddle 1: The Enchanted Reflection (MIRROR)
  'riddle-mirror': {
    id: 'fun-dare-1',
    riddleId: 'riddle-mirror',
    riddleNumber: 1,
    title: 'Fun Dare #1',
    instruction: 'Clap your hands in front of the camera!',
    icon: '👏',
    hint: 'Bring both hands together in front of the webcam!',
    actionType: 'clap_hands',
    durationSeconds: 0,
  },

  // Riddle 2: The Silent Intruder (SHADOW)
  'riddle-shadow': {
    id: 'fun-dare-2',
    riddleId: 'riddle-shadow',
    riddleNumber: 2,
    title: 'Fun Dare #2',
    instruction: 'Raise both hands high in the air!',
    icon: '🙌',
    hint: 'Hold both hands up in view of the webcam!',
    actionType: 'raise_hands',
    durationSeconds: 0,
  },

  // Riddle 3: The Forbidden Vault (KEY)
  'riddle-key': {
    id: 'fun-dare-3',
    riddleId: 'riddle-key',
    riddleNumber: 3,
    title: 'Fun Dare #3',
    instruction: 'Give a big thumbs-up to the camera!',
    icon: '👍',
    hint: 'Show a clear, proud thumbs-up to the webcam!',
    actionType: 'thumbs_up',
    durationSeconds: 0,
  },

  // Riddle 4: The Smirking Apparition (MIRROR Alt)
  'riddle-mirror-smirking': {
    id: 'fun-dare-4',
    riddleId: 'riddle-mirror-smirking',
    riddleNumber: 4,
    title: 'Fun Dare #4',
    instruction: 'Wave your hand side-to-side at the camera!',
    icon: '👋',
    hint: 'Wave your hand back and forth like saying hello!',
    actionType: 'wave_hands',
    durationSeconds: 0,
  },

  // Riddle 5: The Weeping Monk (CANDLE)
  'riddle-candle': {
    id: 'fun-dare-5',
    riddleId: 'riddle-candle',
    riddleNumber: 5,
    title: 'Fun Dare #5',
    instruction: 'Hold up an open palm to the screen!',
    icon: '✋',
    hint: 'Hold your open palm facing the webcam!',
    actionType: 'open_palms',
    durationSeconds: 0,
  },

  // Riddle 6: The Muddy Trail (FOOTSTEPS)
  'riddle-footsteps': {
    id: 'fun-dare-6',
    riddleId: 'riddle-footsteps',
    riddleNumber: 6,
    title: 'Fun Dare #6',
    instruction: 'Give a big thumbs-up to the camera!',
    icon: '👍',
    hint: 'Show a clear thumbs-up to the camera!',
    actionType: 'thumbs_up',
    durationSeconds: 0,
  },

  // Riddle 7: The Crypt’s Mocking Whisper (ECHO)
  'riddle-echo': {
    id: 'fun-dare-7',
    riddleId: 'riddle-echo',
    riddleNumber: 7,
    title: 'Fun Dare #7',
    instruction: 'Raise both hands high in the air!',
    icon: '🙌',
    hint: 'Raise both hands up high in view of the webcam!',
    actionType: 'raise_hands',
    durationSeconds: 0,
  },

  // Riddle 8: The Silent Witness (BOOK)
  'riddle-book': {
    id: 'fun-dare-8',
    riddleId: 'riddle-book',
    riddleNumber: 8,
    title: 'Fun Dare #8',
    instruction: 'Wiggle your fingers at the camera!',
    icon: '🖐️',
    hint: 'Wiggle all your fingers in front of the screen!',
    actionType: 'wiggle_fingers',
    durationSeconds: 0,
  },

  // Riddle 9: The Iron Sentry (LOCK)
  'riddle-lock': {
    id: 'fun-dare-9',
    riddleId: 'riddle-lock',
    riddleNumber: 9,
    title: 'Fun Dare #9',
    instruction: 'Show a peace sign with your fingers!',
    icon: '✌️',
    hint: 'Hold up two fingers in a V victory sign!',
    actionType: 'peace_sign',
    durationSeconds: 0,
  },

  // Riddle 10: The Castaway’s Message (BOTTLE)
  'riddle-bottle': {
    id: 'fun-dare-10',
    riddleId: 'riddle-bottle',
    riddleNumber: 10,
    title: 'Fun Dare #10',
    instruction: 'Bring both hands together in front of the camera!',
    icon: '🤲',
    hint: 'Bring both hands together in front of the webcam!',
    actionType: 'clap_hands',
    durationSeconds: 0,
  },

  // Riddle 11: The Transparent Wall (WINDOW)
  'riddle-window': {
    id: 'fun-dare-11',
    riddleId: 'riddle-window',
    riddleNumber: 11,
    title: 'Fun Dare #11',
    instruction: 'Wave your hand side-to-side at the camera!',
    icon: '👋',
    hint: 'Wave your hand side to side at the webcam!',
    actionType: 'wave_hands',
    durationSeconds: 0,
  },

  // Riddle 12: The Weaver’s Snare (SPIDERWEB)
  'riddle-spiderweb': {
    id: 'fun-dare-12',
    riddleId: 'riddle-spiderweb',
    riddleNumber: 12,
    title: 'Fun Dare #12',
    instruction: 'Spread all fingers wide on an open palm!',
    icon: '🖐️',
    hint: 'Spread all five fingers wide toward the webcam!',
    actionType: 'open_palms',
    durationSeconds: 0,
  },

  // Riddle 13: The Belfry’s Gong (BELL)
  'riddle-bell': {
    id: 'fun-dare-13',
    riddleId: 'riddle-bell',
    riddleNumber: 13,
    title: 'Fun Dare #13',
    instruction: 'Give a big thumbs-up to the camera!',
    icon: '👍',
    hint: 'Flash a clear thumbs-up right at the webcam!',
    actionType: 'thumbs_up',
    durationSeconds: 0,
  },

  // Riddle 14: The Hungry Beast (FIRE)
  'riddle-fire': {
    id: 'fun-dare-14',
    riddleId: 'riddle-fire',
    riddleNumber: 14,
    title: 'Fun Dare #14',
    instruction: 'Bring both hands together in front of the camera!',
    icon: '👏',
    hint: 'Put both hands together in front of the webcam!',
    actionType: 'clap_hands',
    durationSeconds: 0,
  },

  // Riddle 15: The Master Thief’s Disguise (GLOVE)
  'riddle-glove': {
    id: 'fun-dare-15',
    riddleId: 'riddle-glove',
    riddleNumber: 15,
    title: 'Fun Dare #15',
    instruction: 'Hold up an open palm facing the screen!',
    icon: '✋',
    hint: 'Hold your palm forward toward the camera!',
    actionType: 'open_palms',
    durationSeconds: 0,
  },

  // Riddle 16: The Pirate’s Codex (MAP)
  'riddle-map': {
    id: 'fun-dare-16',
    riddleId: 'riddle-map',
    riddleNumber: 16,
    title: 'Fun Dare #16',
    instruction: 'Point your index finger forward at the camera!',
    icon: '👉',
    hint: 'Point your index finger straight at the webcam!',
    actionType: 'point_finger',
    durationSeconds: 0,
  },

  // Riddle 17: The Ghost Ship’s Needle (COMPASS)
  'riddle-compass': {
    id: 'fun-dare-17',
    riddleId: 'riddle-compass',
    riddleNumber: 17,
    title: 'Fun Dare #17',
    instruction: 'Show a peace sign with your fingers!',
    icon: '✌️',
    hint: 'Hold up two fingers in a V sign to the camera!',
    actionType: 'peace_sign',
    durationSeconds: 0,
  },

  // Riddle 18: The Secret Passageway (STAIRS)
  'riddle-stairs': {
    id: 'fun-dare-18',
    riddleId: 'riddle-stairs',
    riddleNumber: 18,
    title: 'Fun Dare #18',
    instruction: 'Wiggle your fingers at the camera!',
    icon: '🖐️',
    hint: 'Wiggle your fingers in front of the webcam!',
    actionType: 'wiggle_fingers',
    durationSeconds: 0,
  },

  // Riddle 19: The Two-Faced Token (COIN)
  'riddle-coin': {
    id: 'fun-dare-19',
    riddleId: 'riddle-coin',
    riddleNumber: 19,
    title: 'Fun Dare #19',
    instruction: 'Give a big thumbs-up to the camera!',
    icon: '👍',
    hint: 'Show a clear, proud thumbs-up to the webcam!',
    actionType: 'thumbs_up',
    durationSeconds: 0,
  },
}

export const FUN_DARES_LIST: FunDare[] = Object.values(FUN_DARES_BY_RIDDLE_ID)

/**
 * Returns the specific predefined Fun Dare assigned to a given riddle ID.
 * Falls back deterministically if an unknown riddle ID is provided.
 */
export function getFunDareForRiddle(riddleId: string): FunDare {
  if (FUN_DARES_BY_RIDDLE_ID[riddleId]) {
    return FUN_DARES_BY_RIDDLE_ID[riddleId]
  }

  // Deterministic fallback based on hashing or list position
  let hash = 0
  for (let i = 0; i < riddleId.length; i++) {
    hash = (hash << 5) - hash + riddleId.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % FUN_DARES_LIST.length
  return {
    ...FUN_DARES_LIST[index],
    riddleId,
  }
}
