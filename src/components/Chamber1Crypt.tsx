import React, { useState, useEffect, useRef } from 'react'
import cryptBg from '../assets/crypt-bg.jpg'
import { ParticleCanvas } from './ParticleCanvas'
import { WebcamPreview } from './WebcamPreview'
import { gestureDetector } from '../vision/gestureDetector'
import { sound } from '../utils/audio'
import { SCIENCE_MYSTERIES } from '../data/scienceMysteries'
import type { ScienceMystery, MysteryProgressState } from '../types/scienceMystery'

export interface Chamber1CryptProps {
  onReturnToStart: () => void
  onCompleteChamber: (stats: { timeRemaining: number; cluesFound: number; score: number }) => void
  currentMystery: ScienceMystery
  mysteryProgress: MysteryProgressState
  onSolveMystery: (method: 'independent' | 'revealed', scoreBonus: number) => void
  onSelectMystery?: (mysteryId: string) => void
}

export const Chamber1Crypt: React.FC<Chamber1CryptProps> = ({
  onReturnToStart,
  onCompleteChamber,
  currentMystery,
  mysteryProgress,
  onSolveMystery,
  onSelectMystery,
}) => {
  // 5-minute countdown (300 seconds)
  const [secondsLeft, setSecondsLeft] = useState<number>(300)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true)

  // Selection & evaluation state
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null)
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false)
  const [showConfirmRevealModal, setShowConfirmRevealModal] = useState<boolean>(false)
  const [showIncorrectModal, setShowIncorrectModal] = useState<boolean>(false)
  const [lastIncorrectSelection, setLastIncorrectSelection] = useState<string | null>(null)

  // Tutorial / Info Modal
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false)

  // Local feedback toast
  const [feedbackToast, setFeedbackToast] = useState<{
    text: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  // Header controls
  const [isVisionHUDOpen, setIsVisionHUDOpen] = useState<boolean>(true)
  const [isAudioActive, setIsAudioActive] = useState<boolean>(() => sound.getAmbientState())
  const [handsCount, setHandsCount] = useState<number>(0)

  const toastTimerRef = useRef<number | null>(null)

  const showFeedback = (text: string, type: 'success' | 'error' | 'info') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    setFeedbackToast({ text, type })
    toastTimerRef.current = window.setTimeout(() => {
      setFeedbackToast(null)
      toastTimerRef.current = null
    }, 4000)
  }

  // 5-Minute Countdown Timer Effect
  useEffect(() => {
    const isPaused =
      !isTimerRunning ||
      showExplanationModal ||
      showConfirmRevealModal ||
      showIncorrectModal ||
      isTutorialOpen

    if (isPaused) return

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)
          setIsTimerRunning(false)
          sound.playDefeatTone()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isTimerRunning, showExplanationModal, showConfirmRevealModal, showIncorrectModal, isTutorialOpen])

  // Count unlocked clues
  const unlockedCluesCount =
    (mysteryProgress.hint1Unlocked ? 1 : 0) +
    (mysteryProgress.hint2Unlocked ? 1 : 0) +
    (mysteryProgress.finalClueUnlocked ? 1 : 0)

  // Format MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Handle Option Selection (Path A: Solve It Yourself)
  const handleSelectOption = (index: number) => {
    if (showExplanationModal || showConfirmRevealModal || showIncorrectModal || isTutorialOpen) {
      return
    }

    setSelectedOptionIndex(index)

    if (index === currentMystery.correctIndex) {
      // --- CORRECT ANSWER ---
      sound.playVictoryFanfare()
      gestureDetector.triggerFeedback('correct')

      // If not already marked as solved, award independent bonus (+500 PTS)
      if (!mysteryProgress.isSolved) {
        onSolveMystery('independent', 500)
        showFeedback('AMAZING! YOU SOLVED THE SCIENCE MYSTERY! +500 PTS', 'success')
      }

      setShowExplanationModal(true)
    } else {
      // --- INCORRECT ANSWER ---
      sound.playErrorFizzle()
      gestureDetector.triggerFeedback('incorrect')
      setLastIncorrectSelection(currentMystery.options[index])
      setShowIncorrectModal(true)
      showFeedback('Not quite! Check your clues or try another answer.', 'error')
    }
  }

  // Handle Path B: Confirmation to Reveal Answer
  const handleConfirmReveal = () => {
    sound.playVictoryFanfare()
    setShowConfirmRevealModal(false)
    setSelectedOptionIndex(currentMystery.correctIndex)

    if (!mysteryProgress.isSolved) {
      onSolveMystery('revealed', 250)
      showFeedback('Science Mystery Revealed via Vault Clues! +250 PTS', 'info')
    }

    setShowExplanationModal(true)
  }

  // Audio Toggle
  const toggleAudio = () => {
    const active = sound.toggleAmbient()
    setIsAudioActive(active)
  }

  // Letters array
  const letters = ['A', 'B', 'C', 'D']
  const runes = ['ᚦ', 'ᚱ', 'ᛉ', 'ᛟ']

  return (
    <div className="crypt-arena-root">
      {/* Background Crypt Layer */}
      <div
        className="crypt-bg-layer"
        style={{ backgroundImage: `url(${cryptBg})` }}
      >
        <div className="crypt-vignette"></div>
        <div className="crypt-mist-bottom"></div>
      </div>

      {/* Particle Canvas */}
      <ParticleCanvas />

      {/* Header Bar */}
      <header className="crypt-header">
        <div className="crypt-header-left">
          <button
            className="btn-abandon-chamber"
            onClick={onReturnToStart}
            onMouseEnter={() => sound.playHover()}
            title="Return to Portal Hub"
          >
            ← PORTAL HUB
          </button>
          <div className="crypt-chamber-badge">
            <span className="badge-gem">🔮</span>
            <span className="badge-title">PORTAL 01: THE SCIENCE MYSTERY REALM</span>
          </div>
        </div>

        {/* Timer Display */}
        <div className={`crypt-timer-display ${secondsLeft <= 60 ? 'timer-danger' : ''}`}>
          <span className="timer-icon">⏱️</span>
          <div className="timer-box">
            <span className="timer-label">INVESTIGATION TIMER</span>
            <span className="timer-digits">{formatTime(secondsLeft)}</span>
          </div>
        </div>

        {/* Live HUD Trackers */}
        <div className="crypt-header-trackers">
          {/* Clues Pill */}
          <div className="tracker-pill clues-pill" title="Clues unlocked from mini-games">
            <span className="pill-ico">🔍</span>
            <span>CLUES: <strong>{unlockedCluesCount} / 3 FOUND</strong></span>
          </div>

          {/* Mystery Status Pill */}
          <div className={`tracker-pill wards-pill ${mysteryProgress.isSolved ? 'solved-glow' : ''}`}>
            <span className="pill-ico">{mysteryProgress.isSolved ? '👑' : '⚡'}</span>
            <span>
              STATUS:{' '}
              <strong>
                {mysteryProgress.isSolved
                  ? mysteryProgress.solvedMethod === 'independent'
                    ? 'SOLVED (INDEPENDENT)'
                    : 'SOLVED (REVEALED)'
                  : 'MYSTERY ACTIVE'}
              </strong>
            </span>
          </div>
        </div>

        {/* Header Right Action Controls */}
        <div className="crypt-header-right">
          {/* How to Play Guide */}
          <button
            className="control-btn tutorial-btn"
            onClick={() => {
              sound.playHover()
              setIsTutorialOpen(true)
            }}
            title="Open Mystery Instructions"
          >
            <span className="btn-icon">📖</span>
            <span className="btn-label">MYSTERY GUIDE</span>
          </button>

          {/* Vision Sensor Toggle */}
          <button
            className={`control-btn vision-btn ${isVisionHUDOpen ? 'active' : ''}`}
            onClick={() => {
              sound.playHover()
              setIsVisionHUDOpen((prev) => !prev)
            }}
            title="Toggle Vision Camera HUD"
          >
            <span className="btn-icon">🖐️</span>
            <span className="btn-label">
              {isVisionHUDOpen
                ? handsCount > 0
                  ? `HANDS (${handsCount})`
                  : 'VISION ON'
                : 'VISION HUD'}
            </span>
          </button>

          {/* Audio Ambience Toggle */}
          <button
            className={`control-btn audio-btn ${isAudioActive ? 'active' : ''}`}
            onClick={toggleAudio}
            onMouseEnter={() => sound.playHover()}
            title="Toggle Sound Ambience"
          >
            <span className="btn-icon">{isAudioActive ? '🔊' : '🔇'}</span>
          </button>
        </div>
      </header>

      {/* Main Crypt Gameplay Stage */}
      <main className="crypt-main-stage science-mystery-stage">
        {/* Mystery Selector Pills (Expo Demo Switcher) */}
        {onSelectMystery && (
          <section className="mystery-switcher-row" aria-label="Available Science Mysteries">
            <span className="switcher-label">EXPO MYSTERIES:</span>
            {SCIENCE_MYSTERIES.map((m) => {
              const isSelected = m.id === currentMystery.id
              return (
                <button
                  key={m.id}
                  className={`mystery-select-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    sound.playHover()
                    onSelectMystery(m.id)
                  }}
                  title={`Switch to ${m.title}`}
                >
                  <span className="pill-dot">{isSelected ? '✦' : '◇'}</span>
                  <span>{m.title}</span>
                </button>
              )
            })}
          </section>
        )}

        {/* GRAND SCIENCE MYSTERY CARD (PRIMARY VISUAL FOCUS) */}
        <section className="grand-riddle-stage-container">
          <div className="grand-riddle-card science-mystery-card">
            {/* Ornate Card Corners */}
            <div className="riddle-corner rc-top-left">✦</div>
            <div className="riddle-corner rc-top-right">✦</div>
            <div className="riddle-corner rc-bottom-left">✦</div>
            <div className="riddle-corner rc-bottom-right">✦</div>

            {/* Mystery Header Bar */}
            <div className="grand-riddle-header">
              <div className="riddle-heading-box">
                <span className="riddle-number-badge">
                  SCIENCE MYSTERY • {currentMystery.difficulty.toUpperCase()}
                </span>
                <span className="riddle-category-pill">
                  ⚛️ {currentMystery.category.toUpperCase()}
                </span>
              </div>

              <div className="riddle-emblem-cluster">
                <span className="riddle-qmark-flare">❓</span>
                <span className="riddle-reward-gem">
                  {mysteryProgress.isSolved ? '✓ SOLVED' : '✦ +500 PTS SOLVE BONUS'}
                </span>
              </div>
            </div>

            {/* Mystery Title */}
            <div className="mystery-headline-area">
              <h2 className="mystery-headline-title">{currentMystery.title}</h2>
            </div>

            {/* Mystery Story Intro Box */}
            <div className="grand-story-prologue">
              <span className="story-scroll-icon">📜</span>
              <p className="story-prologue-text">"{currentMystery.story}"</p>
            </div>

            {/* Prominent High-Contrast Riddle Display */}
            <div className="grand-question-display mystery-riddle-display">
              <div className="riddle-quote-lines">
                {currentMystery.riddle.split('\n').map((line, idx) => (
                  <p key={idx} className="riddle-line-item">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* CLUES PROGRESS BOARD (INTEGRATED HINT DISPLAY) */}
            <div className="mystery-clues-board" aria-label="Unlocked Science Clues">
              <div className="clues-board-header">
                <span className="clues-board-title">
                  💡 VAULT CLUES BOARD ({unlockedCluesCount} / 3 DISCOVERED)
                </span>
                <span className="clues-board-subtitle">
                  Play mini-games in Portals 2, 3 & 4 to unlock progressive clues!
                </span>
              </div>

              <div className="clues-cards-grid">
                {/* Clue 1: Portal 2 Magic Coin Catcher */}
                <div
                  className={`mystery-clue-tile ${
                    mysteryProgress.hint1Unlocked ? 'clue-tile-unlocked' : 'clue-tile-locked'
                  }`}
                >
                  <div className="clue-tile-header">
                    <span className="tile-icon">
                      {mysteryProgress.hint1Unlocked ? '💡' : '🔒'}
                    </span>
                    <span className="tile-name">HINT 1 • PORTAL 2</span>
                  </div>
                  <div className="clue-tile-content">
                    {mysteryProgress.hint1Unlocked ? (
                      <p className="clue-text-quote">"{currentMystery.hint1}"</p>
                    ) : (
                      <p className="clue-locked-hint">
                        🔒 Collect <strong>200 PTS</strong> in Portal 2: Magic Coin Catcher to unveil.
                      </p>
                    )}
                  </div>
                </div>

                {/* Clue 2: Portal 3 Guardian's Funny Trap */}
                <div
                  className={`mystery-clue-tile ${
                    mysteryProgress.hint2Unlocked ? 'clue-tile-unlocked' : 'clue-tile-locked'
                  }`}
                >
                  <div className="clue-tile-header">
                    <span className="tile-icon">
                      {mysteryProgress.hint2Unlocked ? '💡' : '🔒'}
                    </span>
                    <span className="tile-name">HINT 2 • PORTAL 3</span>
                  </div>
                  <div className="clue-tile-content">
                    {mysteryProgress.hint2Unlocked ? (
                      <p className="clue-text-quote">"{currentMystery.hint2}"</p>
                    ) : (
                      <p className="clue-locked-hint">
                        🔒 Survive <strong>15s</strong> in Portal 3: Guardian's Funny Trap to unveil.
                      </p>
                    )}
                  </div>
                </div>

                {/* Final Clue: Portal 4 Boss Escape */}
                <div
                  className={`mystery-clue-tile final-clue-tile ${
                    mysteryProgress.finalClueUnlocked ? 'clue-tile-unlocked' : 'clue-tile-locked'
                  }`}
                >
                  <div className="clue-tile-header">
                    <span className="tile-icon">
                      {mysteryProgress.finalClueUnlocked ? '👑' : '🔒'}
                    </span>
                    <span className="tile-name">FINAL CLUE • PORTAL 4</span>
                  </div>
                  <div className="clue-tile-content">
                    {mysteryProgress.finalClueUnlocked ? (
                      <p className="clue-text-quote">"{currentMystery.finalClue}"</p>
                    ) : (
                      <p className="clue-locked-hint">
                        🔒 Defeat <strong>Arch-Guardian Ignis</strong> in Boss Escape to unveil.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 SELECTABLE ANSWER OPTIONS (PATH A) */}
            <div className="grand-options-grid" aria-label="Science Mystery Options">
              {currentMystery.options.map((optionText, idx) => {
                const isSelected = selectedOptionIndex === idx
                const isCorrect = idx === currentMystery.correctIndex
                const isSolvedOrRevealed = mysteryProgress.isSolved

                let stateClass = ''
                if (isSolvedOrRevealed && isCorrect) stateClass = 'option-correct'
                else if (isSelected && isCorrect) stateClass = 'option-correct'
                else if (isSelected && !isCorrect) stateClass = 'option-incorrect'

                return (
                  <div
                    key={letters[idx]}
                    className={`grand-option-button ${stateClass}`}
                    onClick={() => handleSelectOption(idx)}
                    onMouseEnter={() => sound.playHover()}
                    role="button"
                    tabIndex={0}
                    data-selectable="true"
                    aria-label={`Option ${letters[idx]}: ${optionText}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelectOption(idx)
                      }
                    }}
                  >
                    {/* Letter Badge */}
                    <div className="option-letter-badge">
                      <span>{letters[idx]}</span>
                    </div>

                    {/* Option Text */}
                    <div className="option-label-content">
                      <span className="option-symbol-icon">{runes[idx]}</span>
                      <span className="option-title-text">{optionText}</span>
                    </div>

                    {/* Selection Cue */}
                    <div className="option-select-cue">
                      {isSolvedOrRevealed && isCorrect
                        ? '✓ CORRECT'
                        : isSelected && !isCorrect
                        ? '✗ RETRY'
                        : 'PINCH / CLICK'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* PATH B: REVEAL FINAL ANSWER ACTION BAR */}
            <div className="mystery-path-b-bar">
              <div className="path-b-info">
                <span className="path-b-label">PATH B • VAULT REVEAL POWER:</span>
                <span className="path-b-status">
                  {mysteryProgress.finalClueUnlocked
                    ? '⚡ UNLOCKED! Ready to reveal (+250 PTS bonus)'
                    : '🔒 LOCKED: Defeat Arch-Guardian Ignis in Portal 4 to enable'}
                </span>
              </div>

              <button
                type="button"
                className={`btn-reveal-answer ${
                  mysteryProgress.finalClueUnlocked ? 'reveal-enabled' : 'reveal-disabled'
                }`}
                disabled={!mysteryProgress.finalClueUnlocked}
                onClick={() => {
                  if (mysteryProgress.finalClueUnlocked) {
                    sound.playStartSpell()
                    setShowConfirmRevealModal(true)
                  }
                }}
                data-selectable="true"
                title={
                  mysteryProgress.finalClueUnlocked
                    ? 'Reveal the answer with claimed clues (+250 PTS)'
                    : 'Defeat Boss in Portal 4 to unlock reveal ability'
                }
              >
                <span className="btn-reveal-icon">
                  {mysteryProgress.finalClueUnlocked ? '🔓' : '🔒'}
                </span>
                <span className="btn-reveal-text">REVEAL THE ANSWER</span>
              </button>

              {mysteryProgress.isSolved && (
                <button
                  type="button"
                  className="btn-view-explanation"
                  onClick={() => {
                    sound.playHover()
                    setShowExplanationModal(true)
                  }}
                  data-selectable="true"
                >
                  📖 VIEW SCIENTIFIC EXPLANATION
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Temporary Feedback Toast */}
        {feedbackToast && (
          <div className={`crypt-feedback-toast ${feedbackToast.type}`}>
            <span className="toast-text">{feedbackToast.text}</span>
          </div>
        )}
      </main>

      {/* Docked Webcam Hand Tracking Preview HUD */}
      {isVisionHUDOpen && (
        <aside className="vision-hud-dock" aria-label="Webcam Hand Tracking HUD">
          <WebcamPreview onHandsDetectedChange={setHandsCount} />
        </aside>
      )}

      {/* CONFIRMATION DIALOG: REVEAL THE ANSWER (PATH B) */}
      {showConfirmRevealModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowConfirmRevealModal(false)}
        >
          <div
            className="modal-container ancient-codex confirm-reveal-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="corner c-top-left">✦</div>
            <div className="corner c-top-right">✦</div>
            <div className="corner c-bottom-left">✦</div>
            <div className="corner c-bottom-right">✦</div>

            <div className="modal-header">
              <span className="header-eyebrow gold">GRAND SCIENCE VAULT OVERRIDE</span>
              <h2 className="modal-title">Ready to reveal the final answer?</h2>
            </div>

            <div className="modal-body custom-scrollbar">
              <p className="confirm-reveal-desc">
                You have conquered Arch-Guardian Ignis and claimed the <strong>Final Clue</strong>!
              </p>
              <div className="scoring-comparison-card">
                <div className="score-path-row path-independent">
                  <span>PATH A (Solve Independently):</span>
                  <strong>+500 PTS BONUS</strong>
                </div>
                <div className="score-path-row path-revealed active">
                  <span>PATH B (Reveal via Clues):</span>
                  <strong>+250 PTS BONUS</strong>
                </div>
              </div>
              <p className="confirm-subtext">
                Revealing will display the scientific concept, comprehensive explanation, and trivia fact, marking the mystery as revealed.
              </p>
            </div>

            <div className="modal-footer">
              <div className="confirm-actions-row">
                <button
                  type="button"
                  className="modal-action-btn victory-btn"
                  onClick={handleConfirmReveal}
                  data-selectable="true"
                >
                  ⚡ YES, REVEAL ANSWER (+250 PTS)
                </button>
                <button
                  type="button"
                  className="modal-action-btn cancel-btn"
                  onClick={() => setShowConfirmRevealModal(false)}
                  data-selectable="true"
                >
                  ❌ CANCEL, I'LL GUESS MYSELF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENCOURAGING INCORRECT ANSWER FEEDBACK MODAL */}
      {showIncorrectModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowIncorrectModal(false)}
        >
          <div
            className="modal-container ancient-codex incorrect-feedback-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="corner c-top-left">✦</div>
            <div className="corner c-top-right">✦</div>
            <div className="corner c-bottom-left">✦</div>
            <div className="corner c-bottom-right">✦</div>

            <div className="modal-header">
              <span className="header-eyebrow red">HYPOTHESIS REQUIRES REVISION</span>
              <h2 className="modal-title" style={{ color: '#fca5a5' }}>
                Not Quite the Answer!
              </h2>
            </div>

            <div className="modal-body custom-scrollbar">
              <div className="incorrect-quote-box">
                <span className="quote-icon">🔬</span>
                <p>
                  You selected <strong>"{lastIncorrectSelection}"</strong>. While related in science, that phenomenon doesn't match all conditions in the mystery riddle.
                </p>
              </div>

              <div className="encouraging-tips-box">
                <span className="tip-star">💡</span>
                <div className="tip-text">
                  <strong>Investigator's Advice:</strong>
                  <p>
                    Re-read the riddle lines carefully! If you need more clues, jump into <strong>Portal 2</strong> for Hint 1 or <strong>Portal 3</strong> for Hint 2.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="incorrect-actions-row">
                <button
                  type="button"
                  className="modal-action-btn retry-btn"
                  onClick={() => setShowIncorrectModal(false)}
                  data-selectable="true"
                >
                  🔄 RETRY RIDDLE
                </button>
                <button
                  type="button"
                  className="modal-action-btn go-hub-btn"
                  onClick={onReturnToStart}
                  data-selectable="true"
                >
                  🌀 GO GATHER CLUES IN MINI-GAMES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRAND SCIENTIFIC EXPLANATION MODAL (CORRECT / REVEALED) */}
      {showExplanationModal && (
        <div
          className="modal-backdrop victory-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowExplanationModal(false)}
        >
          <div
            className="modal-container ancient-codex explanation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="corner c-top-left">✦</div>
            <div className="corner c-top-right">✦</div>
            <div className="corner c-bottom-left">✦</div>
            <div className="corner c-bottom-right">✦</div>

            <div className="victory-halo-flare"></div>

            <div className="modal-header">
              <span className="victory-crown">👑</span>
              <span className="header-eyebrow gold">
                {mysteryProgress.solvedMethod === 'independent'
                  ? 'INDEPENDENT SCIENTIFIC TRIUMPH (+500 PTS)'
                  : 'VAULT CLUE SYNTHESIS (+250 PTS)'}
              </span>
              <h2 className="modal-title victory-title">
                AMAZING! YOU SOLVED THE SCIENCE MYSTERY!
              </h2>
            </div>

            <div className="modal-body custom-scrollbar">
              {/* Correct Answer Highlight Box */}
              <div className="correct-answer-banner">
                <span className="answer-tag">THE MYSTERIOUS PHENOMENON IS:</span>
                <h1 className="answer-title">
                  {currentMystery.options[currentMystery.correctIndex].toUpperCase()}
                </h1>
                <div className="answer-formula-pill">
                  <span>⚛️ {currentMystery.formulaOrConcept}</span>
                </div>
              </div>

              {/* Scientific Concept & Explanation Card */}
              <div className="explanation-content-card">
                <h3 className="section-title">
                  <span className="section-icon">🔬</span>
                  <span>Scientific Explanation</span>
                </h3>
                <p className="explanation-body-text">
                  {currentMystery.scientificExplanation}
                </p>
              </div>

              {/* Interesting Science Fact Card */}
              <div className="science-fact-card">
                <h3 className="section-title">
                  <span className="section-icon">🌟</span>
                  <span>Did You Know? (Science Expo Fact)</span>
                </h3>
                <p className="fact-body-text">{currentMystery.interestingFact}</p>
              </div>
            </div>

            <div className="modal-footer">
              <div className="explanation-actions-row">
                <button
                  type="button"
                  className="modal-action-btn victory-btn"
                  onClick={() => {
                    sound.playStartSpell()
                    setShowExplanationModal(false)
                    onCompleteChamber({
                      timeRemaining: secondsLeft,
                      cluesFound: unlockedCluesCount,
                      score: mysteryProgress.solvedMethod === 'independent' ? 500 : 250,
                    })
                  }}
                  data-selectable="true"
                >
                  👑 CLAIM GLORY & RETURN TO PORTAL HUB
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOW TO PLAY TUTORIAL MODAL */}
      {isTutorialOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsTutorialOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-container ancient-codex tutorial-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="corner c-top-left">✦</div>
            <div className="corner c-top-right">✦</div>
            <div className="corner c-bottom-left">✦</div>
            <div className="corner c-bottom-right">✦</div>

            <div className="modal-header">
              <span className="header-eyebrow">PORTAL I • SCIENCE MYSTERY ADVENTURE</span>
              <h2 className="modal-title">HOW TO SOLVE THE SCIENCE MYSTERY</h2>
            </div>

            <div className="modal-body custom-scrollbar">
              <div className="tutorial-steps-grid">
                <div className="tutorial-step-card">
                  <div className="step-badge">1</div>
                  <div className="step-icon">📜</div>
                  <div className="step-info">
                    <h4>Analyze The Riddle</h4>
                    <p>Read the mystery story and riddle carefully. Think about scientific laws from Class 11 & 12.</p>
                  </div>
                </div>

                <div className="tutorial-step-card">
                  <div className="step-badge">2</div>
                  <div className="step-icon">💡</div>
                  <div className="step-info">
                    <h4>Collect Clues In Mini-Games</h4>
                    <p>Portal 2 unlocks Hint 1 (200 PTS). Portal 3 unlocks Hint 2 (Survive 15s). Portal 4 unlocks the Final Clue.</p>
                  </div>
                </div>

                <div className="tutorial-step-card">
                  <div className="step-badge">3</div>
                  <div className="step-icon">🤏</div>
                  <div className="step-info">
                    <h4>Pinch Or Click To Answer</h4>
                    <p>Aim your hand cursor over options A, B, C, or D and pinch thumb + index finger to select.</p>
                  </div>
                </div>

                <div className="tutorial-step-card">
                  <div className="step-badge">4</div>
                  <div className="step-icon">⭐</div>
                  <div className="step-info">
                    <h4>Solve vs Reveal</h4>
                    <p>Solving independently awards +500 PTS! Defeating the Boss in Portal 4 enables the Reveal Power (+250 PTS).</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-action-btn start-tutorial-btn"
                onClick={() => setIsTutorialOpen(false)}
                data-selectable="true"
              >
                🚀 BEGIN INVESTIGATION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
