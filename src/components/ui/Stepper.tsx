import { playClick } from '../../utils/soundEffects'

interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  /** Optional symbol shown after the label, e.g. "l". */
  symbol?: string
  onChange: (value: number) => void
}

/** Slider with − / + buttons and a live value readout. */
export function Stepper({ label, value, min, max, step = 1, symbol, onChange }: StepperProps) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="stepper">
      <span className="stepper__label">
        <span>
          {label}
          {symbol && <var className="stepper__symbol"> {symbol}</var>}
        </span>
        <output className="stepper__value">{value}</output>
      </span>
      <span className="stepper__row">
        <button
          type="button"
          onClick={() => {
            playClick()
            set(value - step)
          }}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(e) => set(Number(e.target.value))}
        />
        <button
          type="button"
          onClick={() => {
            playClick()
            set(value + step)
          }}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </span>
    </div>
  )
}
