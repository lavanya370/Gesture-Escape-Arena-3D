import React from 'react'
import { CameraProvider } from './context/CameraContext'
import { GameProvider, useGame } from './context/GameContext'
import { StartScreen } from './components/StartScreen'
import { PortalHub } from './components/PortalHub'
import { RiddleRealm } from './components/RiddleRealm'
import { MagicCoinCatcher } from './components/MagicCoinCatcher'
import { NumberGateChallenge } from './components/NumberGateChallenge'
import { GuardiansFunnyTrap } from './components/GuardiansFunnyTrap'
import { BossEscape } from './components/BossEscape'
import { HandCursor } from './components/HandCursor'
import './App.css'

const AppContent: React.FC = () => {
  const { currentView, setCurrentView, totalScore, highScore, hints, isCompleted, startNewGameSession } = useGame()

  const portalsCompleted = {
    portal1: isCompleted,
    portal2: hints.hint1.unlocked,
    portal3: hints.hint2.unlocked,
    portal4: hints.hint3.unlocked,
  }

  const handleSelectPortal = (portalId: 'portal1' | 'portal2' | 'portal3' | 'portal4') => {
    if (portalId === 'portal1') {
      setCurrentView('riddle-realm')
    } else if (portalId === 'portal2') {
      setCurrentView('coin-catcher')
    } else if (portalId === 'portal3') {
      setCurrentView('number-gate')
    } else if (portalId === 'portal4') {
      setCurrentView('funny-trap')
    }
  }

  return (
    <>
      {currentView === 'start' && (
        <StartScreen
          onEnterArena={() => {
            startNewGameSession()
          }}
          onEnterChamber1={() => {
            startNewGameSession()
          }}
          isChamber1Completed={isCompleted}
          totalScore={totalScore}
        />
      )}

      {currentView === 'hub' && (
        <PortalHub
          totalScore={totalScore}
          highScore={highScore}
          portalsCompleted={portalsCompleted}
          onSelectPortal={handleSelectPortal}
          onReturnToStart={() => setCurrentView('start')}
        />
      )}

      {currentView === 'riddle-realm' && <RiddleRealm />}

      {currentView === 'coin-catcher' && (
        <MagicCoinCatcher
          onReturnToHub={() => setCurrentView('start')}
        />
      )}

      {currentView === 'number-gate' && <NumberGateChallenge />}

      {currentView === 'funny-trap' && (
        <GuardiansFunnyTrap
          onReturnToHub={() => setCurrentView('riddle-realm')}
        />
      )}

      {currentView === 'boss-escape' && (
        <BossEscape
          onReturnToHub={() => setCurrentView('hub')}
          onCompleteBossEscape={() => setCurrentView('hub')}
        />
      )}

      {/* Magical Cyber-Fantasy Hand Cursor */}
      <HandCursor />
    </>
  )
}

export const App: React.FC = () => {
  return (
    <CameraProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </CameraProvider>
  )
}

export default App
