import { useState } from 'react'
import './DeadMansChest.css'

export default function DeadMansChest({ board, onConfirm, onClose }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dmc-panel" onClick={e => e.stopPropagation()}>
        <div className="dmc-header">
          <div className="dmc-icon">📦</div>
          <h2 className="dmc-title">DEAD MAN'S CHEST</h2>
        </div>
        <p className="dmc-desc">
          Choose a cell for your side bet. If it hides treasure, win x20!
        </p>

        <div className="dmc-board">
          {board.cells.map((cell, idx) => (
            <div
              key={idx}
              className={`dmc-cell ${cell.revealed ? 'dmc-cell-disabled' : ''} ${selected === idx ? 'dmc-cell-selected' : ''}`}
              onClick={() => !cell.revealed && setSelected(idx)}
            >
              {selected === idx && <span className="dmc-check">✓</span>}
            </div>
          ))}
        </div>

        <div className="dmc-actions">
          <button className="dmc-cancel" onClick={onClose}>Cancel</button>
          <button
            className="dmc-confirm"
            disabled={selected === null}
            onClick={() => selected !== null && onConfirm(selected)}
          >
            Confirm Bet
          </button>
        </div>
      </div>
    </div>
  )
}
