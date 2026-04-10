import { useState, useEffect, useCallback, useRef } from 'react'
import {
  generateBoard,
  getRelicBonus,
  getGhostShipBonus,
  getTreasureShipBonus,
  getAdjacentCells,
  getDealerComment,
  calculateGreed,
  SHIP_TYPES,
  TOTAL_CELLS,
  hasLastBreath,
  useLastBreath,
  setPersonalBest,
} from '../gameEngine'
import { playSFX } from '../audioManager'
import ShipsInfo from '../components/ShipsInfo'
import DeadMansChest from '../components/DeadMansChest'
import PirateCaptain from '../components/PirateCaptain'
import './MainGame.css'

export default function MainGame({ bet, onGameOver, onCashOut, onExit, isNightTide }) {
  const [board, setBoard] = useState(null)
  const [multiplier, setMultiplier] = useState(isNightTide ? 1.5 : 1.0)
  const [flatBonus, setFlatBonus] = useState(0)
  const [ghostBonuses, setGhostBonuses] = useState([])
  const [revealedCount, setRevealedCount] = useState(0)
  const [dealerText, setDealerText] = useState('')
  const [showShipsInfo, setShowShipsInfo] = useState(false)
  const [showDeadMansChest, setShowDeadMansChest] = useState(false)
  const [deadMansChestCell, setDeadMansChestCell] = useState(null)
  const [sonarUsed, setSonarUsed] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [multiplierPulse, setMultiplierPulse] = useState(false)
  const [shakeBoard, setShakeBoard] = useState(false)
  const [explosionCells, setExplosionCells] = useState([])
  const [fogCells, setFogCells] = useState([])
  const [chaosAnim, setChaosAnim] = useState(false)
  const [sonarWave, setSonarWave] = useState(false)

  // New feature states
  const [relicStreak, setRelicStreak] = useState(0)
  const [hotWaters, setHotWaters] = useState(false)
  const [safeGlowCell, setSafeGlowCell] = useState(null)
  const [omenVisible, setOmenVisible] = useState(true)
  const [cannonballFired, setCannonballFired] = useState(false)
  const [cannonballTarget, setCannonballTarget] = useState(null)
  const [cannonballAnim, setCannonballAnim] = useState(false)
  const [showDoubleOrNothing, setShowDoubleOrNothing] = useState(false)
  const [lastBreathAvailable, setLastBreathAvailable] = useState(hasLastBreath())
  const [lastBreathAnim, setLastBreathAnim] = useState(false)

  const boardRef = useRef(null)
  const doubleTimerRef = useRef(null)
  const finalizeCashOutRef = useRef(null)

  // Refs to avoid stale closures in finalizeCashOut
  const stateRef = useRef({})

  useEffect(() => {
    const b = generateBoard(isNightTide)
    setBoard(b)
    setDealerText(
      isNightTide
        ? getDealerComment(0, 'night_tide')
        : getDealerComment(0, 'start')
    )

    // Omen cell: flash for 2 seconds then fade
    const omenTimer = setTimeout(() => setOmenVisible(false), 2500)

    // Cannonball: random timing between 15-40s into the round
    const cannonDelay = 15000 + Math.random() * 25000
    const cannonTimer = setTimeout(() => {
      fireCannonball()
    }, cannonDelay)

    return () => {
      clearTimeout(omenTimer)
      clearTimeout(cannonTimer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const greedLevel = board ? calculateGreed(revealedCount, board.cells.length) : 0
  const currentWin = +(bet * multiplier + flatBonus).toFixed(2)

  stateRef.current = {
    multiplier,
    flatBonus,
    ghostBonuses,
    deadMansChestCell,
    board,
    bet,
    greedLevel,
    revealedCount,
  }

  const pulseMultiplier = useCallback(() => {
    setMultiplierPulse(true)
    setTimeout(() => setMultiplierPulse(false), 500)
  }, [])

  const triggerShake = useCallback(() => {
    setShakeBoard(true)
    setTimeout(() => setShakeBoard(false), 600)
  }, [])

  // ── Cannonball event — auto-reveals a random cell ───────────
  const fireCannonball = useCallback(() => {
    const s = stateRef.current
    if (!s.board || cannonballFired) return

    const unrevealed = s.board.cells.filter((c) => !c.revealed && !c.fogged)
    if (unrevealed.length === 0) return

    const target = unrevealed[Math.floor(Math.random() * unrevealed.length)]
    setCannonballTarget(target.index)
    setCannonballAnim(true)
    setCannonballFired(true)
    setDealerText(getDealerComment(0, 'cannonball'))

    // 🔊 Cannonball fire
    playSFX('cannonball')

    setTimeout(() => {
      setCannonballAnim(false)
      const cellEl = document.querySelector(
        `[data-cell-index="${target.index}"]`
      )
      if (cellEl) cellEl.click()
    }, 1200)
  }, [cannonballFired])

  // ── Sonar ───────────────────────────────────────────────────
  const handleSonar = useCallback(() => {
    if (sonarUsed || !board || gameEnded) return
    setSonarUsed(true)
    setSonarWave(true)
    setTimeout(() => setSonarWave(false), 1500)

    // 🔊 Sonar ping
    playSFX('sonarPing')

    const unrevealed = board.cells.filter((c) => !c.revealed && !c.fogged)
    const hintCount = Math.min(6, unrevealed.length)
    const shuffled = [...unrevealed].sort(() => Math.random() - 0.5)
    const hints = shuffled.slice(0, hintCount)

    setBoard((prev) => {
      const newCells = prev.cells.map((c) => {
        const isHint = hints.find((h) => h.index === c.index)
        if (isHint) {
          let hintType = c.ship?.type?.id
          if (hintType === 'pirate_ship') hintType = 'treasure_ship'
          return { ...c, sonarHint: true, sonarHintType: hintType }
        }
        return c
      })
      return { ...prev, cells: newCells }
    })

    setFlatBonus((prev) => +(prev - bet * 0.05).toFixed(2))
    setDealerText(getDealerComment(greedLevel, 'sonar_used'))
  }, [sonarUsed, board, gameEnded, bet, greedLevel])

  // ── Dead Man's Chest confirm ────────────────────────────────
  const handleDeadMansChestConfirm = useCallback((cellIndex) => {
    setDeadMansChestCell(cellIndex)
    setBoard((prev) => {
      const newCells = prev.cells.map((c) =>
        c.index === cellIndex ? { ...c, isDeadMansChestTarget: true } : c
      )
      return { ...prev, cells: newCells }
    })
    setShowDeadMansChest(false)
  }, [])

  // ── Core: reveal a cell ─────────────────────────────────────
  const revealCell = useCallback(
    async (index) => {
      if (!board || isRevealing || gameEnded) return
      const cell = board.cells[index]
      if (cell.revealed || cell.fogged) return

      setIsRevealing(true)

      const newCells = [...board.cells]
      newCells[index] = { ...newCells[index], revealed: true }
      setBoard((prev) => ({ ...prev, cells: newCells }))
      setRevealedCount((prev) => prev + 1)

      // Clear safe glow after clicking
      if (safeGlowCell === index) setSafeGlowCell(null)

      const ship = cell.ship
      if (!ship) {
        // 🔊 Empty cell reveal
        playSFX('cellReveal')
        setIsRevealing(false)
        return
      }

      ship.revealedCount++
      const isComplete = ship.revealedCount >= ship.cellsNeeded
      const shipType = ship.type.id

      // ── DEAD WATERS ──────────────────────────────────────
      if (shipType === 'dead_waters') {
        // Last Breath lifeline check
        if (lastBreathAvailable) {
          useLastBreath()
          setLastBreathAvailable(false)
          setLastBreathAnim(true)
          setDealerText(getDealerComment(greedLevel, 'dead_waters_saved'))
          triggerShake()

          // 🔊 Last Breath save
          playSFX('lastBreath')

          setTimeout(() => setLastBreathAnim(false), 2000)
          setRelicStreak(0)
          setIsRevealing(false)
          return
        }

        // 🔊 Dead Waters — game over
        playSFX('deadWaters')

        setDealerText(getDealerComment(greedLevel, 'dead_waters'))
        triggerShake()
        setGameEnded(true)
        setRelicStreak(0)

        setTimeout(() => {
          onGameOver({
            bet,
            win: 0,
            multiplier,
            reason: 'dead_waters',
            board: board,
            revealedCount: revealedCount + 1,
          })
        }, 1200)
        setIsRevealing(false)
        return
      }

      // ── MULTIPLIER RELIC ─────────────────────────────────
      if (shipType === 'multiplier_relic') {
        // 🔊 Relic found
        playSFX('relicFound')

        const bonus = getRelicBonus()
        setMultiplier((prev) => +(prev + bonus).toFixed(1))
        pulseMultiplier()

        // 🔊 Multiplier increase
        playSFX('multiplierUp', 0.4)

        // Lucky Streak tracking
        const newStreak = relicStreak + 1
        setRelicStreak(newStreak)

        if (newStreak >= 3) {
          // Hot Waters! Grant safe glow on a random unrevealed cell
          setHotWaters(true)
          setTimeout(() => setHotWaters(false), 2000)
          setDealerText(getDealerComment(greedLevel, 'streak'))

          // 🔊 Hot Waters streak
          playSFX('hotWatersStreak')

          // Find a safe unrevealed cell to highlight
          const safeUnrevealed = newCells.filter(
            (c) =>
              !c.revealed &&
              c.ship?.type.id !== 'dead_waters' &&
              c.ship?.type.id !== 'pirate_ship'
          )
          if (safeUnrevealed.length > 0) {
            const safePick =
              safeUnrevealed[Math.floor(Math.random() * safeUnrevealed.length)]
            setSafeGlowCell(safePick.index)
          }
          setRelicStreak(0)
        } else {
          setDealerText(getDealerComment(greedLevel, 'relic_found'))
        }

        setIsRevealing(false)
        return
      }

      // Reset streak for non-relic reveals
      setRelicStreak(0)

      // 🔊 Generic cell reveal for multi-cell ships (partial)
      playSFX('cellReveal')

      // ── PIRATE SHIP ──────────────────────────────────────
      if (shipType === 'pirate_ship') {
        if (isComplete) {
          // 🔊 Pirate reveal — loss!
          playSFX('pirateReveal')

          setDealerText(getDealerComment(greedLevel, 'pirate_reveal'))
          triggerShake()
          setGameEnded(true)

          setTimeout(() => {
            onGameOver({
              bet,
              win: 0,
              multiplier,
              reason: 'pirate_ship',
              board: board,
              revealedCount: revealedCount + 1,
            })
          }, 1500)
          setIsRevealing(false)
          return
        }

        setDealerText('Treasure... or ruin?')
        setIsRevealing(false)
        return
      }

      // ── TREASURE SHIP ────────────────────────────────────
      if (shipType === 'treasure_ship') {
        if (isComplete) {
          // 🔊 Treasure ship completed
          playSFX('treasureComplete')

          const bonus = getTreasureShipBonus()
          setMultiplier((prev) => +(prev + bonus).toFixed(1))
          pulseMultiplier()
          setDealerText(getDealerComment(greedLevel, 'treasure_complete'))
        } else {
          setMultiplier((prev) => +(prev + 0.2).toFixed(1))
          pulseMultiplier()
          playSFX('multiplierUp', 0.4)
          setDealerText('Treasure... or ruin?')
        }
        setIsRevealing(false)
        return
      }

      // ── GHOST SHIP ───────────────────────────────────────
      if (shipType === 'ghost_ship') {
        if (isComplete) {
          // 🔊 Ghost ship found
          playSFX('ghostFound')

          const bonus = getGhostShipBonus()
          setGhostBonuses((prev) => [...prev, bonus])
          setDealerText(getDealerComment(greedLevel, 'ghost_found'))
        }
        setIsRevealing(false)
        return
      }

      // ── CHAOS SHIP ───────────────────────────────────────
      if (shipType === 'chaos_ship') {
        if (ship.revealedCount === 1) {
          // 🔊 Chaos shift
          playSFX('chaosShift')

          setChaosAnim(true)
          setDealerText(getDealerComment(greedLevel, 'chaos_shift'))

          setTimeout(() => {
            setBoard((prev) => {
              const unrevealedIndices = prev.cells
                .filter((c) => !c.revealed && c.index !== index)
                .map((c) => c.index)
              const toShuffle = unrevealedIndices.slice(
                0,
                Math.min(6, unrevealedIndices.length)
              )
              const ships = toShuffle.map((i) => prev.cells[i].ship)
              const shuffled = [...ships].sort(() => Math.random() - 0.5)
              const nc = [...prev.cells]
              toShuffle.forEach((cellIdx, i) => {
                nc[cellIdx] = { ...nc[cellIdx], ship: shuffled[i] }
              })
              return { ...prev, cells: nc }
            })
            setChaosAnim(false)
          }, 800)
        }

        if (isComplete) {
          setMultiplier((prev) => +(prev + 1.0).toFixed(1))
          pulseMultiplier()
          playSFX('multiplierUp', 0.4)
        }

        setIsRevealing(false)
        return
      }

      // ── BOMB SHIP ────────────────────────────────────────
      if (shipType === 'bomb_ship') {
        if (isComplete) {
          // 🔊 Bomb explosion
          playSFX('bombExplode')

          setDealerText(getDealerComment(greedLevel, 'bomb_explode'))

          const allBombCells = newCells
            .filter((c) => c.ship?.shipId === ship.shipId)
            .map((c) => c.index)
          let adjacentSet = new Set()
          allBombCells.forEach((ci) => {
            getAdjacentCells(ci).forEach((ai) => adjacentSet.add(ai))
          })
          allBombCells.forEach((ci) => adjacentSet.delete(ci))

          const toReveal = [...adjacentSet]
            .filter((i) => !newCells[i].revealed)
            .slice(0, 4)

          setExplosionCells(allBombCells)
          setTimeout(() => setExplosionCells([]), 800)
          setMultiplier((prev) => +(prev + 0.5).toFixed(1))
          pulseMultiplier()

          setTimeout(() => {
            for (const ri of toReveal) {
              setBoard((prev) => {
                const nc = [...prev.cells]
                if (!nc[ri].revealed) {
                  nc[ri] = { ...nc[ri], revealed: true }
                  const s = nc[ri].ship
                  if (s) s.revealedCount++

                  if (s?.type.id === 'dead_waters') {
                    if (lastBreathAvailable) {
                      useLastBreath()
                      setLastBreathAvailable(false)
                      setLastBreathAnim(true)
                      setDealerText(
                        getDealerComment(greedLevel, 'dead_waters_saved')
                      )
                      playSFX('lastBreath')
                      setTimeout(() => setLastBreathAnim(false), 2000)
                    } else {
                      playSFX('deadWaters')
                      setDealerText(
                        getDealerComment(greedLevel, 'dead_waters')
                      )
                      triggerShake()
                      setGameEnded(true)
                      setTimeout(() => {
                        onGameOver({
                          bet,
                          win: 0,
                          multiplier,
                          reason: 'bomb_dead_waters',
                          board: prev,
                          revealedCount,
                        })
                      }, 1200)
                    }
                  } else if (s?.type.id === 'multiplier_relic') {
                    const rb = getRelicBonus()
                    setMultiplier((p) => +(p + rb).toFixed(1))
                    playSFX('relicFound', 0.3)
                  }
                }
                return { ...prev, cells: nc }
              })
              setRevealedCount((prev) => prev + 1)
            }
            setIsRevealing(false)
          }, 600)
          return
        }

        setIsRevealing(false)
        return
      }

      // ── FOG SHIP ─────────────────────────────────────────
      if (shipType === 'fog_ship') {
        if (isComplete) {
          // 🔊 Fog spreading
          playSFX('fogSpread')

          setDealerText(getDealerComment(greedLevel, 'fog_spread'))
          setMultiplier((prev) => +(prev + 0.5).toFixed(1))
          pulseMultiplier()

          setTimeout(() => {
            setBoard((prev) => {
              const safeRevealed = prev.cells.filter(
                (c) =>
                  c.revealed &&
                  !c.fogged &&
                  c.ship?.type.id !== 'dead_waters' &&
                  c.ship?.type.id !== 'pirate_ship' &&
                  c.ship?.shipId !== ship.shipId
              )
              const toFog = [...safeRevealed]
                .sort(() => Math.random() - 0.5)
                .slice(0, 5)
              const fogIndices = toFog.map((c) => c.index)

              setFogCells(fogIndices)
              setTimeout(() => setFogCells([]), 1500)

              const nc = prev.cells.map((c) =>
                fogIndices.includes(c.index)
                  ? { ...c, fogged: true, revealed: false }
                  : c
              )
              return { ...prev, cells: nc }
            })
          }, 500)
        }

        setIsRevealing(false)
        return
      }

      setIsRevealing(false)
    },
    [
      board,
      isRevealing,
      gameEnded,
      greedLevel,
      bet,
      multiplier,
      revealedCount,
      relicStreak,
      safeGlowCell,
      lastBreathAvailable,
      onGameOver,
      pulseMultiplier,
      triggerShake,
    ]
  )

  // ── Finalize cash out (ref to avoid stale closures) ─────────
  finalizeCashOutRef.current = (doubled) => {
    const s = stateRef.current
    setGameEnded(true)

    let totalGhostBonus = 0
    if (s.ghostBonuses.length > 0) {
      totalGhostBonus = s.ghostBonuses.reduce((a, b) => a + b, 0)
    }

    let sideWin = 0
    if (s.deadMansChestCell !== null && s.board) {
      const targetCell = s.board.cells[s.deadMansChestCell]
      if (targetCell?.ship?.type.id === 'treasure_ship') {
        sideWin = +(s.bet * 20).toFixed(2)
      }
    }

    const finalMultiplier = +(s.multiplier + totalGhostBonus).toFixed(1)
    let finalWin = +(s.bet * finalMultiplier + s.flatBonus + sideWin).toFixed(2)
    if (doubled) finalWin = +(finalWin * 2).toFixed(2)

    const result = {
      bet: s.bet,
      win: Math.max(0, finalWin),
      multiplier: finalMultiplier,
      ghostBonus: totalGhostBonus,
      sideWin,
      revealedCount: s.revealedCount,
      doubled,
      board: s.board,
    }

    setPersonalBest(finalMultiplier)

    if (!doubled) {
      // 🔊 Cashout
      playSFX('cashout')

      setDealerText(
        getDealerComment(s.greedLevel, 'cashout', {
          revealedCount: s.revealedCount,
          totalCells: TOTAL_CELLS,
        })
      )
    }

    setTimeout(() => {
      onCashOut(result)
    }, 800)
  }

  const handleCashOut = useCallback(() => {
    if (gameEnded) return

    // 🔊 Button click
    playSFX('buttonClick')

    setShowDoubleOrNothing(true)
    doubleTimerRef.current = setTimeout(() => {
      setShowDoubleOrNothing(false)
      finalizeCashOutRef.current(false)
    }, 3000)
  }, [gameEnded])

  const handleConfirmCashOut = useCallback(() => {
    // 🔊 Button click
    playSFX('buttonClick')

    clearTimeout(doubleTimerRef.current)
    setShowDoubleOrNothing(false)
    finalizeCashOutRef.current(false)
  }, [])

  const handleDoubleOrNothing = useCallback(() => {
    clearTimeout(doubleTimerRef.current)
    setShowDoubleOrNothing(false)
    const s = stateRef.current
    if (!s.board) return

    const unrevealed = s.board.cells.filter((c) => !c.revealed && !c.fogged)
    if (unrevealed.length === 0) {
      finalizeCashOutRef.current(false)
      return
    }

    const target = unrevealed[Math.floor(Math.random() * unrevealed.length)]
    const ship = target.ship
    const isDangerous =
      ship?.type.id === 'dead_waters' || ship?.type.id === 'pirate_ship'

    setBoard((prev) => {
      const nc = [...prev.cells]
      nc[target.index] = { ...nc[target.index], revealed: true }
      return { ...prev, cells: nc }
    })

    if (isDangerous) {
      // 🔊 Double or nothing — LOSS
      playSFX('doubleLose')

      triggerShake()
      setDealerText(getDealerComment(s.greedLevel, 'double_lose'))
      setGameEnded(true)
      setTimeout(() => {
        onGameOver({
          bet: s.bet,
          win: 0,
          multiplier: s.multiplier,
          reason: 'double_or_nothing',
          board: s.board,
          revealedCount: s.revealedCount,
        })
      }, 1200)
    } else {
      // 🔊 Double or nothing — WIN
      playSFX('doubleWin')

      setDealerText(getDealerComment(s.greedLevel, 'double_win'))
      finalizeCashOutRef.current(true)
    }
  }, [onGameOver, triggerShake])

  if (!board) return null

  const greedPercent = Math.min(100, greedLevel * 100)
  const greedColor =
    greedLevel < 0.25
      ? '#00ff88'
      : greedLevel < 0.5
        ? '#aaff00'
        : greedLevel < 0.75
          ? '#ffaa00'
          : '#ff3344'

  return (
    <div
      className={`main-game ${isNightTide ? 'night-tide' : ''}`}
      style={{ animation: 'fade-in 0.5s ease' }}
    >
      {/* Hot Waters banner */}
      {hotWaters && <div className="hot-waters-banner">🔥 HOT WATERS 🔥</div>}

      {/* Last Breath animation */}
      {lastBreathAnim && (
        <div className="last-breath-overlay">
          <div className="last-breath-text">⚓ ABANDON SHIP! ⚓</div>
        </div>
      )}

      {/* Cannonball animation */}
      {cannonballAnim && (
        <div className="cannonball-overlay">
          <div className="cannonball-projectile">💣</div>
        </div>
      )}

      {/* LEFT SIDE - Dealer */}
      <div className="game-left">
        <div className="dealer-area">
          <PirateCaptain greedLevel={greedLevel} />
          <div className="dealer-speech">
            <p>{dealerText}</p>
          </div>
        </div>

        {/* Greed Meter */}
        <div className="greed-meter">
          <div className="greed-skull">☠️</div>
          <div className="greed-label">GREED</div>
          <div className="greed-track">
            <div
              className="greed-fill"
              style={{
                height: `${greedPercent}%`,
                background: `linear-gradient(to top, ${greedColor}, ${greedColor}88)`,
                boxShadow: `0 0 12px ${greedColor}66`,
              }}
            />
            <div className="greed-markers">
              {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0].map((v, i) => (
                <div
                  key={v}
                  className="greed-marker"
                  style={{ bottom: `${(i / 6) * 100}%` }}
                >
                  <span>x{v.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="greed-danger" style={{ color: greedColor }}>
            {greedLevel < 0.25
              ? 'SAFE'
              : greedLevel < 0.5
                ? 'RISKY'
                : greedLevel < 0.75
                  ? 'DANGER'
                  : 'DEADLY'}
          </div>
        </div>

        {/* Last Breath indicator */}
        {lastBreathAvailable && (
          <div className="last-breath-indicator">
            <span>⚓</span> Last Breath
          </div>
        )}
      </div>

      {/* CENTER - Board */}
      <div className="game-center">
        <div className="game-logo-small">
          <span className="logo-skull">☠️</span>
          <span className="logo-ghost">Ghost Fleet</span>
          <span className="logo-gamble">
            {isNightTide ? '🌙 Night Tide' : 'Gamble'}
          </span>
        </div>

        <div className="game-board-area">
          <div className="game-board-shell">
            <img
              className="game-board-bg-img"
              src="/GhostFleet_Gameplay_NoHead.png"
              alt=""
              draggable={false}
            />
            <div className="game-board-aligner">
              <div
                ref={boardRef}
                className={`game-board ${shakeBoard ? 'board-shake' : ''} ${chaosAnim ? 'board-chaos' : ''}`}
              >
                {sonarWave && <div className="sonar-wave-overlay" />}
                {board.cells.map((cell, idx) => (
                  <BoardCell
                    key={idx}
                    cellIndex={idx}
                    cell={cell}
                    onClick={() => revealCell(idx)}
                    isExplosion={explosionCells.includes(idx)}
                    isFogTarget={fogCells.includes(idx)}
                    gameEnded={gameEnded}
                    omenVisible={omenVisible}
                    safeGlow={safeGlowCell === idx}
                    cannonballTarget={
                      cannonballAnim && cannonballTarget === idx
                    }
                  />
                ))}
              </div>
            </div>

            <div className="bottom-panel bottom-panel--on-board">
              <div className="panel-stat">
                <div className="panel-stat-label">BET</div>
                <div className="panel-stat-value">${bet.toFixed(2)}</div>
              </div>
              <div className="panel-stat">
                <div className="panel-stat-label">WIN</div>
                <div className="panel-stat-value win-value">
                  ${Math.max(0, currentWin).toFixed(2)}
                </div>
              </div>
              <div
                className={`multiplier-display ${multiplierPulse ? 'mult-pulse' : ''}`}
              >
                <span>x{multiplier.toFixed(1)}</span>
              </div>

              {!showDoubleOrNothing ? (
                <button
                  className="cashout-btn"
                  onClick={handleCashOut}
                  disabled={gameEnded || revealedCount === 0}
                >
                  <div className="cashout-text">CASH OUT</div>
                  <div className="cashout-amount">
                    COLLECT ${Math.max(0, currentWin).toFixed(2)}
                  </div>
                </button>
              ) : (
                <div className="double-or-nothing">
                  <button className="don-confirm" onClick={handleConfirmCashOut}>
                    CONFIRM
                  </button>
                  <button className="don-double" onClick={handleDoubleOrNothing}>
                    2x OR 💀
                  </button>
                  <div className="don-timer" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Bonuses */}
      <div className="game-right">
        <button
          className="info-btn"
          onClick={() => {
            playSFX('buttonClick')
            setShowShipsInfo(true)
          }}
        >
          <span className="info-icon">⚓</span>
          <div className="info-btn-text">
            <span>VIEW SHIPS</span>
            <span className="info-btn-sub">Learn the new sea odds</span>
          </div>
        </button>

        <div className="bonuses-panel">
          <div className="bonuses-title">BONUSES</div>

          <button
            className={`bonus-card sonar-card ${sonarUsed ? 'used' : ''}`}
            onClick={handleSonar}
            disabled={sonarUsed || gameEnded}
          >
            <div className="bonus-icon">🔮</div>
            <div className="bonus-name">SONAR</div>
            <div className="bonus-desc">Ping nearby cells to reveal hints</div>
            <div className="bonus-cost">Cost: 5% Bet</div>
          </button>

          <button
            className={`bonus-card chest-card ${deadMansChestCell !== null ? 'used' : ''}`}
            onClick={() => {
              if (deadMansChestCell === null && !gameEnded) {
                playSFX('buttonClick')
                setShowDeadMansChest(true)
              }
            }}
            disabled={deadMansChestCell !== null || gameEnded}
          >
            <div className="bonus-icon">📦</div>
            <div className="bonus-name">DEAD MAN'S CHEST</div>
            <div className="bonus-desc">Choose any cell on the board</div>
            <div className="bonus-cost">Cost: x20 Bet</div>
          </button>
        </div>

        <button
          className="quit-game-btn"
          onClick={() => {
            playSFX('buttonClick')
            onExit()
          }}
        >
          <span className="quit-icon">🚪</span> QUIT
        </button>
      </div>

      {/* Modals */}
      {showShipsInfo && (
        <ShipsInfo onClose={() => setShowShipsInfo(false)} />
      )}
      {showDeadMansChest && (
        <DeadMansChest
          board={board}
          onConfirm={handleDeadMansChestConfirm}
          onClose={() => setShowDeadMansChest(false)}
        />
      )}
    </div>
  )
}

function BoardCell({
  cellIndex,
  cell,
  onClick,
  isExplosion,
  isFogTarget,
  gameEnded,
  omenVisible,
  safeGlow,
  cannonballTarget,
}) {
  const {
    revealed,
    fogged,
    sonarHint,
    sonarHintType,
    ship,
    isDeadMansChestTarget,
    isOmen,
  } = cell

  if (fogged) {
    return (
      <div
        className="board-cell fogged-cell"
        data-cell-index={cellIndex}
        onClick={onClick}
      >
        <div className="fog-overlay">🌫️</div>
      </div>
    )
  }

  if (revealed && ship) {
    const shipType = ship.type
    const isComplete = ship.revealedCount >= ship.cellsNeeded
    const is4Cell =
      shipType.id === 'treasure_ship' || shipType.id === 'pirate_ship'
    const showTrue = !is4Cell || isComplete

    let cellClass = 'board-cell revealed-cell'
    if (isExplosion) cellClass += ' explosion-cell'
    if (isFogTarget) cellClass += ' fog-target'
    if (shipType.id === 'dead_waters') cellClass += ' dead-waters-cell'
    if (shipType.id === 'pirate_ship' && isComplete)
      cellClass += ' pirate-complete'
    if (shipType.id === 'treasure_ship' && isComplete)
      cellClass += ' treasure-complete'

    const displayImage = showTrue
      ? shipType.image
      : shipType.id === 'pirate_ship'
        ? SHIP_TYPES.TREASURE_SHIP.image
        : shipType.image

    return (
      <div
        className={cellClass}
        data-cell-index={cellIndex}
        style={{
          '--ship-color': showTrue ? shipType.color : '#ffd700',
          borderColor: showTrue ? shipType.color + '88' : '#ffd70088',
        }}
      >
        <img
          src={displayImage}
          alt={showTrue ? shipType.name : '???'}
          className="cell-ship-img"
        />
        {isComplete && shipType.id === 'treasure_ship' && (
          <div className="gold-burst-effect" />
        )}
      </div>
    )
  }

  // Unrevealed cell
  let cellClass = 'board-cell unrevealed-cell'
  if (isDeadMansChestTarget) cellClass += ' dmc-target'
  if (sonarHint) cellClass += ' sonar-hint'
  if (isOmen && omenVisible) cellClass += ' omen-cell'
  if (safeGlow) cellClass += ' safe-glow-cell'
  if (cannonballTarget) cellClass += ' cannonball-target'

  return (
    <div
      className={cellClass}
      data-cell-index={cellIndex}
      onClick={gameEnded ? undefined : onClick}
    >
      {sonarHint && (
        <div className="sonar-hint-overlay">
          <img
            src={
              SHIP_TYPES[
                Object.keys(SHIP_TYPES).find(
                  (k) => SHIP_TYPES[k].id === sonarHintType
                )
              ]?.image || ''
            }
            alt="hint"
            className="sonar-hint-img"
          />
        </div>
      )}
      {isDeadMansChestTarget && <div className="dmc-marker">📦</div>}
      <div className="cell-water" />
    </div>
  )
}
