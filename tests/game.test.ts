import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  command,
  approve,
  interpret,
  tick,
  actions,
} from "../src/game.ts";
import { Store } from "../server/store.ts";
const luna = { id: "luna", name: "Luna" },
  orin = { id: "orin", name: "Orin" };
function proposal() {
  const g = createGame("one", "host", "demo");
  command(g, luna, "!join weaver", "j");
  command(g, luna, "!weave fallen branches into a bridge", "p");
  return g;
}
test("complete adventure: branch choice strengthens storm, ward powers final lens", () => {
  const g = proposal();
  approve(g, "P1", 0, "host");
  assert.equal(g.aether, 7);
  assert.equal(g.encounter, 1);
  command(g, orin, "!join warden", "j2");
  command(g, orin, "!weave shield the party from the storm", "p2");
  assert.equal(g.proposals[1].cost, 4);
  approve(g, "P2", 1, "host");
  command(
    g,
    luna,
    "!weave restore the celestial lens",
    "p3",
    Date.now() + 4000,
  );
  assert.equal(g.proposals[2].cost, 1);
  approve(g, "P3", 2, "host");
  assert.equal(g.status, "won");
  assert.equal(g.aether, 2);
  assert.deepEqual(
    g.events.map((e) => e.sequence),
    [1, 2, 3],
  );
  assert.equal(new Set(g.events.map((e) => e.id)).size, 3);
});
test("alternate route, shelter and star ending is playable", () => {
  const g = createGame("two", "host", "demo");
  for (const [i, id] of ["path", "shelter", "stars"].entries()) {
    const a = actions.find((a) => a.id === id)!;
    command(g, luna, "!join " + a.role, "j" + i);
    command(g, luna, "!weave " + a.idea, "p" + i, Date.now() + i * 4000);
    approve(g, "P" + (i + 1), i, "host");
  }
  assert.equal(g.status, "won");
  assert.equal(g.aether, 3);
});
test("input, catalogue and role boundaries", () => {
  const g = createGame("one", "host", "demo");
  assert.throws(() => command(g, luna, "!join wizard", "a"), /Choose/);
  assert.throws(() => command(g, luna, "!weave bridge", "b"), /Join/);
  command(g, luna, "!join seeker", "c");
  assert.throws(() => command(g, luna, "!weave bridge", "d"), /weaver/);
  assert.throws(() => interpret({ action: "bridge" }, 0), /characters/);
  assert.throws(() => interpret("create infinite gold", 0), /Unsupported/);
  assert.throws(() => interpret("restore lens", 0), /Unsupported/);
});
test("duplicate events and repeated votes cannot create extra support", () => {
  const g = proposal();
  assert.equal(command(g, luna, "!weave bridge", "p"), "Already received.");
  assert.equal(g.proposals.length, 1);
  command(g, orin, "!join seeker", "j2");
  command(g, orin, "!vote P1", "v");
  assert.throws(() => command(g, orin, "!vote P1", "v2"), /already counted/);
  assert.equal(g.proposals[0].supporters.length, 2);
  assert.throws(() => command(g, orin, "!vote made-up", "v3"), /No pending/);
});
test("equivalent ideas group and approvals enforce consensus", () => {
  const g = proposal();
  g.threshold = 2;
  assert.throws(() => approve(g, "P1", 0, "host"), /2 supporters/);
  command(g, orin, "!join weaver", "j2");
  command(g, orin, "!weave use branches for a crossing", "p2");
  assert.equal(g.proposals.length, 1);
  assert.equal(g.proposals[0].supporters.length, 2);
  approve(g, "P1", 0, "host");
});
test("unauthorized, stale, repeated, resource and disconnected approvals fail", () => {
  const g = proposal();
  assert.throws(() => approve(g, "P1", 0, "intruder"), /streamer/);
  assert.throws(() => approve(g, "P1", 42, "host"), /State changed/);
  assert.throws(() => approve(g, "P1", 0, "host", false), /ready/);
  g.aether = 0;
  assert.throws(() => approve(g, "P1", 0, "host"), /Aether/);
  g.aether = 10;
  approve(g, "P1", 0, "host");
  assert.throws(() => approve(g, "P1", 0, "host"), /State changed/);
  assert.equal(g.events.length, 1);
});
test("competing action is marked stale, changed role cannot execute", () => {
  const g = proposal();
  command(g, orin, "!join seeker", "j2");
  command(g, orin, "!weave path", "p2");
  command(g, luna, "!join warden", "changed");
  assert.throws(() => approve(g, "P1", 0, "host"), /changed roles/);
  command(g, luna, "!join weaver", "back");
  approve(g, "P1", 0, "host");
  assert.equal(g.proposals[1].status, "stale");
});
test("paused time is preserved and active timer can expire", () => {
  const g = proposal();
  const remainingBeforePause = g.remaining;
  g.status = "paused";
  g.updated = 1000;
  tick(g, 100000);
  assert.equal(g.remaining, remainingBeforePause);
  g.status = "active";
  tick(g, 600000);
  assert.equal(g.status, "lost");
  assert.throws(() => command(g, luna, "!join weaver", "after"), /finished/);
});
test("SQLite checkpoints persist and failed mutation rolls back atomically", () => {
  const s = new Store(":memory:");
  s.add(proposal());
  const key = s.overlay("one");
  assert.ok(key.length >= 48);
  assert.throws(() =>
    s.mutate("one", (g) => {
      g.aether = 0;
      throw Error("interrupted");
    }),
  );
  assert.equal(s.get("one").aether, 10);
  s.mutate("one", (g) => approve(g, "P1", 0, "host"));
  assert.equal(s.get("one").events.length, 1);
  s.rotate("one");
  assert.notEqual(s.overlay("one"), key);
  s.saveToken("host", { access_token: "secret" }, "ab".repeat(32));
  assert.deepEqual(s.token("host", "ab".repeat(32)), {
    access_token: "secret",
  });
  assert.ok(
    !String(s.db.prepare("SELECT data FROM tokens").get()?.data).includes(
      "secret",
    ),
  );
  s.db.close();
});
