import { useCallback, useState } from 'react'
import { AddSubtractOverlay } from '../../components/panels/AddSubtractOverlay'
import { AddSubtractPanel } from '../../components/panels/AddSubtractPanel'
import {
  applyPart,
  challengePrompt,
  columnWorking,
  regroupMat,
  startMat,
  validOperands,
  type Mat,
  type Operation,
  type Part,
} from '../../data/addSubtract'
import { REGROUP_SPECS, REGROUP_TOTAL_SECONDS, type RegroupEvent, type RegroupKind } from '../../data/placeValue'
import { addSubtractSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playBreak, playBundle, playChime, playClick } from '../../utils/soundEffects'
import { sumLabel } from '../../data/sceneLabels'
import { MathCanvas, PlaceValueScene } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

const keyOf = (op: Operation, a: number, b: number) => `${op}:${a}:${b}`

/**
 * Add & Subtract: base-ten blocks on the Number Sense mat. The mat belongs to one
 * sum; changing the numbers (or the challenge) gives a fresh mat for the new sum.
 */
export function useAddSubtractModule(progress: ProgressApi): ModuleRuntime {
  const [free, setFree] = useState<{ op: Operation; a: number; b: number }>({ op: 'add', a: 27, b: 15 })
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)
  const [regroup, setRegroup] = useState<RegroupEvent | null>(null)
  const [saved, setSaved] = useState<{ key: string; mat: Mat } | null>(null)

  const matFor = useCallback(
    (op: Operation, a: number, b: number): Mat =>
      saved && saved.key === keyOf(op, a, b) ? saved.mat : startMat(a, b),
    [saved],
  )

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'add-subtract',
    challenges: addSubtractSet.challenges,
    enabled: quizOn,
    isSolved: (c) => addSubtractSet.isSolved(c, matFor),
    onCelebrate: celebrate,
    progress,
  })

  // The numbers on the mat: the challenge's while a challenge is on, otherwise the learner's own.
  const { op, a, b } = quizOn ? challenge : free
  const key = keyOf(op, a, b)
  const mat = matFor(op, a, b)

  const setMat = (next: Mat) => setSaved({ key, mat: next })
  const doPart = (part: Part) => {
    const next = applyPart(mat, op, b, part)
    if (!next) return
    playClick()
    setMat(next)
  }
  const doRegroup = (kind: RegroupKind) => {
    const next = regroupMat(mat, kind)
    if (!next) return
    setMat(next)
    setRegroup((r) => ({ id: (r?.id ?? 0) + 1, kind }))
    if (REGROUP_SPECS[kind].bundle) playBundle(REGROUP_TOTAL_SECONDS)
    else playBreak(REGROUP_TOTAL_SECONDS)
  }

  const change = (next: Partial<{ op: Operation; a: number; b: number }>) =>
    setFree((f) => {
      const merged = { ...f, ...next }
      return { op: merged.op, ...validOperands(merged.op, merged.a, merged.b) }
    })

  return {
    stars: quiz.score,
    total: addSubtractSet.challenges.length,
    panel: (
      <AddSubtractPanel
        op={op}
        a={a}
        b={b}
        mat={mat}
        quizOn={quizOn}
        onOperation={(o) => change({ op: o })}
        onA={(n) => change({ a: n })}
        onB={(n) => change({ b: n })}
        onPart={doPart}
        onRegroup={doRegroup}
        onRestart={() => setSaved(null)}
        onQuizChange={setQuizOn}
        challenge={challenge}
        prompt={challengePrompt(challenge)}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="add-subtract"
          resetKey="add-subtract"
          cameraPosition={[0, 6.5, 8.5]}
          maxDistance={32}
          label={sumLabel(op, a, b, mat.counts)}
        >
          <PlaceValueScene counts={mat.counts} burstKey={burst} regroup={regroup} />
        </MathCanvas>
        <AddSubtractOverlay op={op} a={a} b={b} counts={mat.counts} working={quizOn ? undefined : columnWorking(op, a, b)} />
      </>
    ),
  }
}
