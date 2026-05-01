# Boveda — Implementation Checklist

> Do these before deployment.

## Slayt Integration (Completed on Slayt side)

Slayt's boveda suite (~3,600 LOC) has been removed. Characters, GeneratorPanel, Reliquary, RelicCard, characterGenerator.js, reliquary.js, and the Character MongoDB model are all deleted. Slayt now connects to Boveda via API proxy.

### What Slayt expects from Boveda

**Endpoint:** `GET /characters`
- **Auth:** `X-API-Key` header (value matches `BOVEDA_API_KEY` env var)
- **Response:** Array of character objects. Slayt maps the response and adds defaults for missing fields:
  - `color` (default `#8b5cf6`)
  - `voice` (default `conversational`)
  - `captionStyle` (default `conversational`)

**Fields Slayt uses from each character:**
- `_id` or `id` — unique identifier
- `name` — display name (required)
- `bio` — character bio
- `personaTags` — array of personality tags (e.g. `["bold", "witty"]`)
- `toneAllowed` — array of allowed tones
- `toneForbidden` — array of forbidden tones
- `voice` — voice style string
- `captionStyle` — caption style string
- `hookPreferences` — array of preferred hook types
- `systemPrompt` — custom LLM prompt override
- `color` — hex color for UI avatar badge
- `avatar` — optional avatar URL

### Slayt env vars (already configured)
```
BOVEDA_URL=http://localhost:3001
BOVEDA_API_KEY=ophelian-dev-key-2026
```

### What to verify before deploying
1. `GET /characters` returns a JSON array (or `{ characters: [...] }`) with the fields above
2. `X-API-Key` header authentication is enforced
3. Characters created/edited in Boveda Studio appear in Slayt's AI Generator character dropdown
4. Generating content with a Boveda character voice works end-to-end (Slayt sends character data inline to its own `/api/characters/generate`)
