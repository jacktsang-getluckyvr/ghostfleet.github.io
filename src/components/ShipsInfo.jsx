import { SHIP_TYPES } from '../gameEngine'
import './ShipsInfo.css'

const shipList = [
  { ...SHIP_TYPES.MULTIPLIER_RELIC, cellLabel: '1 CELL' },
  { ...SHIP_TYPES.BOMB_SHIP, cellLabel: '3 CELLS' },
  { ...SHIP_TYPES.DEAD_WATERS, cellLabel: '1 CELL' },
  { ...SHIP_TYPES.FOG_SHIP, cellLabel: '3 CELLS' },
  { ...SHIP_TYPES.GHOST_SHIP, cellLabel: '2 CELLS' },
  { ...SHIP_TYPES.TREASURE_SHIP, cellLabel: '4 CELLS' },
  { ...SHIP_TYPES.CHAOS_SHIP, cellLabel: '2 CELLS' },
  { ...SHIP_TYPES.PIRATE_SHIP, cellLabel: '4 CELLS' },
]

export default function ShipsInfo({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ships-info-panel" onClick={e => e.stopPropagation()}>
        <div className="ships-info-banner">
          <div className="ships-info-skull">💀</div>
          <h2 className="ships-info-title">INFO</h2>
          <button className="ships-info-close" onClick={onClose}>✕</button>
        </div>

        <div className="ships-info-body">
          <div className="ships-grid">
            {shipList.map((ship) => (
              <div key={ship.id} className="ship-info-card">
                <div className="ship-info-icon">
                  <img src={ship.image} alt={ship.name} />
                </div>
                <div className="ship-info-text">
                  <div className="ship-info-name" style={{ color: ship.color }}>
                    {ship.name.toUpperCase()} ({ship.cellLabel})
                  </div>
                  <div className="ship-info-desc">{ship.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
