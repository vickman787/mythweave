# Implementation record

Main Codex build session: provided separately in the Devpost submission.

1. Foundation: React/TypeScript, design tokens, responsive navigation. After the user signed into Canva, original logo and full-resolution screen references were recovered from design DAHY9j_6_r4. The app uses the original logo, emblem favicon and illustration-only SVG crops; interface text and controls remain HTML. Landing, dashboard, gameplay, companion and recap follow those references.
2. Integration spike: server OAuth authorization-code flow, server token storage, EventSub WebSocket ingestion and chat replies. Real local Twitch sign-in, chat readiness and command-to-approved-world flow were verified on October 25, 2026; reply delivery and platform recovery remain separate checks.
3. Vertical slice: authenticated/deduplicated commands → bounded deterministic interpretation → role/resource/precondition checks → support → streamer approval → persistent state/SSE.
4. Complete adventure: bridge, storm, observatory; choices change resource costs; timer, pause, ending, attributed recap.
5. Resilience: SQLite transactions, persisted checkpoints, permission boundaries, expiring identities, revocable overlay capability, disconnect pause. Automated checks recorded after execution.
6. Polish/submission: local responsive experience, successful real Twitch adventure and deployment instructions. Hosting, OBS verification, recording and submission remain external steps; nothing is published.

## Decisions

One Node 24 instance with SQLite on a persistent volume, React/Vite and server-sent events. No separate database service. Twitch streamer acts as the bot in their own channel; `user:read:chat user:write:chat` requested only when connecting chat. Identity sign-in requests no scopes. Deterministic natural-language catalogue interpretation works without paid API usage; optional schema-constrained OpenAI interpretation is implemented, disabled by default, and fixture-tested without paid API calls.

## Official references checked October 25, 2026

- https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/
- https://dev.twitch.tv/docs/authentication/validate-tokens/
- https://dev.twitch.tv/docs/chat/authenticating/
- https://dev.twitch.tv/docs/chat/send-receive-messages/
- https://dev.twitch.tv/docs/eventsub/handling-websocket-events/
- https://react.dev/learn
- https://nodejs.org/docs/latest-v24.x/api/sqlite.html

## Verification record

- Strict TypeScript and production frontend build passed.
- Game invariants, SQLite rollback/encryption, HTTP authorization/CSRF, concurrent approvals, overlay revocation/SSE and restart persistence tested.
- Browser demo completed all three encounters and displayed the accepted-decision recap with 2 Aether remaining.
- Desktop landing/control room/recap and 390px mobile recap visually inspected.
- Real local Twitch victory, October 25, 2026: vickman24 signed in, authorized chat and reached EventSub readiness. Session `9db08f1e979a8970a785e788` completed the bridge (3 Aether), storm ward (4) and celestial lens (1), each attributed to the real Twitch identity and approved in the control room. The recap shows Adventure complete, three shared decisions and 2 Aether remaining. Screenshot: `live-victory.jpg`. The prior run `6ad4ff03757c5baed4f44d5c` timed out after two decisions. A separate viewer, bot reply delivery, OBS synchronization and real reconnect/revocation still need verification. Automated Twitch protocol tests separately use a local mock EventSub server.
- Model tests use synthetic provider responses, not live API calls.

Final validation: npm run build passed; npm test passed 14/14 checks. Real Twitch victory is verified locally; remaining provider and deployment limits are described above.
