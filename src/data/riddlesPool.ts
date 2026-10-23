export interface RiddleItem {
  id: string
  title: string
  storyIntro: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  funnyWrongReactions?: string[]
  hints: {
    hint1: {
      title: string
      text: string
      sourceMiniGame: string
      requirement: string
    }
    hint2: {
      title: string
      text: string
      sourceMiniGame: string
      requirement: string
    }
    hint3: {
      title: string
      text: string
      sourceMiniGame: string
      requirement: string
    }
  }
}

export const RIDDLES_POOL: RiddleItem[] = [
  {
    id: 'riddle-mirror',
    title: 'CASE 01: THE ENCHANTED REFLECTION',
    storyIntro:
      'In the grand ballroom of Ravenscroft Castle, an ornate glass hangs within an antique gilded frame. It watches all who pass, reproducing every expression in perfect silence, yet keeping nothing of its own.',
    question:
      'I show you a face, but I possess no eyes of my own.\nI speak no words, but mimic every grimace you make.\nYet the second you walk away, I am completely empty.\nWhat am I?',
    options: ['PORTRAIT', 'CAMERA', 'MIRROR', 'STATUE'],
    correctAnswer: 'MIRROR',
    explanation:
      'A mirror shows your face without having eyes of its own, mimics your every expression, and becomes completely empty the moment you walk away!',
    funnyWrongReactions: [
      'The investigator shakes their head: "A {choice}? That holds an image or has no instant dynamic mimicry!"',
      'The ancient frame whispers: "Look closer into the glass... a {choice} is not what mirrors your gaze!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • SILENT IMITATION',
        text: 'It reflects your smile, frown, and gesture with zero delay.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 200 PTS in Ball Challenge (15s)',
      },
      hint2: {
        title: 'CLUE 2 • TRANSITORY MEMORY',
        text: 'Unlike a photograph or portrait, it retains nothing once you leave.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • MATERIAL ESSENCE',
        text: 'Silvered glass encased in an ornate frame that turns blank without light.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-shadow',
    title: 'CASE 01: THE SILENT INTRUDER',
    storyIntro:
      'Midnight strikes at Blackwood Manor. A nervous night guard swears a dark silhouette is glued to his heels through every drafty corridor, mimicking his every frantic move!',
    question:
      'Someone follows you through every room.\nThey mimic your every frantic move,\nyet they vanish the instant the lights go black.\nWho is this silent intruder?',
    options: ['SHADOW', 'GHOST', 'SPY', 'PUPPET'],
    correctAnswer: 'SHADOW',
    explanation:
      'Your shadow mimics your exact posture and motion whenever illuminated, but disappears into nothingness the moment darkness swallows the room.',
    funnyWrongReactions: [
      'The night guard shivers: "A {choice}?! No, whatever is following me makes zero footsteps and has no heartbeat!"',
      'A suspicious ghost peeks from behind a velvet curtain: "Boo! Did you really blame me? I make way more noise than that!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • SIGHT & TOUCH',
        text: 'You can clearly see this eerie companion, yet you can never grab or touch it.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • STRANGE BEHAVIOR',
        text: 'It copies your exact posture without making a sound, stretching tall under streetlamps.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • FATAL WEAKNESS',
        text: 'Darkness makes it vanish instantly; it requires light cast upon an opaque body to exist.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-key',
    title: 'CASE 02: THE FORBIDDEN VAULT',
    storyIntro:
      'The eccentric Lord Ravenscroft passed away, leaving his fortune sealed in a gargantuan iron vault. The greedy heirs tore up the mansion, finding only a tiny notched piece of brass!',
    question:
      'I have dozens of teeth, but I never take a bite.\nI can open the heaviest iron gate,\nyet I can never walk through it myself.\nWhat am I?',
    options: ['COMB', 'SAW', 'ZIPPER', 'KEY'],
    correctAnswer: 'KEY',
    explanation:
      'A key has serrated teeth cut into its blade to lift internal lock pins, unlocking massive doors and chests that it cannot cross itself.',
    funnyWrongReactions: [
      'The butler adjusts his monocle: "A {choice}, sir? How on Earth would one unlock Lord Ravenscroft’s vault with that?!"',
      'The vault door rattles with laughter: "*Clank!* Wrong tool, detective! The treasure remains sealed!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • GUARDIAN POCKET',
        text: 'The mansion butler keeps a heavy ring of these clinking together in his trench coat.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • MECHANICAL SHAPE',
        text: 'Its serrated teeth and notches are carved to match hidden spring pins inside a tumbler.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • PURPOSE',
        text: 'You insert it into a keyhole and give it a firm twist to unlock a lock.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-mirror-smirking',
    title: 'CASE 03: THE SMIRKING APPARITION',
    storyIntro:
      'A wealthy art collector claims a demon lives in his dressing room. Every time he adjusts his bow tie, an identical figure stares back with the exact same grin!',
    question:
      'I show you a face, but I possess no eyes of my own.\nI speak no words, but mimic every grimace you make.\nYet the second you walk away, I am completely empty.\nWhat am I?',
    options: ['PORTRAIT', 'MIRROR', 'CAMERA', 'STATUE'],
    correctAnswer: 'MIRROR',
    explanation:
      'A mirror reflects light rays directly from your face, copying your every expression, yet instantly empties when you leave.',
    funnyWrongReactions: [
      'The collector faints onto a velvet chaise: "A {choice}?! But portraits don’t blink when I blink!"',
      'A bumbling phantom snickers: "Even my spectral reflection looks handsomer than that guess!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • LOCATION',
        text: 'You find this silvered glass pane hanging in dressing rooms, bathrooms, and mystery mazes.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • SUPERSTITION',
        text: 'Spooky folklore warns that shattering its glass brings seven years of cursed bad luck.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • FUNCTION',
        text: 'You stand directly before it every morning to comb your hair and gaze upon your own reflection.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-candle',
    title: 'CASE 04: THE WEEPING MONK',
    storyIntro:
      'During a thunderstorm blackout in Blackwood Abbey, an investigator spots a glowing white cylinder weeping pale tears in the cold stone chapel.',
    question:
      'My life is measured in hours,\nand I serve by being consumed.\nI am tall when young, but grow short when old.\nMy breath brings light,\nbut my tears are made of wax.\nWHAT AM I?',
    options: ['HOURGLASS', 'MATCHSTICK', 'CANDLE', 'TORCH'],
    correctAnswer: 'CANDLE',
    explanation:
      'A candle burns down its wick over hours, growing shorter as it melts paraffin wax into dripping tears.',
    funnyWrongReactions: [
      'A gust of wind howls down the chimney: "A {choice}? That guess burned out faster than a match in a storm!"',
      'The abbey gargoyle chuckles: "Wrong! Keep thinking before all the wax drips away!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • POWER OUTAGE',
        text: 'When the electricity fails during a thunderstorm, people scramble in drawers to light one.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • CELEBRATION',
        text: 'Rows of small colorful ones stand atop birthday cakes, waiting for a wish and a puff of breath.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • COMPOSITION',
        text: 'It features a cloth wick embedded in paraffin wax that melts as its flame burns.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-footsteps',
    title: 'CASE 05: THE MUDDY TRAIL',
    storyIntro:
      'A cat burglar slipped into the greenhouse and snatched the Empress Emerald. Chief Inspector Sterling arrives to find a curious path through the wet soil!',
    question:
      'The more of me you take, the more you leave behind.\nDetectives hunt for me in dust, sand, and mud,\nyet I vanish forever beneath falling rain.\nWhat am I?',
    options: ['FOOTSTEPS', 'BREATHS', 'FINGERPRINTS', 'SHADOWS'],
    correctAnswer: 'FOOTSTEPS',
    explanation:
      'Every footstep you take leaves an impression behind you on the ground, creating a track that rainfall or wind eventually erases.',
    funnyWrongReactions: [
      'Inspector Sterling adjusts his magnifying glass: "A {choice}? That leaves no tread marks on this garden soil!"',
      'The burglar waves from the rooftop: "Haha! You’re looking in the wrong direction entirely!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • MOVEMENT',
        text: 'You generate two of these for every walking pace you advance across the floor.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • FORENSIC CLUE',
        text: 'Police take plaster casts of their tread marks in snow and soft mud to measure shoe size.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • TRAMPING PATH',
        text: 'Heavy boots crunch them into fresh snow, forming a walking trail for anyone following you.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-echo',
    title: 'CASE 06: THE CRYPT’S MOCKING WHISPER',
    storyIntro:
      'Lost in the subterranean catacombs beneath Paris, an urban explorer yells for an exit. A sinister phantom voice repeats every single word right back!',
    question:
      'I have no voice, yet I answer when you shout.\nI speak every language on Earth, but only repeat what is told.\nI cannot be seen, but you will hear me in deep canyons and empty stone halls.\nWhat am I?',
    options: ['GHOST', 'RADIO', 'PARROT', 'ECHO'],
    correctAnswer: 'ECHO',
    explanation:
      'An acoustic echo bounces sound waves off cavernous walls, returning your own words without having vocal cords of its own.',
    funnyWrongReactions: [
      'The stone walls reverberate: "{choice}... {choice}... {choice}... Still wrong... wrong... wrong!"',
      'A catacomb bat flaps upside down: "Even with my sonar ears, I know that guess missed the mark!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • NATURE’S REPLAY',
        text: 'If you shout "HELLO!" into a rocky mountain gorge, it calls "HELLO!" back to you.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • PHYSICS CLUE',
        text: 'It requires hard reflective acoustic surfaces for sound pressure waves to rebound.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • ANCIENT MYTH',
        text: 'In Greek legend, a heartbroken mountain nymph cursed to only repeat others gave her name to it.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-book',
    title: 'CASE 07: THE SILENT WITNESS',
    storyIntro:
      'Inside the dusty manor library, thousands of silent rectangular artifacts rest on mahogany shelves. The occult detective claims each one holds ancient voices.',
    question:
      'I have a spine, but no bones.\nI have hundreds of leaves, but no branches or roots.\nI can transport you to ancient realms without ever moving an inch.\nWhat am I?',
    options: ['TREE', 'BOOK', 'SKELETON', 'MAP'],
    correctAnswer: 'BOOK',
    explanation:
      'A book has a binding spine and paper leaves (pages), containing stories that carry your imagination anywhere while sitting completely still.',
    funnyWrongReactions: [
      'The librarian shushes loudly: "SHHH! A {choice}?! You clearly have not done your required reading!"',
      'A flying spellbook snaps its covers shut: "Try reading between the lines next time!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • ANATOMY RIDDLE',
        text: 'It has a sturdy protective spine, front and back covers, and numbered paper pages.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • QUIET HABITAT',
        text: 'Librarians guard massive halls of these and demand total quiet while visitors flip through them.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • CONTENTS',
        text: 'Contains chapters, table of contents, bookmarks, and printed stories bound together.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-lock',
    title: 'CASE 08: THE IRON SENTRY',
    storyIntro:
      'The escape room chamber door is clamped shut by a heavy bronze apparatus with a U-shaped shackle. A cryptic warning is stamped into its metal belly!',
    question:
      'I guard great secrets and treasure without a sword or shield.\nI click shut with a satisfying snap,\nand only surrender when fed the right secret teeth or code.\nWhat am I?',
    options: ['SAFE', 'CHAIN', 'LOCK', 'GUARD'],
    correctAnswer: 'LOCK',
    explanation:
      'A padlock or door lock secures gates and vaults with mechanical tumblers, opening only when turned with the matching key or combination.',
    funnyWrongReactions: [
      'The heavy shackle stays frozen: "*CLICK!* A {choice}? Nope, the latch refuses to budge!"',
      'A sneaky thief sighs: "If you keep guessing like that, we will be trapped in this escape room forever!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • CRIME TOOL',
        text: 'Burglars and locksmiths use tension wrenches and pick sets to bypass its internal spring pins.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • EVERYDAY USE',
        text: 'School lockers, bicycle cables, and treasure chests rely on this mechanism for security.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • INSEPARABLE PARTNER',
        text: 'It pairs with a key or dials a 3-digit combination to pop open its curved metal shackle.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-bottle',
    title: 'CASE 09: THE CASTAWAY’S MESSAGE',
    storyIntro:
      'Washed ashore at Dead Man’s Cove, a sealed glass vessel tumbles in the ocean foam. Inside, a parchment scroll rolled in crimson ribbon bobs against the glass!',
    question:
      'I have a slender neck, but no head.\nI have a hollow glass belly, but no appetite.\nI can keep a desperate secret safe for fifty years across stormy seas.\nWhat am I?',
    options: ['BOTTLE', 'VASE', 'BARREL', 'FLASK'],
    correctAnswer: 'BOTTLE',
    explanation:
      'A glass bottle has an elongated neck and hollow body, famously sealed with a cork to carry messages across oceans.',
    funnyWrongReactions: [
      'A salty sea parrot squawks: "Squaaawk! A {choice}?! Ye wouldn’t put a pirate message in that!"',
      'The ocean waves roll back: "Splash! Try uncorking a better deduction, landlubber!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • SHIPWRECK TALE',
        text: 'Castaways on deserted islands famously stuff emergency letters into this before casting it to sea.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • OPENING IT',
        text: 'You need a corkscrew or metal bottle cap opener to open its sealed narrow mouth.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • MATERIAL',
        text: 'Crafted from blown glass or molded plastic, recycling bins are filled with these beverage holders.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-window',
    title: 'CASE 10: THE TRANSPARENT WALL',
    storyIntro:
      'In the high tower of Castle Gloom, violent lightning flashes illuminate the stormy forest. Yet inside the study, not a single gust or raindrop touches the parchment!',
    question:
      'I let the bright daylight in, but keep the howling wind outside.\nI am transparent as fresh air, but hard as crystal rock.\nIf you strike me in anger, I shatter into a thousand jagged pieces.\nWhat am I?',
    options: ['CURTAIN', 'MIRROR', 'DOOR', 'WINDOW'],
    correctAnswer: 'WINDOW',
    explanation:
      'A glass window pane allows sunlight into a room while insulating against rain and storms, but shatters if struck with blunt force.',
    funnyWrongReactions: [
      'Rain patters against the glass: "Tap tap! A {choice}? You couldn’t look through that to check the weather!"',
      'The butler rolls his eyes: "Please do not throw stones, detective—it would be a shattering mistake!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • ARCHITECTURE',
        text: 'Houses and skyscrapers are built with dozens of these framed openings along their walls.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • WEATHER CHECK',
        text: 'You pull open your bedroom blinds and peer through its clear pane to check if it is raining.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • CLEANING',
        text: 'Window cleaner spray and squeegees are used to wipe fingerprints and rain streaks off its glass.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-spiderweb',
    title: 'CASE 11: THE WEAVER’S SNARE',
    storyIntro:
      'In the dusty attic corner above the old wardrobe, a gossamer spiral shimmers in the silver moonlight. Careless moths fly in, but none ever fly back out!',
    question:
      'I am spun from liquid silk stronger than steel.\nI wait silently in dusty rafters for unsuspecting visitors.\nI am an intricate lace trap, but I have never worn a dress.\nWhat am I?',
    options: ['NET', 'SPIDERWEB', 'HAMMOCK', 'CURTAIN'],
    correctAnswer: 'SPIDERWEB',
    explanation:
      'A spiderweb is woven from protein silk by an arachnid, anchored across corners to ensnare passing insects.',
    funnyWrongReactions: [
      'A tiny spider giggles from the ceiling: "Hehehe! A {choice}?! You’re tangled in the wrong web!"',
      'A dusty attic ghost sneezes: "*Achoo!* Careful, those sticky silk threads will catch you next!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • HAUNTED HOUSE TROPE',
        text: 'Classic haunted mansions in spooky films are always draped in thick layers of these cobwebs.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • ARCHITECT',
        text: 'An eight-legged creature spins this geometric trap from abdominal spinnerets.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • HOUSEHOLD REMOVAL',
        text: 'People use feather dusters or broomsticks to sweep these sticky cobwebs off ceiling corners.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-bell',
    title: 'CASE 12: THE BELFRY’S GONG',
    storyIntro:
      'High in the creaking bell tower, a massive flared bronze sculpture hangs motionless. But when the clock strikes twelve, a deafening ring echoes across the entire valley!',
    question:
      'I have no tongue of flesh, yet I can chime across an entire town.\nI am hollow bronze, with a heavy iron clapper inside my throat.\nI ring for joyous weddings and toll for midnight peril.\nWHAT AM I?',
    options: ['BELL', 'DRUM', 'TRUMPET', 'GONG'],
    correctAnswer: 'BELL',
    explanation:
      'A bell has a hollow bronze body and an internal metal clapper (often called its tongue) that strikes its rim to produce ringing sound waves.',
    funnyWrongReactions: [
      'A discordant clang rattles the tower: "*CLANG!* A {choice}? That guess rings completely hollow!"',
      'The hunchback bellringer scratches his head: "Does that guess ring any bells for you? Not for me!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • HIGH PERCH',
        text: 'Cathedrals and historic town halls hang gigantic versions of these in their bell towers.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • EVERYDAY SIZES',
        text: 'School teachers ring handheld brass ones, and bicycles have little handlebar ones that go "Ding ding!".',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • SOUND MECHANISM',
        text: 'An iron swinging clapper strikes against its hollow flared bronze lip to make it toll.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-fire',
    title: 'CASE 13: THE HUNGRY BEAST',
    storyIntro:
      'The dungeon keeper warns the recruits about a wild dancing beast kept inside the stone hearth. It devours dry logs by the crate, but a single bucket of water will kill it!',
    question:
      'Feed me dry wood and paper, and I grow furious and bright.\nGive me a cup of cold water, and I instantly choke and die.\nI have no lungs, but I crackle and dance in the stone hearth.\nWhat am I?',
    options: ['LION', 'VOLCANO', 'FIRE', 'DRAGON'],
    correctAnswer: 'FIRE',
    explanation:
      'Fire requires fuel, heat, and oxygen to undergo rapid combustion, crackling on wood but being extinguished by water.',
    funnyWrongReactions: [
      'The fireplace crackles with amusement: "*FZZZT!* A {choice}? Your guess just went up in smoke!"',
      'The dungeon keeper smirks: "Careful, detective! Don’t play with that answer or you’ll get burned!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • CAMPING ESSENTIAL',
        text: 'Campers strike flint stones or matches to build one inside a ring of stones for warmth and s’mores.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • SENSATIONS',
        text: 'Radiates intense thermal heat and crackling orange flames that emit smoke and glowing embers.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • EXTINCTION',
        text: 'Firefighters hook hoses to hydrants and blast pressurized water to quench its flames.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-glove',
    title: 'CASE 14: THE MASTER THIEF’S DISGUISE',
    storyIntro:
      'Scotland Yard examines the shattered jewel case. The master thief left not a single fingerprint on the velvet cushion, but dropped a curious leather item near the exit!',
    question:
      'I have four fingers and one thumb,\nbut I have no flesh, bones, or pulse of my own.\nBurglars wear me to leave no trace, and gentlemen wear me against the winter chill.\nWhat am I?',
    options: ['SHADOW', 'SOCK', 'PUPPET', 'GLOVE'],
    correctAnswer: 'GLOVE',
    explanation:
      'A glove has sleeves for four fingers and a thumb, worn to prevent leaving fingerprints and to insulate hands from cold weather.',
    funnyWrongReactions: [
      'The detective shakes his head: "A {choice}? That would hardly fit like a glove on the culprit’s hand!"',
      'A shadowy thief chuckles from the shadows: "Nice try, inspector, but my hands remain clean!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • FINGER SLEEVES',
        text: 'It has individual tailored sleeves for four fingers and one separate thumb.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • WINTER WARDROBE',
        text: 'You pull a pair of wool or leather ones over your hands when shoveling snow in freezing weather.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • FORENSIC REASON',
        text: 'Cat burglars and detectives wear them so no natural skin oils or fingerprints transfer onto surfaces.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-map',
    title: 'CASE 15: THE PIRATE’S CODEX',
    storyIntro:
      'Buried in a brass canister beneath shipwreck sands, a brittle parchment displays mysterious coastlines and an ominous skull marking an uncharted island!',
    question:
      'I have sprawling cities, but not a single house.\nI have mountains and rivers, but not a rock or a drop of water.\nI guide lost adventurers through uncharted wilderness on a single sheet of paper.\nWhat am I?',
    options: ['GLOBE', 'MAP', 'BOOK', 'COMPASS'],
    correctAnswer: 'MAP',
    explanation:
      'A map depicts cities, mountains, and waterways in cartographic scale without containing physical buildings or water.',
    funnyWrongReactions: [
      'Captain Redbeard bellows: "Blisterin’ barnacles! A {choice}?! That won’t help ye navigate these reefs!"',
      'The treasure chest groans: "You’re completely lost off course, matey! Recalculate your route!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • TREASURE LORE',
        text: 'Pirates draw a dotted red path ending where "X marks the spot" on this folded parchment.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • NAVIGATION AID',
        text: 'Hikers unfold paper topographical ones, while city drivers open GPS versions on mobile phones.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • CARTOGRAPHY SYMBOLS',
        text: 'Features a compass rose, scale bar in kilometers, elevation contour lines, and highway legends.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-compass',
    title: 'CASE 16: THE GHOST SHIP’S NEEDLE',
    storyIntro:
      'Aboard the Mary Celeste ghost ship drifting through the fog, a polished brass apparatus sits upon the binnacle, its needle steadily quivering toward the horizon.',
    question:
      'I have a spinning needle that never sews a stitch.\nI whisper nothing, yet I tell sailors where North lies.\nNo matter which way you turn, my magnetic heart points the way.\nWhat am I?',
    options: ['CLOCK', 'WEATHERVANE', 'COMPASS', 'SUNDIAL'],
    correctAnswer: 'COMPASS',
    explanation:
      'A magnetic compass uses a magnetized needle freely pivoted to align with Earth’s magnetic dipole field, pointing to magnetic North.',
    funnyWrongReactions: [
      'The helmsman turns the wheel frantically: "A {choice}?! We’ll sail right into the jagged rocks with that navigation!"',
      'The ghost of the captain sighs: "My needle is pointing North, but your guess is pointing nowhere!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • MOVING PART',
        text: 'Its balanced magnetized needle floats freely on a central jeweled pivot pin.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • CARDINAL MARKS',
        text: 'Its circular dial face is marked with the letters N, S, E, and W for the four cardinal directions.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • INVISIBLE FORCE',
        text: 'Aligns with Earth’s invisible geomagnetic field lines to prevent explorers from getting lost.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-stairs',
    title: 'CASE 17: THE SECRET PASSAGEWAY',
    storyIntro:
      'Behind the revolving bookcase in Ravenwood Castle, a spiraling flight of weathered oak leads up into the eerie belfry and down into the creepy dungeon!',
    question:
      'I go up and I go down, but I never move an inch.\nCreaking underfoot during midnight strolls,\nI lead you from the basement dungeon to the highest rooftop tower.\nWhat am I?',
    options: ['STAIRS', 'ELEVATOR', 'LADDER', 'ESCALATOR'],
    correctAnswer: 'STAIRS',
    explanation:
      'A flight of stairs connects architectural floors; while people walk up and down its steps, the staircase itself stays completely stationary.',
    funnyWrongReactions: [
      'A floorboard creaks ominously: "*CREEEAAAK!* A {choice}? You just tripped over the answer!"',
      'A castle ghost floats upward: "I don’t need steps, but you certainly do! Take another step, detective!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • MOTION PARADOX',
        text: 'People travel up and down it all day, yet the structure itself is bolted firmly into the floor.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • OLD HOUSES',
        text: 'Old wooden ones in haunted houses creak loudly under your sneakers when you sneak down at night.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • PHYSICAL EXERCISE',
        text: 'Composed of risers and flat treads; you climb them step-by-step when the elevator is out of order.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
  {
    id: 'riddle-coin',
    title: 'CASE 18: THE TWO-FACED TOKEN',
    storyIntro:
      'In a dimly lit speakeasy beneath the docks, a masked gambler slides a gleaming metallic medallion across the green felt: "Call it in the air, stranger!"',
    question:
      'I have a head, but no eyes or brain.\nI have a tail, but no body or fur.\nKings stamp their royal portraits on me, and gamblers flip me to decide their fate.\nWhat am I?',
    options: ['LIZARD', 'SNAKE', 'MEDAL', 'COIN'],
    correctAnswer: 'COIN',
    explanation:
      'A metal currency coin has a "heads" side (portrait of monarch/leader) and a "tails" side, flipped for 50/50 chance decisions.',
    funnyWrongReactions: [
      'The masked gambler flips it into the air: "*PING!* A {choice}? Bad call, stranger! House wins that round!"',
      'A piggy bank rattles: "*Clink clink!* Better deposit a smarter guess next time!"',
    ],
    hints: {
      hint1: {
        title: 'CLUE 1 • CHANCE DECISION',
        text: 'Referees flip one into the air before sports matches to decide which team kicks off first.',
        sourceMiniGame: 'Magic Coin Catcher',
        requirement: 'Score 100 PTS in Coin Catcher (15s)',
      },
      hint2: {
        title: 'CLUE 2 • EVERYDAY POCKETS',
        text: 'You drop them into vending machines, wishing wells, laundry washers, and arcade slots.',
        sourceMiniGame: 'Number Gate Challenge',
        requirement: 'Solve 3 Math Gates in 15s',
      },
      hint3: {
        title: 'CLUE 3 • TWO SIDES',
        text: 'Stamped from metal like copper or silver, it has an obverse "heads" side and a reverse "tails" side.',
        sourceMiniGame: "Guardian's Funny Trap",
        requirement: 'Survive 15s in Trap Arena',
      },
    },
  },
]

/**
 * Returns a random riddle from the pool, ensuring it differs from previousId if possible.
 */
export function getRandomRiddle(previousId?: string): RiddleItem {
  if (RIDDLES_POOL.length <= 1) {
    return RIDDLES_POOL[0]
  }

  const eligible = RIDDLES_POOL.filter((r) => r.id !== previousId)
  const pool = eligible.length > 0 ? eligible : RIDDLES_POOL
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

/**
 * Returns a fresh riddle from the pool, prioritizing unplayed riddles and
 * avoiding recently completed riddles until all riddles have been played.
 */
export function getNextSessionRiddle(
  completedIds: string[] = [],
  previousId?: string
): RiddleItem {
  if (RIDDLES_POOL.length <= 1) {
    return RIDDLES_POOL[0]
  }

  // Find riddles not in completed list and different from previous
  let eligible = RIDDLES_POOL.filter(
    (r) => !completedIds.includes(r.id) && r.id !== previousId
  )

  // If none eligible (e.g. all available completed, or only previous left),
  // reset pool cycle and pick any riddle different from previous
  if (eligible.length === 0) {
    eligible = RIDDLES_POOL.filter((r) => r.id !== previousId)
  }

  // Absolute fallback to all riddles if needed
  if (eligible.length === 0) {
    eligible = RIDDLES_POOL
  }

  const index = Math.floor(Math.random() * eligible.length)
  return eligible[index]
}
