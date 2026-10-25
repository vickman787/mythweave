# Run Mythweave

Requires Node.js **24+** (tested on 24.15), npm, and a modern browser. No Python or external database is required.

```sh
npm ci
cp .env.example .env
npm run dev
```

PowerShell: `Copy-Item .env.example .env`. Open http://localhost:3010. `npm run build` performs strict TypeScript checking and creates the frontend bundle. `npm test` runs invariant and HTTP integration tests. `npm start` uses the same server; set `NODE_ENV=production` after building for deployment.

## Complete demo path

1. Click **Play the demo** → Prepare your adventure → Launch demo adventure. This creates a separate demo identity, never a fake Twitch connection.
2. In the simulator, select Luna, press `!join weaver`, and enter `!weave fallen branches into a bridge`. Send it, then approve P1. The crossing appears and Aether falls from 10 to 7.
3. Join Warden and propose `!weave shield the party from the storm`. Approve P2. The exposed crossing makes this cost 4 Aether; a ward appears.
4. Join Weaver and propose `!weave restore the celestial lens`. Approve P3. Captured lightning lowers this cost to 1. The beacon lights, and the attributed recap appears.
5. To test voting, start with a threshold of 2 or 3. Switch simulated participants, join any valid role, then send `!vote P1`. Each identity has one vote, including the proposer’s initial support. Repeated/equivalent proposals group together.
6. Before finishing, get the overlay URL, open its preview, and compare the state with the control room. Revoke links to invalidate the old URL. Pause/resume or restart the server: checkpoints survive and a restart pauses active adventures.

Other paths are valid: Seeker reveals the hidden stone path, Weaver restores shelter, Seeker aligns star runes. Unsupported ideas get explicit guidance. The default interpreter is deterministic catalogue matching. An optional server-side OpenAI interpreter is implemented but disabled; no paid model API was called during development. There is no automatic execution or approval-off setting.

## Real Twitch setup (requires account access)

Register a Twitch developer application yourself at https://dev.twitch.tv/console/apps. Use a confidential client and register the exact callback **http://localhost:3010/auth/twitch/callback**. Put its client ID and secret in `.env`; never commit this file. Set `TOKEN_KEY` to a persistent 32-byte hex key using the command in `.env.example`.

1. Continue with Twitch signs in with an authorization-code flow and **no identity scopes**. OAuth state is one-time, bound to an HttpOnly SameSite cookie, and expires after ten minutes.
2. From the dashboard choose **Authorize chat**. This separately requests `user:read:chat user:write:chat`. The same signed-in Twitch account must authorize; it acts as its own channel’s bot. No email, moderation, or channel-management permissions are requested.
3. The server validates the token and opens an EventSub WebSocket to Twitch, then creates a `channel.chat.message` subscription with broadcaster and reader set to that account. Readiness turns to `ready` only after subscription creation succeeds. A live session cannot launch before this.
4. Launch a session. From a real viewer account send `!join weaver`, `!weave fallen branches into a bridge`, and `!vote P1` as needed. The authenticated EventSub chatter ID supplies identity. Review and approve the proposal in the control room. Confirm that the live overlay changes and Twitch receives a concise bot reply.
5. Repeat through the ending. Local testing with vickman24 on October 25, 2026 verified sign-in, chat readiness and a complete real-chat victory: bridge, ward and celestial lens, with three approved decisions and 2 Aether remaining. Evidence: `docs/live-victory.jpg`. Separate viewer identity, bot reply delivery, OBS synchronization and platform reconnect/revocation remain unverified.

Exact commands: `!join weaver`, `!join warden`, `!join seeker`, `!weave <idea>`, `!vote P1`, `!help`. Commands are case-sensitive; role names are lowercase. The companion `/join/<session-id>` permits role/proposal/vote operations only using a signed-in Twitch identity. Typed aliases work only for the three seeded demo identities, controlled by that demo’s owner.

Bot responses are limited to one per channel every 1.5 seconds. Chat input is bounded, event IDs deduplicated within a session (last 2,000), one pending proposal per supported action, one support per identity, and three seconds between new proposals. The owner can reject, pause, resume, and end; accepted actions always revalidate current state, role, resources and support inside one SQLite transaction.

## Disconnects, credentials and storage

