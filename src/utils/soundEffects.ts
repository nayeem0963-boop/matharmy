/**
 * Tiny procedural sound effects built on the Web Audio API.
 * No audio files are downloaded: every sound is synthesised from oscillators.
 *
 * The AudioContext is created lazily on the first sound triggered by a user
 * gesture (click / change), which keeps browsers' autoplay policies happy.
 * Hover sounds never create the context; they only play once it exists.
 */

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

let context: AudioContext | null = null
let master: GainNode | null = null
let enabled = true
let lastPopAt = 0

const POP_THROTTLE_MS = 70

function getContext(create: boolean): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null
  if (!context) {
    if (!create) return null
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
    if (!Ctor) return null
    context = new Ctor()
    master = context.createGain()
    master.gain.value = 0.25
    master.connect(context.destination)
  }
  if (context.state === 'suspended') {
    if (!create) return null
    void context.resume()
  }
  return context
}

interface ToneOptions {
  frequency: number
  duration: number
  delay?: number
  type?: OscillatorType
  volume?: number
  endFrequency?: number
}

function playTone(ctx: AudioContext, opts: ToneOptions) {
  if (!master) return
  const { frequency, duration, delay = 0, type = 'sine', volume = 0.6, endFrequency } = opts
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration)

  // Short attack, exponential decay: avoids clicks.
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain)
  gain.connect(master)
  osc.start(start)
  osc.stop(start + duration + 0.05)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

/** Cheerful rising arpeggio for a correct answer. */
export function playChime() {
  const ctx = getContext(true)
  if (!ctx) return
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((frequency, i) => {
    playTone(ctx, { frequency, duration: 0.45, delay: i * 0.08, type: 'triangle', volume: 0.5 })
    playTone(ctx, { frequency: frequency * 2, duration: 0.25, delay: i * 0.08, volume: 0.08 })
  })
}

/** Soft, short pop for hovering interactive objects. Throttled. */
export function playPop() {
  const now = performance.now()
  if (now - lastPopAt < POP_THROTTLE_MS) return
  const ctx = getContext(false)
  if (!ctx) return
  lastPopAt = now
  playTone(ctx, { frequency: 620, endFrequency: 240, duration: 0.09, volume: 0.25 })
}

/** Crisp tick for button presses and selections. */
export function playClick() {
  const ctx = getContext(true)
  if (!ctx) return
  playTone(ctx, { frequency: 1100, endFrequency: 700, duration: 0.05, type: 'square', volume: 0.08 })
}

/**
 * Bundling cue: a rising whoosh while the pieces fly, then a bright two-note
 * "snap" when they lock together `arrivalSeconds` later.
 */
export function playBundle(arrivalSeconds = 0.9) {
  const ctx = getContext(true)
  if (!ctx) return
  playTone(ctx, { frequency: 260, endFrequency: 780, duration: arrivalSeconds * 0.8, type: 'triangle', volume: 0.12 })
  playTone(ctx, { frequency: 1400, endFrequency: 700, duration: 0.05, delay: arrivalSeconds, type: 'square', volume: 0.1 })
  playTone(ctx, { frequency: 784, duration: 0.18, delay: arrivalSeconds, type: 'triangle', volume: 0.35 })
  playTone(ctx, { frequency: 1175, duration: 0.25, delay: arrivalSeconds + 0.07, type: 'triangle', volume: 0.3 })
}

/**
 * Breaking cue: a short crack, a falling whoosh, then a patter of light ticks
 * as the small pieces land `arrivalSeconds` later.
 */
export function playBreak(arrivalSeconds = 0.9) {
  const ctx = getContext(true)
  if (!ctx) return
  playTone(ctx, { frequency: 900, endFrequency: 300, duration: 0.06, type: 'square', volume: 0.1 })
  playTone(ctx, { frequency: 780, endFrequency: 260, duration: arrivalSeconds * 0.8, type: 'triangle', volume: 0.12 })
  for (let i = 0; i < 4; i++) {
    playTone(ctx, {
      frequency: 1300 - i * 120,
      endFrequency: 900 - i * 80,
      duration: 0.05,
      delay: arrivalSeconds - 0.12 + i * 0.06,
      volume: 0.12,
    })
  }
}

/** Friendly robot "boo-dee-bip!" greeting for the mascot. */
export function playHello() {
  const ctx = getContext(true)
  if (!ctx) return
  playTone(ctx, { frequency: 392, endFrequency: 523, duration: 0.14, type: 'sine', volume: 0.35 })
  playTone(ctx, { frequency: 659, endFrequency: 880, duration: 0.16, delay: 0.13, type: 'sine', volume: 0.35 })
  playTone(ctx, { frequency: 1320, duration: 0.08, delay: 0.3, type: 'triangle', volume: 0.25 })
}

/**
 * Short triumphant fanfare for unlocking a badge: a quick G-C-E-G run up to a
 * held high C, with a soft octave shimmer. Starts after a small delay so it
 * lands just after the solve chime instead of on top of it.
 */
export function playFanfare(delaySeconds = 0.35) {
  const ctx = getContext(true)
  if (!ctx) return
  const run = [392, 523.25, 659.25, 783.99] // G4 C5 E5 G5
  run.forEach((frequency, i) => {
    playTone(ctx, { frequency, duration: 0.16, delay: delaySeconds + i * 0.07, type: 'square', volume: 0.12 })
  })
  const hold = delaySeconds + run.length * 0.07
  playTone(ctx, { frequency: 1046.5, duration: 0.6, delay: hold, type: 'triangle', volume: 0.4 }) // C6
  playTone(ctx, { frequency: 2093, duration: 0.45, delay: hold + 0.02, volume: 0.06 })
}

export function setSoundEnabled(value: boolean) {
  enabled = value
  if (!value && context?.state === 'running') void context.suspend()
}

export function isSoundEnabled() {
  return enabled
}
