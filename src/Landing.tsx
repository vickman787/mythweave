import { SceneArt } from "./SceneArt";
import { Icon } from "./Icons";
export function Landing({
  busy,
  onCreate,
  onDemo,
}: {
  busy: boolean;
  onCreate: () => void;
  onDemo: () => void;
}) {
  return (
    <main className="landing canva-landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="adventure-pill">✦ A new kind of shared adventure</p>
          <h1>
            Your chat.
            <br />
            Your choices<span>.</span>
            <br />
            Your world<span>.</span>
          </h1>
          <div className="hero-rule" />
          <p className="hero-description">
            Turn your community’s ideas into
            <br />a living adventure.
          </p>
          <div className="hero-actions">
            <button disabled={busy} onClick={onCreate}>
              ✦ Create a session
            </button>
            <button className="secondary" disabled={busy} onClick={onDemo}>
              ▶ Play demo
            </button>
          </div>
        </div>
        <div className="hero-world">
          <SceneArt />
          <div className="sample-action">
            <span className="action-glyph">
              <Icon name="branch" />
            </span>
            <div>
              <p>
                Weave the fallen
                <br />
                branches into a bridge
              </p>
              <span className="approved-label">✓ APPROVED</span>
              <b>✦ 3 Aether</b>
            </div>
            <small>DEMO PREVIEW</small>
          </div>
        </div>
      </section>
      <section className="promise-strip" id="how-it-works">
        {[
          [
            "▣",
            "01",
            "Connect your channel",
            "Link your Twitch channel and bring your community together.",
          ],
          [
            "♟",
            "02",
            "Gather your party",
            "Your chat becomes the party. Every voice shapes the story.",
          ],
          [
            "✴",
            "03",
            "Shape the world",
            "Propose, vote, and weave your choices into a living world.",
          ],
        ].map(([icon, n, title, description]) => (
          <div key={n}>
            <span className="promise-icon">
              <Icon
                name={n === "01" ? "twitch" : n === "02" ? "party" : "compass"}
              />
            </span>
            <div>
              <b>{n}</b>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
        ))}
      </section>
      <footer>
        <span className="footer-rule" />
        <span className="footer-wordmark">MYTHWEAVE</span>
        <span className="footer-preview">Demo available</span>
        <span className="footer-rule" />
      </footer>
      <section className="roles-section" id="worlds">
        <p className="eyebrow">THE SHATTERED OBSERVATORY</p>
        <h2>One world. Three ways to change it.</h2>
        <div className="role-grid">
          {[
            ["Weaver", "✧", "Build paths and restore relics"],
            ["Warden", "♜", "Protect the party"],
            ["Seeker", "✴", "Reveal hidden routes"],
          ].map(([name, icon, detail]) => (
            <article className="role-card" key={name}>
              <div className="role-icon">{icon}</div>
              <h3>{name}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <p className="fine" id="for-streamers">
          An eight-minute community adventure. Streamer approval is always on.
          Demo events are simulated; live play requires Twitch authorization.
        </p>
      </section>
    </main>
  );
}
