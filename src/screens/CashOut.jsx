import { playSFX } from '../audioManager'
import './EndScreens.css'

export default function CashOut({ result, onContinue, balance }) {
  // Note: cashout SFX is triggered in MainGame.jsx when the player cashes out.
  // No duplicate sound needed here.

  return (
    <div className="end-screen cashout-screen">
      <div className="end-content cashout-content">
        <button
          className="co-close"
          onClick={() => {
            playSFX('buttonClick')
            onContinue()
          }}
        >
          ✕
        </button>
        <h1 className="end-title cashout-title">CASH OUT</h1>
        <div className="co-divider" />
        <div className="cashout-amount-display">
          <span className="cashout-dollar">$</span>
          <span className="cashout-number">
            {result?.win?.toFixed(2) || '0.00'}
          </span>
        </div>
        {result?.doubled && <div className="doubled-badge">DOUBLED!</div>}
        <div className="end-stats">
          <div className="end-stat">
            <div className="end-stat-label">BET</div>
            <div className="end-stat-value">
              ${result?.bet?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="end-stat">
            <div className="end-stat-label">MULTIPLIER</div>
            <div className="end-stat-value">
              x{result?.multiplier?.toFixed(1) || '1.0'}
            </div>
          </div>
          {result?.ghostBonus > 0 && (
            <div className="end-stat">
              <div className="end-stat-label">GHOST BONUS</div>
              <div className="end-stat-value ghost-bonus">
                +x{result.ghostBonus}
              </div>
            </div>
          )}
        </div>
        <div className="end-balance">
          Balance:{' '}
          <span className="end-balance-amount">${balance?.toFixed(2)}</span>
        </div>
        <button
          className="end-btn confirm-btn co-confirm"
          onClick={() => {
            playSFX('buttonClick')
            onContinue()
          }}
        >
          <span className="btn-icon">⚓</span> CONFIRM
        </button>
      </div>
    </div>
  )
}
