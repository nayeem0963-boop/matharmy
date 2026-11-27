import { lazy, Suspense, type CSSProperties } from 'react'
import { SceneErrorBoundary } from '../components/canvas/SceneErrorBoundary'
import { WelcomePanel } from '../components/panels/WelcomePanel'
import { BadgeToast } from '../components/ui/BadgeToast'
import { getModule, mathModules } from '../data/mathModules'
import type { ModuleRuntimes, ProgressApi } from '../modules/types'
import { MathCanvas } from '../modules/shared'
import type { View } from './route'

const CaptainHexaCubieScene = lazy(() => import('../components/scenes/CaptainHexaCubieScene'))

function StageLoading() {
  return (
    <div className="stage__placeholder" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>Loading 3D scene…</p>
    </div>
  )
}

interface AcademyShellProps {
  view: View
  onNavigate: (view: View) => void
  runtimes: ModuleRuntimes
  progress: ProgressApi
  soundOn: boolean
  onToggleSound: () => void
}

/**
 * The MathArmy Academy frame: header with module tabs, sidebar panel, 3D stage
 * and the badge toast. It knows nothing about any one module; each module's
 * controls and stage come from its runtime (see `src/modules`).
 */
export function AcademyShell({ view, onNavigate, runtimes, progress, soundOn, onToggleSound }: AcademyShellProps) {
  const { progress: saved, resetProgress, badgeQueue, dismissBadge } = progress
  const active = view === 'welcome' ? null : getModule(view)
  const runtime = active ? runtimes[active.id] : null
  const lastModule = saved.lastView === 'welcome' ? null : getModule(saved.lastView)

  const stars = Object.fromEntries(mathModules.map((m) => [m.id, runtimes[m.id].stars])) as Record<
    (typeof mathModules)[number]['id'],
    number
  >
  const totals = Object.fromEntries(mathModules.map((m) => [m.id, runtimes[m.id].total])) as typeof stars

  const stage = !active ? (
    <MathCanvas key="welcome" resetKey="welcome" cameraPosition={[0, 2.5, 5.7]}>
      <CaptainHexaCubieScene />
    </MathCanvas>
  ) : active.status === 'coming-soon' ? (
    <div className="stage__placeholder">
      <p>{active.title} is coming soon.</p>
    </div>
  ) : (
    runtime!.stage
  )

  return (
    <div className="app">
      <header className="app-header">
        <button
          type="button"
          className="brand"
          aria-label="MathArmy home"
          aria-current={view === 'welcome' ? 'page' : undefined}
          onClick={() => onNavigate('welcome')}
        >
          <span className="brand__mark" aria-hidden="true">
            ∑
          </span>
          <span className="brand__name">MathArmy</span>
        </button>
        <nav className="module-tabs" aria-label="Math modules">
          {mathModules.map((m) => (
            <button
              key={m.id}
              type="button"
              className="module-tab"
              aria-pressed={m.id === view}
              style={{ '--tab-color': m.color } as CSSProperties}
              onClick={() => onNavigate(m.id)}
            >
              {m.tabLabel}
              {m.status === 'coming-soon' && <span className="badge">Soon</span>}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="sound-toggle"
          aria-pressed={soundOn}
          onClick={onToggleSound}
          title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
        >
          {soundOn ? '🔊 Sound on' : '🔇 Sound off'}
        </button>
      </header>

      <main className="app-main">
        <aside className="panel">
          {!active && (
            <WelcomePanel
              onSelect={onNavigate}
              stars={stars}
              totals={totals}
              earnedBadges={saved.badges}
              onResetProgress={resetProgress}
              continueModule={lastModule}
            />
          )}
          {active && (
            <>
              <p className="panel__eyebrow">{active.gradeBand}</p>
              <h1 className="panel__title">{active.title}</h1>
              <p className="panel__text">{active.description}</p>
              {runtime!.panel}
            </>
          )}
          {active?.status === 'coming-soon' && (
            <ul className="skills">
              {active.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </aside>

        <section
          className="stage"
          aria-label={active ? `${active.title} 3D view` : 'Captain Hexa-Cubie welcome scene'}
        >
          <SceneErrorBoundary resetKey={view}>
            <Suspense fallback={<StageLoading />}>{stage}</Suspense>
          </SceneErrorBoundary>
        </section>
      </main>

      {badgeQueue.length > 0 && <BadgeToast key={badgeQueue[0]} badgeId={badgeQueue[0]} onDone={dismissBadge} />}
    </div>
  )
}
