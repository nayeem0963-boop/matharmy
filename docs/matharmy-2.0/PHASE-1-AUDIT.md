# MathArmy 2.0: Phase 1 Technical Audit (read-only)

Audited commit: `bc72d77` ("ready to merge"), shallow clone, so earlier history was not inspected.
Method: every source file under `src/` was read; the production build, lint and a headless-browser smoke test were run in a **scratch copy outside the repository** (see section 7). No application code, CSS, assets, config, package files or dependencies were changed.

> **Update after Phase 2 (2A to 2E).** The findings below describe the code as audited at `bc72d77`. Section 15 at the end lists what Phase 2 has since changed. Anything marked as a risk or bug here may be resolved there.

Status legend used throughout: **[Done]** implemented and verified in source, **[Partial]** implemented but incomplete, **[Placeholder]** visual only, **[None]** not implemented, **[?]** needs further investigation.

---

## 1. Executive summary

MathArmy is a small (about 4,900 lines in 46 files), clean, single-page **React 19 + TypeScript 7 + Vite 8** app with **react-three-fiber / drei / three** for 3D. It ships three working 3D modules (Fractions, Geometry 3D Explorer, Number Sense), a landing "Academy" screen hosting an animated 3D mascot (Captain Hexa-Cubie), a challenge/quiz loop with three difficulty tiers, ten badges, and versioned `localStorage` progress.

What is good: the data layer (`src/data/*`) is already separated from rendering and is pure TypeScript; the quiz loop (`useChallenge` + `useModuleQuiz`) and progress store are generic; 3D scenes are lazy-loaded and dispose their GPU resources; the build is clean (0 TS errors, 0 lint errors, 0 `npm audit` findings).

What limits 2.0:
- **No router, no shell.** Navigation is one `useState` in `App.tsx`; the "Academy" is the welcome panel plus the mascot scene, not a structure. Adding modules means editing `App.tsx` in several places.
- **Per-module state lives in `App.tsx`** (about 90 lines each) rather than in the module. The three modules are wired by copy-paste.
- **Challenge types are not unified.** Fractions use ids + numeric target, Geometry uses a `check()` closure, Number Sense uses target + `require`. There is no question/assessment abstraction (no multiple choice, typed answers, word problems).
- **Zero automated tests** and no test runner.
- **Mobile is weak** (horizontal overflow at 390 px, 3D stage pushed below the fold), and there is **no keyboard/focus styling** and no `prefers-reduced-motion` handling for the 3D scenes.
- **Gamification is real but thin:** stars, streaks, tiers, badges persist; there are no XP, levels, missions, lessons or grade structure. The mascot is a one-scene greeter and does not react to progress.
- Two **confirmed bugs** (section 8): the first Geometry challenge is solved the moment Challenge mode is switched on, and `lastView` is saved but never restored.

Recommendation: do not restructure. Add an Academy shell *around* the existing modules, extract a shared "module contract" and question engine from the patterns already present, then grow the curriculum module by module. Suggested Phase 2 start is in section 14.

---

## 2. Existing project architecture

### 2.1 Stack and build

| Item | Finding | Evidence |
|---|---|---|
| Framework | React 19.3.1, function components + hooks, StrictMode on | `package.json`, `src/main.tsx` |
| Language | TypeScript ~7.0.2, strict-ish (`noUnusedLocals/Parameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`); note `strict` itself is **not** set | `tsconfig.app.json` |
| Bundler | Vite 8.4 (Rolldown). Manual vendor chunk groups for three / r3f / drei | `vite.config.ts` |
| 3D | three 0.187, @react-three/fiber 9.8, drei 10.7 (only `OrbitControls`, `Stars`, `Sparkles` used) | `MathCanvas.tsx`, `CaptainHexaCubieScene.tsx` |
| Lint | oxlint 1.95 with react/typescript/oxc plugins | `.oxlintrc.json` |
| Styling | One global stylesheet (917 lines) + tiny `index.css` with CSS variables; no CSS framework, no CSS modules | `src/App.css`, `src/index.css` |
| State | Local React state + one `useProgress` hook; no store library | `src/hooks/useProgress.ts` |
| Routing | **None** (no react-router, no URL state, no hash) | `src/App.tsx:44-65` |
| Backend/auth | None | n/a |
| Tests | **None** (no runner, no script, no test files) | `package.json` scripts: dev, build, lint, preview |
| CI/deploy | **[?]** no `.github/`, no deploy config in repo | repo tree |
| Docs | README is the unmodified Vite template | `README.md` |

### 2.2 Directory map

```
index.html                     entry HTML (title is just "matharmy")
public/favicon.svg, icons.svg  only static assets (icons.svg is unreferenced)
src/main.tsx                   createRoot + StrictMode
src/App.tsx (330 lines)        the whole app shell: view state, all per-module state, header, sidebar, stage
src/App.css, src/index.css     all styling
src/data/                      pure data + math (no React)
  mathModules.ts               module registry (id, title, grade band, colour, skills) + "upcoming" teasers
  challenges.ts                Tier type, Fraction + Geometry challenges
  placeValue.ts                place-value math, regrouping rules, words/expanded form, Number Sense challenges
  geometryShapes.ts            shape definitions, dimension limits, volume/surface-area formulas + worked strings
  badges.ts                    badge definitions + rule evaluation
src/hooks/
  useProgress.ts               persistent progress, cross-tab sync, badge queue
  useModuleQuiz.ts             one module's quiz wired to progress
  useChallenge.ts              generic "current challenge + rising-edge solve detection"
  useShapeDimensions.ts        Geometry state
src/utils/
  progressStore.ts             localStorage schema v2, migration, badge awarding
  soundEffects.ts              WebAudio synth sounds (no audio files)
src/components/
  canvas/  MathCanvas, SceneErrorBoundary, SceneHtml (DOM labels in 3D), ParticleBurst
  scenes/  FractionBlocksScene, GeometryExplorerScene, PlaceValueScene, CaptainHexaCubieScene
  panels/  one sidebar panel + (Geometry, Number Sense) one stage overlay per module, WelcomePanel
  ui/      Stepper, Toggle, ChallengeCard, BadgeToast
```

