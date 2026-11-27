import type { MathModuleId } from './mathModules'

/** What Captain Hexa-Cubie reacts to. */
export type CaptainEvent = 'solve' | 'badge' | 'level'

const LINES: Record<CaptainEvent, string[]> = {
  solve: [
    'Mission accomplished, cadet!',
    'Nice work! That one was tricky.',
    'Correct! Hexa-Cubie salutes you.',
    'You nailed it!',
    'Brilliant thinking!',
  ],
  badge: [
    'A new badge! Wear it with pride.',
    'Badge unlocked. The army is proud!',
    'Look at that shiny badge!',
  ],
  level: [
    'Level up! You are marching ahead.',
    'Promotion time! New level reached.',
    'Higher rank, bigger missions!',
  ],
}

/** Tips shown when the learner taps the Captain inside a module. */
const TIPS: Record<MathModuleId, string[]> = {
  fractions: ['Click a block to set the numerator.', 'Equivalent fractions count too: 2/4 is the same as 1/2.'],
  geometry: ['Try unfolding a solid into its net.', 'Watch how volume changes when you stretch one side.'],
  'number-sense': ['Ten ones make a ten. Try trading them!', 'Zeros hold the places. 406 has no tens.'],
  'add-subtract': ['Stuck on subtracting? Break a ten into ten ones.', 'Ten ones make a ten. Trade them when you add.'],
  multiplication: ['Swap rows and columns: 3 × 4 and 4 × 3 match!', 'Click a cube to skip count up to its row.'],
}

/** The n-th line for an event; cycles through the list so repeats vary but stay predictable. */
export const captainLine = (event: CaptainEvent, n: number) => LINES[event][Math.abs(n) % LINES[event].length]
export const captainTip = (module: MathModuleId, n: number) => TIPS[module][Math.abs(n) % TIPS[module].length]

export const CAPTAIN_EVENTS = Object.keys(LINES) as CaptainEvent[]
export const captainLineCount = (event: CaptainEvent) => LINES[event].length
