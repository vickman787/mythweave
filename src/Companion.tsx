import { useState } from "react";
import { actions, encounters, type Role } from "./game";
import { Brand } from "./Brand";
import { SceneArt } from "./SceneArt";
type View = {
  id: string;
  status: string;
  mode: string;
  encounter: number;
  aether: number;
  yourRole?: Role | null;
  proposals: {
    id: string;
    action: string;
    name: string;
    supporters: number;
    status: string;
  }[];
};
const roles = [
  {
    id: "weaver" as Role,
    icon: "✧",
    name: "Weaver",
    detail: "Build paths and restore relics",
  },
  {
    id: "warden" as Role,
    icon: "♜",
    name: "Warden",
    detail: "Protect the party",
  },
  {
    id: "seeker" as Role,
    icon: "✴",
    name: "Seeker",
    detail: "Reveal hidden routes",
  },
];
export function Companion({
  game,
  user,
  busy,
  notice,
  onCommand,
  onClearNotice,
}: {
  game: View;
  user: { mode: string } | null | undefined;
  busy: boolean;
  notice: string;
  onCommand: (s: string) => void;
  onClearNotice: () => void;
}) {
  const [selected, setSelected] = useState<Role>("weaver"),
    [idea, setIdea] = useState(""),
    [changing, setChanging] = useState(false);
  const role = roles.find((r) => r.id === game.yourRole),
    live = game.mode === "live",
    signed = user?.mode === "live",
    active = game.status === "active";
  if (!signed || !live)
    return (
      <section className="mobile-join">
        <Brand stacked />
        <h1>
          A world is
          <br />
          waiting for you
        </h1>
        <SceneArt kind="mobile" />
        <div className="mobile-session">
          <span>✴</span>
          <div>
            <b>The Shattered Observatory</b>
            <small>
              {live ? "Community adventure" : "Demo preview · simulated events"}
            </small>
          </div>
        </div>
        {live ? (
          <a
            className="button wide"
            href={
              "/auth/twitch?returnTo=" + encodeURIComponent("/join/" + game.id)
            }
          >
            ▣ Join session with Twitch
          </a>
        ) : (
          <a className="button wide" href={"/session/" + game.id}>
            Open demo control room
          </a>
        )}
        <p className="mobile-chat-hint">
          ▤ Or type <code>!join weaver</code> in Twitch chat
        </p>
        {!live && (
          <p className="fine">
            Demo commands are available to the demo owner in the control room.
            Live participation uses your Twitch identity.
          </p>
        )}
      </section>
    );
  if (!role || changing)
    return (
      <section className="mobile-roles">
        <h1>Choose your role</h1>
        <p>Every role weaves the story together.</p>
        <div className="mobile-role-list">
          {roles.map((r) => (
            <button
              key={r.id}
              className={`role-option ${r.id} ${selected === r.id ? "selected" : ""}`}
              onClick={() => setSelected(r.id)}
            >
              <span>{r.icon}</span>
              <div>
                <b>{r.name}</b>
                <small>{r.detail}</small>
              </div>
              <span className="role-check">{selected === r.id ? "✓" : ""}</span>
            </button>
          ))}
        </div>
        <button
          className="wide"
          disabled={busy || !active}
          onClick={() => {
            onCommand("!join " + selected);
            setChanging(false);
          }}
        >
          ♧ Join as {roles.find((r) => r.id === selected)?.name}
        </button>
        {!active && (
          <p className="fine">
            The adventure is {game.status}. Wait for the streamer.
          </p>
        )}
        {changing && (
          <button className="text-button" onClick={() => setChanging(false)}>
            Keep current role
          </button>
        )}
      </section>
    );
  return (
    <section className="mobile-play">
      <div className="mobile-role-heading">
        <span>{role.icon}</span>
        <div>
          <h1>You’re a {role.name}</h1>
          <small>The Shattered Observatory</small>
        </div>
        <button
          className="text-button"
          aria-label="Change role"
          onClick={() => {
            setSelected(role.id);
            setChanging(true);
          }}
        >
          ›
        </button>
      </div>
      <article className="mobile-objective">
        <p>OBJECTIVE</p>
        <h2>{encounters[game.encounter].objective}</h2>
      </article>
      <div className="mobile-aether">
        <span>✦ Aether</span>
        <b>{game.aether}</b>
      </div>
      <form
        className="mobile-idea"
        onSubmit={(e) => {
          e.preventDefault();
          onCommand(idea.startsWith("!") ? idea : "!weave " + idea);
          setIdea("");
        }}
      >
        <label htmlFor="viewer-idea">What should we create?</label>
        <input
          id="viewer-idea"
          placeholder="Share your idea…"
          value={idea}
          maxLength={240}
          required
          onChange={(e) => setIdea(e.target.value)}
        />
        <button className="wide" disabled={busy || !active || !idea.trim()}>
          {busy ? "Submitting…" : "♧ Submit idea"}
        </button>
        <div className="mobile-or">or</div>
        <code>▤ !weave your idea</code>
      </form>
      <p className="eyebrow">CURRENT VOTE</p>
      {game.proposals
        .filter((p) => p.status === "pending")
        .map((p) => (
          <article className="mobile-vote" key={p.id}>
            <span>✧</span>
            <div>
              <b>{actions.find((a) => a.id === p.action)?.title}</b>
              <small>Proposed by {p.name}</small>
              <small>♧ {p.supporters} support</small>
            </div>
            <button
              className="secondary"
              disabled={busy || !active}
              onClick={() => onCommand("!vote " + p.id)}
            >
              Vote
            </button>
          </article>
        ))}
      {!game.proposals.some((p) => p.status === "pending") && (
        <p className="fine">
          No proposals yet. Your idea could be the first spark.
        </p>
      )}
      {notice && (
        <div className="mobile-success" role="status">
          <span>✓</span>
          {notice}
          <button
            className="text-button"
            aria-label="Dismiss notification"
            onClick={onClearNotice}
          >
            ×
          </button>
        </div>
      )}
      {!active && (
        <p className="mobile-chat-hint">
          Adventure {game.status}. Participation is currently closed.
        </p>
      )}
    </section>
  );
}
