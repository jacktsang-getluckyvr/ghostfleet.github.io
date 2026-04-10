import { SHIP_TYPES } from '../gameEngine'
import './NavigatorsLog.css'

export default function NavigatorsLog({ board }) {
  if (!board) return null

  return (
    <div className="nav-log">
      <div className="nav-log-title">NAVIGATOR'S LOG</div>
      <div className="nav-log-grid">
        {board.cells.map((cell, idx) => {
          const ship = cell.ship
          const wasRevealed = cell.revealed
          return (
            <div
              key={idx}
              className={`nav-cell ${wasRevealed ? 'nav-revealed' : 'nav-hidden'}`}
              style={{ borderColor: ship?.type?.color ? ship.type.color + '66' : 'transparent' }}
            >
              {ship && (
                <img
                  src={ship.type.image}
                  alt={ship.type.name}
                  className="nav-cell-img"
                  style={{ opacity: wasRevealed ? 1 : 0.4 }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="nav-log-hint">Full board revealed — what could have been...</div>
    </div>
  )
}
