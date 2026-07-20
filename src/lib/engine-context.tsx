import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SoundscapeEngine } from '~/engine/audio/engine'
import { PROFILES } from '~/engine/audio/profiles'
import type { EngineParams, StateProfile, TargetState } from '~/engine/audio/types'
import { BiometricPipeline } from '~/engine/biometric/pipeline'
import type { CaptureStatus } from '~/engine/biometric/capture'
import { IDLE_READING, EMPTY_BASELINE, type Baseline, type BiometricReading } from '~/engine/biometric/types'
import { LoopController } from '~/engine/loop/controller'
import type { PulseReading } from '~/design/SignalRing'
import type { Scenario } from '~/lib/catalog'
import { applySignal, arousalToLch } from '~/design/signal'

interface EngineContextValue {
  status: 'idle' | 'running'
  profile: StateProfile
  params: EngineParams
  arousal: number
  reading: BiometricReading
  baseline: Baseline
  bioStatus: CaptureStatus
  activeScenario: { name: string; phase: string } | null
  start: (state: TargetState) => Promise<void>
  startScenario: (scenario: Scenario) => Promise<void>
  stop: () => Promise<void>
  selectState: (state: TargetState) => void
  setNeuralIntensity: (depth: number) => void
  startAttune: () => Promise<CaptureStatus>
  stopAttune: () => void
  captureBaseline: () => void
  /** Live FFT for the ring — null when audio is idle. */
  getSpectrum: () => Uint8Array | null
  /** Live rPPG pulse for the ring — null when the camera loop is off. */
  getPulse: () => PulseReading | null
  /** Real arousal samples from this session, for Insights. */
  getArousalHistory: () => ArousalSample[]
  clearHistory: () => void
  /** The raw engine — the Studio drives its score/atmosphere buses directly. */
  getEngine: () => SoundscapeEngine
}

export interface ArousalSample {
  t: number
  a: number
}

const EngineContext = createContext<EngineContextValue | null>(null)

