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
  'data-graphs': ['The mean shares the total out equally. Try the mean line!', 'Put the counts in order to find the median.'],
  probability: ['The more you spin, the closer the results get to the chances!', 'Half the sectors red? Then red has a 1/2 chance.'],
  integers: ['Subtracting a negative is the same as adding a positive!', 'The further right on the line, the greater the number.'],
  'coordinate-plane': ['Say x first, then y: across, then up.', 'A flip changes a sign; a slide adds or subtracts.'],
  angles: ['Click the protractor to turn the ray!', 'A right angle is the corner of a square: 90°.'],
  decimals: ['A column is a tenth, a single square is a hundredth.', '50% and 0.5 and 1/2 are the same amount!'],
  'area-perimeter': ['Area counts tiles inside. Perimeter counts edges around.', 'Cut a corner off an L-shape: the area shrinks, the perimeter stays!'],
  patterns: ['Adding makes steady steps up. Multiplying curves upward!', 'To find a far term, use the rule instead of counting.'],
  division: ['Check division with multiplication: 6 × 3 + 2 = 20.', 'Leftovers are always smaller than what you divide by.'],
}

/** The n-th line for an event; cycles through the list so repeats vary but stay predictable. */
export const captainLine = (event: CaptainEvent, n: number) => LINES[event][Math.abs(n) % LINES[event].length]
export const captainTip = (module: MathModuleId, n: number) => TIPS[module][Math.abs(n) % TIPS[module].length]

export const CAPTAIN_EVENTS = Object.keys(LINES) as CaptainEvent[]
export const captainLineCount = (event: CaptainEvent) => LINES[event].length
