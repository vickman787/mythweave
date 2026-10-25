# Mythweave — Product and Build Brief

## Local implementation

The playable application is now in this folder. Requires Node.js 24+.

```sh
npm ci --include=dev
npm run dev
```

Open **http://localhost:3010** and select **Play the demo** for the full three-encounter adventure. Twitch credentials are optional for the demo and required for live play. `npm run build` checks TypeScript and builds the frontend; `npm test` runs 14 automated checks.

For real Twitch play, copy `.env.example` to `.env` and follow [the Twitch setup steps](docs/SETUP.md#real-twitch-setup-requires-account-access). Supply your own developer app credentials; credentials and local game databases are excluded from the repository. OpenAI interpretation is optional and disabled by default. A public web deployment is optional: reviewers can run the project locally with Node.js 24+.

Read [setup and deployment instructions](docs/SETUP.md) and the [milestone/evidence record](docs/MILESTONES.md). Original Canva branding and illustration crops are installed. A complete real Twitch adventure was verified locally with vickman24 on October 25, 2026; see [the live recap](docs/live-victory.jpg). Deployment, OBS and platform recovery checks, recording and submission remain pending. No accounts were registered by the agent, no paid model calls were made, and nothing was published.

The original approved brief follows.

This folder is the starting point for building Mythweave. The product concept and visual direction are approved. This document describes the intended app; it does not claim that the app, integrations, or deployment already exist.

## Start here

Build a working Twitch-connected cooperative fantasy adventure from this brief and the Canva reference. Begin with one complete playable experience, then improve presentation and reliability. Use OpenAI Codex throughout the build and retain the main build chat's session ID for submission.

Before implementation, inspect the destination repository and applicable AGENTS.md instructions. Confirm available runtimes and verify current official API documentation. Create a short implementation plan and proceed with reasonable technical choices. Never fabricate successful integrations or present sample events as live activity.

## Design reference

**Canva UI/UX presentation:** https://www.canva.com/d/nn64tnr14Zqy3N2

The presentation contains five slides:

1. Landing page, including the updated single **Continue with Twitch** button.
2. Streamer dashboard.
3. Live gameplay and streamer controls.
4. Mobile onboarding and participation.
5. Session recap.

These are high-fidelity static image mockups, not a clickable prototype or an implemented app. Recreate the interface using actual components, accessible text, and responsive layouts. Do not use whole screenshot images as functional app pages. Use judgment to turn visual suggestions into clear behavior and handle missing states.

### Canva assets

| Asset | Canva media ID | Source |
| --- | --- | --- |
| Original logo | MAHY9mm0nA8 | https://www.canva.com/M/MAHY9mm0nA8 |
| Updated landing page | MAHY9xV-uHI | https://www.canva.com/M/MAHY9xV-uHI |
| Streamer dashboard | MAHY9seCPOU | https://www.canva.com/M/MAHY9seCPOU |
| Live gameplay controls | MAHY9qPmsgw | https://www.canva.com/M/MAHY9qPmsgw |
| Mobile flow | MAHY9qemK84 | https://www.canva.com/M/MAHY9qemK84 |
| Session recap | MAHY9nSbgTU | https://www.canva.com/M/MAHY9nSbgTU |

Canva links may require account access. Media IDs are references, not image download URLs. Export the original logo and permitted artwork through Canva when preparing app assets. Preserve the logo's proportions and use appropriate contrast. Do not hotlink expiring thumbnail URLs or use low-resolution previews as final artwork. The earlier landing image with separate Sign in and Connect Twitch actions is superseded.

## Product

**Mythweave is a live adventure where a Twitch community's words and decisions reshape a shared fantasy world while a streamer plays.**

Tagline: **Chat casts. Worlds change.**

The distinguishing mechanic is a visible consequence from a viewer's idea. A viewer proposes a solution, the system translates it into a supported action, checks the rules, gathers community support, and lets the streamer approve it. The world changes and later encounters reflect the decision.

Example: the party reaches a broken bridge. A viewer proposes weaving fallen branches into a crossing. The action costs Aether. After approval, the bridge appears and the party can cross. Spending that resource affects the next encounter.

### Users

- **Streamer:** launches and controls sessions, approves proposals, and displays gameplay on stream.
- **Viewer:** joins a role, proposes actions, and supports decisions through Twitch chat. A companion mobile page can make participation easier.
- **Spectator:** understands the objective and consequences without learning the control room.

## Visual direction

| Token | Color | Purpose |
| --- | --- | --- |
| Background | #100D20 | Midnight canvas |
| Surface | #1B1630 | Cards and panels |
| Primary | #A78BFA | Primary buttons and selected states |
| Accent | #E8CC8A | Magic, resources, highlights |
| Text | #F4EDE0 | Primary text |

Use restrained mystical styling, woven rune motifs, illustrated floating ruins, generous spacing, elegant display headings, and readable sans-serif interface text. Choose fonts whose licenses permit the intended use. Keep contrast, text size, focus states, and touch targets accessible. Pair status colors with labels or icons.

Use the full logo in the landing header and dashboard identity area. Use a small emblem in gameplay and compact mobile headers. Keep gameplay readable on stream. Respect reduced-motion preferences and do not rely on animation alone to communicate a result.

## First playable adventure

**The Shattered Observatory** is a bounded, approximately five-to-ten-minute cooperative escape and restoration adventure.

- One world with three connected encounters and a clear ending.
- Shared Aether resource, objective, timer, and party progress.
- Three roles: **Weaver** builds and restores, **Warden** protects, **Seeker** reveals routes and clues.
- A small catalogue of supported actions with authored visual outcomes.
- Natural-language proposals mapped to that catalogue, including clear unsupported-action feedback.
- Viewer support/voting and explicit streamer approval before execution.
- A recap of accepted decisions and their consequences.

The exact encounter rules and costs are implementation choices. Keep them consistent and explain them in the interface. Numbers in the mockups are sample content, not fixed requirements.

## Screens and flows

### 1. Landing and authentication

Show the product promise, an adventure preview, and a primary path into the app. The header has one **Continue with Twitch** button. Do not add a separate Sign in action.

Use Twitch authentication for account identity and channel connection. Request only necessary permissions, explain their purpose, and support cancellation, revoked access, and expired sessions. Returning users with valid sessions reach their dashboard. Authentication alone must not imply that chat permissions or EventSub subscriptions are ready; show readiness separately and request any additional required authorization clearly.

Hero actions may be **Create a session** and **Watch demo**. An unauthenticated Create a session action should enter the same authentication flow. Do not expose a nonfunctional demo link.

### 2. Streamer dashboard

Include channel connection/readiness, world selection, recent sessions, and session creation. Provide an OBS browser-source overlay URL with copy and preview controls. Include useful first-session empty states and reconnect actions.

### 3. Session setup

This screen is required even though it has no separate slide. Select the world, review roles and session settings, confirm Twitch/overlay readiness, and launch. Streamer approval defaults to on. Do not launch a supposedly live session with a broken chat connection.

### 4. Live streamer control room

The world stage should occupy most of the screen. Show the objective, remaining time, resources, role counts, and pause/end controls. A separate proposal queue shows interpreted action, proposer, supporters, cost, validation result, and approval controls. Distinguish proposal interpretation, voting, approval, execution, and rejection.

### 5. Broadcast overlay

Provide a dedicated read-only overlay route. Display the world, objective, vote/action feedback, and brief participation instructions. Keep streamer controls and private settings out of it. Overlay access must not grant control-room permissions. Make overlay access revocable and avoid revealing Twitch credentials.

### 6. Viewer participation

Support joining a role, viewing the current objective, proposing an idea, and supporting a proposal. Twitch chat is the essential participation path. The mobile companion page is secondary and must use authenticated identity for privileged actions, not trust a typed alias.

Suggested command syntax, to finalize during implementation:

```text
!join weaver
!join warden
!join seeker
!weave <idea>
!vote <proposal-id>
!help
```

Show exact working commands in the product. Validate role names and proposal IDs and respond usefully to invalid input. Keep bot responses concise and rate-limited.

### 7. Recap

Show the outcome and the key decisions that produced it. Credit contributors appropriately and offer Play again. Implement Share recap only if it produces a useful shareable result with deliberate visibility controls.

## Technical direction

The following is a recommended starting architecture, not an already selected or installed stack:

- TypeScript and React for the web interface, with a framework suitable for deployment.
- A server that owns session state, Twitch authentication, event ingestion, and privileged game actions.
- WebSocket or server-sent events to synchronize the control room, overlay, and companion view.
- A database for accounts, sessions, proposals, accepted actions, and checkpoints. Choose a local development database and deployment storage together.
- A 2D renderer such as Canvas, PixiJS, or Phaser for the world if it materially improves the experience. Keep account and dashboard UI in regular accessible HTML.
- A server-side language-model integration for mapping proposals to supported actions and optional bounded narrative variation. Select and verify the provider/model during implementation. Codex is required as a development tool; a runtime model is a separate integration.

Avoid unnecessary services. Prove local operation and the Twitch connection early, then choose a hosting option that supports the required real-time connections.

### Authoritative action pipeline

1. Receive and deduplicate an authenticated viewer event.
2. Apply participation limits and input validation.
3. Interpret the proposal into a schema-constrained action from an allowlist.
4. Validate role, target, resources, world preconditions, and current session state.
5. Group equivalent proposals and collect support using explicit rules.
6. Obtain streamer approval when required.
7. Revalidate and atomically apply the action once.
8. Persist the accepted event and broadcast the resulting state.
9. Display the consequence and retain it for the recap.

The model must not directly mutate game state, execute code, or invent inventory/resources. Treat chat and model outputs as untrusted input. Use a deterministic fallback for supported commands if interpretation is unavailable.

### Suggested domain objects

Account, ChannelConnection, AdventureSession, Participant, Proposal, Vote, WorldState, GameEvent, and StateCheckpoint. Each accepted event needs a stable ID, session ID, sequence number, action, resulting state version, and timestamp. Store only the viewer information needed for participation and attribution. Do not retain unrestricted chat history by default.

### Twitch integration

Verify current official documentation before choosing OAuth scopes, EventSub transport, or bot configuration:

- https://dev.twitch.tv/docs/authentication/
- https://dev.twitch.tv/docs/chat/send-receive-messages/
- https://dev.twitch.tv/docs/eventsub/

Handle permission denial, token expiry, subscription loss, reconnects, duplicate delivery, and rate limits. Preserve session state during temporary disconnection. Pause or clearly restrict actions when live input is unavailable. Keep application secrets and tokens on the server, out of logs and public assets.

Provide a clearly labeled **Demo mode** with seeded events for development and judging convenience. Demo mode must not appear to be a real Twitch connection. Actual end-to-end Twitch operation must be demonstrated before claiming it works.

## Scope priorities

### Required for the first release

- Branded responsive interface with the approved authentication entry.
- Working Twitch authentication and live chat participation.
- One complete observatory adventure with visible state changes.
- Role-based supported actions and bounded natural-language interpretation.
- Proposal validation, voting/support, and streamer approval.
- Control room, broadcast overlay, session persistence/reconnect, and recap.
- Clear loading, empty, error, and disconnected states.
- Runnable repository with setup instructions and a documented demo path.

### Add after the complete flow works

- Richer animations and sound with mute controls.
- More polished mobile companion participation.
- Additional authored encounters, replay playback, and shareable recaps.

### Defer

Unrestricted AI-generated worlds, arbitrary generated code, cross-channel raids, marketplaces, monetization, multiple campaigns, and complex competitive economies.

## Build and validation plan

1. **Foundation:** scaffold the project, install the logo/assets, establish design tokens and screen navigation.
2. **Integration spike:** prove authentication and receipt of a real chat message. Record exact setup requirements.
3. **Vertical slice:** make one viewer proposal produce one validated, approved, visible world change.
4. **Complete adventure:** connect the three encounters, resources, timer, outcome, and recap.
5. **Resilience:** verify duplicate handling, concurrent approvals, reconnects, persistence, and permission boundaries.
6. **Polish and submission:** check desktop/mobile layouts, deploy, record the demo, and verify all submission links.

Test game invariants rather than only checking interface snapshots. Cover insufficient resources, stale approvals, duplicate events, repeated votes, unauthorized controls, malformed model responses, and interrupted sessions. Manually test the main flow with a real Twitch channel and verify that the control room and overlay agree on state. Label any load tests as synthetic; do not claim production-scale capacity without measurement.

Reserve time before the deadline for a real stream test, video recording, and submission. Avoid adding features during the final submission buffer.

## Hackathon checklist

Competition: **Codex x TwitchCon Hackathon**

- Overview: https://twitchcon-codex.devpost.com/
- Rules: https://twitchcon-codex.devpost.com/rules
- Published deadline checked during planning: **November 2, 2026, 2:00 p.m. PST**, equivalent to **11:00 p.m. Africa/Lagos**. Recheck the official page before submission.
- Build new work during the competition period with OpenAI Codex and connect the interactive experience to Twitch.
- Supply a repository containing source, permitted assets, and complete setup/testing instructions. Follow the official access instructions for a private repository.
- Supply a public YouTube video under three minutes showing actual Twitch functionality and how Codex helped build the project.
- Supply the project description and the main Codex build session ID.
- Provide English submission materials or the required translations.
- Keep judging access available through the official judging period.
- Verify personal/team eligibility and required registrations separately. This document does not establish eligibility or register an entry.

Judging criteria are equally weighted: innovation, potential impact, implementation, and design. Prioritize a reliable demonstration of chat shaping the world, supported by an understandable interface and clear evidence of Codex use.

## Build handoff prompt

> Build Mythweave in this folder using README.md as the product brief and the linked Canva presentation as the visual reference. Start by inspecting the repository and applicable instructions, verifying dependencies, and planning one complete playable flow. Implement the landing page with one Continue with Twitch button, streamer dashboard, one observatory adventure, real Twitch chat integration, authoritative validated actions, streamer approval, broadcast overlay, and recap. Use clearly labeled demo events while credentials are unavailable and explain exactly what remains unverified. Match the logo, palette, and layouts without using screenshots as app pages. Make reasonable technical decisions, keep secrets server-side, test the important game and integration failure cases, and document how to run and deploy the result. Do not publish, register accounts, incur paid usage, or submit the hackathon entry without the necessary user authorization.
