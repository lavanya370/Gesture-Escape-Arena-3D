import type { ActionDare } from '../types/riddles'

/**
 * Unique, physical action-based dares specifically designed for Class 12 students
 * at a school/college science exhibition.
 *
 * Rules:
 * - Safe, non-embarrassing, enjoyable, no equipment needed.
 * - Suitable for teenagers in a classroom or exhibition space.
 * - Each existing riddle has its own distinct action dare and theme.
 */
export const ACTION_DARES_BY_RIDDLE_ID: Record<string, ActionDare> = {
  // Case 01: The Enchanted Reflection (Answer: MIRROR)
  'riddle-mirror': {
    id: 'dare-mirror-mimic',
    riddleId: 'riddle-mirror',
    title: 'Silent Movie Mirror Mimic',
    actionPrompt:
      'Pretend you are an actor in an old silent movie staring into a mirror! Make 3 dramatic, funny facial expressions in slow motion without speaking a single word!',
    themeEmoji: '🪞',
    category: 'MIME & EXPRESSION',
    durationSeconds: 8,
    cheerMessage: 'Hilarious mime performance! Your reflection would be proud!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 01 (Alt/Companion): The Silent Intruder (Answer: SHADOW)
  'riddle-shadow': {
    id: 'dare-shadow-ninja',
    riddleId: 'riddle-shadow',
    title: 'Freeze-Frame Shadow Ninja',
    actionPrompt:
      'Strike your most dramatic superhero ninja pose and freeze like a solid statue for 8 seconds without moving a single muscle!',
    themeEmoji: '🥷',
    category: 'STATUE FREEZE',
    durationSeconds: 8,
    cheerMessage: 'Rock-solid freeze! Even your shadow was impressed!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'freeze',
  },

  // Case 02: The Forbidden Vault (Answer: KEY)
  'riddle-key': {
    id: 'dare-vault-unlock',
    riddleId: 'riddle-key',
    title: 'Giant Key Vault Twist',
    actionPrompt:
      'Grasp an imaginary giant, 50-kg ancient vault key with both hands and do a goofy celebratory hip twist while turning it!',
    themeEmoji: '🗝️',
    category: 'FUNNY MOVEMENT',
    durationSeconds: 8,
    cheerMessage: 'Vault unlocked with pure comedic flair! Ready to try again!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 03: The Smirking Apparition (Answer: MIRROR)
  'riddle-mirror-smirking': {
    id: 'dare-slowmo-hero',
    riddleId: 'riddle-mirror-smirking',
    title: 'Slow-Motion Hero Entrance',
    actionPrompt:
      'Pretend you are a superhero walking onto a movie set in dramatic slow motion with epic cinematic wind blowing in your face!',
    themeEmoji: '🦸',
    category: 'CINEMATIC ACTING',
    durationSeconds: 8,
    cheerMessage: 'Pure cinematic gold! Hollywood needs to hire you immediately!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 04: The Weeping Monk (Answer: CANDLE)
  'riddle-candle': {
    id: 'dare-flame-flicker',
    riddleId: 'riddle-candle',
    title: 'Flickering Candle Flame Sway',
    actionPrompt:
      'Put your hands together above your head like a candle flame and sway gently side to side in an imaginary cool breeze!',
    themeEmoji: '🕯️',
    category: 'SWAY & BALANCE',
    durationSeconds: 8,
    cheerMessage: 'Smooth and glowing! You lit up the entire arena!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'wizard',
  },

  // Case 05: The Muddy Trail (Answer: FOOTSTEPS)
  'riddle-footsteps': {
    id: 'dare-penguin-march',
    riddleId: 'riddle-footsteps',
    title: 'Funny Penguin Waddle Challenge',
    actionPrompt:
      'Pin your elbows to your waist, stick your palms outward, and waddle in place like a happy penguin for 8 seconds!',
    themeEmoji: '🐧',
    category: 'FUNNY ANIMAL WALK',
    durationSeconds: 8,
    cheerMessage: '10/10 penguin technique! The Antarctic colony salutes you!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'penguin',
  },

  // Case 06: The Crypt’s Mocking Whisper (Answer: ECHO)
  'riddle-echo': {
    id: 'dare-sports-commentary',
    riddleId: 'riddle-echo',
    title: 'Fast-Talking Sports Commentator',
    actionPrompt:
      'In your best hyper-excited sports TV announcer voice, announce your own escape attempt for 10 seconds: "AND THE DETECTIVE MAKES A MOVE! WHAT A DEDUCTION!"',
    themeEmoji: '🎙️',
    category: 'VOICE PERFORMANCE',
    durationSeconds: 10,
    cheerMessage: 'GOOOAL! Outstanding commentary, champion broadcaster!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 07: The Silent Witness (Answer: BOOK)
  'riddle-book': {
    id: 'dare-air-guitar',
    riddleId: 'riddle-book',
    title: 'Imaginary Electric Guitar Solo',
    actionPrompt:
      'Grab an imaginary electric rock guitar and shred a passionate, head-bobbing 10-second rockstar guitar solo!',
    themeEmoji: '🎸',
    category: 'ROCKSTAR AIR SOLO',
    durationSeconds: 10,
    cheerMessage: 'LEGENDARY RIFF! The crowd is cheering for an encore!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'guitar',
  },

  // Case 08: The Iron Sentry (Answer: LOCK)
  'riddle-lock': {
    id: 'dare-robot-pose',
    riddleId: 'riddle-lock',
    title: 'Mechanical Robot Movement',
    actionPrompt:
      'Move your arms, neck, and shoulders in sharp 90-degree mechanical robot angles while quietly making "beep boop" sound effects!',
    themeEmoji: '🤖',
    category: 'ROBOTICS & MOVEMENT',
    durationSeconds: 10,
    cheerMessage: 'BEEP BOOP! Precision servomotors fully calibrated!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'robot',
  },

  // Case 09: The Castaway’s Message (Answer: BOTTLE)
  'riddle-bottle': {
    id: 'dare-weather-reporter',
    riddleId: 'riddle-bottle',
    title: 'Dramatic TV Weather Reporter',
    actionPrompt:
      'Pretend you are a live TV weather reporter battling imaginary torrential winds: point to the left and right at imaginary storm clouds!',
    themeEmoji: '🌦️',
    category: 'DRAMATIC WEATHER BROADCAST',
    durationSeconds: 10,
    cheerMessage: 'Reporting live from the storm! Excellent weather courage!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 10: The Transparent Wall (Answer: WINDOW)
  'riddle-window': {
    id: 'dare-invisible-rope',
    riddleId: 'riddle-window',
    title: 'Invisible Jump Rope Bounce',
    actionPrompt:
      'Spin an imaginary jump rope with your wrists and do light rhythmic skips on the spot (or seated arm bounces) for 8 seconds!',
    themeEmoji: '🪢',
    category: 'RHYTHMIC SKIP',
    durationSeconds: 8,
    cheerMessage: 'Great rhythm and agility! Super smooth skipping!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 11: The Weaver’s Snare (Answer: SPIDERWEB)
  'riddle-spiderweb': {
    id: 'dare-spider-fingers',
    riddleId: 'riddle-spiderweb',
    title: 'Friendly Spider-Fingers Wave',
    actionPrompt:
      'Wiggle all ten of your fingers in front of the camera like friendly scurrying spider legs, then finish with a dramatic magician flourish!',
    themeEmoji: '🕷️',
    category: 'HAND DEXTERITY',
    durationSeconds: 8,
    cheerMessage: 'Spooky and stylish! A true arachnid illusionist!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'wizard',
  },

  // Case 12: The Belfry’s Gong (Answer: BELL)
  'riddle-bell': {
    id: 'dare-air-drums',
    riddleId: 'riddle-bell',
    title: 'Air Drum Solo Rockstar',
    actionPrompt:
      'Lay down a thunderous 10-second drum solo on imaginary snare, toms, and crash cymbals with dramatic imaginary stick flips!',
    themeEmoji: '🥁',
    category: 'PERCUSSION BEAT',
    durationSeconds: 10,
    cheerMessage: 'Badum-tss! Incredible tempo and drum fill mastery!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'drums',
  },

  // Case 13: The Hungry Beast (Answer: FIRE)
  'riddle-fire': {
    id: 'dare-victory-celebration',
    riddleId: 'riddle-fire',
    title: 'Over-the-Top Victory Celebration',
    actionPrompt:
      'Perform your funniest, most enthusiastic soccer goal or video game victory cheer as if you just won world champion in the 90th minute!',
    themeEmoji: '🎉',
    category: 'VICTORY FIESTA',
    durationSeconds: 6,
    cheerMessage: 'WORLD CLASS CELEBRATION! The stadium is chanting your name!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 14: The Master Thief’s Disguise (Answer: GLOVE)
  'riddle-glove': {
    id: 'dare-tiptoe-burglar',
    riddleId: 'riddle-glove',
    title: 'Sneaky Master Detective Tiptoe',
    actionPrompt:
      'Tiptoe in place in comedic ultra-stealth mode, glancing suspiciously to your left and right for 8 seconds!',
    themeEmoji: '🕵️',
    category: 'STEALTH COMEDY',
    durationSeconds: 8,
    cheerMessage: 'Zero noise detected! You are a phantom master of stealth!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 15: The Pirate’s Codex (Answer: MAP)
  'riddle-map': {
    id: 'dare-pirate-ahoy',
    riddleId: 'riddle-map',
    title: 'Pirate Captain Lookout',
    actionPrompt:
      'Hold an imaginary spyglass up to your eye, scan the horizon, and boldly announce: "LAND HO, MATEYS!" with your best pirate grin!',
    themeEmoji: '🏴‍☠️',
    category: 'SWASHBUCKLER ROLEPLAY',
    durationSeconds: 8,
    cheerMessage: 'Ahoy Captain! You navigated right through uncharted waters!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 16: The Ghost Ship’s Needle (Answer: COMPASS)
  'riddle-compass': {
    id: 'dare-spinning-gyro',
    riddleId: 'riddle-compass',
    title: 'Human Compass Calibration',
    actionPrompt:
      'Point both index fingers forward and smoothly pivot your upper body North, South, East, and West to calibrate your magnetic navigation sense!',
    themeEmoji: '🧭',
    category: 'GYROSCOPE CALIBRATION',
    durationSeconds: 8,
    cheerMessage: 'True North confirmed! Your internal gyroscope is dialed in!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'freeze',
  },

  // Case 17: The Secret Passageway (Answer: STAIRS)
  'riddle-stairs': {
    id: 'dare-moonwalk-step',
    riddleId: 'riddle-stairs',
    title: 'Funky Slow-Step Challenge',
    actionPrompt:
      'Slide your shoes in a mini slow-motion slide or do a smooth 6-second funky side-to-side balance step in place!',
    themeEmoji: '🕺',
    category: 'BALANCE & STEP',
    durationSeconds: 6,
    cheerMessage: 'Smoother than silk! Fantastic footwork on the secret stairs!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Case 18: The Two-Faced Token (Answer: COIN)
  'riddle-coin': {
    id: 'dare-coin-flip',
    riddleId: 'riddle-coin',
    title: 'The Dramatic Coin Flip Catch',
    actionPrompt:
      'Flick an imaginary coin high into the air, track its slow-motion flight with your eyes, slap it onto your wrist, and strike an astonished face!',
    themeEmoji: '🪙',
    category: 'MAGIC SLEIGHT',
    durationSeconds: 6,
    cheerMessage: 'It’s heads! Fortune favors the bold detective!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  // Science Questions Dares
  'phys-photoelectric': {
    id: 'dare-photoelectric',
    riddleId: 'phys-photoelectric',
    title: 'Photoelectron Ejection Leap',
    actionPrompt:
      'Pretend you are a bound valence electron struck by a high-energy UV photon: jump once in place (or throw both arms up) shouting: "EJECTED WITH MAXIMUM KINETIC ENERGY!"',
    themeEmoji: '⚡',
    category: 'QUANTUM PHYSICS DARE',
    durationSeconds: 6,
    cheerMessage: 'Quantum threshold exceeded! Photoelectrons liberated successfully!',
    badgeText: 'CLASS 12 PHYSICS DARE',
    characterAnimation: 'hero',
  },

  'chem-catalysis': {
    id: 'dare-catalysis',
    riddleId: 'chem-catalysis',
    title: 'Activation Energy Barrier Smash',
    actionPrompt:
      'Rub your palms together rapidly to generate friction heat, then do 3 fast power claps to lower the chemical activation energy barrier!',
    themeEmoji: '🧪',
    category: 'KINETICS ACTION',
    durationSeconds: 6,
    cheerMessage: 'Reaction rate multiplied by 1000x! Catalysis complete!',
    badgeText: 'CLASS 12 CHEMISTRY DARE',
    characterAnimation: 'frog',
  },

  'bio-dna-helicase': {
    id: 'dare-dna-helicase',
    riddleId: 'bio-dna-helicase',
    title: 'Double Helix Molecular Unzipper',
    actionPrompt:
      'Twist both forearms in a spiral helix shape, then pull them apart like a molecular helicase enzyme unzipping DNA strands with ATP energy!',
    themeEmoji: '🧬',
    category: 'GENETICS ACTION',
    durationSeconds: 8,
    cheerMessage: 'Hydrogen bonds cleaved! Replication fork open and ready!',
    badgeText: 'CLASS 12 BIOLOGY DARE',
    characterAnimation: 'hero',
  },

  'phys-lenz-law': {
    id: 'dare-lenz-law',
    riddleId: 'phys-lenz-law',
    title: 'Lenz’s Law Magnetic Resistance',
    actionPrompt:
      'Push both hands forward against an imaginary opposing magnetic flux field with dramatic facial tension and declare: "NATURE OPPOSES THE FLUX CHANGE!"',
    themeEmoji: '🧲',
    category: 'ELECTROMAGNETIC DARE',
    durationSeconds: 8,
    cheerMessage: 'Energy conservation upheld! Eddy currents fully resisting!',
    badgeText: 'CLASS 12 PHYSICS DARE',
    characterAnimation: 'wizard',
  },

  'mod-mass-defect': {
    id: 'dare-mass-defect',
    riddleId: 'mod-mass-defect',
    title: 'Nuclear Binding Energy Burst',
    actionPrompt:
      'Pull both fists tight into your chest like nucleons binding into a nucleus, then burst them outward proclaiming: "E = mc²!"',
    themeEmoji: '🌌',
    category: 'NUCLEAR SCIENCE DARE',
    durationSeconds: 6,
    cheerMessage: 'Mass defect converted into binding energy! Core stabilized!',
    badgeText: 'CLASS 12 NUCLEAR PHYSICS DARE',
    characterAnimation: 'hero',
  },

  'mystery-force': {
    id: 'dare-newton-force',
    riddleId: 'mystery-force',
    title: 'Newtonian Push & Pull Karate',
    actionPrompt:
      'Do a dramatic slow-motion martial arts push forward, then pull back to demonstrate equal and opposite reaction forces!',
    themeEmoji: '🪐',
    category: 'FORCE & MOTION',
    durationSeconds: 6,
    cheerMessage: 'F = m·a demonstrated with supreme martial precision!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'hero',
  },

  'mystery-photon': {
    id: 'dare-photon-speed',
    riddleId: 'mystery-photon',
    title: 'Cosmic Light-Speed Sprint',
    actionPrompt:
      'Run in place at "cosmic top speed" for 6 seconds while flashing two peace signs like dual propagating light waves!',
    themeEmoji: '✨',
    category: 'RELATIVITY SPRINT',
    durationSeconds: 6,
    cheerMessage: 'Traveling at 3 × 10⁸ m/s! Zero rest mass verified!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'chicken',
  },

  'mystery-catalyst': {
    id: 'dare-enzyme-lock',
    riddleId: 'mystery-catalyst',
    title: 'Enzyme Lock-and-Key Snap',
    actionPrompt:
      'Interlock the fingers of both hands tightly together like an enzyme-substrate complex, then give a satisfying snap!',
    themeEmoji: '🔬',
    category: 'BIO-CHEM ACTION',
    durationSeconds: 6,
    cheerMessage: 'Active site fitted perfectly! Product released smoothly!',
    badgeText: 'CLASS 12 ACTION DARE',
    characterAnimation: 'wizard',
  },
}

/**
 * Universal default dare for any unlisted or custom riddle.
 */
export const DEFAULT_ACTION_DARE: ActionDare = {
  id: 'dare-detective-hero',
  riddleId: 'default',
  title: 'Master Detective Superhero Pose',
  actionPrompt:
    'Put one hand on your hip, point forward with the other like Sherlock Holmes, and declare: "THE MYSTERY SHALL BE SOLVED!" for 6 seconds!',
  themeEmoji: '🕵️',
  category: 'DETECTIVE SPIRIT',
  durationSeconds: 6,
  cheerMessage: 'Awesome enthusiasm, detective! Ready to solve the riddle!',
  badgeText: 'CLASS 12 ACTION DARE',
  characterAnimation: 'hero',
}

/**
 * Retrieves the unique, deterministic action dare assigned to a specific riddle ID.
 */
export function getActionDareForRiddle(riddleId: string): ActionDare {
  if (ACTION_DARES_BY_RIDDLE_ID[riddleId]) {
    return ACTION_DARES_BY_RIDDLE_ID[riddleId]
  }

  // Handle case 03 apparition fallback if ID matches riddle-mirror and needs distinction
  if (riddleId === 'riddle-mirror') {
    return ACTION_DARES_BY_RIDDLE_ID['riddle-mirror']
  }

  return {
    ...DEFAULT_ACTION_DARE,
    riddleId,
  }
}