### 2.3 Entry points and how modules are integrated

- Single entry: `index.html` -> `src/main.tsx` -> `App`.
- `App.tsx:44` `type View = 'welcome' | MathModuleId`; `openView()` (`:61`) swaps the view and stores it.
- Layout is fixed: header (brand, module tabs, sound toggle), `<aside class="panel">` for controls, `<section class="stage">` for the 3D canvas (`:207-323`).
- `renderStage()` (`:153-205`) is an `if` chain per module id, each returning `<MathCanvas><XScene .../></MathCanvas>`; non-available modules fall through to a "coming soon" placeholder (dead today: all three modules are `status: 'available'`).
- Each module is integrated by **three hand-edited places in `App.tsx`**: its state block, its `renderStage` branch, its panel in the sidebar. Plus the id union in `mathModules.ts`, `MODULE_IDS`/default state/`awardBadges` in `progressStore.ts`, and `MODULE_CHALLENGES` in `badges.ts`. Adding a fourth module touches about 6 files.
- Shared pieces already reusable: `MathCanvas` (camera, lights, orbit, error boundary), `ParticleBurst`, `SceneHtml`, `Stepper`, `Toggle`, `ChallengeCard`, `useModuleQuiz`, `useProgress`, `soundEffects`.
- 3D is lazy-loaded (`App.tsx:38-42`), so the initial bundle is React + shell only.

### 2.4 Academy and mascot

- **[Partial]** "MathArmy Academy" = `WelcomePanel.tsx` (intro, module cards with star counts, badge grid, "Coming soon" list, reset button) + `CaptainHexaCubieScene` as the welcome stage. There is no separate Academy concept in code (no lessons, grades, map, missions).
- **[Done]** Captain Hexa-Cubie is **fully procedural**: a 1,283-line three.js scene (`CaptainHexaCubieScene.tsx`) generating body, goggles, cap, hands, orbiting glyph rings, an abacus panel, a voxel-tile dais, nebula backdrop and stars from code and canvas textures. **There are no image/model/audio asset files.** Behaviours: look-at pointer, hover = happy, click = jump + cheer + particle burst + `playHello()` + cycles 6 hard-coded greetings in a speech bubble (`:23-30`, `:886-895`, `:1272-1276`).
- **[None]** The mascot appears **only on the welcome view**. It is not shown in modules, does not react to correct answers, badges or progress, and has no hint/feedback role. Greetings are a static array.

---

## 3. Module-by-module functionality inventory

### 3.1 Fractions (grades 3-5 per `mathModules.ts`)

| Aspect | Finding | Evidence |
|---|---|---|
| Function | Fraction bar of `denominator` blocks, first `numerator` filled; improper fractions stack extra bars | `FractionBlocksScene.tsx:36-100` |
| Interactions | Numerator/denominator steppers+sliders; **click a block to set numerator** (hover lifts block + pop sound); orbit | `FractionsPanel.tsx`, `FractionBlocksScene.tsx:130-165` |
| Limits | Denominator 1-12 (`MAX_DENOMINATOR`), numerator 0 to 2x denominator, so max 2 wholes | `FractionsPanel.tsx:6`, `App.tsx:79-85` |
| Validation | `isFractionSolved`: `n*cd == cn*d`, `n>0`. Equivalent fractions accepted; panel explains "4/6 = 2/3" | `challenges.ts:46-47`, `FractionsPanel.tsx:48-59` |
| Challenges | 12 (4 easy unit fractions, 4 medium odd denominators, 4 hard improper) | `challenges.ts:27-40` |
| 3D | Shared box geometry + 2 shared materials, disposed manually; ground shadow plane; burst on solve | `FractionBlocksScene.tsx:47-76` |
| Missing | No mixed numbers, comparing, adding/subtracting, number line, no decimal/percent link, no "make a fraction of a set/circle" | not present |
| Opportunity | Strong base for the Fractions strand; add comparison, equivalence ladder, number line view |  |

### 3.2 Geometry 3D Explorer (grades 4-7)

| Aspect | Finding | Evidence |
|---|---|---|
| Solids | Cube, rectangular prism, sphere, cylinder, triangular prism | `geometryShapes.ts:34-85` |
| Interactions | Shape picker; per-shape dimension steppers (1-6, step 0.5); unfold into net toggle (animated); orbit; hover label with faces/edges/vertices | `GeometryPanel.tsx`, `GeometryExplorerScene.tsx` |
| Math | Volume and surface area with symbolic formula and worked substitution, e.g. `A = bh + l(b + 2s)` for triangular prism | `geometryShapes.ts:112-210` (formulas verified correct) |
| Overlay | Live formula/working/value card over the stage | `GeometryFormulaOverlay.tsx` |
| Nets | Box, triangular prism, cylinder (unrolled strip). Sphere correctly has none | `GeometryExplorerScene.tsx:133-330` |
| Challenges | 12 (identify solids by faces/edges; hit target volume/area), checked via `check(state)` closures with `1e-6` tolerance | `challenges.ts:62-140` |
| Missing | No cone/pyramid/hemisphere; no 2D shapes; no area/perimeter; no cross-sections; no net-matching task | not present |
| Concern | `GeometryChallenge.check` is a function, so challenges cannot be serialised or authored as data | `challenges.ts:63-68` |

