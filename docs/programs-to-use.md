# Programs to use

The sleepers. Software that nobody in worldbuilding-tools-land is
treating as load-bearing, but that would change what's possible if
Bóveda actually integrated them. Sits with `cluster-architecture.md`,
`computational-orisha.md`, `node-logic.md`, `agentic-build.md`,
`Burnthesquareimplement.md`, `protocol.md` as architectural source
material.

## 1. TouchDesigner as a first-class runtime, not a side tool

Already in the ecosystem at `/home/sphinxy/touchdesigner` with its
MCP server. TD is usually treated as a tool for VJs and AV
installers. The blindspot: it's a real-time graph engine where
every parameter can be data-driven.

If espíritu state pipes into TD via OSC, every live performance has
Ai-8O reacting to audio, Triarch's mood shifting the lighting,
the Cube's "weather" driving particle systems. Bomac on stage with
TD running visuals fed by Bóveda is a new performance form. Nobody
in worldbuilding-tools-land thinks like this.

## 2. Strudel (web TidalCycles) for espíritu music

Diasporic tradition has a deep history of music-as-language (drum
talks, calypso storytelling, Yoruba talking drums). Most generative
music is melody-first; Strudel is rhythm-first and runs in the
browser.

**Espíritus could speak in patterns, not just in words.** Triarch's
voice could be a pattern; Booe's voice another; their conversations
are call-and-response. This is the move literally no other system
is making and it's the most diasporic-authentic.

## 3. Yjs (CRDTs) for the data layer

The boring-infrastructure sleeper. Build Bóveda's character + cube
+ relationship state on CRDT primitives now and collaboration
becomes free later.

When you decide to let another creator co-build a cube with you,
when Ai-8O needs to update state while Ubani is also editing, when
audiences need to interact live during a performance — all of that
is a one-line CRDT sync, not a database refactor.

## 4. Bevy (headless Rust simulation)

The blindspot in agentic systems is *running the simulation when
nobody is looking*. Bevy can run pure simulation server-side
without rendering.

Espíritus live in a continuous Bevy ECS simulation. Unreal / Unity
/ web only render when you visit. Memory accumulates. Goals
progress. The world keeps moving. Most "AI character" systems are
turn-based because they have no simulation substrate; Bevy gives
you continuous time.

## 5. OSC (Open Sound Control) as the lingua franca

Not software exactly — a protocol. UDP messages between tools.
Bóveda → TouchDesigner → Ableton → Notch → Strudel → all
live-synced.

The plumbing of the live AV stack. Underrated because it sits
between tools rather than being one. For the future where Bomac
performs alongside Ai-8O, OSC is the wire.

## The bet

If only one of these gets adopted, **Strudel + espíritu pattern
voices**. Most authentically diasporic (drum-talks tradition),
lowest engineering cost (browser-native), most original. Nobody
else is doing it.

If a second gets adopted, **Yjs / CRDTs** as the substrate. Not
visible to the user but unlocks every future where Bóveda holds
more than one mind at a time.

The other three (TouchDesigner runtime, Bevy headless sim, OSC) are
real but downstream of Bóveda having actual espíritu activity to
pipe somewhere.
