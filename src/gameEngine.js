// Ship type definitions
export const SHIP_TYPES = {
  MULTIPLIER_RELIC: {
    id: 'multiplier_relic',
    name: 'Multiplier Relic',
    cells: 1,
    color: '#f0c040',
    description: 'Boosts your current multiplier.',
    image: '/assets/ships/ShipMultiplierRelic.png',
  },
  DEAD_WATERS: {
    id: 'dead_waters',
    name: 'Dead Waters',
    cells: 1,
    color: '#ff3344',
    description: 'Reveal it — and your run ends instantly.',
    image: '/assets/ships/ShipDeadWaters.png',
  },
  GHOST_SHIP: {
    id: 'ghost_ship',
    name: 'Ghost Ship',
    cells: 2,
    color: '#00ff88',
    description: 'Find both pieces to unlock a hidden x2–x8 bonus at cashout.',
    image: '/assets/ships/ShipGhost.png',
  },
  CHAOS_SHIP: {
    id: 'chaos_ship',
    name: 'Chaos Ship',
    cells: 2,
    color: '#aa44ff',
    description: 'Shifts part of the board when disturbed.',
    image: '/assets/ships/ShipChaos.png',
  },
  BOMB_SHIP: {
    id: 'bomb_ship',
    name: 'Bomb Ship',
    cells: 3,
    color: '#ff8800',
    description: 'Unleashes an explosion that reveals nearby cells.',
    image: '/assets/ships/ShipBomb.png',
  },
  FOG_SHIP: {
    id: 'fog_ship',
    name: 'Fog Ship',
    cells: 3,
    color: '#6699cc',
    description: 'Covers revealed safe cells back in fog when completed.',
    image: '/assets/ships/ShipFog.png',
  },
  TREASURE_SHIP: {
    id: 'treasure_ship',
    name: 'Treasure Ship',
    cells: 4,
    color: '#ffd700',
    description: 'Complete the ship to claim a powerful reward.',
    image: '/assets/ships/ShipTreasure.png',
  },
  PIRATE_SHIP: {
    id: 'pirate_ship',
    name: 'Pirate Ship',
    cells: 4,
    color: '#ff4422',
    description: 'Looks just like treasure while you uncover it. Finish it — and lose everything.',
    image: '/assets/ships/ShipPirate.png',
  },
}

