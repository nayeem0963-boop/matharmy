import { useCallback, useState } from 'react'
import { DataOverlay } from '../../components/panels/DataOverlay'
import { DataPanel } from '../../components/panels/DataPanel'
import { DEFAULT_GRAPH, clampValue, getTopic, type GraphState, type TopicId } from '../../data/dataGraphs'
import { graphLabel } from '../../data/sceneLabels'
import { graphSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime } from '../../utils/soundEffects'
import { DataScene, MathCanvas } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

/** Data and Graphs: state, quiz wiring, sidebar controls and 3D stage. */
export function useDataGraphsModule(progress: ProgressApi): ModuleRuntime {
  const [graph, setGraph] = useState<GraphState>(DEFAULT_GRAPH)
  const [showMean, setShowMean] = useState(false)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)
  const topic = getTopic(graph.topic)

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'data-graphs',
    challenges: graphSet.challenges,
    enabled: quizOn,
    isSolved: (c) => graphSet.isSolved(c, graph),
    onCelebrate: celebrate,
    progress,
  })

  return {
    stars: quiz.score,
    total: graphSet.challenges.length,
    panel: (
      <DataPanel
        topic={topic}
        values={graph.values}
        showMean={showMean}
        onTopic={(id: TopicId) => setGraph((g) => ({ ...g, topic: id }))}
        onValue={(i, n) => setGraph((g) => ({ ...g, values: g.values.map((v, j) => (j === i ? clampValue(n) : v)) }))}
        onShowMean={setShowMean}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="data-graphs"
          resetKey="data-graphs"
          cameraPosition={[0, 4.5, 13.5]}
          maxDistance={30}
          label={graphLabel(topic, graph.values, showMean)}
        >
          <DataScene categories={topic.categories} values={graph.values} showMean={showMean} burstKey={burst} />
        </MathCanvas>
        <DataOverlay topic={topic} values={graph.values} />
      </>
    ),
  }
}
