import type { ScienceQuestion } from '../types/science'

export const CHAMBER_1_QUESTIONS: ScienceQuestion[] = [
  {
    id: 'phys-photoelectric',
    questionNumber: 1,
    subject: 'Physics',
    subjectBadge: '⚛️ CLASS 12 PHYSICS • DUAL NATURE OF MATTER',
    topic: 'Photoelectric Effect & Quantum Theory',
    question:
      'According to Einstein’s photoelectric equation (K_max = hν - Φ), if the frequency of incident radiation is doubled while keeping it above threshold frequency, what happens to the maximum kinetic energy of emitted photoelectrons?',
    options: [
      {
        letter: 'A',
        text: 'It remains completely unchanged',
        symbol: 'ᚦ',
      },
      {
        letter: 'B',
        text: 'It increases to more than double the original value',
        symbol: 'ᛟ',
      },
      {
        letter: 'C',
        text: 'It decreases because of photon scattering collisions',
        symbol: 'ᚱ',
      },
      {
        letter: 'D',
        text: 'It drops to exactly zero',
        symbol: 'ᛉ',
      },
    ],
    correctIndex: 1, // Option B
    hint: 'Examine Einstein’s equation: K_max = hν - Φ. Since the metal work function Φ is subtracted as a constant, doubling ν adds hν, which is greater than the original (hν - Φ)!',
    explanation:
      'According to K_max = hν - Φ, if frequency is doubled (2ν), the new kinetic energy is K_new = 2hν - Φ = 2(K_max + Φ) - Φ = 2K_max + Φ. Since work function Φ > 0, the new kinetic energy is strictly greater than double the original value! Note: Intensity only affects the number of photoelectrons, not their maximum kinetic energy.',
    points: 100,
    guardianDare: {
      guardianName: 'Archmage Hertz',
      guardianTitle: 'Guardian of Quantum Radiation',
      avatarEmoji: '⚡',
      reactionDialogue:
        '“By Planck’s constant! Your photon frequency was mismatched with the metal’s work function!”',
      dareTitle: 'ROBOT MODE DARE',
      dareDescription:
        'Freeze in place like a mechanical automaton and count to 5 in an authentic robot monotone voice!',
    },
  },
  {
    id: 'chem-catalysis',
    questionNumber: 2,
    subject: 'Chemistry',
    subjectBadge: '🧪 CLASS 12 CHEMISTRY • CHEMICAL KINETICS',
    topic: 'Catalysis & Activation Energy',
    question:
      'How does a positive catalyst significantly increase the rate of a chemical reaction without shifting the position of chemical equilibrium?',
    options: [
      {
        letter: 'A',
        text: 'It increases the overall enthalpy change (ΔH) of the reaction',
        symbol: 'ᚦ',
      },
      {
        letter: 'B',
        text: 'It lowers the activation energy (Ea) by providing an alternative pathway',
        symbol: 'ᚱ',
      },
      {
        letter: 'C',
        text: 'It directly raises the temperature of the reaction vessel',
        symbol: 'ᛟ',
      },
      {
        letter: 'D',
        text: 'It increases the equilibrium constant (K_eq) in favor of products',
        symbol: 'ᛉ',
      },
    ],
    correctIndex: 1, // Option B
    hint: 'Remember the Arrhenius equation: k = A·e^(-Ea/RT). A catalyst lowers the energy barrier mountain for both forward and backward reactions equally.',
    explanation:
      'A catalyst offers an alternate reaction pathway involving lower activation energy (Ea). According to the Arrhenius equation, reducing Ea exponentially increases the rate constant (k) for both the forward and reverse reactions by the exact same factor. Therefore, it speeds up attainment of equilibrium without changing the equilibrium composition or ΔH.',
    points: 100,
    guardianDare: {
      guardianName: 'Alchemist Arrhenius',
      guardianTitle: 'Keeper of Chemical Equilibrium',
      avatarEmoji: '🧪',
      reactionDialogue:
        '“Fascinating hypothesis, but your reaction path crashed straight into the high activation energy barrier!”',
      dareTitle: 'FROG JUMP DARE',
      dareDescription:
        'Perform 3 mini frog jumps in place to energize your kinetic particles and overcome the activation barrier!',
    },
  },
  {
    id: 'bio-dna-helicase',
    questionNumber: 3,
    subject: 'Biology',
    subjectBadge: '🧬 CLASS 12 BIOLOGY • MOLECULAR BASIS OF INHERITANCE',
    topic: 'DNA Replication & Enzymology',
    question:
      'During semiconservative DNA replication in cells, which key enzyme is responsible for unwinding the double helix at the replication fork by breaking hydrogen bonds between complementary bases?',
    options: [
      {
        letter: 'A',
        text: 'DNA Ligase (Molecular Glue)',
        symbol: 'ᚦ',
      },
      {
        letter: 'B',
        text: 'RNA Primase (Primer Synthesizer)',
        symbol: 'ᛟ',
      },
      {
        letter: 'C',
        text: 'DNA Helicase (Molecular Unzipper)',
        symbol: 'ᚱ',
      },
      {
        letter: 'D',
        text: 'Topoisomerase / DNA Gyrase',
        symbol: 'ᛉ',
      },
    ],
    correctIndex: 2, // Option C
    hint: 'Think of the molecular motor that acts like a zipper pull, utilizing ATP energy to unzip the double-stranded DNA template.',
    explanation:
      'DNA Helicase is the motor enzyme that binds at replication origins and moves along the duplex, hydrolyzing ATP to break hydrogen bonds between complementary base pairs (Adenine=Thymine and Guanine≡Cytosine), unwinding the double helix into single-stranded templates for DNA Polymerase.',
    points: 100,
    guardianDare: {
      guardianName: 'Warden Watson-Crick',
      guardianTitle: 'Guardian of the Genetic Codex',
      avatarEmoji: '🧬',
      reactionDialogue:
        '“A mutation in your biological cipher! The double helix remains tightly bound by hydrogen bonds!”',
      dareTitle: 'DOUBLE HELIX TWIST',
      dareDescription:
        'Twist both of your arms in a spiral helix shape in front of the webcam and proclaim: “Deoxyribonucleic Acid!”',
    },
  },
  {
    id: 'phys-lenz-law',
    questionNumber: 4,
    subject: 'Physics',
    subjectBadge: '⚡ CLASS 12 PHYSICS • ELECTROMAGNETIC INDUCTION',
    topic: 'Faraday’s Law & Lenz’s Principle',
    question:
      'In Faraday’s Law of Electromagnetic Induction (ε = -dΦ/dt), what fundamental conservation law is represented by the negative sign introduced by Lenz’s Law?',
    options: [
      {
        letter: 'A',
        text: 'Conservation of Electric Charge',
        symbol: 'ᚦ',
      },
      {
        letter: 'B',
        text: 'Conservation of Linear Momentum',
        symbol: 'ᛉ',
      },
      {
        letter: 'C',
        text: 'Conservation of Energy (Induced current opposes the flux change)',
        symbol: 'ᛟ',
      },
      {
        letter: 'D',
        text: 'Conservation of Angular Momentum',
        symbol: 'ᚱ',
      },
    ],
    correctIndex: 2, // Option C
    hint: 'Lenz’s Law states that nature opposes changes in magnetic flux. If it aided the change instead, you would create infinite mechanical energy from nothing!',
    explanation:
      'The negative sign represents Lenz’s Law, which directly embodies the Law of Conservation of Energy. The polarity of the induced EMF always opposes the change in magnetic flux producing it. Mechanical work must be done against this opposing magnetic force to generate electric energy; otherwise, energy would be created spontaneously.',
    points: 100,
    guardianDare: {
      guardianName: 'Lord Faraday',
      guardianTitle: 'Sentinel of the Magnetic Vortex',
      avatarEmoji: '🧲',
      reactionDialogue:
        '“Your flux vector just defied electromagnetic conservation! Nature resists sudden changes!”',
      dareTitle: 'WIZARD SPELLCAST POSE',
      dareDescription:
        'Strike an epic wizard spellcasting pose pointing both hands forward and shout: “LENZ’S LAW RESISTS ALL!”',
    },
  },
  {
    id: 'mod-mass-defect',
    questionNumber: 5,
    subject: 'Modern Science',
    subjectBadge: '🌌 CLASS 12 MODERN PHYSICS • NUCLEAR PHYSICS',
    topic: 'Mass Defect & Binding Energy',
    question:
      'Why is the measured mass of a stable atomic nucleus always strictly less than the combined sum of the individual rest masses of its constituent protons and neutrons?',
    options: [
      {
        letter: 'A',
        text: 'The missing mass is converted into Nuclear Binding Energy (E = Δm·c²)',
        symbol: 'ᛟ',
      },
      {
        letter: 'B',
        text: 'Neutrons continuously lose mass through neutrino emission',
        symbol: 'ᚦ',
      },
      {
        letter: 'C',
        text: 'Orbital electrons attract nuclear mass outward into the electron cloud',
        symbol: 'ᚱ',
      },
      {
        letter: 'D',
        text: 'Gravitational forces compress subatomic particles out of existence',
        symbol: 'ᛉ',
      },
    ],
    correctIndex: 0, // Option A
    hint: 'Recall Einstein’s mass-energy equivalence equation: E = Δm·c². The "mass defect" (Δm) is released as energy when the nucleus forms.',
    explanation:
      'When nucleons (protons and neutrons) bind together to form a nucleus, an immense amount of energy is released to overcome proton-proton Coulomb repulsion. By Einstein’s relation E = Δm·c², this released energy corresponds to a loss of mass called the Mass Defect (Δm = Z·m_p + (A-Z)·m_n - M_nucleus), which represents the Nuclear Binding Energy.',
    points: 100,
    guardianDare: {
      guardianName: 'Sage Einstein',
      guardianTitle: 'Keeper of Spacetime & Energy',
      avatarEmoji: '🌌',
      reactionDialogue:
        '“Relativity is bewildered! The missing mass cannot simply evaporate into thin air!”',
      dareTitle: 'QUANTUM ATOM SPIN',
      dareDescription:
        'Do a gentle 360-degree rotation in your chair like an electron in its quantum orbital, then tap your forehead and say “E = mc²!”',
    },
  },
]
