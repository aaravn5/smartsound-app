import type { SceneVariant } from '~/design/Scene'

/**
 * Nature asset ladder — the zero-code drop-in loader for the Nature Visual
 * Overhaul. For each scene id the runtime probes, in order:
 *
 *   1. /assets/nature/{id}.webm   (ambient loop — skipped under reduced
 *                                  motion or Save-Data)
 *   2. /assets/nature/{id}.avif   (high-res still)
 *   3. the bundled scene photograph (handled by the caller)
 *   4. the procedural landscape    (handled by the caller — also forced via
 *                                  ?scene=procedural or
 *                                  localStorage ss_scene_source=procedural)
 *
 * A correctly-named file appearing in public/assets/nature/ activates itself
 * on the next load with NO code change. `public/assets/nature/manifest.json`
 * documents the intended specs + the full generation prompts per scene.
 *
 * Probes are HEAD requests, cached for the session. The SPA history fallback
 * can answer unknown paths with index.html — a 200 whose content-type is
 * text/html is therefore treated as "missing".
 */

export type NatureSceneId = 'focus' | 'flow' | 'calm' | 'winddown' | 'sleep'

/** Scene variant → nature scene family (the mapping is 1:1 by design). */
export const VARIANT_NATURE_ID: Record<SceneVariant, NatureSceneId> = {
  ocean: 'focus',
  dusk: 'flow',
  forest: 'calm',
  dawn: 'winddown',
  aurora: 'sleep',
}

export type NatureUpgrade =
  | { kind: 'video'; src: string }
  | { kind: 'image'; src: string }
  | null

const probeCache = new Map<string, Promise<boolean>>()

function probe(url: string): Promise<boolean> {
  let pending = probeCache.get(url)
  if (!pending) {
    pending = fetch(url, { method: 'HEAD' })
      .then((res) => res.ok && !(res.headers.get('content-type') ?? '').includes('text/html'))
      .catch(() => false)
    probeCache.set(url, pending)
  }
  return pending
}

/** True when the user agent asks us to conserve data — video is skipped. */
export function saveDataOn(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  return Boolean(nav.connection?.saveData)
}

/**
 * True when procedural scenes are forced (QA / zero-asset audits):
 * `?scene=procedural` on the URL, or localStorage ss_scene_source.
 */
export function proceduralForced(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (new URLSearchParams(window.location.search).get('scene') === 'procedural') return true
    return window.localStorage.getItem('ss_scene_source') === 'procedural'
  } catch {
    return false
  }
}

/**
 * Resolve the best available UPGRADE for a scene (video or avif still), or
 * null when neither rendered asset exists — the caller then uses the bundled
 * photo, and the procedural landscape below that.
 */
export async function resolveNatureUpgrade(
  id: NatureSceneId,
  { allowVideo }: { allowVideo: boolean },
): Promise<NatureUpgrade> {
  if (allowVideo && !saveDataOn()) {
    const videoUrl = `/assets/nature/${id}.webm`
    if (await probe(videoUrl)) return { kind: 'video', src: videoUrl }
  }
  const imageUrl = `/assets/nature/${id}.avif`
  if (await probe(imageUrl)) return { kind: 'image', src: imageUrl }
  return null
}
