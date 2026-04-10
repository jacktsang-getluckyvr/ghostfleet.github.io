import { useState } from 'react'
import {
  getPersonalBest,
  getRoundCount,
  getTotalWon,
  getBiggestWin,
  resetBalance,
} from '../gameEngine'
import { playSFX } from '../audioManager'
import './BetSetup.css'

const PRESETS = [0.5, 1, 2, 5, 10]

export default function BetSetup({ onPlay, initialBet, balance }) {
  const [bet, setBet] = useState(Math.min(initialBet || 2, balance))
  const personalBest = getPersonalBest()
  const roundCount = getRoundCount()
  const isNextNightTide = (roundCount + 1) % 3 === 0
  const totalWon = getTotalWon()
  const biggestWin = getBiggestWin()

  const adjust = (delta) => {
    // 🔊 Bet adjustment tick
    playSFX('betAdjust')
    setBet((prev) => {
      const next = +(prev + delta).toFixed(2)
      return Math.max(0.5, Math.min(Math.min(10, balance), next))
    })
  }

  const handleReset = () => {
    playSFX('buttonClick')
    resetBalance()
    window.location.reload()
  }

  const canPlay = balance >= 0.5

  return (
    <div className="bet-setup">
      <div className="bet-setup-content">
        <div className="bet-logo">
          <div className="bet-logo-ornament">
            <svg viewBox="0 0 120 80" className="skull-icon">
              <defs>
                <filter id="skullGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <ellipse
                cx="60"
                cy="30"
                rx="22"
                ry="24"
                fill="none"
                stroke="#00bfff"
                strokeWidth="2"
                filter="url(#skullGlow)"
              />
              <circle cx="52" cy="26" r="5" fill="#00bfff" opacity="0.8" />
              <circle cx="68" cy="26" r="5" fill="#00bfff" opacity="0.8" />
              <path
                d="M55 36 Q60 40 65 36"
                fill="none"
                stroke="#00bfff"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <path
                d="M30 55 L90 55"
                stroke="#00bfff"
                strokeWidth="3"
                opacity="0.5"
                strokeLinecap="round"
              />
              <circle cx="28" cy="52" r="3" fill="#00bfff" opacity="0.4" />
              <circle cx="28" cy="58" r="3" fill="#00bfff" opacity="0.4" />
              <circle cx="92" cy="52" r="3" fill="#00bfff" opacity="0.4" />
              <circle cx="92" cy="58" r="3" fill="#00bfff" opacity="0.4" />
              <path
                d="M35 45 L85 65"
                stroke="#00bfff"
                strokeWidth="3"
                opacity="0.4"
                strokeLinecap="round"
              />
              <path
                d="M35 65 L85 45"
                stroke="#00bfff"
                strokeWidth="3"
                opacity="0.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="bet-title">Ghost Fleet</h1>
          <h2 className="bet-subtitle">Gamble</h2>
          <div className="bet-title-underline" />
        </div>

        {/* Balance display */}
        <div className="balance-display">
          <span className="balance-label">BALANCE</span>
          <span className="balance-amount">${balance.toFixed(2)}</span>
        </div>

        {/* Stats row */}
        {(totalWon > 0 || personalBest > 0) && (
          <div className="stats-row">
            {personalBest > 0 && (
              <div className="stat-chip">
                Best:{' '}
                <span className="stat-value gold">
                  x{personalBest.toFixed(1)}
                </span>
              </div>
            )}
            {totalWon > 0 && (
              <div className="stat-chip">
                Won:{' '}
                <span className="stat-value green">
                  ${totalWon.toFixed(2)}
                </span>
              </div>
            )}
            {biggestWin > 0 && (
              <div className="stat-chip">
                Top:{' '}
                <span className="stat-value green">
                  ${biggestWin.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {isNextNightTide && (
          <div className="night-tide-indicator">
            🌙 Night Tide round incoming!
          </div>
        )}

        <p className="bet-instruction">SELECT YOUR BET</p>

        <div className="bet-stepper-container">
          <div className="bet-stepper">
            <button className="bet-stepper-btn" onClick={() => adjust(-0.5)}>
              −
            </button>
            <div className="bet-stepper-value">${bet.toFixed(2)}</div>
            <button className="bet-stepper-btn" onClick={() => adjust(0.5)}>
              +
            </button>
          </div>
        </div>

        <div className="bet-presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              className={`bet-preset ${bet === p ? 'active' : ''} ${p > balance ? 'disabled-preset' : ''}`}
              onClick={() => {
                if (p <= balance) {
                  playSFX('betAdjust')
                  setBet(p)
                }
              }}
              disabled={p > balance}
            >
              ${p % 1 === 0 ? p : p.toFixed(2)}
            </button>
          ))}
        </div>

        {canPlay ? (
          <button
            className="bet-play-btn"
            onClick={() => {
              // 🔊 Play button
              playSFX('buttonClick')
              onPlay(bet)
            }}
          >
            <span className="bet-play-text">PLAY</span>
          </button>
        ) : (
          <div className="broke-section">
            <p className="broke-text">Your coffers are empty, captain.</p>
            <button className="reset-btn" onClick={handleReset}>
              Start Fresh ($100.00)
            </button>
          </div>
        )}

        <p className="bet-helper">
          {canPlay ? 'Choose your stake and test your luck.' : ''}
        </p>
      </div>
    </div>
  )
}
