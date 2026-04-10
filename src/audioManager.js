// ============================================================
// audioManager.js — Ghost Fleet Gamble Audio System
// ============================================================
// Singleton audio controller using Web Audio API for SFX
// and HTMLAudioElement for background music. Zero dependencies.
// ============================================================

const AudioContext = window.AudioContext || window.webkitAudioContext

// ── State ────────────────────────────────────────────────────
let ctx = null
let musicElement = null
let buffers = {}
let musicVolume = 0.3
let sfxVolume = 0.6
let muted = false
let initialized = false

// ── SFX manifest ─────────────────────────────────────────────
const SFX_FILES = {
  cellReveal:       '/assets/audio/sfx/cell-reveal.mp3',
  relicFound:       '/assets/audio/sfx/relic-found.mp3',
  deadWaters:       '/assets/audio/sfx/dead-waters.mp3',
  ghostFound:       '/assets/audio/sfx/ghost-found.mp3',
  treasureComplete: '/assets/audio/sfx/treasure-complete.mp3',
  pirateReveal:     '/assets/audio/sfx/pirate-reveal.mp3',
  bombExplode:      '/assets/audio/sfx/bomb-explode.mp3',
  fogSpread:        '/assets/audio/sfx/fog-spread.mp3',
  chaosShift:       '/assets/audio/sfx/chaos-shift.mp3',
  sonarPing:        '/assets/audio/sfx/sonar-ping.mp3',
  cannonball:       '/assets/audio/sfx/cannonball.mp3',
  cashout:          '/assets/audio/sfx/cashout.mp3',
  gameOver:         '/assets/audio/sfx/game-over.mp3',
  multiplierUp:     '/assets/audio/sfx/multiplier-up.mp3',
  hotWatersStreak:  '/assets/audio/sfx/hot-waters-streak.mp3',
  lastBreath:       '/assets/audio/sfx/last-breath.mp3',
  doubleWin:        '/assets/audio/sfx/double-win.mp3',
  doubleLose:       '/assets/audio/sfx/double-lose.mp3',
  buttonClick:      '/assets/audio/sfx/button-click.mp3',
  betAdjust:        '/assets/audio/sfx/bet-adjust.mp3',
}

// ── Internal helpers ─────────────────────────────────────────

async function preloadAll() {
  const entries = Object.entries(SFX_FILES)
  await Promise.allSettled(
    entries.map(async ([key, url]) => {
      try {
        const resp = await fetch(url)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const arrayBuf = await resp.arrayBuffer()
        buffers[key] = await ctx.decodeAudioData(arrayBuf)
      } catch (e) {
        console.warn(`[audio] Failed to load SFX "${key}":`, e.message)
      }
    })
  )
  console.log(`[audio] Loaded ${Object.keys(buffers).length}/${entries.length} SFX`)
}

function setupMusic() {
  musicElement = new Audio('/assets/audio/music/storm-over-the-hidden-fleet.mp3')
  musicElement.loop = true
  musicElement.volume = musicVolume
  musicElement.preload = 'auto'
}

// ── Public API ───────────────────────────────────────────────

export function initAudio() {
  if (initialized) return
  initialized = true
  ctx = new AudioContext()
  preloadAll()
  setupMusic()
  console.log('[audio] Initialized')
}

export function isAudioReady() {
  return initialized
}

export function playSFX(name, vol) {
  if (muted || !ctx || !buffers[name]) return
  if (ctx.state === 'suspended') ctx.resume()
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = buffers[name]
  gain.gain.value = vol !== undefined ? vol : sfxVolume
  source.connect(gain).connect(ctx.destination)
  source.start(0)
}

export function startMusic() {
  if (!musicElement) return
  musicElement.volume = muted ? 0 : musicVolume
  musicElement.play().catch(() => {})
}

export function stopMusic() {
  if (!musicElement) return
  musicElement.pause()
  musicElement.currentTime = 0
}

export function pauseMusic() {
  if (!musicElement) return
  musicElement.pause()
}

export function fadeMusic(targetVol, durationMs = 1000) {
  if (!musicElement) return
  const startVol = musicElement.volume
  const startTime = performance.now()
  const tick = (now) => {
    const elapsed = now - startTime
    const t = Math.min(1, elapsed / durationMs)
    const eased = 1 - (1 - t) * (1 - t)
    musicElement.volume = startVol + (targetVol - startVol) * eased
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export function setMuted(val) {
  muted = val
  if (musicElement) {
    musicElement.volume = val ? 0 : musicVolume
  }
}

export function toggleMute() {
  setMuted(!muted)
  return muted
}

export function isMuted() {
  return muted
}

export function setSFXVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, v))
}

export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v))
  if (musicElement && !muted) {
    musicElement.volume = musicVolume
  }
}

export function getVolumes() {
  return { music: musicVolume, sfx: sfxVolume, muted }
}
