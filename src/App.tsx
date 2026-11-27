import { lazy, Suspense, useCallback, useEffect, useState, type CSSProperties } from 'react'
import { SceneErrorBoundary } from './components/canvas/SceneErrorBoundary'
import { FractionsPanel, MAX_DENOMINATOR } from './components/panels/FractionsPanel'
import { GeometryFormulaOverlay } from './components/panels/GeometryFormulaOverlay'
import { GeometryPanel } from './components/panels/GeometryPanel'
import { NumberSenseOverlay } from './components/panels/NumberSenseOverlay'
import { NumberSensePanel } from './components/panels/NumberSensePanel'
import { WelcomePanel } from './components/panels/WelcomePanel'
import { BadgeToast } from './components/ui/BadgeToast'
import { fractionChallenges, geometryChallenges, isFractionSolved } from './data/challenges'
import { getModule, mathModules, type MathModuleId } from './data/mathModules'
import {
  PLACE_LIMITS,
  REGROUP_SPECS,
  REGROUP_TOTAL_SECONDS,
  applyRegroup,
  isNumberSenseSolved,
  numberSenseChallenges,
  type Place,
  type PlaceValueCounts,
  type RegroupEvent,
  type RegroupKind,
} from './data/placeValue'
import { useModuleQuiz } from './hooks/useModuleQuiz'
import { useProgress } from './hooks/useProgress'
import { useShapeDimensions } from './hooks/useShapeDimensions'
import {
  playBreak,
  playBundle,
  playChime,
  playClick,
  setSoundEnabled,
} from './utils/soundEffects'
import './App.css'

// Everything that pulls in three / @react-three/* loads on demand, so the
// initial bundle is only React + the UI shell.
const MathCanvas = lazy(() => import('./components/canvas/MathCanvas'))
const FractionBlocksScene = lazy(() => import('./components/scenes/FractionBlocksScene'))
const GeometryExplorerScene = lazy(() => import('./components/scenes/GeometryExplorerScene'))
const PlaceValueScene = lazy(() => import('./components/scenes/PlaceValueScene'))
const CaptainHexaCubieScene = lazy(() => import('./components/scenes/CaptainHexaCubieScene'))

type View = 'welcome' | MathModuleId

function StageLoading() {
  return (
    <div className="stage__placeholder" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>Loading 3D scene…</p>
    </div>
  )
}

