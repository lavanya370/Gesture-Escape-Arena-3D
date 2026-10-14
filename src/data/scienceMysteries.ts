import type { ScienceMystery } from '../types/scienceMystery'

export const SCIENCE_MYSTERIES: ScienceMystery[] = [
  {
    id: 'mystery-force',
    title: 'THE INVISIBLE FORCE',
    category: 'Physics',
    difficulty: 'Class 11',
    story:
      'The Grand Science Vault has detected an invisible phenomenon permeating the entire cosmos. It can alter the trajectory of celestial planets or accelerate a tiny electron, yet no human can physically grasp it in their hand. Your mission is to discover what it is.',
    riddle:
      'I cannot be seen directly.\nI can push or pull an object.\nI can change its motion.\nMy strength can be measured.\nWhat am I?',
    options: ['Energy', 'Force', 'Pressure', 'Power'],
    correctIndex: 1, // B: Force
    hint1: 'Think about what happens when you push a shopping cart or pull a door.',
    hint2: 'In physics, it is a vector quantity measured in newtons (N), named after Isaac Newton.',
    finalClue:
      "The answer describes a push or pull acting upon an object, formalized by Newton's Second Law: F = m · a.",
    scientificExplanation:
      'A force is an external influence capable of altering an object’s state of motion, velocity, or direction. Formally formulated by Sir Isaac Newton in his Second Law of Motion as the rate of change of linear momentum (F = dp/dt = m·a). Force is a vector quantity (possessing both magnitude and direction) and is measured in newtons (N = kg·m/s²).',
    interestingFact:
      'In modern physics, all known interactions in the entire universe reduce to just four fundamental forces: Gravity, Electromagnetism, the Strong Nuclear Force, and the Weak Nuclear Force!',
    formulaOrConcept: 'F = m · a (Newton’s 2nd Law • Measured in Newtons [N])',
  },
  {
    id: 'mystery-photon',
    title: 'THE QUANTUM TRAVELER',
    category: 'Modern Science',
    difficulty: 'Class 12',
    story:
      'The Vault sensors have intercepted a mysterious packet originating from the sun. It travels at the absolute cosmic speed limit, carries zero invariant rest mass, yet delivers discrete packets of momentum and energy capable of kicking electrons out of solid metal.',
    riddle:
      'I have no rest mass, yet I have momentum.\nI travel at the universe’s top speed.\nI behave as both a spreading wave and a discrete packet.\nEinstein won the Nobel Prize explaining my interaction with metal.\nWhat am I?',
    options: ['Neutron', 'Photon', 'Proton', 'Graviton'],
    correctIndex: 1, // B: Photon
    hint1: 'Think of the smallest discrete quantum packet of electromagnetic radiation and visible light.',
    hint2:
      'Max Planck formulated its energy as E = h · ν, where h is Planck’s constant and ν is radiation frequency.',
    finalClue:
      'In Einstein’s Photoelectric Effect, each one of these discrete light particles transfers its energy to liberate a single photoelectron.',
    scientificExplanation:
      'A photon is the elementary particle and quantum of light and all other electromagnetic radiation. It exhibits wave-particle duality: traveling as an electromagnetic wave with wavelength λ, yet interacting as a localized particle carrying quantized energy E = hν and momentum p = h/λ. It possesses zero rest mass and always propagates at c (3 × 10⁸ m/s) in a vacuum.',
    interestingFact:
      'Photons created at the core of the Sun take over 100,000 years to reach the solar surface through continuous collisions, but once released, they reach Earth in just 8 minutes and 20 seconds!',
    formulaOrConcept: 'E = h · ν = h · c / λ (Planck-Einstein Relation)',
  },
  {
    id: 'mystery-catalyst',
    title: 'THE CHEMICAL ACCELERATOR',
    category: 'Chemistry',
    difficulty: 'Class 12',
    story:
      'Inside the Alchemical Reactor of the Vault, a stubborn chemical process was taking centuries to complete. A master chemist introduced a minute trace of an enigmatic substance. In a fraction of a second, the reaction concluded without consuming any of the secret agent.',
    riddle:
      'I speed up chemical reactions dramatically.\nI lower the activation energy barrier mountain.\nI remain completely unconsumed at the end of the reaction.\nI do not shift the chemical equilibrium point.\nWhat am I?',
    options: ['Catalyst', 'Solvent', 'Reactant', 'Electrolyte'],
    correctIndex: 0, // A: Catalyst
    hint1: 'Think of what enzymes act as inside biological organisms to accelerate cellular metabolism.',
    hint2:
      'It provides an alternative reaction pathway with a lower activation energy (Ea) in the Arrhenius equation.',
    finalClue:
      'Automobiles use them with platinum and rhodium in exhaust converters to convert toxic carbon monoxide into harmless carbon dioxide without being used up.',
    scientificExplanation:
      'A catalyst is a substance that accelerates the rate of a chemical reaction without undergoing any permanent chemical alteration itself. It functions by providing an alternative reaction pathway with a significantly lower activation energy (Ea). According to the Arrhenius equation (k = A·e^(-Ea/RT)), reducing Ea exponentially increases the reaction rate constant k for both forward and reverse processes equally, leaving the equilibrium constant K_eq unchanged.',
    interestingFact:
      'Without biological catalysts called enzymes, your body would take approximately 2.3 billion years to break down a single meal!',
    formulaOrConcept: 'k = A · e^(-Ea/RT) (Arrhenius Equation • Ea Lowering)',
  },
  {
    id: 'mystery-dna',
    title: 'THE BLUEPRINT OF LIFE',
    category: 'Biology',
    difficulty: 'Class 12',
    story:
      'A cryogenic vault cylinder holds a sub-microscopic polymeric strand. It stores the complete developmental schematics and genetic instructions for every living organism on Earth in a four-letter molecular alphabet.',
    riddle:
      'I have two complementary strands wound in a right-handed helix.\nMy backbone is made of alternating sugar and phosphate groups.\nMy rungs consist of Adenine, Thymine, Guanine, and Cytosine.\nWatson and Crick deduced my 3D architectural structure in 1953.\nWhat am I?',
    options: ['Ribosome', 'Hemoglobin', 'DNA', 'ATP'],
    correctIndex: 2, // C: DNA
    hint1: 'Deoxyribose sugar gives this master nucleic acid its famous 3-letter acronym.',
    hint2: 'Adenine pairs specifically with Thymine, while Guanine pairs with Cytosine via hydrogen bonds.',
    finalClue:
      'During cell division, Helicase unzips this double helix, and DNA Polymerase synthesizes faithful daughter copies.',
    scientificExplanation:
      'Deoxyribonucleic Acid (DNA) is the primary molecule of heredity in nearly all living organisms. Structured as an antiparallel double helix, each nucleotide consists of a deoxyribose sugar, a phosphate group, and one of four nitrogenous bases (A, T, G, C). Base pairing follows Chargaff’s rules (A=T with 2 hydrogen bonds, G≡C with 3 hydrogen bonds), allowing high-fidelity semiconservative replication.',
    interestingFact:
      'If you uncoiled and stretched end-to-end all the DNA in all 37 trillion cells of a single human body, it would stretch over 10 billion miles—reaching Pluto and back!',
    formulaOrConcept: 'Chargaff’s Rule: [A] = [T] and [G] = [C] • 3.4 nm Pitch',
  },
]

export const DEFAULT_SCIENCE_MYSTERY = SCIENCE_MYSTERIES[0]