const ROWS = 6
const COLS = 8
export const TOTAL_CELLS = ROWS * COLS

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Generate ships for a round
// isNightTide: if true, board is slightly more dangerous
export function generateBoard(isNightTide = false) {
  const entities = []
  let shipIdCounter = 0

  const makeShip = (type) => {
    const id = `ship_${shipIdCounter++}`
    return { shipId: id, type, cellsNeeded: type.cells, revealedCount: 0, completed: false }
  }

  // 4-cell ships (1–2) — slightly more likely in night tide
  const num4Cell = Math.random() < (isNightTide ? 0.60 : 0.45) ? 2 : 1
  for (let i = 0; i < num4Cell; i++) {
    const is_treasure = Math.random() < 0.5
    entities.push(makeShip(is_treasure ? SHIP_TYPES.TREASURE_SHIP : SHIP_TYPES.PIRATE_SHIP))
  }

  // 3-cell ships (1–2)
  const num3Cell = rand(1, 2)
  for (let i = 0; i < num3Cell; i++) {
    const is_bomb = Math.random() < 0.5
    entities.push(makeShip(is_bomb ? SHIP_TYPES.BOMB_SHIP : SHIP_TYPES.FOG_SHIP))
  }

  // 2-cell ships (2–3)
  const num2Cell = rand(2, 3)
  for (let i = 0; i < num2Cell; i++) {
    const is_ghost = Math.random() < 0.4
    entities.push(makeShip(is_ghost ? SHIP_TYPES.GHOST_SHIP : SHIP_TYPES.CHAOS_SHIP))
  }

  let usedCells = entities.reduce((sum, e) => sum + e.cellsNeeded, 0)
  const remaining = TOTAL_CELLS - usedCells

  // Night tide: slightly more dead waters
  const deadWatersCount = isNightTide ? rand(7, 9) : rand(5, 7)
  const relicCount = remaining - deadWatersCount

  for (let i = 0; i < relicCount; i++) {
    entities.push(makeShip(SHIP_TYPES.MULTIPLIER_RELIC))
  }
  for (let i = 0; i < deadWatersCount; i++) {
    entities.push(makeShip(SHIP_TYPES.DEAD_WATERS))
  }

  // Assign cells to ships
  const cellAssignments = new Array(TOTAL_CELLS).fill(null)
  const placed = new Set()

  const multiCellShips = entities.filter(e => e.cellsNeeded > 1).sort((a, b) => b.cellsNeeded - a.cellsNeeded)

  for (const ship of multiCellShips) {
    let didPlace = false
    for (let attempt = 0; attempt < 200; attempt++) {
      const startRow = rand(0, ROWS - 1)
      const startCol = rand(0, COLS - 1)
      const horizontal = Math.random() < 0.5

      const positions = []
      for (let k = 0; k < ship.cellsNeeded; k++) {
        const r = horizontal ? startRow : startRow + k
        const c = horizontal ? startCol + k : startCol
        if (r >= ROWS || c >= COLS) break
        const idx = r * COLS + c
        if (placed.has(idx)) break
        positions.push(idx)
      }

      if (positions.length === ship.cellsNeeded) {
        positions.forEach(idx => {
          cellAssignments[idx] = ship
          placed.add(idx)
        })
        didPlace = true
        break
      }
    }

    if (!didPlace) {
      const emptyCells = []
      for (let i = 0; i < TOTAL_CELLS; i++) {
        if (!placed.has(i)) emptyCells.push(i)
      }
      const shuffled = shuffle(emptyCells)
      for (let k = 0; k < ship.cellsNeeded && k < shuffled.length; k++) {
        cellAssignments[shuffled[k]] = ship
        placed.add(shuffled[k])
      }
    }
  }

  // Place 1-cell entities — dead waters biased to bottom
  const singleCellEntities = entities.filter(e => e.cellsNeeded === 1)
  const deadWaters = singleCellEntities.filter(e => e.type.id === 'dead_waters')
  const relics = singleCellEntities.filter(e => e.type.id === 'multiplier_relic')

  const emptyCellIndices = []
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (!placed.has(i)) emptyCellIndices.push(i)
  }

  const bottomBiased = [...emptyCellIndices].sort((a, b) => {
    return Math.floor(b / COLS) - Math.floor(a / COLS)
  })

  for (const dw of deadWaters) {
    const idx = bottomBiased.shift()
    if (idx !== undefined) {
      cellAssignments[idx] = dw
      placed.add(idx)
    }
  }

  const remainingEmpty = emptyCellIndices.filter(i => !placed.has(i))
  const shuffledRemaining = shuffle(remainingEmpty)
  let relicIdx = 0
  for (const idx of shuffledRemaining) {
    if (relicIdx < relics.length) {
      cellAssignments[idx] = relics[relicIdx++]
      placed.add(idx)
    }
  }

  // Pick a random omen cell (any unrevealed cell, not guaranteed dangerous)
  const omenCellIndex = rand(0, TOTAL_CELLS - 1)

  const cells = cellAssignments.map((ship, idx) => ({
    index: idx,
    row: Math.floor(idx / COLS),
    col: idx % COLS,
    ship,
    revealed: false,
    fogged: false,
    sonarHint: false,
    isDeadMansChestTarget: false,
    isOmen: idx === omenCellIndex,
  }))

  return { cells, ships: entities, rows: ROWS, cols: COLS }
}

export function getRelicBonus() {
  return +(0.3 + Math.random() * 0.5).toFixed(1)
}

export function getGhostShipBonus() {
  return rand(2, 8)
}

export function getTreasureShipBonus() {
  return +(2.0 + Math.random() * 2.0).toFixed(1)
}

export function getAdjacentCells(index, cols = COLS, rows = ROWS) {
  const r = Math.floor(index / cols)
  const c = index % cols
  const adj = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        adj.push(nr * cols + nc)
      }
    }
  }
  return adj
}

// Dealer comments — now includes cashout reactions based on reveal count
export function getDealerComment(greedLevel, event, extra = {}) {
  // Cashout reactions based on how far the player got
  if (event === 'cashout') {
    const { revealedCount = 0, totalCells = 24 } = extra
    const pct = revealedCount / totalCells
    if (pct < 0.2) return "Wise. The sea respects the cautious."
    if (pct < 0.4) return "Not bad. But you left treasure behind."
    if (pct < 0.7) return "You pushed it further than most. Bold captain."
    return "Even I didn't think you'd survive that long."
  }

  if (event === 'start') return "Choose wisely, captain..."
  if (event === 'dead_waters') return "The sea claims another fool."
  if (event === 'dead_waters_saved') return "Abandon ship! ...That was your only lifeline."
  if (event === 'pirate_reveal') return "That wasn't treasure, captain..."
  if (event === 'treasure_complete') return "Now THAT is a prize worth sailing for!"
  if (event === 'ghost_found') return "The spirits smile upon you..."
  if (event === 'bomb_explode') return "BOOM! The sea lights up!"
  if (event === 'fog_spread') return "The mist rolls in... can you still see?"
  if (event === 'chaos_shift') return "The waters shift beneath us!"
  if (event === 'relic_found') return "A nice find. Keep going?"
  if (event === 'sonar_used') return "The depths whisper their secrets..."
  if (event === 'streak') return "Hot waters! The sea favors the bold!"
  if (event === 'cannonball') return "Cannonball incoming!"
  if (event === 'night_tide') return "Night falls... the stakes rise with the tide."
  if (event === 'double_win') return "Fortune favors the reckless!"
  if (event === 'double_lose') return "You gambled it all... and the sea took it."

  if (greedLevel < 0.25) return "A quiet sea... for now."
  if (greedLevel < 0.5) return "You're chasing something valuable."
  if (greedLevel < 0.75) return "Careful, captain... greed sinks ships."
  return "Turn back while you still can!"
}