### 3.3 Number Sense (grades 1-3)

| Aspect | Finding | Evidence |
|---|---|---|
| Function | Hundreds flats / tens rods / ones cubes as one `instancedMesh` per type (max instance count derived from limits) | `PlaceValueScene.tsx:67-68, 330` |
| Interactions | Steppers (hundreds 0-9, tens 0-19, ones 0-19); four **regroup** buttons with flying/bundling animation and matching sounds; clear; hover block sizes | `NumberSensePanel.tsx`, `PlaceValueScene.tsx:130-160`, `placeValue.ts:80-121` |
| Math | `placeValueTotal`, `expandedForm`, `numberToWords` (0-9999), `regroupBlocker`/`applyRegroup` (blocked with a reason string if not enough blocks or over limit) | `placeValue.ts` |
| Overlay | Number, words, expanded form, "not standard form: you can regroup" note | `NumberSenseOverlay.tsx` |
| Challenges | 12; some require exact block counts (`require`), e.g. "show 162 using exactly 16 tens" | `placeValue.ts:123-186` |
| Missing | No thousands in builder, comparing/ordering, rounding, no add/subtract with regrouping (the natural next step), no decimals |  |
| Opportunity | Regroup engine and `numberToWords` can power Addition/Subtraction and Decimals later |  |

### 3.4 Coverage

**[None]**: there are **no automated tests of any kind** for any module (no runner in `package.json`). The data modules are pure functions and highly testable; the only verification today is manual use plus the type checker.

---

## 4. Existing assets and reusable components

| Asset | Reuse value | Notes |
|---|---|---|
| `src/data/*` pure math | High | Framework-free; already the right place for 2.0's curriculum content |
| `MathCanvas` | High | Camera/lights/orbit/error boundary; props `cameraPosition`, `maxDistance`. Has a nested `SceneErrorBoundary` and `App` wraps another (duplicate) |
| `SceneHtml` | High | Custom replacement for drei `Html` (documented React-19 StrictMode reason, `SceneHtml.tsx:20-29`) |
| `ParticleBurst` | High | Single `THREE.Points`, hidden when idle |
| `Stepper`, `Toggle`, `ChallengeCard`, `BadgeToast` | High | Accessible roles (`role=switch`, `radiogroup`, `aria-live`) |
| `useChallenge` / `useModuleQuiz` | High | Generic over challenge type |
| `progressStore` | High | Versioned schema, migration, never throws, in-memory fallback |
| `soundEffects` | High | Synth only, lazily created `AudioContext` |
| Captain scene | Medium | Great hero asset but monolithic (1,283 lines in one file; not reusable as a small companion) |
| `public/icons.svg` | Unknown | Not referenced anywhere in `src` or `index.html` |
| `.claude/launch.json` | n/a | Dev server config on port 5173 |

Naming/ids to preserve (stored in saved progress): challenge ids (`f-*`, `g-*`, `n-*`), badge ids, module ids, storage key `matharmy:progress`, schema `version: 2`.

---

## 5. Design and UX audit

Evidence: source review plus headless-Chromium screenshots at 1440x900, 820x1180 and 390x844.

| Area | Finding | Status |
|---|---|---|
| Layout | Consistent two-column app (340 px panel + stage) on desktop; panel scrolls independently | Good |
| Desktop page height | At 1440x900 the document is 924 px tall, so the page scrolls about 24 px even though `.app` is `100svh` | Minor bug [?] cause |
| Tablet (820 px) | Breakpoint is 800 px, so at 820 the stage is only 480 px wide beside a 340 px panel; no tablet-specific layout | Weak |
| Phone (390 px) | **Horizontal overflow: `scrollWidth` 435 vs 390.** Header wraps to 3 rows (about 220 px); the whole control panel comes first (1,159 px tall on welcome), so the 3D stage is **below the fold**; the formula overlay is clipped at the bottom edge | Weak |
| Stage minimum | `.stage { min-height: 360px }` on phones; no landscape-phone handling | Weak |
| Sidebar | Long welcome panel mixes intro, cards, 10 badges, coming-soon and reset. Heavy for a first screen | Needs redesign in shell |
| Typography | `system-ui` only; fixed px sizes (11-40 px) with no scale tokens; `13px`/`11px` micro-text widespread; formulas use a different (serif) face | Inconsistent |
| Colour | CSS variables exist for base palette; **module colours are in TS data** (`mathModules.ts`) and sliders use the global amber accent regardless of module (green Geometry page has amber slider) | Inconsistent |
| Controls | Steppers, toggles and tier switch are consistent and well-built | Good |
| Tooltips | Native `title` attributes only (not shown on touch, not keyboard accessible); hover block labels in 3D are pointer-only | Weak |
| Unused space | Desktop stage is large and mostly empty grid around a small object; formula overlay sits top-right but nothing uses the lower stage area (good place for a mascot/lesson prompt) | Opportunity |
| Accessibility | No `:focus-visible` rules anywhere in `App.css` (browser default only); `prefers-reduced-motion` handled for spinner and badge toast only, **not** for the 3D animations or mascot; `<canvas>` has no text alternative (section has an `aria-label`, readouts use `aria-live`); 3D block clicking is pointer-only, but each has a stepper alternative (good); small touch targets (`-`/`+` buttons about 32 px) | Partial |
| Page title/meta | `<title>matharmy</title>`, no description/theme-color | Minor |
| Navigation | Tabs only; no URL, so no back button, deep link, or share link; reload always returns to Welcome | Weak |

