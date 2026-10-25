import { actions, type GameEvent, type Role } from "./game";
import { SceneArt } from "./SceneArt";
export function Recap({
  game,
  onReplay,
  onDashboard,
}: {
  game: {
    status: string;
    events: GameEvent[];
    aether: number;
    participants: Record<Role, number>;
  };
  onReplay: () => void;
  onDashboard: () => void;
}) {
  const won = game.status === "won";
  return (
    <section className="canva-recap">
      <div className="recap-world">
        <div className="recap-title">
          <h1>
            {won
              ? "You rewove the stars"
              : game.status === "lost"
                ? "The stars will wait"
                : "Until the next chapter"}
          </h1>
          <p>
            The Shattered Observatory ·{" "}
            {won
              ? "Adventure complete"
              : game.status === "lost"
                ? "Time ran out"
                : "Adventure ended"}
          </p>
        </div>
        <SceneArt kind={won ? "recap" : "dashboard"} />
      </div>
      <div className="recap-decisions">
        <h2>The choices that shaped your world</h2>
        <div className="ornament-rule" />
        <div className="decision-timeline">
          {game.events.length === 0 ? (
            <p>
              No actions were accepted. A new adventure is another chance to
              weave your story.
            </p>
          ) : (
            game.events.map((e) => {
              const a = actions.find((a) => a.id === e.action);
              return (
                <article key={e.id}>
                  <span className={`decision-icon ${a?.role}`}>
                    {a?.role === "warden"
                      ? "♜"
                      : a?.role === "seeker"
                        ? "✴"
                        : "✧"}
                  </span>
                  <div>
                    <h3>{a?.title}</h3>
                    <p>{e.consequence}</p>
                    <small>
                      By {e.contributor} · {e.supporters}{" "}
                      {e.supporters === 1 ? "supporter" : "supporters"} ·{" "}
                      {e.cost} Aether
                    </small>
                  </div>
                </article>
              );
            })
          )}
        </div>
        <div className="ornament-rule" />
        <div className="contributor-cards">
          {(["weaver", "warden", "seeker"] as Role[]).map((role) => {
            const names = [
              ...new Set(
                game.events
                  .filter(
                    (e) =>
                      actions.find((a) => a.id === e.action)?.role === role,
                  )
                  .map((e) => e.contributor),
              ),
            ];
            return (
              <section className={role} key={role}>
                <h3>
                  {role === "warden" ? "♜" : role === "seeker" ? "✴" : "✧"}{" "}
                  {role[0].toUpperCase() + role.slice(1)}s
                </h3>
                <p>
                  {names.length} {names.length === 1 ? "contributor" : "contributors"}
                </p>
                {names.length ? (
                  names.map((name) => <small key={name}>{name}</small>)
                ) : (
                  <small>No accepted actions</small>
                )}
              </section>
            );
          })}
        </div>
        <div className="recap-action-row">
          <button onClick={onReplay}>↻ Play again</button>
          <button className="secondary" onClick={onDashboard}>
            ← Your dashboard
          </button>
        </div>
        <p className="recap-footnote">
          {game.events.length} shared decisions · {game.aether} Aether remaining
        </p>
      </div>
    </section>
  );
}
