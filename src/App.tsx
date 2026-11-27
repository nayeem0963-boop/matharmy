import { useState, type CSSProperties } from 'react'
import { MathCanvas } from './components/canvas/MathCanvas'
import { FractionBlocksScene } from './components/scenes/FractionBlocksScene'
import { getModule, mathModules, type MathModuleId } from './data/mathModules'
import './App.css'

const MAX_DENOMINATOR = 12

function App() {
  const [activeId, setActiveId] = useState<MathModuleId>('fractions')
  const [numerator, setNumerator] = useState(3)
  const [denominator, setDenominator] = useState(4)
  const active = getModule(activeId)

  // Allow improper fractions up to two wholes.
  const maxNumerator = denominator * 2

  const changeDenominator = (next: number) => {
    const d = Math.min(MAX_DENOMINATOR, Math.max(1, next))
    setDenominator(d)
    setNumerator((n) => Math.min(n, d * 2))
  }
  const changeNumerator = (next: number) =>
    setNumerator(Math.min(maxNumerator, Math.max(0, next)))

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            ∑
          </span>
          <span className="brand__name">MathArmy</span>
        </div>
        <nav className="module-tabs" aria-label="Math modules">
          {mathModules.map((m) => (
            <button
              key={m.id}
              type="button"
              className="module-tab"
              aria-pressed={m.id === activeId}
              style={{ '--tab-color': m.color } as CSSProperties}
              onClick={() => setActiveId(m.id)}
            >
              {m.title}
              {m.status === 'coming-soon' && <span className="badge">Soon</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <aside className="panel">
          <p className="panel__eyebrow">{active.gradeBand}</p>
          <h1 className="panel__title">{active.title}</h1>
          <p className="panel__text">{active.description}</p>

          {active.id === 'fractions' ? (
            <div className="controls">
              <div className="fraction-readout" aria-live="polite">
                <span>{numerator}</span>
                <span className="fraction-readout__bar" />
                <span>{denominator}</span>
              </div>
              <Stepper
                label="Numerator"
                value={numerator}
                min={0}
                max={maxNumerator}
                onChange={changeNumerator}
              />
              <Stepper
                label="Denominator"
                value={denominator}
                min={1}
                max={MAX_DENOMINATOR}
                onChange={changeDenominator}
              />
              <p className="hint">Tip: click a block to set the numerator. Drag to orbit.</p>
            </div>
          ) : (
            <ul className="skills">
              {active.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </aside>

        <section className="stage" aria-label={`${active.title} 3D view`}>
          {active.id === 'fractions' ? (
            <MathCanvas resetKey={active.id}>
              <FractionBlocksScene
                numerator={numerator}
                denominator={denominator}
                color={active.color}
                onSelectNumerator={changeNumerator}
              />
            </MathCanvas>
          ) : (
            <div className="stage__placeholder">
              <p>{active.title} is coming soon.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function Stepper({ label, value, min, max, onChange }: StepperProps) {
  return (
    <div className="stepper">
      <span className="stepper__label">{label}</span>
      <span className="stepper__row">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </span>
    </div>
  )
}

export default App
