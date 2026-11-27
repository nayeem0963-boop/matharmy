import { useEffect } from 'react'
import { useModuleRuntimes } from './modules/useModuleRuntimes'
import { useProgress } from './hooks/useProgress'
import { AcademyShell } from './shell/AcademyShell'
import { useHashView } from './shell/route'
import { playClick, setSoundEnabled } from './utils/soundEffects'
import './App.css'
import './styles-foundation.css'

/** App root: saved progress, hash navigation, per-module runtimes, then the Academy shell. */
function App() {
  const progressApi = useProgress()
  const { progress, setSoundOn, setLastView } = progressApi
  const soundOn = progress.soundOn

  // Remember the module the learner is using (shown as "Continue" on the welcome page).
  const [view, navigate] = useHashView(setLastView)
  const openView: typeof navigate = (next) => {
    playClick()
    navigate(next)
  }

  // Apply the saved sound preference (and any change from another tab).
  useEffect(() => {
    setSoundEnabled(soundOn)
  }, [soundOn])
  const toggleSound = () => {
    const next = !soundOn
    setSoundEnabled(next) // apply now so the click below can play
    setSoundOn(next) // persisted; the effect above keeps it applied
    if (next) playClick()
  }

  const runtimes = useModuleRuntimes(progressApi)

  return (
    <AcademyShell
      view={view}
      onNavigate={openView}
      runtimes={runtimes}
      progress={progressApi}
      soundOn={soundOn}
      onToggleSound={toggleSound}
    />
  )
}

export default App
