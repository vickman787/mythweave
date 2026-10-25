import { useState } from "react";
import { Brand } from "./Brand";
import { SceneArt } from "./SceneArt";
type Overview = {
  user: { name: string; mode: "demo" | "live" } | null;
  chat: string;
  sessions: {
    id: string;
    status: string;
    mode: string;
    at: number;
    encounter: number;
  }[];
};
export function Dashboard({
  me,
  onNavigate,
  onReconnect,
  onSignOut,
}: {
  me: Overview;
  onNavigate: (p: string) => void;
  onReconnect: () => void;
  onSignOut: () => void;
}) {
  const [preview, setPreview] = useState(false),
    [section, setSection] = useState("Overview"),
    [overlayUrl, setOverlayUrl] = useState(""),
    [overlayNote, setOverlayNote] = useState("");
  if (!me.user) return null;
  const demo = me.user.mode === "demo",
    current = me.sessions.find((s) => ["active", "paused"].includes(s.status));
  const jump = (name: string, target: string) => {
    setSection(name);
    document.getElementById(target)?.scrollIntoView({ block: "start" });
  };
  const overlay = async () => {
    try {
      const s = current ?? me.sessions[0];
      if (!s) {
        setOverlayNote(
          "Launch your first adventure to create its read-only overlay.",
        );
        return;
      }
      const r = await fetch(`/api/games/${s.id}/overlay`);
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setOverlayUrl(d.url);
      try {
        await navigator.clipboard.writeText(d.url);
        setOverlayNote("Overlay URL copied.");
      } catch {
        setOverlayNote("Select and copy the URL below.");
      }
    } catch (e) {
      setOverlayNote((e as Error).message);
    }
  };
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Brand stacked onHome={() => onNavigate("/")} />
        <nav aria-label="Dashboard navigation">
          {[
            ["Overview", "⌂", "world-card"],
            ["Sessions", "▦", "chronicles"],
            ["Worlds", "♧", "world-card"],
            ["Stream overlay", "▱", "overlay-card"],
            ["Settings", "⚙", "readiness"],
          ].map(([name, icon, target]) => (
            <button
              key={name}
              className={section === name ? "selected" : ""}
              onClick={() => jump(name, target)}
            >
              <span aria-hidden="true">{icon}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className="sidebar-account">
          <span className="avatar">{me.user.name[0].toUpperCase()}</span>
          <div>
            <b>{demo ? "Storyteller" : me.user.name}</b>
            <small>
              {demo
                ? "◈ Demo mode"
                : me.chat === "ready"
                  ? "● Chat connected"
                  : "○ Chat offline"}
            </small>
          </div>
          <button className="text-button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <h1>Your next story starts here</h1>
            <p>Gather your community. Weave something unforgettable.</p>
          </div>
          <button onClick={() => onNavigate("/setup")}>
            Create session <span>＋</span>
          </button>
        </div>
        <div className="dashboard-content">
          <div className="dashboard-primary">
            <section id="world-card" className="world-card">
              <SceneArt kind="dashboard" />
              <div className="world-card-content">
                <h2>
                  The Shattered
                  <br />
                  Observatory
                </h2>
                <div className="rune-divider" />
                <p>
                  Restore the star bridge before
                  <br />
                  the last light fades.
                </p>
                <div className="world-tags">
                  <span>◷ 5–10 min</span>
                  <span>♧ 3 roles</span>
                  <span>♧ Cooperative</span>
                </div>
                <div className="button-pair">
                  <button
                    onClick={() =>
                      onNavigate(current ? "/session/" + current.id : "/setup")
                    }
                  >
                    {current ? "Resume adventure" : "Start adventure"}{" "}
                    <span>›</span>
                  </button>
                  <button
                    className="secondary gold-border"
                    onClick={() => setPreview(true)}
                  >
                    Preview world
                  </button>
                </div>
              </div>
            </section>
            <section id="chronicles" className="chronicles panel">
              <h2>
                <span>♧</span> Recent adventures
              </h2>
              {me.sessions.length ? (
                <div className="chronicles-table">
                  <div className="chronicles-labels">
                    <span>ADVENTURE</span>
                    <span>DATE</span>
                    <span>CHAPTER</span>
                    <span>RESULT</span>
                  </div>
                  {me.sessions.map((s) => (
                    <button
                      className="chronicle-row"
                      key={s.id}
                      onClick={() => onNavigate("/session/" + s.id)}
                    >
                      <span>
                        <span className="chronicle-thumb">✧</span>The Shattered
                        Observatory
                      </span>
                      <small>
                        {new Date(s.at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {s.mode === "demo" ? "Demo" : "Twitch"}
                      </small>
                      <small>{s.encounter + 1} / 3</small>
                      <span
                        className={
                          "result " + (s.status === "won" ? "success" : "")
                        }
                      >
                        {s.status === "won" ? "Success" : s.status}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="chronicles-empty">
                  <span>✧</span>
                  <h3>Your first story is still unwritten.</h3>
                  <p>
                    Start an adventure to collect your community’s choices here.
                  </p>
                </div>
              )}
            </section>
            <section className="first-world-tip">
              <span>✴</span>
              <div>
                <b>New here? Preview a world before going live.</b>
                <small>Explore how your community can shape the story.</small>
              </div>
              <button className="secondary" onClick={() => setPreview(true)}>
                Preview world ›
              </button>
            </section>
          </div>
          <aside className="dashboard-secondary">
            <section id="readiness" className="panel readiness">
              <h2>✧ Stream readiness</h2>
              {[
                [
                  "▣",
                  demo ? "Demo identity" : "Twitch identity",
                  demo ? "Simulated participants" : me.user.name,
                  true,
                ],
                [
                  "▱",
                  "Overlay access",
                  current
                    ? "Ready for your current adventure"
                    : "Created when you launch",
                  !!current,
                ],
                [
                  "▤",
                  demo ? "Demo chat simulator" : "Live chat",
                  demo ? "No real Twitch events" : me.chat,
                  demo || me.chat === "ready",
                ],
              ].map(([icon, title, detail, ready]) => (
                <div className="readiness-row" key={String(title)}>
                  <span>{icon}</span>
                  <div>
                    <b>{title}</b>
                    <small>{detail}</small>
                  </div>
                  <span className={ready ? "check" : "not-ready"}>
                    {ready ? "✓" : "○"}
                  </span>
                </div>
              ))}
              {demo ? (
                <p className="demo-disclosure">
                  ◈ DEMO MODE · Events are simulated.
                </p>
              ) : (
                <div className="button-pair">
                  <a className="button secondary" href="/auth/twitch?chat=1">
                    Authorize chat
                  </a>
                  <button className="quiet" onClick={onReconnect}>
                    Reconnect
                  </button>
                </div>
              )}
            </section>
            <section id="overlay-card" className="panel overlay-card">
              <h2>▱ Your stream overlay</h2>
              <div className="overlay-miniature">
                <Brand small />
                <SceneArt kind="landing" />
                <div className="overlay-mini-label">READ-ONLY WORLD VIEW</div>
              </div>
              <button className="wide secondary" onClick={overlay}>
                ♧ Copy overlay URL
              </button>
              {overlayUrl && (
                <>
                  <input
                    readOnly
                    aria-label="Overlay URL"
                    value={overlayUrl}
                    onFocus={(e) => e.target.select()}
                  />
                  <a
                    className="inline-link"
                    href={overlayUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview overlay ↗
                  </a>
                </>
              )}
              {overlayNote && (
                <p className="fine" role="status">
                  {overlayNote}
                </p>
              )}
            </section>
            <p className="dashboard-footnote">
              {demo
                ? "Clearly labeled demo · Real Twitch setup pending"
                : "Streamer approval stays on for every action."}
            </p>
          </aside>
        </div>
      </main>
      {preview && (
        <div className="preview-backdrop" onClick={() => setPreview(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="World preview"
            className="world-preview panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="preview-close quiet"
              autoFocus
              onClick={() => setPreview(false)}
              aria-label="Close world preview"
            >
              ×
            </button>
            <SceneArt kind="landing" />
            <div>
              <p className="eyebrow">THE SHATTERED OBSERVATORY</p>
              <h2>A world waiting to be rewoven.</h2>
              <p>
                Cross a broken bridge, weather an Aether storm, and restore the
                celestial lens. Every supported choice changes the cost of what
                comes next.
              </p>
              <button onClick={() => onNavigate("/setup")}>
                Prepare adventure ›
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
