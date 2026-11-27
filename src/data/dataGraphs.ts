import type { Tier } from './challenges'

/**
 * Data and Graphs. A bar graph of five categories, each bar a count from 0 to
 * 10. The five counts are a small data set: the overlay reads off its total,
 * range, mean, median and mode, and challenges ask for a graph that has a given
 * property.
 */
export const BAR_COUNT = 5
export const VALUE_MIN = 0
export const VALUE_MAX = 10

export type TopicId = 'fruit' | 'pets' | 'sports'

export interface Topic {
  id: TopicId
  title: string
  question: string
  categories: string[]
}

export const topics: Topic[] = [
  { id: 'fruit', title: 'Fruit', question: 'Favourite fruit', categories: ['Apple', 'Banana', 'Grape', 'Orange', 'Pear'] },
  { id: 'pets', title: 'Pets', question: 'Pets at home', categories: ['Dog', 'Cat', 'Fish', 'Bird', 'Rabbit'] },
  { id: 'sports', title: 'Sports', question: 'Favourite sport', categories: ['Football', 'Swimming', 'Tennis', 'Running', 'Cycling'] },
]
export const getTopic = (id: TopicId) => topics.find((t) => t.id === id) ?? topics[0]

export interface GraphState {
  topic: TopicId
  values: number[]
}

/** Where a learner starts. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_GRAPH: GraphState = { topic: 'fruit', values: [3, 5, 2, 4, 6] }

export const clampValue = (n: number) => Math.min(VALUE_MAX, Math.max(VALUE_MIN, Math.floor(n)))

/* ---------- Statistics of the five counts ---------- */

export const totalOf = (v: number[]) => v.reduce((a, b) => a + b, 0)
export const meanOf = (v: number[]) => totalOf(v) / v.length
export const rangeOf = (v: number[]) => Math.max(...v) - Math.min(...v)

export function medianOf(v: number[]): number {
  const s = [...v].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** The one value that appears most often (and more than once), or null when there is no single mode. */
export function modeOf(v: number[]): number | null {
  const counts = new Map<number, number>()
  for (const x of v) counts.set(x, (counts.get(x) ?? 0) + 1)
  const best = Math.max(...counts.values())
  if (best < 2) return null
  const winners = [...counts.entries()].filter(([, c]) => c === best)
  return winners.length === 1 ? winners[0][0] : null
}

/** Index of the single tallest bar, or null when two or more tie. */
export function tallestIndex(v: number[]): number | null {
  const max = Math.max(...v)
  const at = v.flatMap((x, i) => (x === max ? [i] : []))
  return at.length === 1 ? at[0] : null
}

/** 4, 4.2, 4.25: at most two decimal places, no trailing zeros. */
export const formatStat = (n: number) => String(Math.round(n * 100) / 100)

/* ---------- Challenges ---------- */

export type GraphRule =
  | { type: 'total'; value: number }
  | { type: 'mean'; value: number }
  | { type: 'median'; value: number }
  | { type: 'mode'; value: number }
  | { type: 'range'; value: number }
  /** This bar (0-based) is the tallest, on its own. */
  | { type: 'tallest'; index: number }
  /** These two bars tie for the tallest. */
  | { type: 'tied'; a: number; b: number }
  /** Every bar has the same height, and it is not zero. */
  | { type: 'all-equal' }
  | { type: 'median-above-mean' }
  | { type: 'all'; rules: GraphRule[] }

export interface GraphChallenge {
  id: string
  tier: Tier
  rule: GraphRule
  prompt: string
  hint: string
}

function ruleHolds(r: GraphRule, v: number[]): boolean {
  switch (r.type) {
    case 'total':
      return totalOf(v) === r.value
    case 'mean':
      return meanOf(v) === r.value
    case 'median':
      return medianOf(v) === r.value
    case 'mode':
      return modeOf(v) === r.value
    case 'range':
      return rangeOf(v) === r.value
    case 'tallest':
      return tallestIndex(v) === r.index
    case 'tied': {
      const max = Math.max(...v)
      return v[r.a] === max && v[r.b] === max
    }
    case 'all-equal':
      return v.every((x) => x === v[0]) && v[0] > 0
    case 'median-above-mean':
      return medianOf(v) > meanOf(v)
    case 'all':
      return r.rules.every((x) => ruleHolds(x, v))
  }
}

export const isGraphSolved = (c: GraphChallenge, s: GraphState) => ruleHolds(c.rule, s.values)

// IDs are stable: they are stored in saved progress.
export const graphChallenges: GraphChallenge[] = [
  // Easy: read a graph, one fact at a time
  { id: 'g-total-10', tier: 'easy', rule: { type: 'total', value: 10 }, prompt: 'Make a graph where the bars add up to 10 in total.', hint: 'The total is shown in the readout. Raise and lower bars until it says 10.' },
  { id: 'g-tallest-1', tier: 'easy', rule: { type: 'tallest', index: 0 }, prompt: 'Make bar 1 the tallest, with no other bar as tall.', hint: 'Bar 1 needs a bigger number than all of the others.' },
  { id: 'g-mean-3', tier: 'easy', rule: { type: 'mean', value: 3 }, prompt: 'Make a graph with a mean of 3.', hint: 'The mean is the total shared out equally: 5 bars × 3 = 15.' },
  { id: 'g-all-equal', tier: 'easy', rule: { type: 'all-equal' }, prompt: 'Make all five bars the same height (not zero).', hint: 'Every bar shows the same number.' },
  // Medium: median, range, mode, ties
  { id: 'g-median-6', tier: 'medium', rule: { type: 'median', value: 6 }, prompt: 'Make a graph with a median of 6.', hint: 'Put the counts in order. The middle one has to be 6.' },
  { id: 'g-range-5', tier: 'medium', rule: { type: 'range', value: 5 }, prompt: 'Make a graph with a range of 5.', hint: 'Range = tallest bar − shortest bar.' },
  { id: 'g-mode-3', tier: 'medium', rule: { type: 'mode', value: 3 }, prompt: 'Make 3 the mode: it must appear more often than any other number.', hint: 'At least two bars show 3, and no other number shows up as often.' },
  { id: 'g-tied-2-4', tier: 'medium', rule: { type: 'tied', a: 1, b: 3 }, prompt: 'Make bars 2 and 4 tie for the tallest.', hint: 'Both bars need the biggest count in the graph.' },
  // Hard: two facts at once
  { id: 'g-mean-6-median-4', tier: 'hard', rule: { type: 'all', rules: [{ type: 'mean', value: 6 }, { type: 'median', value: 4 }] }, prompt: 'Make a graph with a mean of 6 and a median of 4.', hint: 'Total 30. A few big bars pull the mean up past the median.' },
  { id: 'g-range-9-mean-5', tier: 'hard', rule: { type: 'all', rules: [{ type: 'range', value: 9 }, { type: 'mean', value: 5 }] }, prompt: 'Make a graph with a range of 9 and a mean of 5.', hint: 'Start with a 0 and a 9, then fill the other three so the total is 25.' },
  { id: 'g-median-above-mean', tier: 'hard', rule: { type: 'median-above-mean' }, prompt: 'Make the median bigger than the mean.', hint: 'A few very small bars drag the mean below the middle value.' },
  { id: 'g-total-23-mode-4', tier: 'hard', rule: { type: 'all', rules: [{ type: 'total', value: 23 }, { type: 'mode', value: 4 }] }, prompt: 'Make the total 23 and the mode 4.', hint: 'Two bars of 4, then three more that add to 15 without repeating another number.' },
]
