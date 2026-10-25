# Mythweave submission draft

Status: prepared for review, not submitted. A complete local real-Twitch adventure was verified on October 25, 2026. Do not describe demo footage as live chat.

## Name and tagline

**Mythweave â€” Chat casts. Worlds change.**

## Short description

A cooperative fantasy adventure where a Twitch community proposes solutions, supports ideas, and watches streamer-approved decisions reshape a shared world.

## Inspiration

Livestream chat is full of ideas, but those ideas rarely leave a lasting mark on the game. Mythweave gives a viewer a visible contribution: a bridge they imagined becomes the route the party takes, and that route changes what comes next.

## What it does

The Shattered Observatory is an eight-minute adventure with three connected encounters. Viewers choose Weaver, Warden, or Seeker; propose an idea; and support a proposal. The streamer reviews the interpreted action and its Aether cost before approving it. A woven bridge exposes the party to a stronger storm. Capturing that storm with a ward lowers the cost of restoring the final celestial lens.

The app includes a streamer dashboard, setup screen, control room, read-only OBS overlay, companion participation page, and an attributed recap. Demo mode provides three clearly labeled simulated participants and the same server-owned game rules.

## How it was built and how Codex helped

Codex built the React/TypeScript interface using the supplied Canva branding and illustration crops, SVG world-state effects, Node server, SQLite persistence, authoritative action pipeline, Twitch OAuth/EventSub integration code, and optional bounded model interpreter from the product brief. Codex also wrote and ran invariant and HTTP tests, exercised the full demo in the browser, and checked a mobile layout. Source, setup instructions, and milestone notes are included.

Main build session ID: provided separately in the Devpost submission.

## Technical choices

One Node 24 process owns state and stores checkpoints in SQLite. Server-sent events synchronize the control room and overlay. Duplicate event IDs, repeated votes, stale approvals, role changes, and insufficient resources are checked server-side. Accepted actions commit in a transaction. Overlay links are read-only and revocable. Tokens remain encrypted on the server.

Catalogue matching works without a model provider. An optional OpenAI classifier can return only an authored action ID; it cannot spend resources, approve actions, or create new rules. It is disabled by default.

## Evidence and limitations to include honestly

- Verified: complete local demo, alternate action paths, production build, automated invariants/HTTP tests, desktop and mobile inspection.
- Implemented and fixture-tested: Twitch EventSub ingestion and bounded model response handling.
- Verified on October 25, 2026: vickman24 completed a real Twitch adventure with three approved decisions and 2 Aether remaining. Screenshot: `live-victory.jpg`. Separate viewer, bot reply delivery, OBS and live recovery checks remain outstanding.
- Original Canva logo, emblem favicon and illustration crops are installed. Whole mockup screenshots are not used as app screens; controls, text, resources and approval states are live HTML.
- Pending: hosting, actual provider testing, recording and public YouTube upload. No production-scale capacity claim is made.

## Submission fields still needing final values

| Field | Current status |
| --- | --- |
| Source repository URL | https://github.com/vickman787/mythweave |
| Public YouTube URL | Not recorded/uploaded |
| Hosting URL, if supplied | Not deployed |
| Real Twitch channel and test date | vickman24 Â· October 25, 2026 Â· complete local live adventure |
| Team details and eligibility | User to confirm |

## Official requirements checkpoint

Checked October 25, 2026 against the [official rules](https://twitchcon-codex.devpost.com/rules):

- Deadline: November 2, 2026, 2 p.m. Pacific Standard Time; 11 p.m. Africa/Lagos.
- Supply a working Twitch-connected project built with Codex during the competition period.
- Supply an accessible source repository, project description, and main Codex session ID.
- Provide a publicly visible YouTube video under three minutes, showing functioning Twitch interaction and how Codex helped build it.
- Supply English materials or translations, use permitted assets, and maintain judging access through the judging period.
- Registration, eligibility, repository access and final submission need the entrantâ€™s confirmation. This draft does not register or submit an entry.
