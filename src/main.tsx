import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  actions,
  encounters,
  cost,
  type Game,
  type Role,
  type Proposal,
} from "./game";
import { World } from "./ReferenceWorld";
import { Brand } from "./Brand";
import { Landing } from "./Landing";
import { Dashboard } from "./Dashboard";
import { SceneArt } from "./SceneArt";
import { Recap } from "./Recap";
import { Companion } from "./Companion";
import { Icon } from "./Icons";
import "./style.css";
import "./reference.css";
type PublicGame = Omit<
  Game,
  "participants" | "proposals" | "owner" | "seen" | "lastProposal"
> & {
  yourRole?: Role | null;
  participants: Record<Role, number>;
  proposals: (Omit<Proposal, "supporters" | "proposer"> & {
    supporters: number;
  })[];
};
type Me = {
  user: null | { id: string; name: string; mode: "demo" | "live" };
  configured: boolean;
  chat: string;
  sessions: {
    id: string;
    status: string;
    mode: string;
    at: number;
    encounter: number;
  }[];
};
async function api(path: string, body?: unknown) {
  const r = await fetch("/api" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error ?? "Request failed.");
  return data;
}
const nav = (path: string) => {
  history.pushState({}, "", path);
  dispatchEvent(new PopStateEvent("popstate"));
};
function App() {
  const [path, setPath] = useState(location.pathname),
    [me, setMe] = useState<Me | null>(null),
    [error, setError] = useState(
      new URLSearchParams(location.search).get("error") ?? "",
    ),
    [busy, setBusy] = useState(false),
    [g, setGame] = useState<PublicGame | null>(null),
    [online, setOnline] = useState(true),
    [threshold, setThreshold] = useState(1),
    [overlay, setOverlay] = useState(""),
    [notice, setNotice] = useState(""),
    [actor, setActor] = useState("Luna"),
    [text, setText] = useState(""),
    [confirmEnd, setConfirmEnd] = useState(false);
  const id = path.split("/")[2],
    isOverlay = path.startsWith("/overlay/"),
    isCompanion = path.startsWith("/join/"),
    inGame = path.startsWith("/session/") || isOverlay || isCompanion;
  const refresh = () =>
    api("/me")
      .then(setMe)
      .catch((e) => setError(e.message));
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [
    path,
    g?.status === "won" || g?.status === "lost" || g?.status === "ended",
  ]);
  useEffect(() => {
    refresh();
    const f = () => {
      setPath(location.pathname);
      setError("");
      setGame(null);
      setOverlay("");
      setNotice("");
      setOnline(true);
    };
    addEventListener("popstate", f);
    return () => removeEventListener("popstate", f);
  }, []);
  useEffect(() => {
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!inGame || !id) return;
    let cancelled = false;
    const suffix = isOverlay ? location.search : "";
    api(isCompanion ? `/companion/${id}` : `/games/${id}${suffix}`)
      .then((data) => {
        if (!cancelled) setGame(data);
      })
      .catch((e) => setError(e.message));
    if (isCompanion) {
      const timer = setInterval(
        () =>
          api(`/companion/${id}`)
            .then((data) => {
              if (!cancelled) setGame(data);
            })
            .catch((e) => {
              if (!cancelled) setError(e.message);
            }),
        2000,
      );
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }
    const stream = new EventSource(`/api/games/${id}/events${suffix}`);
    stream.onmessage = (e) => {
      if (cancelled) return;
      setOnline(true);
      setGame(JSON.parse(e.data));
    };
    stream.onerror = () => {
      if (cancelled) return;
      setOnline(false);
      // Check authorization again: a revoked capability must clear the last scene.
      void fetch(`/api/games/${id}${suffix}`)
        .then(async (response) => {
          if (cancelled || response.ok || response.status >= 500) return;
          const detail = await response.json().catch(() => ({}));
          if (cancelled) return;
          stream.close();
          setGame(null);
          setError(
            isOverlay
              ? "Overlay access is no longer available. Ask the streamer for a new link."
              : (detail.error ?? "Session access expired. Sign in again."),
          );
        })
        .catch(() => {});
    };
    return () => {
      cancelled = true;
      stream.close();
    };
  }, [path]);
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const demo = () =>
    run(async () => {
      await api("/demo", {});
      await refresh();
      nav("/dashboard");
    });
  const control = (action: string, proposal?: string) =>
    run(async () => {
      await api(`/games/${id}/control`, {
        action,
        proposal,
        version: g?.version,
      });
      setConfirmEnd(false);
      setNotice("");
      await refresh();
    });
  const send = (value = text) =>
    run(async () => {
      const r = await api(`/games/${id}/command`, {
        actor,
        text: value,
        eventId: crypto.randomUUID(),
      });
      setNotice(r.reply);
      setText("");
      if (isCompanion) setGame(await api(`/companion/${id}`));
    });
  const getOverlay = () =>
    run(async () => {
      const r = await api(`/games/${id}/overlay`);
      setOverlay(r.url);
    });
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Select and copy the URL below.");
    }
  };
  const badge = (
    <span className={"badge " + (me?.user?.mode === "demo" ? "gold" : "")}>
      {me?.user?.mode === "demo"
        ? "◈ DEMO MODE"
        : `● CHAT ${me?.chat?.toUpperCase() ?? "OFFLINE"}`}
    </span>
  );
  const errorBox = error && (
    <div className="alert request-error" role="alert">
      <span>{error}</span>
      <button
        className="text-button"
        onClick={() => setError("")}
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
  if (isOverlay || isCompanion)
    return (
      <div className={isOverlay ? "broadcast" : "companion"}>
        <header>
          <Brand small={!isCompanion} />
          {g && (
            <span className="badge gold">
              {g.mode === "demo" ? "DEMO MODE" : "COMMUNITY ADVENTURE"}
            </span>
          )}
        </header>
        {errorBox}
        {!g ? (
          <div className="loading">
            {error ? "Adventure unavailable." : "Opening the world…"}
          </div>
        ) : (
          <>
            {!online && !isCompanion && (
              <div className="alert">Connection interrupted. Reconnecting…</div>
            )}
            {isOverlay && <Stage g={g} />}
            {isOverlay && (
              <aside className="panel overlay-feedback" aria-live="polite">
                <p className="eyebrow">
                  {g.proposals.some((p) => p.status === "pending")
                    ? "A THREAD IS GATHERING SUPPORT"
                    : "THE WORLD REMEMBERS"}
                </p>
                {g.proposals
                  .filter((p) => p.status === "pending")
                  .map((p) => (
                    <p key={p.id}>
                      {actions.find((a) => a.id === p.action)?.title} ·{" "}
                      {p.supporters}/{g.threshold} support ·{" "}
                      <code>!vote {p.id}</code> · streamer approval required
                    </p>
                  ))}
                {!g.proposals.some((p) => p.status === "pending") && (
                  <p>
                    {g.events.at(-1)?.consequence ??
                      "Join a role and propose an idea to change this world."}
                  </p>
                )}
              </aside>
            )}
            {isOverlay ? (
              <div className="overlay-instructions">
                Join the adventure in Twitch chat <code>!join {actions.find((a) => a.encounter === g.encounter)?.role ?? "weaver"}</code>
                <code>
                  !weave{" "}
                  {actions.find((a) => a.encounter === g.encounter)?.idea}
                </code>
              </div>
            ) : (
              <Companion
                game={g}
                user={me?.user}
                busy={busy}
                notice={notice}
                onCommand={send}
                onClearNotice={() => setNotice("")}
              />
            )}
          </>
        )}
      </div>
    );
  return (
    <>
      <header
        className={`main-header ${path === "/dashboard" ? "dashboard-hidden" : ""} ${inGame ? "game-header" : ""}`}
      >
        <Brand onHome={() => nav("/")} />
        {path === "/" && (
          <nav className="landing-navigation" aria-label="Explore Mythweave">
            <a href="#how-it-works">How it works</a>
            <a href="#worlds">Worlds</a>
            <a href="#for-streamers">For streamers</a>
          </nav>
        )}
        {inGame && g && (
          <div className="game-header-identity">
            <h1>The Shattered Observatory</h1>
            {badge}
            <span>
              <Icon name="party" />
              {Object.values(g.participants).reduce((a, b) => a + b, 0)}{" "}
              participants
            </span>
          </div>
        )}
        <nav aria-label="Main navigation">
          {inGame && g ? (
            <>
              {["active", "paused"].includes(g.status) ? (
                <>
                  <button
                    className="quiet"
                    disabled={busy}
                    onClick={() =>
                      control(g.status === "active" ? "pause" : "resume")
                    }
                  >
                    {g.status === "active" ? "Ⅱ Pause" : "▷ Resume"}
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setConfirmEnd(true)}
                  >
                    End
                  </button>
                </>
              ) : (
                <button
                  className="text-button"
                  onClick={() => {
                    refresh();
                    nav("/dashboard");
                  }}
                >
                  ← Back to dashboard
                </button>
              )}
            </>
          ) : me?.user ? (
            <>
              <button
                className="text-button"
                onClick={() => {
                  nav("/dashboard");
                  refresh();
                }}
              >
                Your dashboard
              </button>
              <span className="account">{me.user.name}</span>
              <button
                className="quiet"
                onClick={() =>
                  run(async () => {
                    await api("/logout", {});
                    await refresh();
                    nav("/");
                  })
                }
              >
                Sign out
              </button>
            </>
          ) : (
            <a className="button twitch" href="/auth/twitch">
              <Icon name="twitch" /> Continue with Twitch
            </a>
          )}
        </nav>
      </header>
      {errorBox}
      {notice && (
        <div className="toast" role="status" onClick={() => setNotice("")}>
          {notice}
          <button
            aria-label="Dismiss notification"
            className="text-button"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
      {path === "/" ? (
        <Landing
          busy={busy}
          onCreate={() =>
            me?.user ? nav("/setup") : location.assign("/auth/twitch")
          }
          onDemo={demo}
        />
      ) : !me ? (
        <main className="loading">Gathering your story…</main>
      ) : !me.user ? (
        <main className="center panel">
          <h1>Your story starts here.</h1>
          <p>Sign in with Twitch or explore the complete demo.</p>
          <a className="button" href="/auth/twitch">
            Continue with Twitch
          </a>
          <button className="secondary" onClick={demo}>
            Enter Demo mode
          </button>
        </main>
      ) : path === "/dashboard" ? (
        <Dashboard
          me={me}
          onNavigate={nav}
          onReconnect={() =>
            run(async () => {
              await api("/chat/reconnect", {});
              await refresh();
            })
          }
          onSignOut={() =>
            run(async () => {
              await api("/logout", {});
              await refresh();
              nav("/");
            })
          }
        />
      ) : path === "/setup" ? (
        <main className="workspace setup">
          <button className="text-button" onClick={() => nav("/dashboard")}>
            ← Dashboard
          </button>
          <p className="eyebrow">BEFORE THE FIRST SPARK</p>
          <h1>Set the stage.</h1>
          <p>
            One adventure. Three roles. A story only your community can tell.
          </p>
          <div className="setup-grid">
            <section className="panel">
              <World />
              <h2>The Shattered Observatory</h2>
              <p>
                Eight minutes to cross the broken bridge, survive the storm and
                awaken the celestial heart.
              </p>
              <ol className="encounter-list">
                {encounters.map((e) => (
                  <li key={e.name}>{e.name}</li>
                ))}
              </ol>
            </section>
            <section className="panel">
              <h2>Your adventure settings</h2>
              <label>
                Support needed per proposal
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                >
                  <option value="1">
                    1 · solo testing / small communities
                  </option>
                  <option value="2">2 · community consensus</option>
                  <option value="3">3 · larger parties</option>
                </select>
              </label>
              <div className="status-line">
                <span>Streamer approval</span>
                <b>Always on ✓</b>
              </div>
              <div className="status-line">
                <span>Starting Aether</span>
                <b>10 ✦</b>
              </div>
              <div className="status-line">
                <span>Chat readiness</span>
                <b>{me.user.mode === "demo" ? "Demo simulator" : me.chat}</b>
              </div>
              <p className="fine">
                All viewers can change roles using !join. Proposals require the
                matching role. One vote per identity, including the proposer’s
                initial support.
              </p>
              <p className="fine">
                The OBS URL is created with the session. Preview and copy it
                from the control room. It is read-only and revocable.
              </p>
              <button
                className="wide"
                disabled={
                  busy || (me.user.mode === "live" && me.chat !== "ready")
                }
                onClick={() =>
                  run(async () => {
                    const r = await api("/games", { threshold });
                    await refresh();
                    nav("/session/" + r.id);
                  })
                }
              >
                Launch {me.user.mode === "demo" ? "demo" : "live"} adventure ↗
              </button>
              {me.user.mode === "live" && me.chat !== "ready" && (
                <a className="inline-link" href="/auth/twitch?chat=1">
                  Connect chat to launch
                </a>
              )}
            </section>
          </div>
        </main>
      ) : inGame ? (
        <main
          className={`workspace control-room ${g && ["won", "lost", "ended"].includes(g.status) ? "recap-room" : ""}`}
        >
          {!g ? (
            <div className="loading">
              {error ? "Unable to open adventure." : "Opening your adventure…"}
            </div>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">THE SHATTERED OBSERVATORY</p>
                  <h1>
                    {["won", "lost", "ended"].includes(g.status)
                      ? "A story worth remembering."
                      : "Weave the next chapter."}
                  </h1>
                </div>
                <div className="control-buttons">
                  {badge}
                  {g.status === "active" && (
                    <button
                      className="quiet"
                      disabled={busy}
                      onClick={() => control("pause")}
                    >
                      Ⅱ Pause
                    </button>
                  )}
                  {g.status === "paused" && (
                    <button disabled={busy} onClick={() => control("resume")}>
                      ▷ Resume
                    </button>
                  )}
                  {["active", "paused"].includes(g.status) && (
                    <button
                      className="quiet"
                      onClick={() => setConfirmEnd(true)}
                    >
                      End session
                    </button>
                  )}
                </div>
              </div>
              {!online && (
                <div className="alert">
                  State connection interrupted. Reconnecting… Controls are
                  temporarily disabled.
                </div>
              )}
              {g.status === "paused" && (
                <div className="alert">
                  {g.pauseReason ?? "Adventure paused."}
                </div>
              )}
              {confirmEnd && (
                <div className="alert">
                  <span>End this adventure and keep the recap?</span>
                  <button onClick={() => control("end")} disabled={busy}>
                    End adventure
                  </button>
                  <button
                    className="quiet"
                    onClick={() => setConfirmEnd(false)}
                  >
                    Keep playing
                  </button>
                </div>
              )}
              {["won", "lost", "ended"].includes(g.status) ? (
                <Recap
                  game={g}
                  onReplay={() => {
                    refresh();
                    nav("/setup");
                  }}
                  onDashboard={() => {
                    refresh();
                    nav("/dashboard");
                  }}
                />
              ) : (
                <>
                  <div className="game-grid">
                    <section>
                      <Stage g={g} />
                      <div className="party-strip">
                        {(["weaver", "warden", "seeker"] as Role[]).map(
                          (r, i) => (
                            <div key={r}>
                              <span>
                                <Icon
                                  name={
                                    r === "weaver"
                                      ? "weaver"
                                      : r === "warden"
                                        ? "warden"
                                        : "compass"
                                  }
                                />
                              </span>
                              <b>{g.participants[r]}</b>
                              <small>
                                {r.toUpperCase()}
                                {g.participants[r] !== 1 ? "S" : ""}
                              </small>
                            </div>
                          ),
                        )}
                      </div>
                      <div className="panel consequences">
                        <p className="eyebrow">♜ STREAMER APPROVAL IS ON</p>
                        <p>
                          {g.events.at(-1)?.consequence ??
                            "Every great story begins with an idea. Ask your community how to cross the broken bridge."}
                        </p>
                      </div>
                    </section>
                    <aside className="panel proposal-panel">
                      <div className="section-heading">
                        <h2>Community proposals</h2>
                        <span className="count">
                          {
                            g.proposals.filter((p) => p.status === "pending")
                              .length
                          }
                        </span>
                      </div>
                      <p className="muted">
                        Community ideas, waiting to become real.
                      </p>
                      {g.proposals.filter((p) => p.status === "pending")
                        .length === 0 && (
                        <div className="queue-empty">
                          <span>✧</span>
                          <h3>A little spark is all it takes.</h3>
                          <p>
                            Propose a supported action in Twitch chat or the
                            demo simulator below.
                          </p>
                        </div>
                      )}
                      {g.proposals
                        .filter((p) => p.status === "pending")
                        .map((p) => (
                          <article className="proposal" key={p.id}>
                            <div className="section-heading">
                              <span className="badge">
                                {p.id} ·{" "}
                                {p.supporters >= g.threshold
                                  ? "AWAITING APPROVAL"
                                  : "GATHERING SUPPORT"}
                              </span>
                              <span className="gold-text">{p.cost} ✦</span>
                            </div>
                            <div className="proposal-author">
                              <span className="proposal-avatar">
                                {p.name[0]?.toUpperCase()}
                              </span>
                              <b>{p.name}</b>
                            </div>
                            <h3>
                              {actions.find((a) => a.id === p.action)?.title}
                            </h3>
                            <p className="proposal-readiness">
                              {p.supporters >= g.threshold
                                ? "● Ready for approval"
                                : "◷ Gathering support"}
                            </p>
                            <small>
                              {p.interpretation === "model"
                                ? "Model"
                                : "Catalogue"}{" "}
                              interpretation · role and cost validated
                            </small>
                            <div className="proposal-footer">
                              <span>
                                ♧ {p.supporters}/{g.threshold} support
                              </span>
                              <code>!vote {p.id}</code>
                            </div>
                            <div className="button-pair">
                              <button
                                disabled={
                                  busy ||
                                  !online ||
                                  g.status !== "active" ||
                                  p.supporters < g.threshold
                                }
                                onClick={() => control("approve", p.id)}
                              >
                                ✓ Approve
                              </button>
                              <button
                                className="quiet"
                                disabled={busy || !online}
                                onClick={() => control("reject", p.id)}
                              >
                                × Reject
                              </button>
                            </div>
                          </article>
                        ))}
                      {g.events.length > 0 && (
                        <details className="accepted-history">
                          <summary>
                            History · {g.events.length} accepted
                          </summary>
                          {g.events.map((e) => (
                            <article key={e.id}>
                              <span>✓</span>
                              <div>
                                <b>
                                  {
                                    actions.find((a) => a.id === e.action)
                                      ?.title
                                  }
                                </b>
                                <small>
                                  Approved by streamer · {e.contributor}
                                </small>
                              </div>
                              <time>
                                {new Date(e.at).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </time>
                            </article>
                          ))}
                        </details>
                      )}
                      <div className="supported">
                        <p className="eyebrow">POSSIBLE THREADS</p>
                        {actions
                          .filter((a) => a.encounter === g.encounter)
                          .map((a) => (
                            <div key={a.id}>
                              <b>{a.title}</b>
                              <small>
                                {a.role} · {cost(g, a)} Aether · “{a.idea}”
                              </small>
                            </div>
                          ))}
                      </div>
                      {g.proposals.some(
                        (p) => p.status === "rejected" || p.status === "stale",
                      ) && (
                        <details>
                          <summary>Previous proposals</summary>
                          {g.proposals
                            .filter(
                              (p) =>
                                p.status === "rejected" || p.status === "stale",
                            )
                            .map((p) => (
                              <p key={p.id}>
                                {p.id} · {p.status}: {p.reason}
                              </p>
                            ))}
                        </details>
                      )}
                    </aside>
                  </div>
                  <div className="bottom-grid">
                    <section className="panel">
                      <p className="eyebrow">
                        {g.mode === "demo"
                          ? "DEMO CHAT SIMULATOR · SEEDED IDENTITIES"
                          : "YOUR COMMUNITY’S SPELLBOOK"}
                      </p>
                      <h2>
                        {g.mode === "demo"
                          ? "Try a little magic."
                          : "Give chat the first spark."}
                      </h2>
                      {g.mode === "demo" ? (
                        <>
                          <p>
                            Simulate a viewer command, gather support, then
                            approve it in the queue.
                          </p>
                          <label>
                            Simulated participant
                            <select
                              value={actor}
                              onChange={(e) => setActor(e.target.value)}
                            >
                              {["Luna", "Orin", "Sable"].map((a) => (
                                <option key={a}>{a}</option>
                              ))}
                            </select>
                          </label>
                          <div className="command-chips">
                            {(["weaver", "warden", "seeker"] as Role[]).map(
                              (r) => (
                                <button
                                  className="quiet"
                                  disabled={busy}
                                  key={r}
                                  onClick={() => send("!join " + r)}
                                >
                                  !join {r}
                                </button>
                              ),
                            )}
                          </div>
                          <CommandForm {...{ text, setText, busy, send }} />
                          <div className="command-chips">
                            {actions
                              .filter((a) => a.encounter === g.encounter)
                              .map((a) => (
                                <button
                                  className="text-button"
                                  disabled={busy}
                                  key={a.id}
                                  onClick={() => setText("!weave " + a.idea)}
                                >
                                  {a.title} ↗
                                </button>
                              ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <p>Send these commands in your Twitch channel:</p>
                          <code className="block-code">
                            !join {actions.find((a) => a.encounter === g.encounter)?.role ?? "weaver"}
                            <br />
                            !weave{" "}
                            {
                              actions.find((a) => a.encounter === g.encounter)
                                ?.idea
                            }
                            <br />
                            !vote {g.proposals.find((p) => p.status === "pending")?.id ?? "<proposal ID>"}
                            <br />
                            !help
                          </code>
                          <a
                            className="inline-link"
                            href={"/join/" + g.id}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open companion page ↗
                          </a>
                        </>
                      )}
                    </section>
                    <section className="panel">
                      <p className="eyebrow">MADE FOR YOUR STREAM</p>
                      <h2>A window into your world.</h2>
                      <p>
                        Add the read-only overlay to OBS as a browser source.
                        Suggested size: 1920 × 1080. Keep the access URL
                        private.
                      </p>
                      <div className="button-pair">
                        <button
                          className="secondary"
                          onClick={getOverlay}
                          disabled={busy}
                        >
                          Get overlay URL
                        </button>
                        <button
                          className="quiet"
                          onClick={() =>
                            run(async () => {
                              await api(`/games/${id}/overlay`, {});
                              setOverlay("");
                              setNotice(
                                "Previous overlay links revoked. Get a new URL for OBS.",
                              );
                            })
                          }
                        >
                          Revoke overlay links
                        </button>
                      </div>
                      {overlay && (
                        <>
                          <input
                            aria-label="OBS browser source URL"
                            readOnly
                            value={overlay}
                            onFocus={(e) => e.target.select()}
                          />
                          <div className="button-pair">
                            <button
                              className="quiet"
                              onClick={() => copy(overlay)}
                            >
                              Copy URL
                            </button>
                            <a
                              className="button quiet"
                              href={overlay}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Preview ↗
                            </a>
                          </div>
                        </>
                      )}
                    </section>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      ) : (
        <main className="center">
          <h1>This path is still unwritten.</h1>
          <button onClick={() => nav("/dashboard")}>Return to dashboard</button>
        </main>
      )}
    </>
  );
}
function Stage({ g }: { g: PublicGame }) {
  const encounter = encounters[g.encounter];
  return (
    <section className="stage">
      <World
        encounter={g.encounter}
        bridge={g.events.some((e) => e.action === "bridge")}
        stones={g.events.some((e) => e.action === "path")}
        shelter={g.events.some((e) => e.action === "shelter")}
        ward={g.events.some((e) => e.action === "shield")}
        restored={g.status === "won"}
      />
      <div className="stage-top">
        <span className="badge">
          {g.status === "active"
            ? "● ADVENTURE IN PROGRESS"
            : g.status.toUpperCase()}
        </span>
        <div className="stage-stats">
          <span>
            ✦ <b>{g.aether}</b> AETHER
          </span>
          <span>
            ◷ {Math.floor(g.remaining / 60)}:
            {String(Math.floor(g.remaining % 60)).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="stage-caption">
        <p className="eyebrow">
          CHAPTER {String(g.encounter + 1).padStart(2, "0")} OF 03
        </p>
        <h2>
          {g.status === "won" ? "The Observatory Awakened" : encounter.name}
        </h2>
        <p>
          {g.status === "won"
            ? "Your community lit a beacon in the dark."
            : encounter.objective}
        </p>
        <div className="progress-steps">
          {encounters.map((e, i) => (
            <span
              className={g.encounter >= i ? "complete" : ""}
              key={e.name}
              title={e.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
function CommandForm({
  text,
  setText,
  busy,
  send,
}: {
  text: string;
  setText: (s: string) => void;
  busy: boolean;
  send: (s?: string) => void;
}) {
  return (
    <form
      className="command-form"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <label className="sr-only" htmlFor="command">
        Chat command
      </label>
      <input
        id="command"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="!weave fallen branches into a bridge"
        maxLength={280}
        required
      />
      <button disabled={busy || !text.trim()} type="submit">
        {busy ? "Sending…" : "Send ↗"}
      </button>
    </form>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