function App() {
  const progressApi = useProgress()
  // Reopen the module the learner was last using (saved by openView below).
  const [view, setView] = useState<View>(() => progressApi.progress.lastView)
  const { progress, setSoundOn, setLastView, resetProgress, badgeQueue, dismissBadge } = progressApi
  const soundOn = progress.soundOn
  const active = view === 'welcome' ? null : getModule(view)
  const openView = (next: View) => {
    playClick()
    setView(next)
    setLastView(next)
  }

  // Apply the saved sound preference (and any change from another tab).
  useEffect(() => {
    setSoundEnabled(soundOn)
  }, [soundOn])


  // Fractions state
  const [numerator, setNumerator] = useState(3)
  const [denominator, setDenominator] = useState(4)
  const [fractionQuizOn, setFractionQuizOn] = useState(false)
  const [fractionBurst, setFractionBurst] = useState(0)

  const changeDenominator = (next: number) => {
    const d = Math.min(MAX_DENOMINATOR, Math.max(1, next))
    setDenominator(d)
    setNumerator((n) => Math.min(n, d * 2))
  }
  const changeNumerator = (next: number) =>
    setNumerator(Math.min(denominator * 2, Math.max(0, next)))

  const celebrateFraction = useCallback(() => {
    playChime()
    setFractionBurst((b) => b + 1)
  }, [])
  const fractionQuiz = useModuleQuiz({
    module: 'fractions',
    challenges: fractionChallenges,
    enabled: fractionQuizOn,
    isSolved: (c) => isFractionSolved(c, numerator, denominator),
    onCelebrate: celebrateFraction,
    progress: progressApi,
  })

  // Geometry state
  const geometry = useShapeDimensions('cube')
  const [geometryQuizOn, setGeometryQuizOn] = useState(false)
  const [geometryBurst, setGeometryBurst] = useState(0)
  const celebrateGeometry = useCallback(() => {
    playChime()
    setGeometryBurst((b) => b + 1)
  }, [])
  const geometryQuiz = useModuleQuiz({
    module: 'geometry',
    challenges: geometryChallenges,
    enabled: geometryQuizOn,
    isSolved: (c) =>
      c.check({ shapeId: geometry.shapeId, dimensions: geometry.dimensions, metrics: geometry.metrics }),
    onCelebrate: celebrateGeometry,
    progress: progressApi,
  })

  // Number Sense state
  const [placeCounts, setPlaceCounts] = useState<PlaceValueCounts>({ hundreds: 1, tens: 2, ones: 3 })
  const [numberQuizOn, setNumberQuizOn] = useState(false)
  const [numberBurst, setNumberBurst] = useState(0)
  const [regroup, setRegroup] = useState<RegroupEvent | null>(null)
  const setPlaceCount = (place: Place, value: number) =>
    setPlaceCounts((c) => ({ ...c, [place]: Math.min(PLACE_LIMITS[place], Math.max(0, value)) }))
  const regroupPlace = (kind: RegroupKind) => {
    const next = applyRegroup(placeCounts, kind)
    if (!next) return
    setPlaceCounts(next)
    setRegroup((r) => ({ id: (r?.id ?? 0) + 1, kind }))
    if (REGROUP_SPECS[kind].bundle) playBundle(REGROUP_TOTAL_SECONDS)
    else playBreak(REGROUP_TOTAL_SECONDS)
  }
  const celebrateNumber = useCallback(() => {
    playChime()
    setNumberBurst((b) => b + 1)
  }, [])
  const numberQuiz = useModuleQuiz({
    module: 'number-sense',
    challenges: numberSenseChallenges,
    enabled: numberQuizOn,
    isSolved: (c) => isNumberSenseSolved(c, placeCounts),
    onCelebrate: celebrateNumber,
    progress: progressApi,
  })

  const toggleSound = () => {
    const next = !soundOn
    setSoundEnabled(next) // apply now so the click below can play
    setSoundOn(next) // persisted; the effect above keeps it applied
    if (next) playClick()
  }

  const renderStage = () => {
    if (!active) {
      return (
        <MathCanvas key="welcome" resetKey="welcome" cameraPosition={[0, 2.5, 5.7]}>
          <CaptainHexaCubieScene />
        </MathCanvas>
      )
    }
    if (active.id === 'fractions') {
      return (
        <MathCanvas key="fractions" resetKey={active.id}>
          <FractionBlocksScene
            numerator={numerator}
            denominator={denominator}
            color={active.color}
            onSelectNumerator={changeNumerator}
            burstKey={fractionBurst}
          />
        </MathCanvas>
      )
    }
    if (active.id === 'geometry') {
      return (
        <>
          <MathCanvas key="geometry" resetKey={active.id} cameraPosition={[4.5, 5, 7.5]} maxDistance={24}>
            <GeometryExplorerScene
              shapeId={geometry.shapeId}
              dimensions={geometry.dimensions}
              showNet={geometry.showNet}
              color={active.color}
              burstKey={geometryBurst}
            />
          </MathCanvas>
          <GeometryFormulaOverlay shape={geometry.shape} metrics={geometry.metrics} />
        </>
      )
    }
    if (active.id === 'number-sense') {
      return (
        <>
          <MathCanvas key="number-sense" resetKey={active.id} cameraPosition={[0, 6.5, 8.5]} maxDistance={32}>
            <PlaceValueScene counts={placeCounts} burstKey={numberBurst} regroup={regroup} />
          </MathCanvas>
          <NumberSenseOverlay counts={placeCounts} />
        </>
      )
    }
    return (
      <div className="stage__placeholder">
        <p>{active.title} is coming soon.</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <button
          type="button"
          className="brand"
          aria-label="MathArmy home"
          aria-current={view === 'welcome' ? 'page' : undefined}
          onClick={() => openView('welcome')}
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
              onClick={() => openView(m.id)}
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
          onClick={toggleSound}
          title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
        >
          {soundOn ? '🔊 Sound on' : '🔇 Sound off'}
        </button>
      </header>

      <main className="app-main">
        <aside className="panel">
          {!active && <WelcomePanel
              onSelect={(id) => openView(id)}
              stars={{
                fractions: fractionQuiz.quiz.score,
                geometry: geometryQuiz.quiz.score,
                'number-sense': numberQuiz.quiz.score,
              }}
              totals={{
                fractions: fractionChallenges.length,
                geometry: geometryChallenges.length,
                'number-sense': numberSenseChallenges.length,
              }}
              earnedBadges={progress.badges}
              onResetProgress={resetProgress}
            />}
          {active && (
            <>
              <p className="panel__eyebrow">{active.gradeBand}</p>
              <h1 className="panel__title">{active.title}</h1>
              <p className="panel__text">{active.description}</p>
            </>
          )}

          {active?.id === 'fractions' && (
            <FractionsPanel
              numerator={numerator}
              denominator={denominator}
              onNumeratorChange={changeNumerator}
              onDenominatorChange={changeDenominator}
              quizOn={fractionQuizOn}
              onQuizChange={setFractionQuizOn}
              challenge={fractionQuiz.challenge}
              quiz={fractionQuiz.quiz}
            />
          )}
          {active?.id === 'geometry' && (
            <GeometryPanel
              geometry={geometry}
              quizOn={geometryQuizOn}
              onQuizChange={setGeometryQuizOn}
              challenge={geometryQuiz.challenge}
              quiz={geometryQuiz.quiz}
            />
          )}
          {active?.id === 'number-sense' && (
            <NumberSensePanel
              counts={placeCounts}
              onCountChange={setPlaceCount}
              onClear={() => setPlaceCounts({ hundreds: 0, tens: 0, ones: 0 })}
              onRegroup={regroupPlace}
              quizOn={numberQuizOn}
              onQuizChange={setNumberQuizOn}
              challenge={numberQuiz.challenge}
              quiz={numberQuiz.quiz}
            />
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
            <Suspense fallback={<StageLoading />}>{renderStage()}</Suspense>
          </SceneErrorBoundary>
        </section>
      </main>

      {badgeQueue.length > 0 && <BadgeToast key={badgeQueue[0]} badgeId={badgeQueue[0]} onDone={dismissBadge} />}
    </div>
  )
}

export default App
