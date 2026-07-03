import type { TargetState } from '~/engine/audio/types'

/** The Library's content (§6.4): endless Soundscapes and timed, phased Scenarios. */

export const BAND_LABEL: Record<TargetState, string> = {
  focus: 'Beta · ~15 Hz',
  flow: 'Alpha–Beta · ~12 Hz',
  calm: 'Alpha · ~10 Hz',
  winddown: 'Theta · ~6 Hz',
  sleep: 'Delta · ~2.5 Hz',
}

export interface Soundscape {
  id: string
  title: string
  state: TargetState
  band: string
  blurb: string
}

export interface ScenarioPhase {
  name: string
  state: TargetState
  /** Fraction of the total session this phase occupies. */
  fraction: number
}

export interface Scenario {
  id: string
  title: string
  state: TargetState
  minutes: number
  band: string
  phases: ScenarioPhase[]
  blurb: string
}

export const SOUNDSCAPES: Soundscape[] = [
  { id: 'deep-focus', title: 'Deep Focus', state: 'focus', band: BAND_LABEL.focus, blurb: 'Steady beta modulation under warm pads. For sustained single-task work.' },
  { id: 'open-flow', title: 'Open Flow', state: 'flow', band: BAND_LABEL.flow, blurb: 'Looser rhythm, more texture. For generative, momentum-building work.' },
  { id: 'still', title: 'Still', state: 'calm', band: BAND_LABEL.calm, blurb: 'Alpha-paced and unhurried. For reading, reflection, a settled mind.' },
  { id: 'wind-down', title: 'Wind-down', state: 'winddown', band: BAND_LABEL.winddown, blurb: 'Slows tempo and brightness toward theta. For the end of the day.' },
  { id: 'delta-sleep', title: 'Delta Sleep', state: 'sleep', band: BAND_LABEL.sleep, blurb: 'Resolves toward delta-modulated noise. For letting go.' },
]

export const SCENARIOS: Scenario[] = [
  {
    id: 'pomodoro-25', title: 'Pomodoro · 25', state: 'focus', minutes: 25, band: BAND_LABEL.focus,
    phases: [
      { name: 'Ramp-in', state: 'flow', fraction: 0.15 },
      { name: 'Sustain', state: 'focus', fraction: 0.7 },
      { name: 'Resolve', state: 'calm', fraction: 0.15 },
    ],
    blurb: 'Ramps you in, holds deep focus, eases out for the break.',
  },
  {
    id: 'deep-work-50', title: 'Deep Work · 50', state: 'focus', minutes: 50, band: BAND_LABEL.focus,
    phases: [
      { name: 'Ramp-in', state: 'flow', fraction: 0.12 },
      { name: 'Sustain', state: 'focus', fraction: 0.76 },
      { name: 'Resolve', state: 'calm', fraction: 0.12 },
    ],
    blurb: 'A full ultradian block for demanding work.',
  },
  {
    id: 'unwind-15', title: 'Wind-down · 15', state: 'winddown', minutes: 15, band: BAND_LABEL.winddown,
    phases: [
      { name: 'Settle', state: 'calm', fraction: 0.4 },
      { name: 'Descend', state: 'winddown', fraction: 0.6 },
    ],
    blurb: 'A short glide from alert to rest.',
  },
  {
    id: 'sleep-30', title: 'Sleep · 30', state: 'sleep', minutes: 30, band: BAND_LABEL.sleep,
    phases: [
      { name: 'Descend', state: 'winddown', fraction: 0.4 },
      { name: 'Delta', state: 'sleep', fraction: 0.6 },
    ],
    blurb: 'Descends to delta-modulated noise and fades.',
  },
]
