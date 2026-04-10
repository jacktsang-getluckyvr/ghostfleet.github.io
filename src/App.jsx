import { useState, useCallback, useEffect, useRef } from 'react'
import BetSetup from './screens/BetSetup'
import MainGame from './screens/MainGame'
import GameOver from './screens/GameOver'
import CashOut from './screens/CashOut'
import Particles from './components/Particles'
import {
  incrementRoundCount,
  getBalance,
  deductFromBalance,
  addToBalance,
  recordWager,
  recordWin,
} from './gameEngine'
import {
  initAudio,
  startMusic,
  fadeMusic,
  toggleMute,
  isMuted as getIsMuted,
} from './audioManager'
import './App.css'

const SCREENS = {
  BET_SETUP: 'bet_setup',
  MAIN_GAME: 'main_game',
  GAME_OVER: 'game_over',
  CASH_OUT: 'cash_out',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.BET_SETUP)
  const [bet, setBet] = useState(2)
  const [balance, setBalanceState] = useState(getBalance)
  const [lastResult, setLastResult] = useState(null)
  const [isNightTide, setIsNightTide] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)
  const audioInitRef = useRef(false)

  const refreshBalance = () => setBalanceState(getBalance())

  // Audio: init on first click anywhere in the app
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!audioInitRef.current) {
        initAudio()
        startMusic()
        audioInitRef.current = true
      }
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)
    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [])

  // Audio: manage music volume per screen
  useEffect(() => {
    if (!audioInitRef.current) return
    switch (screen) {
      case SCREENS.MAIN_GAME:
        fadeMusic(0.25, 800)
        startMusic()
        break
      case SCREENS.GAME_OVER:
        fadeMusic(0.08, 600)
        break
      case SCREENS.CASH_OUT:
        fadeMusic(0.12, 600)
        break
      case SCREENS.BET_SETUP:
        fadeMusic(0.3, 1000)
        startMusic()
        break
    }
  }, [screen])

  const handleToggleMute = useCallback(() => {
    const nowMuted = toggleMute()
    setAudioMuted(nowMuted)
  }, [])

  const handlePlay = useCallback((betAmount) => {
    setBet(betAmount)
    deductFromBalance(betAmount)
    recordWager(betAmount)
    setBalanceState(getBalance())
    const round = incrementRoundCount()
    const nightTide = round % 3 === 0
    setIsNightTide(nightTide)
    setScreen(SCREENS.MAIN_GAME)
  }, [])

  const handleGameOver = useCallback((result) => {
    setLastResult(result)
    refreshBalance()
    setScreen(SCREENS.GAME_OVER)
  }, [])

  const handleCashOut = useCallback((result) => {
    if (result.win > 0) {
      addToBalance(result.win)
      recordWin(result.win)
    }
    setLastResult(result)
    refreshBalance()
    setScreen(SCREENS.CASH_OUT)
  }, [])

  const handleRetry = useCallback(() => {
    refreshBalance()
    setScreen(SCREENS.BET_SETUP)
    setLastResult(null)
  }, [])

  return (
    <div className="app-container">
      <div className="app-bg-overlay" />
      <Particles />

      {/* Mute toggle */}
      <button
        className="mute-toggle"
        onClick={handleToggleMute}
        title={audioMuted ? 'Unmute' : 'Mute'}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%', width: 44, height: 44, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 20,
          cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}
      >
        {audioMuted ? '\u{1F507}' : '\u{1F50A}'}
      </button>

      {screen === SCREENS.BET_SETUP && (
        <BetSetup onPlay={handlePlay} initialBet={bet} balance={balance} />
      )}
      {screen === SCREENS.MAIN_GAME && (
        <MainGame
          bet={bet}
          onGameOver={handleGameOver}
          onCashOut={handleCashOut}
          onExit={handleRetry}
          isNightTide={isNightTide}
        />
      )}
      {screen === SCREENS.GAME_OVER && (
        <GameOver result={lastResult} onRetry={handleRetry} balance={balance} />
      )}
      {screen === SCREENS.CASH_OUT && (
        <CashOut result={lastResult} onContinue={handleRetry} balance={balance} />
      )}
    </div>
  )
}
