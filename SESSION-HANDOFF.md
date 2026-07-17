# SmartSound — Session Handoff

> Paste this into a fresh chat if context runs out. It has everything a new conversation needs to pick up seamlessly. Recommended model for a **new orchestration chat**: Sonnet 5 (plenty for driving SSH/file work). The actual build happens on the VPS under **Fable 5**, separately — see Part 3.

---

## Part 1 — Infrastructure (already set up, don't redo)

- **VPS:** `root@2.25.76.220`, Ubuntu 24.04, 31GB RAM, x86_64.
- **Claude Code:** installed (Node 22 + npm), logged into the user's Claude Max subscription (`aaravnaveen21@gmail.com`).
- **Persistent session:** tmux session named `claude`, working dir `/root/projects`. Survives disconnects and VPS reboots via systemd unit `claude-tmux.service` (auto-restarts it).
- **Mac shortcut:** `claude-vps` function added to `~/.zshrc` — running it in Terminal SSHes in and attaches to the tmux session in one step. If `command not found`, run `source ~/.zshrc` once.
- **Detach vs stay running:** inside the session, `Ctrl-b` then `d` detaches — the session and any in-progress task keep running on the VPS regardless of whether the Mac is open, asleep, or off. Reattach anytime with `claude-vps`. Only `/exit` (or VPS shutdown) actually stops it.

## Part 2 — Plugins installed on the VPS (user scope, all active)

- `andrej-karpathy-skills` — coding discipline guidelines
- `superpowers` — brainstorming, subagent-driven dev, TDD, systematic debugging
- `ruflo-core`, `ruflo-swarm`, `ruflo-rag-memory`, `ruflo-neural-trader` — agent swarm/memory tooling (note: neural-trader implies trading automation — never let it execute real trades/transfers; keep to simulation)
- **Higgsfield** — CLI + 5 skills (`higgsfield-generate`, `higgsfield-soul-id`, `higgsfield-product-photoshoot`, `higgsfield-websites`, `higgsfield-marketplace-cards`). **Authenticated** as `aaravnaveen06@icloud.com`, workspace "Private" selected, **free plan — only 10 credits**. Use sparingly; don't rely on it for bulk asset generation.

## Part 3 — The project: SmartSound

- Location: `/root/projects/smartsound`
- What it is: closed-loop neuroacoustic web app — camera-based rPPG heart-rate detection ⟷ real-time adaptive audio ⟷ a biofeedback ring visualizing the loop.
- Status as of last check: 10 milestones built, typechecked, build passing.
- Reference docs already in the project folder (don't recreate — read and use):
  - `UI-Design-Bible.md` — full design research (Endel/Oura/Calm from Mobbin + Apple Mindfulness/Lungy research), extracted design tokens, Liquid Glass recipe.
  - `Landing-Goal-Prompt.md` — earlier standalone landing-page spec (superseded by MASTER-GOAL.md below, kept for reference).
  - `MASTER-GOAL.md` — the full combined build spec (app + landing page). **This is the one to run.**

## Part 4 — How to run the build (do this next)

1. `claude-vps` in Terminal (Mac) to attach to the VPS session.
2. `/model claude-fable-5` — switch this VPS session to Fable 5 (best fit for this dense visual/creative frontend work).
3. `/effort high` (if available) — this is a long, thorough build, not a quick task.
4. Run:
   ```
   /goal read MASTER-GOAL.md in this project and build exactly what it specifies. This is a long, comprehensive build — take the time needed (expect this to run for hours across the app UI and landing page). Do not shortcut, simplify, or ship a stripped-down version to finish faster. Work through every section of the spec fully: the app biofeedback ring + native glass buttons + pixelation, and the full landing page (pixel hero, sticky-scroll 3D brain/brain-stem, FAQ, Liquid Glass, native buttons). Use the Higgsfield CLI only sparingly if at all — the account has just 10 free credits, so prefer hand-built shaders/geometry over generated assets unless a specific asset is worth spending a credit on. Build, verify, deploy, and report the live URL(s) when fully done.
   ```
5. Once it's running, detach: `Ctrl-b` then `d`. Close the laptop, walk away — it keeps building on the VPS.
6. Reattach later with `claude-vps` to check progress or see the final report.

## Part 5 — The full MASTER-GOAL spec (for reference / if the file needs restoring)

The complete spec is saved at `/root/projects/smartsound/MASTER-GOAL.md` on the VPS and `~/SmartSound-MASTER-GOAL.md` on the Mac. Summary of what it covers:

- **App:** `BiofeedbackRing.tsx` (pulses live with rPPG heart rate, cool↔warm gradient), `HeartRateReadout.tsx`, native-feeling `GlassButton.tsx` (real press states, 44px+ touch targets, Liquid Glass material), pixel-assemble boot animation, pixel-dissolve session transitions, faint pixel-noise texture — all restrained, not decorative overload.
- **Landing page:** Antimetal-style WebGL pixel-field hero reacting to cursor, sticky-pinned 3D brain (React Three Fiber) with a glowing "brain-stem" spine down the page, sections (How it works / Live demo / Science / FAQ / CTA) fading in as branches off the stem as you scroll, Liquid Glass nav/cards/FAQ accordion with cursor-tracked specular hover, CTA routes into the live app.
- **Shared:** one design token set (`--ring-cool` #38BDF8 → `--ring-warm` #A78BFA, black `--bg-base`, Liquid Glass recipe, `--pixel-size` 4px grid) used identically across both surfaces. Responsive + `prefers-reduced-motion` fallbacks required. Must deploy and report the live URL(s).

*(If this file is lost, the full verbatim spec is still safely on the VPS at the path above — just `cat MASTER-GOAL.md` in the session rather than regenerating it.)*