---

## 6. Gamification and mascot audit

| Capability | Status | Evidence |
|---|---|---|
| Stars (unique challenges solved per module) | **[Done]** | `useProgress.ts:60-72`, shown on cards and `ChallengeCard` |
| Difficulty tiers (easy/medium/hard) persisted per module | **[Done]** | `progressStore.ts:44-52`, `ChallengeCard.tsx:51-73` |
| Streaks (reset on skip) + best streak | **[Done]** | `useProgress.ts:75-82`, `useModuleQuiz.ts:62-65` |
| 10 badges with rule functions over saved progress | **[Done]** | `badges.ts:38-98` |
| Badge toast + fanfare, queued, not announced when granted silently by migration | **[Done]** | `BadgeToast.tsx`, `useProgress.ts:38-47` |
| Persistence between sessions (localStorage v2, migration from v1, cross-tab sync) | **[Done]** | `progressStore.ts`, `useProgress.ts:27-33` |
| Reset progress (confirm) keeping sound preference | **[Done]** | `WelcomePanel.tsx:23-30` |
| Last view restore | **[Partial]** saved, never read | `lastView` written in `App.tsx:65`; no read anywhere (`grep`); reload lands on Welcome (confirmed in browser) |
| XP, levels, ranks | **[None]** | |
| Missions / adventures / lessons / guided steps | **[None]** (only a "Soon" teaser list) | `mathModules.ts:57-61` |
| Grade progression, curriculum map | **[None]** | `gradeBand` is display text only |
| Student profiles / multiple learners | **[None]** (single anonymous profile per browser) | |
| Mascot reacting to learning events | **[None]** | greetings only on click |
| "Coming soon" modules | **[Placeholder]**: 3 teasers (Multiplication Arrays, Coordinate Plane, Angles) are plain list items; the `status:'coming-soon'` branch in `App.tsx:200-204, 306-312` is currently unreachable | |
| Hint system | **[Partial]**: static hint string per challenge shown always, no escalation or cost | `ChallengeCard.tsx:82-86` |

Note on scoring semantics: "stars" are unique first-time solves; replaying gives nothing, and there is no attempt count, time, or accuracy data to support assessment or teacher reporting.

---

## 7. Test and performance baseline

Run in a scratch copy (`git archive` of HEAD, then `npm ci`) **outside the repository**, so no tracked or untracked files in `matharmy` changed. (`npm ci` was executed only in that copy.) Environment: Node 22.23.5, npm 10.9.9.

| Check | Result |
|---|---|
| `npm ci` | OK, 0 vulnerabilities, 5 s |
| `npm audit` | 0 vulnerabilities |
| `tsc -b` (part of `npm run build`) | 0 errors |
| `npm run build` | Success, 599 modules, built in about 0.3 s (1.2 s wall) |
| `npx oxlint` | **0 errors, warnings only** (react-compiler-style rules): `ParticleBurst.tsx:70,94,102` (mutating hook-arg values in effects/frames), `GeometryExplorerScene.tsx:62`, `CaptainHexaCubieScene.tsx:520,549,1141` (memo form, mutation, ref read in render), `SceneHtml.tsx:15` (context exported with component file). These are idiomatic three.js patterns, low risk |
| Unit/integration/e2e tests | **None exist, nothing to run** |
| Browser smoke (Playwright Chromium, SwiftShader WebGL) | All 4 views render with a WebGL canvas at 1440, 820, 390 px; no page errors; console shows `THREE.Clock deprecated` (comes from the three/r3f versions) and one-time `GPU stall due to ReadPixels` driver messages (software GL, not representative) |

Production bundle (gzip in brackets):

| Chunk | Size |
|---|---|
| `index` (React + shell, eager) | 258.5 kB (81.0 kB) |
| `vendor-three` (lazy) | 742.6 kB (187.4 kB) |
| `vendor-r3f` (lazy) | 167.0 kB (53.0 kB) |
| `CaptainHexaCubieScene` | 27.3 kB (8.4 kB) |
| `MathCanvas` | 18.5 kB (5.8 kB) |
| `Line2` | 18.6 kB (5.6 kB) |
| `vendor-drei` | 10.3 kB (3.7 kB) |
| Geometry / PlaceValue / Fraction scenes | 6.4 / 5.4 / 2.1 kB |
| CSS | 13.8 kB (3.5 kB) |

Eager JS is about 81 kB gzip; first 3D view adds about 250 kB gzip (three + r3f). `vite.config.ts` raises `chunkSizeWarningLimit` to 800 to silence the three.js warning (documented in the file). Static assets total about 15 kB.

Performance observations from source (no device profiling was possible here, **[?]** real-device FPS not measured):
- Good: `dpr={[1,2]}`, instanced meshes for place value, shared geometries/materials disposed, `ParticleBurst` idle-hidden, scenes lazy, no textures/models to download.
- Watch: shadow map 1024 with `shadows="percentage"` on every scene; Captain scene draws a 44x44 tile deck plus stars/sparkles and several point lights (heavy for low-end phones); nothing adapts quality or pauses rendering when idle (`frameloop="always"` default) so battery use on phones is a risk; `dpr` up to 2 on every device.
- Error handling: good for 3D (error boundary with retry, resets on view change); localStorage failures handled; AudioContext failures guarded. No global error boundary outside the stage, no offline/PWA support.
- Browser compatibility: requires WebGL; no WebGL-unavailable fallback beyond the generic error card; `es2023` target; uses CSS container queries (`App.css:504`) and `100svh`, so older browsers (pre-2022) unsupported. Safari WebAudio handled via `webkitAudioContext`.

