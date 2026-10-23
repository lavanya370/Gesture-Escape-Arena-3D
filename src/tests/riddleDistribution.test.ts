function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg)
}
import { RIDDLES_POOL } from '../data/riddlesPool'

console.log('=== TEST SUITE: Riddle Option Distribution & Answer Validation ===\n')

// 1. Check total count
const totalRiddles = RIDDLES_POOL.length
console.log(`Total questions in pool: ${totalRiddles}`)
assert(totalRiddles === 19, `Expected 19 riddles in RIDDLES_POOL, found ${totalRiddles}`)

// 2. Check each question's properties and correct answer position
const counts: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 }
const letters = ['A', 'B', 'C', 'D'] as const
const positions: Array<'A' | 'B' | 'C' | 'D'> = []

RIDDLES_POOL.forEach((riddle, idx) => {
  assert(riddle.id && riddle.id.length > 0, `Riddle ${idx} must have valid id`)
  assert(riddle.title && riddle.title.length > 0, `Riddle ${riddle.id} must have valid title`)
  assert(riddle.question && riddle.question.length > 0, `Riddle ${riddle.id} must have valid question`)
  assert(Array.isArray(riddle.options) && riddle.options.length === 4, `Riddle ${riddle.id} must have 4 options`)
  assert(riddle.correctAnswer && riddle.correctAnswer.length > 0, `Riddle ${riddle.id} must have correctAnswer`)

  // Check uniqueness of 4 options
  const uniqueOptions = new Set(riddle.options.map((o) => o.trim().toUpperCase()))
  assert(uniqueOptions.size === 4, `Riddle ${riddle.id} options must all be unique`)

  // Check correct answer exists in options
  const target = riddle.correctAnswer.trim().toUpperCase()
  const correctIdx = riddle.options.findIndex((opt) => opt.trim().toUpperCase() === target)
  assert(correctIdx !== -1, `Riddle ${riddle.id} correctAnswer "${riddle.correctAnswer}" not found in options!`)

  const letter = letters[correctIdx]
  counts[letter]++
  positions.push(letter)

  console.log(
    `Question ${idx + 1} [${riddle.id}]: Correct = "${riddle.correctAnswer}" -> Option ${letter} (index ${correctIdx}) | Options: [${riddle.options.join(', ')}]`
  )
})

console.log('\nFinal distribution across options:', counts)

// 3. Verify balanced distribution: A: 5, B: 4, C: 5, D: 5
assert(counts.A === 5, `Expected 5 Option A answers, got ${counts.A}`)
assert(counts.B === 4, `Expected 4 Option B answers, got ${counts.B}`)
assert(counts.C === 5, `Expected 5 Option C answers, got ${counts.C}`)
assert(counts.D === 5, `Expected 5 Option D answers, got ${counts.D}`)
console.log('✓ PASS: All 4 options (A, B, C, D) have balanced distribution (A:5, B:4, C:5, D:5)!')

// 4. Verify Option B is no longer dominant
assert(counts.B < totalRiddles / 2, `Option B should not dominate (got ${counts.B}/${totalRiddles})`)
console.log('✓ PASS: Option B is not always the correct answer (only 4/19 = ~21%).')

// 5. Verify no consecutive riddles share the exact same option position
for (let i = 0; i < positions.length - 1; i++) {
  assert(
    positions[i] !== positions[i + 1],
    `Questions ${i + 1} and ${i + 2} have repeating answer position "${positions[i]}"`
  )
}
console.log('✓ PASS: No consecutive questions share the same correct answer position!')

// 6. Test Answer Validation logic against all 19 riddles
console.log('\nTesting answer validation function for each riddle...')
function validateAnswer(
  riddle: (typeof RIDDLES_POOL)[0],
  answer: string
): boolean {
  const cleanAnswer = answer.trim().toUpperCase()
  const target = riddle.correctAnswer.toUpperCase()
  const correctIndex = riddle.options.findIndex(
    (opt) => opt.trim().toUpperCase() === target
  )
  const correctLetter = ['A', 'B', 'C', 'D'][correctIndex] || ''

  return (
    cleanAnswer === target ||
    cleanAnswer.endsWith(target) ||
    cleanAnswer.includes(target) ||
    (correctLetter !== '' && (
      cleanAnswer === correctLetter ||
      cleanAnswer === `${correctLetter}.` ||
      cleanAnswer === `OPTION ${correctLetter}` ||
      cleanAnswer === `(${correctLetter})` ||
      cleanAnswer.startsWith(`${correctLetter}.`) ||
      cleanAnswer.startsWith(`${correctLetter}:`) ||
      cleanAnswer.startsWith(`OPTION ${correctLetter}:`) ||
      cleanAnswer.startsWith(`OPTION ${correctLetter}.`)
    ))
  )
}

RIDDLES_POOL.forEach((riddle, idx) => {
  const target = riddle.correctAnswer
  const correctIdx = riddle.options.findIndex((opt) => opt.toUpperCase() === target.toUpperCase())
  const correctLetter = letters[correctIdx]

  // Positive tests
  assert(validateAnswer(riddle, target), `Riddle ${idx} should accept target text: ${target}`)
  assert(validateAnswer(riddle, target.toLowerCase()), `Riddle ${idx} should accept lowercase text`)
  assert(validateAnswer(riddle, correctLetter), `Riddle ${idx} should accept letter: ${correctLetter}`)
  assert(validateAnswer(riddle, `Option ${correctLetter}`), `Riddle ${idx} should accept "Option ${correctLetter}"`)
  assert(validateAnswer(riddle, `${correctLetter}. ${target}`), `Riddle ${idx} should accept "${correctLetter}. ${target}"`)

  // Negative tests (all 3 wrong options must fail)
  riddle.options.forEach((opt, optIdx) => {
    if (optIdx !== correctIdx) {
      assert(
        !validateAnswer(riddle, opt),
        `Riddle ${idx} must reject wrong option text "${opt}" (correct is "${target}")`
      )
      const wrongLetter = letters[optIdx]
      assert(
        !validateAnswer(riddle, wrongLetter),
        `Riddle ${idx} must reject wrong letter "${wrongLetter}" (correct is "${correctLetter}")`
      )
      assert(
        !validateAnswer(riddle, `Option ${wrongLetter}`),
        `Riddle ${idx} must reject "Option ${wrongLetter}"`
      )
    }
  })
})

console.log('✓ PASS: All 19 riddles accurately validated for correct and incorrect answers!')
console.log('\n========================================')
console.log('All Riddle Distribution & Validation Tests PASSED!')
console.log('========================================\n')
