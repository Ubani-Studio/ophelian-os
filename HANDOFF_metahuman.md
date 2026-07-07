# Handoff: Bo Ubani MetaHuman in Tufiakwa

You are picking up an in-flight session. The user is mid-MetaHuman setup in Unreal Engine 5.7 and stuck. Drive the editor via MCP to unblock them.

## First action

Call `mcp__unreal__get_actors_in_level`. If it returns actor data, MCP is reachable and you can proceed. If it returns empty or errors, MCP routing is broken; report that and stop.

## Project context

- UE project: `/mnt/e/Alabo/Unreal/Unreal Projects/Tufiakwa`, UE 5.7, BP-driven with two custom plugins (BovedaBridge, UnrealMCP).
- `BovedaBridge` is a runtime plugin already wired with: Cipher methods (GetCipherInventory, DecryptCipher, ReportPresenceEvent), dialogue + audio playback (AskDialogue, PlayAudioUrl), and a multicast delegate `OnAudioAboutToPlay(CharacterId, AudioUrl)` that fires before playback. MetaHuman BPs subscribe to that to drive Audio2Face.
- The Boveda backend is a Fastify API at http://localhost:5130 (auth header `x-api-key: ophelian-dev-key-2026`). Persona Bo Ubani is `d5ed82b8-98ae-4d8a-ad30-e4fea597d40a`. Voice is rendered via Mmuo (Modal app at https://bomac1193--mmuo-synthesize.modal.run).

## What the user has

- Imported a Mesh Capture Data asset somewhere under `/Game/`. They could not find a `Mesh to MetaHuman` button in the toolbar, and Quixel Bridge is gone in 5.7.
- An existing legacy MetaHuman `BotheBrunette` at `/Game/MetaHumans/BotheBrunette/` (can be ignored or deleted).
- A pre-existing user character `Bo Ubani` in the Boveda DB. The MetaHuman being created represents him.

## Goal

Land a usable MetaHuman BP at `/Game/MetaHumans/BoUbani/` that:

1. Wraps the user's face (from the Mesh Capture Data they imported).
2. Has default body, clothes, hair (style is editable later in MetaHuman Character editor).
3. Can be dragged into a level.
4. Has its dialogue audio routed through `BovedaSubsystem.PlayAudioUrl` (you will scaffold a thin BP that calls AskDialogue with `Bo Ubani` as IdOrName, then the audio URL drives playback through the MetaHuman's audio component).

Do steps 1 to 3 first. Step 4 is a follow-up.

## UE 5.7 specifics

- **Quixel Bridge is removed** in 5.7. The MetaHuman character lives natively as a `MetaHuman Character` asset (plugin `MetaHumanCharacter` + `MetaHumanCharacterUAF` are enabled in the .uproject). No external service required.
- The flow split:
  - `MetaHuman Identity` asset is still used for face fitting (creates the locked geometry from the user's mesh).
  - `Mesh to MetaHuman` action on the Identity asset produces a `MetaHuman Character` asset.
  - The `MetaHuman Character` asset opens in the new in-engine Character Editor for body, clothes, hair, skin, eyes, makeup. All independently editable later.
  - A `MetaHuman Actor` BP wraps the Character for level placement.

## Likely user state

The user has either:

- A Static Mesh asset (OBJ/FBX from photogrammetry).
- An empty MetaHuman Capture Data asset (created via right-click but not populated).
- A Footage Capture Data asset (if they used a phone capture flow).

Diagnose first via MCP. List `/Game/` and find the imported asset. Tell the user what type it is.

## Steps

1. Confirm MCP works (`mcp__unreal__get_actors_in_level` non-empty response).
2. List the user's Content folder, find the imported mesh/capture asset, report its asset class to the user.
3. Based on the asset type, drive the right path:
   - **Static Mesh path**: create a `MetaHuman Identity`, set its mesh source to the static mesh, add 3 to 5 promoted frames, run Track Active on each, run Identity Solve, then run Mesh to MetaHuman.
   - **Mesh Capture Data with photos**: open the Capture Data, ensure it has photos. If empty, ask the user to drag the photos in. Then proceed as above with Identity.
   - **Footage Capture Data**: same Identity flow but use `Components from Footage`.
4. Confirm a `MetaHuman Character` asset lands in `/Game/MetaHumans/BoUbani/`.
5. Drag the BP into the current level. Confirm it spawns visible.
6. Stop. Tell the user the BP is in the level.

## What you must NOT do

- Do not delete the existing `BotheBrunette` MetaHuman without asking.
- Do not edit the BovedaBridge plugin or UnrealMCP plugin. Both have been freshly recompiled and are stable.
- Do not change `.uproject`, target.cs files, or any UnrealBuildTool config. The build system is settled.
- Do not start a v4 voice training run. There is one already on a separate Modal account; the user will retry it elsewhere.

## Other in-flight work to be aware of

- A Bo Ubani GPT-SoVITS v2 voice model is the current Bo Ubani voice (40% match, American accent substrate). A v4 LoRA fine-tune was attempted but failed; retry is queued for after Modal billing limit reset. Use the v2 model for any audio testing meanwhile by calling `BovedaSubsystem.AskDialogue("Bo Ubani", ..., bWithVoice=true)`.
- A Cipher mechanic is shipped end to end on the backend (Boveda routes + DB) and exposed via `BovedaSubsystem.GetCipherInventory / DecryptCipher / ReportPresenceEvent`. UMG widget for the HUD is the next BP task after MetaHuman is live, but only if the user explicitly asks.

## Style

- Sentence case headings.
- No em dashes.
- No emojis.
- Restraint. Short sentences. Land the next step, not paragraphs of theory.
- Black, sharp. Match the user's chrysalis aesthetic memory if you generate any UI.

## When you finish step 5

Reply to the user: "MetaHuman BP is in the level at <path>. Ready to wire dialogue or to keep editing." Then stop.