---

## 8. Technical risks and limitations

| # | Risk / issue | Severity | Evidence |
|---|---|---|---|
| 1 | **No automated tests** while 2.0 will refactor shared code and persistent data | High | `package.json` |
| 2 | **Bug (confirmed in browser): first Geometry challenge is auto-solved** when Challenge mode is switched on, because the default state is a cube of edge 3 (volume 27) and the first challenge is "cube with volume 27". Awards a free star + badge progress. Same pattern can hit Fractions (default 3/4 vs challenge `f-3-4` once earlier ones are solved) | Medium | `useShapeDimensions.ts:19`, `challenges.ts:72-77`, `useChallenge.ts:38-49`; observed `g-cube-27` saved immediately |
| 3 | **Bug: `lastView` saved but never restored** | Low | `App.tsx:56,65` |
| 4 | Persistence is one localStorage blob with a **fixed per-module schema**; adding modules requires touching `MODULE_IDS`, defaults, `awardBadges`, migration | Medium | `progressStore.ts:41-42,57,111-118` |
| 5 | Challenge ids and badge ids are **public contracts** (stored in saves); renaming silently drops progress (migration filters unknown ids) | Medium | `progressStore.ts:78-85`, comments "IDs are stable" |
| 6 | `App.tsx` is the integration bottleneck; each module adds about 90 lines of state | Medium | `App.tsx:73-144` |
| 7 | Challenge model is not unified, and Geometry challenges contain functions, so they cannot be data-driven or authored by non-developers | Medium | `challenges.ts` |
| 8 | Mobile layout defects (overflow, stage below fold); heavy mascot scene on low-end phones | Medium | section 5 and 7 |
| 9 | Accessibility gaps (focus styles, reduced motion in 3D, canvas alternative) matter for a children's product | Medium | section 5 |
| 10 | Dependencies are all brand-new majors (Vite 8, TS 7, React 19.3, three 0.187, oxlint). Fine today, but expect churn; `@vitejs/devtools*` packages are dev-only and used for `devtools` config | Low-Med | `package.json` |
| 11 | Single global CSS file (917 lines) with no scoping, so style collisions will grow with modules | Medium | `src/App.css` |
| 12 | `THREE.Clock` deprecation warning from dependencies | Low | console |
| 13 | Anonymous, device-local progress only (no backup, no sharing between devices); matches the no-backend constraint but limits teachers/parents | Constraint | n/a |
| 14 | Unused `public/icons.svg`; README is boilerplate; HTML title is "matharmy" | Low | repo |
| 15 | Duplicated error boundary (`App.tsx:319` and `MathCanvas.tsx:34`) | Low | |

---

## 9. Proposed future architecture (incremental, built on what exists)

Principle: keep `src/data`, hooks, scenes and UI primitives; move wiring, do not rewrite.

