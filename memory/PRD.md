# Digital Chai & Coffee Lounge — PRD

## Original Problem Statement
Build a responsive, full-screen web app where users join a shared room, customize a cartoon avatar, trigger real-time drinking animations, and chat together on a synchronized 2D HTML5 Canvas lounge. Cozy hand-drawn aesthetic, warm tones. WebSocket multiplayer, NPC bots for liveliness.

## User Choices
- Real-time WebSockets for multiplayer (true cross-device sync)
- Audio ON (Web Audio API synthesized SFX)
- Ephemeral / in-memory room state (nothing persisted)
- Avatars: both human (hair/skin/outfit) and animal heads (Cat, Bear, Bunny)

## Architecture
- **Backend**: FastAPI. WebSocket at `/api/ws/{room_name}` with in-memory `LoungeManager`. Messages: `join`, `chat`, `action`. Broadcasts `welcome`, `roster`, `chat`, `action` to all members (incl. sender).
- **Frontend**: React + Tailwind. HTML5 Canvas (`LoungeCanvas.jsx`) draws the wooden lounge, central table, radially-seated avatars, steam, floating emojis, name/drink labels, and speech bubbles via `requestAnimationFrame`. WS via `useLounge.js`. SFX synthesized in `audio.js`. NPCs are client-side (Mocha/Luna/Pip).
- **DB**: MongoDB present but unused (ephemeral requirement); only demo `/api/status` route remains.

## Personas
- Casual hangout user who wants a cozy, playful shared space to co-work / relax with friends.

## Core Requirements (static)
1. Startup avatar & drink setup modal.
2. Synchronized shared lounge canvas with floating name+drink labels.
3. Interactive actions with animation + sound: Drink, Cheers, Blow Steam, Wave.
4. Live chat → speech bubbles over avatars + side chat panel.
5. 3 NPC bots that auto-chat and animate.

## Implemented (2026-06)
### Iteration 1 — MVP
- ✅ Setup modal with live avatar preview, name, 4 drinks, 4 heads, hair/skin/fur/outfit customization.
- ✅ WebSocket multiplayer room with roster sync; cross-session chat verified.
- ✅ Canvas lounge: table w/ candle, radial seating, per-avatar bob, drink/cheers/steam/wave animations, steam wisps, floating reaction emojis, canvas name+drink labels, animated speech bubbles.
- ✅ Web Audio SFX (slurp, clink, steam, wave, message, join) + mute toggle.
- ✅ 3 client-side NPCs with ambient chat/animations.
- ✅ Connection/guest-count status indicator. `?demo=1` quick-join shortcut.

### Iteration 2 — Named Rooms, Lofi Radio, Typing Dots
- ✅ **Named Rooms**: room field + "Private" code generator in setup; room encoded in `?room=` URL; invite button copies shareable link; private rooms are isolated (server per-room broadcast). Public vs private shown in HUD.
- ✅ **Lofi Radio**: procedural Web-Audio lofi engine (chord pads + bass + vinyl crackle) with play/pause + volume knob in HUD.
- ✅ **Typing Dots**: `typing` WS message (broadcast excludes sender); animated "…" bubble drawn over avatars while a user types; NPCs also show it before chatting.
- ✅ Tested: 14/14 backend WS tests, all frontend critical flows incl. two-session same-room sync.

## Backlog (P1/P2)
- P1: Emote wheel / more reactions.
- P2: Server-authoritative NPCs shared across clients; seat picking / drag avatars.

## Next Tasks
- Awaiting user feedback on visuals & feature depth.
