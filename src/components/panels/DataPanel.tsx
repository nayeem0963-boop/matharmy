import './data-graphs.css'
import { VALUE_MAX, VALUE_MIN, topics, type GraphChallenge, type Topic, type TopicId } from '../../data/dataGraphs'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface DataPanelProps {
  topic: Topic
  values: number[]
  showMean: boolean
  onTopic: (id: TopicId) => void
  onValue: (index: number, n: number) => void
  onShowMean: (on: boolean) => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: GraphChallenge
  quiz: QuizStatus
}

export function DataPanel({ topic, values, showMean, onTopic, onValue, onShowMean, quizOn, onQuizChange, challenge, quiz }: DataPanelProps) {
  return (
    <div className="controls">
      <div className="shape-picker" role="group" aria-label="Topic">
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            className="shape-picker__btn"
            aria-pressed={t.id === topic.id}
            onClick={() => {
              playClick()
              onTopic(t.id)
            }}
          >
            {t.title}
          </button>
        ))}
      </div>
      {values.map((v, i) => (
        <Stepper
          key={`${topic.id}-${i}`}
          label={`Bar ${i + 1}: ${topic.categories[i]}`}
          value={v}
          min={VALUE_MIN}
          max={VALUE_MAX}
          onChange={(n) => onValue(i, n)}
        />
      ))}
      <Toggle label="Show mean line" checked={showMean} onChange={onShowMean} />
      <p className="hint">Each bar is a count from 0 to 10. The five counts are your data set.</p>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
