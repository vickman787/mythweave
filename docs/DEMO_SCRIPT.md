# Recording plan — target 2 minutes 40 seconds

This is a rehearsal plan, not evidence that a recording exists. Rehearse in **Demo mode** today. Record the final Twitch segment only after an actual viewer message has been received and applied. Keep simulation labels visible in any demo footage used.

## Before recording

- Run `npm run doctor`, `npm run build`, and `npm test`.
- Use a clean browser tab with normal-size text. Silence unrelated notifications and hide credentials, access URLs, private chats and personal account settings.
- Prepare the control room and the read-only overlay in separate tabs/windows. Have the Twitch channel open for the real-message segment when ready.
- Start with support threshold 1 for the short walkthrough. The proposer’s support counts; show another viewer supporting if demonstrating community consensus.
- Show a brief view of the main Codex build conversation, source changes and test results. Do not open `.env` on camera.
- Use narration with no background music unless its license permits this use.

## Shot and narration guide

| Time | Show | Narration / purpose |
| --- | --- | --- |
| 0:00–0:15 | Landing and observatory scene | “Chat has ideas. Mythweave lets those ideas leave a mark. Your community shares a fantasy adventure, and every accepted choice changes what happens next.” |
| 0:15–0:30 | Setup: roles, support threshold, approval on | “Viewers become Weavers, Wardens or Seekers. Ideas gather support, and the streamer has the final say.” |
| 0:30–1:05 | Real Twitch `!join weaver`, then `!weave fallen branches into a bridge`; show P1 and approve | “A viewer proposes a branch bridge. Mythweave checks the role, action and cost. Three Aether, one approval—and the crossing appears.” Show the actual Twitch message and resulting queue entry in the final recording. |
| 1:05–1:20 | Overlay agrees with control room; reveal stronger storm | “The broadcast sees the same world. Taking the exposed bridge makes the next storm more expensive.” |
| 1:20–1:45 | Warden’s storm ward, then Weaver’s lens restoration | “The Warden turns the storm into captured energy. That choice lowers the final restoration cost to one Aether.” Cut pauses between commands if needed; preserve the actual action order. |
| 1:45–2:05 | Lit beacon and attributed recap | “The observatory is restored. The recap remembers who contributed and how those decisions shaped the outcome.” |
| 2:05–2:30 | Main Codex build chat, authored code and tests | “Codex helped build the interface, game rules, Twitch pipeline and recovery checks. The server validates every action, stores accepted events, and synchronizes the overlay.” |
| 2:30–2:40 | Return to beacon / product name | “Mythweave. Chat casts. Worlds change.” |

## Exact rehearsal commands

In Demo mode, choose Luna for the Weaver actions and Orin for the Warden action. Commands work through the simulator; do not present them as Twitch messages.

```text
Luna: !join weaver
Luna: !weave fallen branches into a bridge
Streamer: approve P1
Orin: !join warden
Orin: !weave shield the party from the storm
Streamer: approve P2
Luna: !weave restore the celestial lens
Streamer: approve P3
```

Expected Aether: **10 → 7 → 3 → 2**. Expected scenes: branch bridge → storm ward → lit beacon. If a different proposal was submitted first, use the IDs actually displayed in the queue.

For voting rehearsal, use threshold 2: after P1, join Orin to any role and send `!vote P1`, then approve. A second vote from Orin must not increase support.

## Final recording checks

- Entire video is shorter than three minutes and contains readable, actual Twitch functionality.
- Simulation, if included, stays labeled; no mock is described as a successful live integration.
- Codex use is visible, with the main session ID retained in the submission.
- No credentials or overlay capability URLs are readable on camera.
- Upload and final submission remain user-controlled steps. Check the uploaded video’s public visibility and playback before entering its link.
