# PORTS.md — the Tailwind→Panda port ledger (§4.2)

shadcn/ui, Aceternity, and 21st.dev components are authored in Tailwind utility
classes. This build is **Panda CSS**. Mixing them produces class collisions and
half-broken styling — exactly the slop the brief forbids. The rule:

- **Base kit → Park UI** (shadcn semantics, Panda-native). *Deferred to M6 — see
  note below.*
- **Any shadcn / Aceternity / 21st.dev component we want → port it.** Copy the
  JSX structure and behavior, delete every `className="…"` Tailwind string, and
  re-express styling as a Panda `cva` recipe or `css()` call using *our* tokens.
  Replace any Framer Motion import with `motion/react`.

Every port gets a row below: **source · what changed · why**.

---

## Deferred install: Park UI preset

`@park-ui/panda-preset`'s npm install runs a `bun run build` step; `bun` is not
present in this environment, and its failure rolled back the whole `npm install`.
Park UI is only needed once we build real components (M6) / do the port pass
(M9). It is intentionally **not** in `package.json` yet. When M6 starts, install
`bun` (or a prebuilt Park UI release) and wire `createPreset(...)` into
`panda.config.ts`. The M1 token system is authored in plain Panda and does not
depend on it.

## Ports

**Outcome of the port pass (M9): nothing needed porting.** Every component was
authored natively in Panda from the start — buttons/panels as `cva` recipes
(`src/design/recipes.ts`), the ring in canvas, controls on Radix primitives
(`Slider`, `Tabs`) styled with Panda `css()`. No shadcn/Aceternity/21st.dev
Tailwind source was pasted in, so there are **no `className="…"` utility strings
anywhere in `src/`** (grep-verifiable) and nothing to reconcile. This is the
§4.2 rule satisfied by construction rather than by cleanup.

If a Tailwind-authored component is pulled in later, add a row here:

| Component | Source | What changed | Why |
| --------- | ------ | ------------ | --- |
| —         | —      | —            | —   |

## Documented deviations from the spec

- **Radix over Park UI (base kit).** Park UI's preset needs `bun` at install
  (absent here). Rather than block, controls use Radix primitives directly
  (the spec's named primitive layer) styled with Panda. Swapping in Park UI's
  preset later is additive.
- **rPPG ROI.** The spec names MediaPipe FaceMesh for ROI tracking. To keep the
  demo offline and light, ROI uses centered forehead+cheek boxes with motion/
  low-light gating; the POS signal pipeline (the actual DSP) is the real thing.
  FaceMesh is the drop-in upgrade for robust multi-ROI tracking.
