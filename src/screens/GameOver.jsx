import { useEffect } from 'react'
import { playSFX } from '../audioManager'
import './EndScreens.css'

export default function GameOver({ result, onRetry, balance }) {
  // 🔊 Play game over sting on mount
  useEffect(() => {
    playSFX('gameOver')
  }, [])

  const reason =
    result?.reason === 'pirate_ship'
      ? 'The Pirate Ship claimed your fortune!'
      : result?.reason === 'dead_waters'
        ? 'Dead Waters swallowed your treasure.'
        : result?.reason === 'bomb_dead_waters'
          ? 'The explosion uncovered deadly waters!'
          : result?.reason === 'double_or_nothing'
            ? 'Double or nothing... and nothing it is.'
            : 'The sea takes what it pleases.'

  return (
    <div className="end-screen game-over-screen">
      <div className="end-content game-over-content">
        <div className="go-skull-icon">☠️</div>
        <h1 className="end-title game-over-title">GAME OVER</h1>
        <p className="end-reason">{reason}</p>
        <div className="end-stats">
          <div className="end-stat">
            <div className="end-stat-label">BET LOST</div>
            <div className="end-stat-value lost">
              ${result?.bet?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="end-stat">
            <div className="end-stat-label">MULTIPLIER</div>
            <div className="end-stat-value">
              x{result?.multiplier?.toFixed(1) || '1.0'}
            </div>
          </div>
        </div>
        <div className="end-balance">
          Balance:{' '}
          <span className="end-balance-amount">${balance?.toFixed(2)}</span>
        </div>
        <div className="end-buttons">
          <button
            className="end-btn retry-btn"
            onClick={() => {
              playSFX('buttonClick')
              onRetry()
            }}
          >
            <span className="btn-icon">💀</span> RETRY
          </button>
          <button
            className="end-btn exit-btn"
            onClick={() => {
              playSFX('buttonClick')
              onRetry()
            }}
          >
            <span className="btn-icon">⚓</span> EXIT
          </button>
        </div>
      </div>
    </div>
  )
}
