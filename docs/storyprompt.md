# Storyprompt · implementation parking note

The decolonial ten (in `storyarcs_decolonial.md`) is the canonical
spec. This file is the parked work order. Pick up when phase 2 is
done.

## What to build, in order

1. **Schema.** Add to Cube (and optionally Scene):
   - `trajectory: enum` (the ten primaries; nullable; default null)
   - `trajectoryVariant: string` (free-form within the variants
     list, nullable)
   - `temperature: enum('hot'|'cool'|'crossroads')` (derived from
     primary; persisted for query)
   - `trajectoryStack: string[]` (optional second primary for the
     shadow-stack cases; cap at 2)
2. **Trajectory data file.** A static TS module
   `apps/studio/src/lib/trajectories.ts` that exports the ten
   primaries with: name, glyph, temperature, motion, energy,
   five-phase array, compatibles, shadow, variants. Source of truth
   for the picker UI and for manifest export.
3. **Cube detail page picker.** On the Cube detail surface, a
   "Trajectory" section. Empty state shows "untrajectoried" with a
   subtle "pick one" link. Picker is a 10-cell grid of glyphs +
   single-word names (sentence case). Clicking opens the primary's
   sheet (definition, five phases, variants). Pin-a-variant is a
   secondary action.
4. **Glyph rendering.** The ten glyphs as a single span with
   `font-family: monospace` so they render consistently. Tyrian
   tint when active, muted when not. Mirror Subtaste's twelve.
5. **Filter on Cubes index.** Sidebar or top-bar filter "by
   trajectory" listing the ten with counts.
6. **Manifest export.** Add to the Cube manifest JSON:
   ```json
   {
     "trajectory": "Descent",
     "trajectoryGlyph": "⤓",
     "trajectoryVariant": "Sankofa",
     "temperature": "hot",
     "phases": ["Threshold-call", "Crossing-down", ...]
   }
   ```
   Engine-side (Unreal / Unity) consumers can map this to beat
   templates.
7. **Beat-template seeding.** When a Scene is created on a
   trajectoried Cube, seed the five phase names as draft scenes if
   the user opts in. Non-destructive; default off.
8. **Cross-Cube compare view.** "Which of my Cubes are *Descent*"
   query on the Cubes index. Group-by-primary toggle.
9. **Branding lift.** The ten glyphs become the trajectory
   iconography on every Cube card and in the manifest pill on the
   Nexus node. Parallel to Subtaste's twelve.

## Open decisions to resolve before shipping

- Witness primary swap (currently variant under Inheritance)
- Communion as primary vs phase-of-descent
- English-only names vs source-tradition names (Sankofa, Kalfou)
- Variants list open to community contribution under protocol

## Why we are parking it

Phase 2 (memory tending UI) is closer to the agentic core. The
trajectory system is brand and structure but does not change how
espíritus run. Ship the autonomy infrastructure first, then return
here.
