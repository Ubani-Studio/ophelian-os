# Scene sync · Ikenga ↔ Bóveda Cube parking note

Park the Ikenga-storyboard / browse / collections to Bóveda Cube
binding. Pick up after the agentic track stabilises (post Phase 4
inbox), or sooner if storyboard work blocks on it.

## What it unlocks

- A scene shot or staged in Ikenga (storyboard, browse, collection)
  becomes a Cube-bound location in Bóveda.
- The Cube's nexus shows scenes as nodes alongside characters, with
  edges for "appears_in" / "located_in" / "rules".
- Tags flow both ways: Ikenga's scene tags inform the Bóveda scene;
  Subtaste glyphs and Trajectory phase tags (when those ship) flow
  back to Ikenga.

## What's missing today

1. `Scene.worldId` does not exist in `apps/api/prisma/schema.prisma`.
   Scenes are global; they have no Cube binding.
2. `Scene.tizitaSceneId` does not exist. No round-trip handle.
3. `POST /scenes` accepts no `worldId` and Ikenga does not call it.
4. Ikenga's `storyboard_ai.py` knows about Bóveda arcs but only as
   a closed list for arc suggestion; it does not write scene data.
5. No Ikenga UI for "send to Cube".

## Build steps when unparking

1. **Schema additions.**
   ```prisma
   model Scene {
     // ...existing fields
     worldId        String?
     world          World?  @relation(fields: [worldId], references: [id])
     tizitaSceneId  String?  // round-trip handle
     @@index([worldId])
     @@index([tizitaSceneId])
   }
   model World {
     // ...existing fields
     scenes Scene[]
   }
   ```
   Run `prisma db push`.

2. **Bóveda API.**
   - `POST /scenes`: accept `{ name, description?, type, imageUrl?, tags?, worldId?, tizitaSceneId? }`. Idempotent on
     `tizitaSceneId` — if present and matches, update instead of
     duplicate.
   - `GET /worlds/:id/scenes`: list scenes belonging to a Cube.
   - `PATCH /scenes/:id`: allow `worldId` + tags edits so a
     scene can be reassigned between Cubes (rare, but allowed).
   - Response includes `boveda_scene_id` so Ikenga can store it.

3. **Ikenga end.**
   - Add a "Send to Cube" action on storyboard scene cards,
     collection items, and (optionally) browse-result cards.
   - Picker fetches `GET ${BOVEDA_API_URL}/worlds` and lists Cubes.
   - On select: `POST ${BOVEDA_API_URL}/scenes` with the scene's
     name, image URL, tags, chosen `worldId`, and Ikenga scene id.
   - Store the returned `boveda_scene_id` on the Ikenga scene row so
     subsequent edits update rather than re-create.
   - Surface a small "synced to Cube X" badge on the scene card.

4. **Bóveda Nexus.**
   - In `/cubes/[id]/nexus`, fetch `GET /worlds/:id/scenes` and
     render scene nodes alongside characters. Use the existing
     `WorldConnection` model with `connectionType: "appears_in" |
     "located_in" | "rules"` for character-scene edges.
   - Scene node visual: square with image thumbnail, name in
     Söhne, tag glyphs in monospace.

5. **Tag propagation.**
   - Ikenga scene tags flow into Bóveda scene's `tags[]`.
   - When Subtaste twelve-glyph classification ships, Bóveda
     attaches a glyph to the scene from its dominant tag and
     surfaces it back to Ikenga as a read-only badge.
   - When the decolonial-ten trajectory system ships
     (`storyarcs_decolonial.md`), the scene optionally inherits its
     phase tag from the parent Cube's trajectory and that flows back
     too.

6. **Auth and federation.**
   - Use the existing `ECOSYSTEM_API_SECRET` pattern (CLAUDE.md) so
     Ikenga writes are authenticated.
   - Bóveda treats Ikenga as the photo authority — image URL points
     to Ikenga, not copied.

## Open decisions

- **Soft delete vs hard delete on Ikenga side.** If a scene is
  deleted in Ikenga, do we delete in Bóveda or just unbind?
  Recommendation: unbind (`tizitaSceneId = null`) and keep the
  Bóveda scene, since the Cube may have authored work depending
  on it.
- **Multiple Cubes per scene.** Currently `Scene.worldId` is single.
  If a location belongs to two Cubes (rare but possible: a shared
  cosmology), do we promote to many-to-many? Decision deferred —
  start single, escalate if a real case appears.
- **Browse-result scenes.** Browse hits are not yet "scenes" in
  Ikenga's data model; they're photos. Either promote a browse
  result to a Ikenga scene first, or accept ad-hoc `POST /scenes`
  from browse without round-trip. Recommendation: require promote-
  to-scene first; keeps the round-trip handle clean.

## Why we are parking

Phase 4 (Ubani's inbox for incoming espíritu messages) is closer to
the agentic core and depends on Phase 3 settling. Scene sync is
infrastructure: real but not on the critical path. Pick up when
storyboard work blocks on it or after Phase 5 (twin behaviour).