1. **Unified Academy shell.** Introduce a tiny hash-based router (or `useState` + `location.hash` with no new dependency) and an `AcademyShell` component that owns header, navigation, grade/strand picker and the sidebar/stage layout. `App.tsx` becomes: providers + shell. The existing `.app/.app-main/.panel/.stage` structure stays as the "module workspace" layout.
2. **Module contract + registry.** Define `MathModuleDefinition` (id, title, strand, grade range, prerequisites, colour, `Scene`, `Panel`, optional `Overlay`, `initialState`, `challenges`). Extend `mathModules.ts` into the registry. Move each module's state out of `App.tsx` into a `useFractionsModule()`-style hook beside its panel. Existing modules adopt it one at a time with identical behaviour.
3. **Shared question and assessment engine.** Generalise `useChallenge`/`useModuleQuiz` over a `Question` union: *interactive-build* (today's challenges), *multiple choice*, *numeric/typed answer*, *drag-order*, *word problem*. Keep existing challenges as `interactive-build` questions via adapters so ids and checks stay unchanged. Make checks data (target + predicate id) where possible. Add attempt count and hint level to the result record.
4. **Shared progress and scoring.** Evolve `progressStore` to **schema v3**: module map becomes open-ended (`Record<string, ModuleProgress>` validated against the registry), add `xp`, `level`, per-question attempts, `completedMissions`, `profile` (name/avatar optional). Keep v2->v3 migration (the v1->v2 pattern is already there), keep storage key and old ids.
5. **Mission and achievement management.** Data-driven `missions.ts` (ordered steps referencing modules/questions) and extend `badges.ts` from hard-coded rules to rule descriptors (keeps stable ids). A `useMissions` hook derives mission status from progress; no separate store.
6. **Captain Hexa-Cubie integration.** Extract a lightweight `<CaptainCompanion>` (small canvas or 2D sprite rendered from the same design) that can sit in the corner of any module and receive events (`correct`, `hint`, `badge`, `mission`). Keep the big welcome scene as the Academy hero. Dialogue becomes data (`captainDialogue.ts`).
7. **New modules.** Each new module = one data file + one scene + one panel + registry entry. Provide a scaffold/checklist so contributors do not touch `App.tsx`. 2D modules (arrays, number lines, graphs) should use SVG/DOM, not three.js, to keep cost low on phones; reserve 3D for where depth teaches (solids, volume, place value).
8. **Persistent student progress.** Stay client-side: versioned localStorage (existing approach), plus **export/import progress as a JSON file** and optional multiple local profiles. Isolate behind a `ProgressRepository` interface so a backend could replace it later without touching UI (no backend now, per constraints).
9. **Cross-cutting.** Add Vitest for `src/data`, `progressStore`, badge rules, engine; CSS split by module (CSS modules or per-folder CSS) plus design tokens for type, spacing, module colours; responsive layout fixes (phone: stage first or tabbed, tablet breakpoint); a11y baseline (focus-visible, reduced motion, canvas labels); render-on-demand/quality tiers for mobile.

---

## 10. Grades 1-7 curriculum map

Complexity: **L**ow (data + simple UI, reuses existing parts), **M**edium (new scene/interaction), **H**igh (new interaction model, many question types or heavy 3D). Rendering suggestion: 2D = SVG/DOM, 3D = existing r3f stack. Existing = [Done] today.

### Number and Operations

| Module | Grades | Prerequisites | Interactive demonstrations | Assessment | Cx | Notes |
|---|---|---|---|---|---|---|
| Place Value | 1-4 | none | **Existing Number Sense**; extend to thousands, comparing, rounding | build/compare/order, expanded form | L | Extend, do not rebuild |
| Addition and Subtraction | 1-4 | Place value | Base-ten blocks with regroup/borrow animation (reuse regroup engine); number-line jumps | typed answer, build-the-sum | M | Highest-value next module for grades 1-3 |
| Multiplication Arrays | 2-5 | Addition | Rows x columns grid, skip counting, area link | build array for a product, MC, fact fluency | M | Already teased |
| Division and Grouping | 3-5 | Multiplication | Share items equally, remainders, array-inverse | partition tasks, word problems | M | |
| Fractions | 2-6 | Division/grouping (informal) | **Existing**; add compare, equivalent ladder, number-line, add/subtract, mixed numbers | build, order, MC | L-M | Extend |
| Decimals | 4-6 | Place value, fractions | Tenths/hundredths grids, decimal place-value mat, number line | place, compare, convert | M | Reuse place-value scene logic |
| Percentages | 5-7 | Fractions, decimals | 10x10 grid, fraction-decimal-percent triple view | convert, discounts word problems | M | |
| Integers and Number Lines | 5-7 | Number line, subtraction | Thermometer, number line walk, zero pairs (chips) | place, add/subtract on line | M | |

### Geometry and Measurement

| Module | Grades | Prerequisites | Demonstrations | Assessment | Cx | Notes |
|---|---|---|---|---|---|---|
| 2D and 3D Shapes | 1-4 | none | Shape sorter, rotate solids; extend current picker (cone, pyramid) | identify, sort, faces/edges/vertices | L-M | Seeds in Geometry |
| Angles | 3-7 | Shapes | 3D/2D protractor, turn animation, angle types | measure, estimate, construct | M | Teased |
| Area and Perimeter | 3-6 | Multiplication | Tile grid, drag corners of rectangles/composites | build to target, word problems | M | Prereq to volume |
| Volume and Surface Area | 5-7 | Area | **Existing Geometry Explorer** | existing 12 challenges | L | Extend (cone/pyramid) |
| Coordinate Plane | 5-7 | Integers/number line | Plot, translate, reflect, rotate (3D optional) | plot/identify points | M | Teased |
| Symmetry and Transformations | 3-7 | Shapes, coordinates | Fold line, mirror, rotate, tessellate | draw/complete, identify | M-H | Easier after coordinate plane |
| Measurement (length, mass, time, capacity, money) | 1-5 | Number sense | Virtual ruler, clock, scale, jug | read instruments, convert units | M | Many sub-skills; split |

### Mathematical Thinking

| Module | Grades | Prerequisites | Demonstrations | Assessment | Cx | Notes |
|---|---|---|---|---|---|---|
| Patterns and Sequences | 1-6 | none | Pattern builder, growing shapes, rule finder | continue/find rule | L | Good early-grade filler |
| Logical Reasoning | 1-7 | none | Sorting/Venn, grid puzzles, if-then | puzzles, MC | L-M | |
| Algebraic Balance | 5-7 | Operations | Balance scale with weights/variables | solve for unknown | M | |
| Variables and Expressions | 6-7 | Balance | Function machines, substitution, tables | evaluate, simplify | M | |
| Probability | 4-7 | Fractions | Spinners, dice, coin/bag experiments with frequency vs theory | predict, compare | M | |
| Data and Graphs | 2-7 | Counting, number sense | Build pictograph/bar/line graph from data; mean/median | read and build charts | M | |
| Word Problems | 1-7 | per topic | Captain story missions, bar models | typed answer, MC, model building | H | Needs question engine with text inputs |

---

## 11. Recommended implementation phases

| Phase | Scope | Outcome |
|---|---|---|
| 2A | Safety net: add Vitest + unit tests for `src/data`, `progressStore`, badges; fix confirmed bugs (auto-solve, `lastView`) behind tests | Baseline protection |
| 2B | Academy shell + hash router + module registry/contract; migrate the three modules with **zero behaviour change** | Navigation, deep links, scalable wiring |
| 2C | Question/assessment engine + progress schema v3 (XP, attempts, open module map, migration) | Shared scoring and richer data |
| 2D | Captain companion + dialogue data + missions/achievements | Hybrid guided experience |
| 2E | Responsive + accessibility + design tokens + mobile performance pass | Usable on phones/tablets |
| 3+ | New modules in value order: Addition/Subtraction, Multiplication Arrays, Patterns, Fractions expansion, Decimals/Percent, Area/Perimeter, Angles, Coordinate Plane, Data/Graphs, Balance/Algebra, Probability, Integers, Symmetry, Measurement, Word Problems | Curriculum growth |

---

## 12. Dependency map

```
Tests (2A) ──► Shell/router/registry (2B) ──► Question engine (2C) ──► Missions/achievements (2D)
                    │                               │                        │
                    │                               └──► Progress v3 (2C) ───┘
                    └──► Responsive/a11y (2E)        └──► Captain companion (2D, needs engine events)
New modules (3+) need: registry (2B) + engine (2C) [+ progress v3 for XP]
Word Problems need: engine with text/MC input (2C) + most number modules
Addition/Subtraction  <- Place Value
Multiplication        <- Addition       -> Division, Area, Arrays-to-fractions link
Fractions             <- Division(informal) -> Decimals -> Percentages
Integers/Number line  -> Coordinate Plane -> Transformations
Area/Perimeter        -> Volume/Surface Area (existing Geometry)
Fractions             -> Probability
Algebraic Balance     -> Variables and Expressions
```

---

## 13. Estimated complexity

| Work item | Complexity |
|---|---|
| Test setup + data/store tests | Low |
| Fix auto-solve and `lastView` bugs | Low |
| Hash router + Academy shell | Medium |
| Module registry/contract + migrating 3 modules | Medium |
| Question engine (build + MC + numeric) | Medium-High |
| Progress schema v3 + migration | Medium |
| Missions + achievements data model | Medium |
| Captain companion (extract from 1,283-line scene) | Medium-High |
| Responsive/accessibility pass | Medium |
| Each new 2D module | Low-Medium |
| Each new 3D module | Medium-High |
| Word Problems | High |

---

## 14. Recommended Phase 2 starting point

Start with **2A then 2B**, in that order, and stop for review between them:

1. **Characterisation tests first** (Vitest, dev-dependency only) for `placeValue.ts`, `geometryShapes.ts`, `challenges.ts`, `badges.ts`, `progressStore.ts` so every later refactor is protected. This needs a package change, so it requires your explicit approval.
2. Fix the two confirmed bugs under test.
3. Introduce the module registry/contract and move per-module state out of `App.tsx` with identical rendered behaviour, then add the router and shell.

Files most likely touched in Phase 2:
- `package.json`, `package-lock.json` (test runner), `vite.config.ts` (test config)
- `src/App.tsx` (to be thinned), `src/main.tsx`
- `src/data/mathModules.ts` (registry/contract), `src/data/badges.ts`, `src/data/challenges.ts`
- `src/utils/progressStore.ts`, `src/hooks/useProgress.ts`, `src/hooks/useModuleQuiz.ts`, `src/hooks/useChallenge.ts`
- `src/components/panels/WelcomePanel.tsx` (becomes Academy home)
- `src/App.css` (split/tokens)
- New: `src/shell/`, `src/modules/<id>/`, `src/engine/`, `src/data/missions.ts`

Must be preserved: module ids, challenge ids, badge ids, `matharmy:progress` key and v2 migration path, lazy loading of 3D chunks, the SceneHtml workaround, scene resource disposal, Number Sense regroup timing constants shared by scene and sound.

---

## Appendix A: how the baseline was produced

```
git archive HEAD | tar -x -C <scratch>/ma-audit      # copy outside the repo
cd <scratch>/ma-audit && npm ci && npx oxlint && npm run build && npm audit
npx vite preview --port 4173 ; Playwright (Chromium, SwiftShader) smoke script
```
The repository working tree was unchanged by these steps (`git status` clean apart from this report).

## Appendix B: items needing further investigation

- Real-device frame rate and thermal behaviour on mid/low Android and iPad (not measurable in a headless container).
- Why the document is 24 px taller than the viewport at 1440x900 on desktop.
- Whether `public/icons.svg` is intended for future use.
- Git history before `bc72d77` (shallow clone), deployment target, and any hosting configuration outside the repo.
- Supplied screenshots: none were attached to this task, so visual comparison was against live renders at three viewport sizes.


---

## 15. Phase 2 outcome (2A to 2E)

All on branch `claude/matharmy-2-phase-2`, draft PR #1, one commit per phase. No new maths modules.

| Audit finding | Status now | Where |
|---|---|---|
| No automated tests (risk 1) | **Resolved**: Vitest + jsdom + Testing Library; 231 tests in 15 files covering maths, badges, progress, hooks, all three modules through the real `App`, routing | `vitest.config.ts`, `src/**/*.test.*` |
| Free Geometry star (risk 2) | **Fixed**, including the same case in Fractions. A challenge counts only after it has been seen unsolved during the visit | `src/hooks/useChallenge.ts` |
| `lastView` saved, never used (risk 3) | **Fixed differently**: welcome page stays the landing page; a "Continue: <module>" shortcut appears when a module was left open | `WelcomePanel.tsx`, `AcademyShell.tsx` |
| Fixed per-module progress schema (risk 4) | **Partly addressed**: schema v3 adds `xp`, `missions`, `lessons`; v1/v2 upgrade in place. The module map is still keyed by the `MathModuleId` union; a consistency test guards it | `src/utils/progressStore.ts`, `src/modules/registry.test.ts` |
| `App.tsx` integration bottleneck (risk 6) | **Resolved**: one hook per module in `src/modules/*`; adding a module is a hook, a registry entry and one line in `useModuleRuntimes.ts` | `src/modules`, `src/shell` |
| Challenge model not unified (risk 7) | **Partly resolved**: `ChallengeSet` contract and one challenge registry; question kinds declared. Geometry challenges still use `check()` functions | `src/engine/*` |
| Mobile overflow and 3D below the fold (risk 8) | **Fixed** at 360 and 390 px and landscape phones; 3D view first and sticky on phones. Real-device frame rate still not measured | `src/styles-foundation.css` |
| Accessibility gaps (risk 9) | **Mostly resolved**: focus ring everywhere, reduced-motion handling (CSS and 3D decorative motion), larger touch targets, and a live text description of every 3D scene. A full screen-reader pass with real assistive technology remains | `src/styles-foundation.css`, `src/utils/reducedMotion.ts` |
| No router / no deep links | **Resolved**: hash routes `#/`, `#/fractions`, `#/geometry`, `#/number-sense`; Back button works | `src/shell/route.ts` |
| Single global stylesheet (risk 11) | **Mostly resolved**: welcome, place-value, fractions, add-subtract and Captain styles moved next to their components (App.css 955 to about 620 lines). Verified with before/after screenshots. Shared rules (header, stage, challenge card, formula overlay) remain in `App.css` | `src/components/**/*.css` |
| Captain only on the welcome page, no reaction to progress | **Resolved**: a small 2D Captain in every module reacts to solves, badges and level-ups and gives tips when tapped; XP and level shown in the header once earned | `CaptainCompanion.tsx`, `useCaptainReactions.ts`, `XpMeter.tsx` |
| Dependencies churn, `THREE.Clock` warning (risks 10, 12) | **Open** | |

Still not built: missions, lessons, student profiles, export/import of progress.

### Done since (Phase 3, first pass)
- **Add & Subtract** (grades 1-3), the first new module: base-ten blocks, carry/borrow with the existing regroup trades, worked column method, 12 challenges, a badge. Built on the registry, `ChallengeSet` and module hook, as proposed.
- **Multiplication Arrays** (grades 2-5): rows x columns grid of cubes, skip counting by clicking a row, swap rows and columns, repeated addition and fact family, 12 challenges, a badge. It was the teaser on the welcome page and is now a real card.
- **Division and Grouping** (grades 3-5): share cubes equally or make groups of a set size, quotient and remainder, the multiplication check, 12 challenges, a badge. Builds on arrays: one row per group, left-overs in red.
- **Patterns and Sequences** (grades 1-6): add or multiply the same amount each time, shown as bars, jump to any term, the rule for the n-th term, 12 challenges, a badge.
- **Area and Perimeter** (grades 3-6): rectangles and L-shapes on a grid, area as tiles and perimeter as boundary edges, composite shapes (cutting a corner changes area but not perimeter), largest-area and smallest-perimeter challenges, 12 challenges, a badge.
- **Decimals and Percentages** (grades 4-7): a 100-square grid shaded by tenths (columns) and hundredths (squares), read as a decimal, a fraction in lowest terms and a percent at once, 12 challenges including comparisons across forms, a badge.
- **Data and Graphs** (grades 2-7): a five-bar graph with three topics, the counts read as a data set (total, mean, median, mode, range, tallest), an optional mean line, 12 challenges including two-fact ones, a badge.
- **Angles** (grades 3-7): a 3D protractor you can click to turn the ray, angles named (acute, right, obtuse, straight, reflex, full turn), complement / supplement / full-turn partners, share of a turn, 12 challenges, a badge. Replaces the 'Coming soon' teaser.
- **Coordinate Plane** (grades 5-7): a -6..6 plane with plotted points (click or steppers), quadrants, distances from the axes, and a triangle you can slide, flip and turn (with its faint starting copy and a move history), 12 challenges, a badge. It was the last 'Coming soon' teaser, so that list is gone.
- **Integers and Number Lines** (grades 5-7): a -10..10 number line (red negative side, blue positive side) with two points to compare (absolute value, opposite, order, distance apart) and an add/subtract view that draws the hop and explains why subtracting a negative moves right, 12 challenges, a badge.
- **Probability** (grades 4-7): a spinner with 0-6 red, blue and green sectors, theoretical chance as a fraction, percent and word (impossible to certain), spins from a seeded stream with a bar per colour and a line for the expected count, 12 challenges, a badge.
- **Symmetry** (grades 3-7): twelve shapes drawn flat with their lines of symmetry and the order of rotation (checked by reflection tests), and a 6x6 mirror pattern (up and down, across, diagonal) where mismatched tiles show red and the learner fixes the picture; 12 challenges, a badge.
- **Welcome page organised**: module cards grouped under the three curriculum strands (Number and Operations, Geometry and Measurement, Mathematical Thinking), sorted by starting grade, with an All / 1-2 / 3-4 / 5-7 grade filter. The card design is unchanged. A type-checked map makes adding a module without choosing its strand an error.
- With ten module tabs the header now scrolls sideways in one row (it had grown to 224 px tall when wrapped) and keeps the active tab in view.
- XP and level meter in the header; the Captain companion; per-component styles; text descriptions of the 3D scenes.

### Suggested next steps
1. Next modules in value order: Algebraic Balance, Measurement, then Variables and Expressions.
2. Missions and lessons on top of the stored `missions` / `lessons` containers.
3. Progress export/import (JSON file) so a learner can move devices without a backend.
4. A real-device performance and screen-reader pass.