export function EngineProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<SoundscapeEngine | null>(null)
  if (!engineRef.current) engineRef.current = new SoundscapeEngine()
  const engine = engineRef.current

  const controllerRef = useRef<LoopController | null>(null)
  if (!controllerRef.current) controllerRef.current = new LoopController(engine)
  const controller = controllerRef.current

  const pipelineRef = useRef<BiometricPipeline | null>(null)
  if (!pipelineRef.current) pipelineRef.current = new BiometricPipeline()
  const pipeline = pipelineRef.current

  const [status, setStatus] = useState<'idle' | 'running'>('idle')
  const [profile, setProfile] = useState<StateProfile>(PROFILES.focus)
  const [params, setParams] = useState<EngineParams>({ ...PROFILES.focus })
  const [arousal, setArousalState] = useState(PROFILES.focus.targetArousal)
  const [reading, setReading] = useState<BiometricReading>({ ...IDLE_READING })
  const [baseline, setBaseline] = useState<Baseline>({ ...EMPTY_BASELINE })
  const [bioStatus, setBioStatus] = useState<CaptureStatus>('idle')
  const [activeScenario, setActiveScenario] = useState<{ name: string; phase: string } | null>(null)
  const scenarioTimers = useRef<number[]>([])

  // Per-frame refs so the biometric loop never forces a React render at 60fps.
  const readingRef = useRef<BiometricReading>({ ...IDLE_READING })
  const lastLoopT = useRef(0)
  const lastUiT = useRef(0)
  const arousalHist = useRef<ArousalSample[]>([])

  useEffect(() => {
    pipeline.onStatus = (s) => setBioStatus(s)
    pipeline.onReading = (r) => {
      const now = performance.now()
      const dt = lastLoopT.current ? (now - lastLoopT.current) / 1000 : 0.016
      lastLoopT.current = now
      const measured = controller.update(r, dt)
      applySignal(arousalToLch(measured)) // imperative — the identity, every frame
      readingRef.current = r
      // Throttle React state to ~6/s for the readout UI.
      if (now - lastUiT.current > 160) {
        lastUiT.current = now
        setReading(r)
        setArousalState(measured)
        setParams(engine.currentParams)
        if (engine.isRunning) {
          arousalHist.current.push({ t: now, a: measured })
          if (arousalHist.current.length > 900) arousalHist.current.shift()
        }
      }
    }
    return () => {
      pipeline.onReading = undefined
      pipeline.onStatus = undefined
    }
  }, [pipeline, controller, engine])

  // When audio is idle, keep --signal reflecting the current arousal.
  useEffect(() => {
    if (bioStatus !== 'active') applySignal(arousalToLch(arousal))
  }, [arousal, bioStatus])

  const start = useCallback(
    async (state: TargetState) => {
      controller.setTarget(state)
      controller.reset()
      await engine.start(state)
      setProfile(engine.currentProfile)
      setParams(engine.currentParams)
      if (!pipeline.isActive) setArousalState(engine.currentProfile.targetArousal)
      setStatus('running')
    },
    [engine, controller, pipeline],
  )

  const clearScenario = useCallback(() => {
    scenarioTimers.current.forEach((id) => window.clearTimeout(id))
    scenarioTimers.current = []
    setActiveScenario(null)
  }, [])

  const stop = useCallback(async () => {
    clearScenario()
    await engine.stop()
    setStatus('idle')
  }, [engine, clearScenario])

  /** Run a timed, phased scenario (§7.4): initial → middle → end. */
  const startScenario = useCallback(
    async (scenario: Scenario) => {
      clearScenario()
      const first = scenario.phases[0]
      controller.setTarget(first.state)
      controller.reset()
      await engine.start(first.state)
      setProfile(engine.currentProfile)
      setParams(engine.currentParams)
      setStatus('running')
      setActiveScenario({ name: scenario.title, phase: first.name })

      const totalMs = scenario.minutes * 60_000
      let acc = 0
      for (let i = 1; i < scenario.phases.length; i++) {
        acc += scenario.phases[i - 1].fraction * totalMs
        const ph = scenario.phases[i]
        const id = window.setTimeout(() => {
          controller.setTarget(ph.state)
          engine.setState(ph.state)
          setProfile(PROFILES[ph.state])
          setActiveScenario((prev) => (prev ? { ...prev, phase: ph.name } : prev))
        }, acc)
        scenarioTimers.current.push(id)
      }
      const endId = window.setTimeout(() => void stop(), totalMs)
      scenarioTimers.current.push(endId)
    },
    [engine, controller, clearScenario, stop],
  )

  const selectState = useCallback(
    (state: TargetState) => {
      controller.setTarget(state)
      engine.setState(state)
      setProfile(PROFILES[state])
      setParams(engine.currentParams)
      if (!pipeline.isActive) setArousalState(PROFILES[state].targetArousal)
    },
    [engine, controller, pipeline],
  )

  const setNeuralIntensity = useCallback(
    (depth: number) => {
      controller.setManualDepth(depth)
      setParams(engine.currentParams)
    },
    [engine, controller],
  )

  const startAttune = useCallback(async () => {
    lastLoopT.current = 0
    return pipeline.start()
  }, [pipeline])

  const stopAttune = useCallback(() => {
    pipeline.stop()
    readingRef.current = { ...IDLE_READING }
    setReading({ ...IDLE_READING })
  }, [pipeline])

  const captureBaseline = useCallback(() => {
    setBaseline(pipeline.captureBaseline())
  }, [pipeline])

  const getSpectrum = useCallback(
    () => (engine.isRunning ? engine.getSpectrum() : null),
    [engine],
  )

  const getPulse = useCallback((): PulseReading | null => {
    const r = readingRef.current
    return r.active ? { phase: r.phase, bpm: r.hr, confidence: r.confidence } : null
  }, [])

  const getArousalHistory = useCallback(() => arousalHist.current, [])
  const clearHistory = useCallback(() => { arousalHist.current = [] }, [])
  const getEngine = useCallback(() => engine, [engine])

  const value = useMemo<EngineContextValue>(
    () => ({
      status, profile, params, arousal, reading, baseline, bioStatus, activeScenario,
      start, startScenario, stop, selectState, setNeuralIntensity, startAttune, stopAttune,
      captureBaseline, getSpectrum, getPulse, getArousalHistory, clearHistory, getEngine,
    }),
    [
      status, profile, params, arousal, reading, baseline, bioStatus, activeScenario,
      start, startScenario, stop, selectState, setNeuralIntensity, startAttune, stopAttune,
      captureBaseline, getSpectrum, getPulse, getArousalHistory, clearHistory, getEngine,
    ],
  )

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>
}

export function useEngine(): EngineContextValue {
  const ctx = useContext(EngineContext)
  if (!ctx) throw new Error('useEngine must be used within <EngineProvider>')
  return ctx
}
