# Node logic

References for what Bóveda's Nexus is becoming, and the four patterns we're actually stealing. Sits with `cluster-architecture.md` and `Burnthesquareimplement.md` as architectural source material.

## What Nexus is

A character + scene + cube relationship graph. Drag-and-connect node canvas, typed edges, snapshot history, sub-cube scoping. Worldbuilding-as-graph rather than worldbuilding-as-wiki.

## Adjacent tools and what each is

### Direct worldbuilding tools

- **World Anvil** — encyclopedic wiki with cross-links. Strong on completeness, weak on graph view. Heavy.
- **Campfire** — modular worldbuilding (magic-system module / family-tree module / location module separately). Each axis its own sub-surface.
- **Plottr** — character-arc on timeline. Time as a first-class axis on the graph.

### Game writing / narrative graphs (the structural ambition)

- **Articy:Draft** — the closest comparable. Flow-based dialog + character + variable graph. Conditional edges. State variables. Heaviest single reference for what Nexus is becoming.
- **Twine** — story-state checkpoints, branches from a canvas. Light visual graph.
- **Yarn Spinner** — Unity/Godot dialog graph. Structured, lightweight.

### Branching / sandbox-vs-canonical

- **Figma branching** — *the* model. "Main" is canonical, branches are sandboxes; you merge when the exploration is good. No precedent for this pattern in worldbuilding tools yet.
- **Git** — same metaphor at the engineering level. The cultural norm of "commit when concrete" is what we want.
- **Linear cycles** — drafts that ship to canonical at cycle close.

### Connection-graph aesthetic

- **TheBrain** — focused-node-pulls-neighbors-into-view. The graph breathes around attention. Beautiful spatial memory.
- **Kumu** — relationship typology with strong edge legends. Their typed-edge legend pattern is canonical.

### Knowledge-graph backlinks

- **Obsidian / Roam / Tana** — bidirectional links emerge from text, not just explicit edges. Mentioning a name auto-creates a soft edge.

## The four to steal

Ranked by leverage. Build all four; minimal-viable versions first, refine after.

### 1. Figma's branching model — highest leverage

**Why:** sandbox-to-canonical exists nowhere in worldbuilding tools today. Owning this pattern is a real moat for Bóveda, and the snapshot infrastructure is already there.

**Minimal implementation:**
- Snapshot gets `kind: 'sandbox' | 'canonical'` field
- Studio shows a state pill at top: tyrian "Canonical" when committed, neutral "Sandbox" while exploring
- "Promote to canonical" action on a sandbox snapshot copies its state to the canonical branch
- "Branch from canonical" creates a fresh sandbox from the current canonical state

**Future:** named branches (not just sandbox/canonical), three-way merge, conflict resolution UI.

### 2. Articy:Draft's conditional edges + state variables

**Why:** lets relationships carry meaning that responds to story state ("ALLY if trust > 5"). Underused in fiction tools.

**Minimal implementation:**
- Relationship gets optional `condition: string` (free text for now: "trust > 5", "post-revelation", "if Cube.state = wartime")
- Edge label shows the condition when present, monospace, smaller font
- No state-variable engine yet; just human-readable conditions that author and reader can interpret

**Future:** typed state variables on Cube + Character, expression parser, runtime evaluation, conditional visibility.

### 3. TheBrain's focal interaction

**Why:** the graph reorients around the user's attention. Replaces the "see everything at once" view that's overwhelming once Nexus has 50+ nodes.

**Minimal implementation:**
- When a node is selected, dim non-neighbors (opacity 0.3)
- Re-center / fitView to put the selected node at the center with its immediate neighbors visible
- Click empty canvas → restore full opacity

**Future:** spring-layout reorientation, distance-based opacity falloff, multi-hop neighbor expansion.

### 4. Obsidian's backlink emergence

**Why:** explicit edges are work. Backlinks emerge automatically from text and reveal connections the writer didn't think to draw. Surfaces hidden structure.

**Minimal implementation:**
- Parse Character.bio for `[[Name]]` patterns
- For each mention where the target Character exists, render a soft edge: dashed neutral grey, label "(implicit)"
- Click the edge → jump to the citation in the bio

**Future:** typed mentions (`[[Name|ALLY]]`), bidirectional view (this character mentions / mentioned by), full-text similarity edges.

## What we're NOT taking

- World Anvil's encyclopedic wiki page-per-everything. Too heavy. Bóveda is a graph tool that surfaces wiki entries inline, not a wiki tool that has a graph as a side feature.
- Twine's pure-narrative model. Bóveda's nodes are characters and places, not story passages.
- Notion's database-as-fundamental-primitive. The graph is the primitive; tables are a view.

## Implementation order

The four are mostly independent. Suggested order:

1. **Branching** (item 1) — biggest moat, builds on existing snapshot model.
2. **Focal interaction** (item 3) — pure UI, ships fast, immediate UX win.
3. **Backlinks** (item 4) — regex parsing + soft-edge rendering. Modest scope.
4. **Conditional edges** (item 2) — schema change + edge label. Can wait until state variables earn their keep.