- Tokens stay on the server and are encrypted with AES-256-GCM in SQLite. Production requires `TOKEN_KEY`; changing it makes old tokens unreadable, requiring chat reauthorization. Without a local key, tokens become unreadable after restarting; this is acceptable for temporary demo development only.
- Twitch tokens validate on connect and hourly while connected; near-expiry tokens refresh server-side. Rejected/revoked tokens require authorization again. Closing/lost subscriptions pause live adventures. A reconnect preserves transferred subscriptions; a lost socket creates a new subscription. Actions remain paused until the owner resumes.
- A server restart pauses active games. Auth cookies expire after 24 hours. Signing in again with the same Twitch identity restores access to its stored sessions. Demo identities persist only via their cookie; save the browser cookie to return to that demo. Signing out deletes that auth session.
- SQLite file: `data/mythweave.sqlite`; override with `DB_PATH`. WAL and transactions protect checkpoints and accepted event ordering. Back up the database together with its WAL safely using SQLite backup tooling. Do not commit data or secrets.
- Overlay URL contains an opaque read-only capability, not credentials. It can read that session’s public world, proposals and attributed recap, never control it. Revocation closes existing streams on the next broadcast/heartbeat. Treat its URL as private. A public companion link intentionally reveals the public game state and displayed contributor names; do not use sensitive names.
- No unrestricted chat history is stored. Only role assignments, pending/accepted action attribution, bounded deduplication IDs and supported decisions are retained. Expired browser sessions are deleted hourly. Delete the local database to remove local game data while the server is stopped; production retention needs an operator policy.

## Deployment plan

Use **one Node 24 process** on a VM or container host with a persistent volume and HTTPS reverse proxy (Caddy/nginx). SQLite on ephemeral storage will lose sessions; multiple workers are unsupported. Set `APP_URL` to the public HTTPS origin, `NODE_ENV=production`, `TOKEN_KEY`, Twitch credentials and `DB_PATH` on the persistent volume. Register the matching HTTPS callback with Twitch. Run `npm ci --include=dev && npm run build`, then `npm start`. Proxy upstream to `127.0.0.1:3010`; disable buffering and set long read timeouts on `/api/games/*/events` for SSE. Twitch EventSub requires outbound WSS/HTTPS, not an inbound webhook. `/health` provides a readiness check.

Do not deploy as a static-only site or short-lived serverless function. The frontend and API must share one origin. Configure any proxy Host/Origin handling consistently with APP_URL. Run a real stream test after deployment, including reconnect, overlay revocation, OAuth denial and token revocation. Nothing has been deployed, registered, paid for, or submitted automatically.

### Container packaging

The included Dockerfile builds the frontend, runs Node 24 as a non-root user, and exposes port 3010. The Docker image excludes local secrets, databases and dependency folders. Set HOST=0.0.0.0 inside a container; the default local server binds only to loopback.

```sh
docker build -t mythweave .
docker run --name mythweave --env-file .env -e NODE_ENV=production -e APP_URL=https://YOUR-DOMAIN -p 127.0.0.1:3010:3010 -v mythweave-data:/app/data mythweave
```

Replace YOUR-DOMAIN with your HTTPS origin and configure the reverse proxy and Twitch callback before live use. The local .env must contain the persistent TOKEN_KEY and Twitch credentials. Container packaging is supplied for deployment preparation; the image has not been built or deployed in this environment.

## Outstanding release evidence

- Original Canva logo, emblem favicon and illustration crops are installed. Full-resolution references are retained in `docs/design-reference`; provenance is in `public/brand/README.md`. Screens use functioning HTML controls rather than whole-page mockup images.
- Continue visual review across devices. This build follows the Canva palette, artwork and layouts; exact mockup parity is not claimed.
- Verify Twitch end to end with credentials and a real viewer/channel. Exercise permission denial, refresh, EventSub reconnect and revocation on the actual platform.
- Optional model interpretation is implemented and fixture-tested; actual provider operation is unverified without operator opt-in and credentials.
- Deploy with authorization, check desktop/mobile/OBS on the deployed URL, record a public video under three minutes and prepare submission. Recheck official eligibility/deadline and keep judging access available. No submission is made by this build.

See [MILESTONES.md](MILESTONES.md) for milestone tracking. The main Codex session ID is retained in private submission notes, outside the repository.


## Optional model interpretation

Following the official OpenAI Responses API structured-output guidance, the server can use gpt-4o-mini for ideas outside the deterministic vocabulary. Enable only when you authorize paid API usage: set ENABLE_MODEL=1 and OPENAI_API_KEY server-side. OPENAI_MODEL defaults to gpt-4o-mini. Only the bounded proposal text and authored action catalogue are sent; no Twitch tokens or viewer IDs are sent. store:false disables response persistence. The model returns one allowlisted action ID or unsupported. The server rejects malformed, refused, incomplete, cross-encounter and extra-field outputs, then rechecks the current world and role/resource rules. A six-second timeout, per-viewer ten-second cooldown and process-wide 60-call hourly ceiling limit usage. Normal catalogue commands work without the provider; failures fall back to explicit supported-command guidance. Model classification cannot approve or execute anything. Actual provider calls remain unverified.

Official references: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses and https://developers.openai.com/api/docs/models/gpt-4o-mini .