export function calculateGreed(revealedCount, totalCells) {
  return Math.min(1, revealedCount / (totalCells * 0.7))
}

// Personal best helpers
export function getPersonalBest() {
  try {
    return parseFloat(localStorage.getItem('gfg_best_multiplier') || '0')
  } catch { return 0 }
}

export function setPersonalBest(mult) {
  try {
    const current = getPersonalBest()
    if (mult > current) {
      localStorage.setItem('gfg_best_multiplier', String(mult))
      return true // new record
    }
  } catch {}
  return false
}

// Round counter for Night Tide
export function getRoundCount() {
  try {
    return parseInt(localStorage.getItem('gfg_round_count') || '0', 10)
  } catch { return 0 }
}

export function incrementRoundCount() {
  try {
    const c = getRoundCount() + 1
    localStorage.setItem('gfg_round_count', String(c))
    return c
  } catch { return 1 }
}

// Balance / wallet helpers
const STARTING_BALANCE = 100
const BALANCE_KEY = 'gfg_balance'
const TOTAL_WON_KEY = 'gfg_total_won'
const TOTAL_WAGERED_KEY = 'gfg_total_wagered'
const BIGGEST_WIN_KEY = 'gfg_biggest_win'

export function getBalance() {
  try {
    const val = localStorage.getItem(BALANCE_KEY)
    return val !== null ? parseFloat(val) : STARTING_BALANCE
  } catch { return STARTING_BALANCE }
}

export function setBalance(amount) {
  try { localStorage.setItem(BALANCE_KEY, String(+amount.toFixed(2))) } catch {}
}

export function addToBalance(amount) {
  const bal = getBalance() + amount
  setBalance(bal)
  return +bal.toFixed(2)
}

export function deductFromBalance(amount) {
  const bal = Math.max(0, getBalance() - amount)
  setBalance(bal)
  return +bal.toFixed(2)
}

export function getTotalWon() {
  try { return parseFloat(localStorage.getItem(TOTAL_WON_KEY) || '0') } catch { return 0 }
}

export function getTotalWagered() {
  try { return parseFloat(localStorage.getItem(TOTAL_WAGERED_KEY) || '0') } catch { return 0 }
}

export function getBiggestWin() {
  try { return parseFloat(localStorage.getItem(BIGGEST_WIN_KEY) || '0') } catch { return 0 }
}

export function recordWin(winAmount) {
  try {
    const totalWon = getTotalWon() + winAmount
    localStorage.setItem(TOTAL_WON_KEY, String(+totalWon.toFixed(2)))
    const biggest = getBiggestWin()
    if (winAmount > biggest) {
      localStorage.setItem(BIGGEST_WIN_KEY, String(+winAmount.toFixed(2)))
    }
  } catch {}
}

export function recordWager(betAmount) {
  try {
    const total = getTotalWagered() + betAmount
    localStorage.setItem(TOTAL_WAGERED_KEY, String(+total.toFixed(2)))
  } catch {}
}

export function resetBalance() {
  try {
    localStorage.setItem(BALANCE_KEY, String(STARTING_BALANCE))
    localStorage.removeItem(TOTAL_WON_KEY)
    localStorage.removeItem(TOTAL_WAGERED_KEY)
    localStorage.removeItem(BIGGEST_WIN_KEY)
    localStorage.removeItem('gfg_best_multiplier')
    localStorage.removeItem('gfg_round_count')
  } catch {}
}

// Last Breath — once per session flag
let lastBreathUsed = false
export function hasLastBreath() { return !lastBreathUsed }
export function useLastBreath() { lastBreathUsed = true }
export function resetLastBreath() { lastBreathUsed = false }
