import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("HTTP identity, CSRF, overlay isolation, concurrent approval, revoke and restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mythweave-test-")),
    origin = "http://127.0.0.1:3097";
  // Production HTTPS checks also apply in tests. Use development server on loopback.
  const launch = () =>
    spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
      env: {
        ...process.env,
        PORT: "3097",
        APP_URL: origin,
        NODE_ENV: "development",
        TOKEN_KEY: "ab".repeat(32),
        DB_PATH: join(dir, "state.sqlite"),
        TWITCH_CLIENT_ID: "",
        TWITCH_CLIENT_SECRET: "",
        ENABLE_MODEL: "0",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
  let child = launch();
  let logs = "";
  child.stderr.on("data", (d) => (logs += d));
  child.stdout.on("data", (d) => (logs += d));
  const ready = async () => {
    for (let i = 0; i < 600; i++) {
      if (child.exitCode !== null) throw Error(logs);
      try {
        if (
          (
            await fetch(origin + "/health", {
              signal: AbortSignal.timeout(500),
            })
          ).ok
        )
          return;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw Error("Server readiness timeout: " + logs);
  };
  let auth = "";
  const request = (path: string, body?: unknown, cookie = auth, extra = {}) =>
    fetch(origin + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        Cookie: cookie,
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    await ready();
    let r = await request("/api/demo", {});
    assert.equal(r.status, 200);
    auth = r.headers.get("set-cookie")!.split(";")[0];
    const identity = (await (await request("/api/me")).json()) as any;
    assert.equal(identity.user.mode, "demo");
    const repeatDemo = await request("/api/demo", {});
    assert.equal(repeatDemo.headers.get("set-cookie"), null);
    assert.equal(
      ((await (await request("/api/me")).json()) as any).user.id,
      identity.user.id,
    );
    assert.equal(
      (await request("/api/games", {}, auth, { Origin: "https://evil.test" }))
        .status,
      403,
    );
    r = await request("/api/games", { threshold: 1 });
    const { id } = (await r.json()) as any;
    assert.ok(id);
    assert.equal(
      (await request(`/api/games/${id}`, undefined, "")).status,
      400,
    );
    const { url } = (await (
      await request(`/api/games/${id}/overlay`)
    ).json()) as any;
    const overlay = new URL(url).search;
    assert.equal(
      (await request(`/api/games/${id}${overlay}`, undefined, "")).status,
      200,
    );
    assert.equal(
      (
        await request(
          `/api/games/${id}/control${overlay}`,
          { action: "end" },
          "",
        )
      ).status,
      400,
    );
    assert.equal(
      (await request(`/api/games/${id}/overlay`, undefined, "")).status,
      400,
    );
    const publicState = (await (
      await request(`/api/games/${id}${overlay}`, undefined, "")
    ).json()) as any;
    assert.equal(publicState.owner, undefined);
    assert.equal(publicState.seen, undefined);
    for (const text of ["!join weaver", "!weave bridge"])
      assert.equal(
        (
          await request(`/api/games/${id}/command`, {
            actor: "Luna",
            text,
            eventId: text,
          })
        ).status,
        200,
      );
    const results = await Promise.all(
      [1, 2].map(() =>
        request(`/api/games/${id}/control`, {
          action: "approve",
          proposal: "P1",
          version: 0,
        }),
      ),
    );
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
    assert.equal(
      ((await (await request(`/api/games/${id}`)).json()) as any).events.length,
      1,
    );
    const sse = await request(
      `/api/games/${id}/events${overlay}`,
      undefined,
      "",
    );
    assert.match(sse.headers.get("content-type")!, /text\/event-stream/);
    const reader = sse.body!.getReader();
    const chunk = await reader.read();
    assert.match(new TextDecoder().decode(chunk.value), /data:/);
    await request(`/api/games/${id}/overlay`, {});
    let closed = false;
    for (let i = 0; i < 20; i++) {
      const next = await reader.read();
      if (next.done) {
        closed = true;
        break;
      }
    }
    assert.equal(
      closed,
      true,
      "Revocation must close an already-connected overlay stream",
    );
    assert.equal(
      (await request(`/api/games/${id}${overlay}`, undefined, "")).status,
      400,
    );
    child.kill();
    await new Promise<void>((r) => child.once("exit", () => r()));
    child = launch();
    child.stderr.on("data", (d) => (logs += d));
    await ready();
    const restored = (await (await request(`/api/games/${id}`)).json()) as any;
    assert.equal(restored.status, "paused");
    assert.equal(restored.events.length, 1);
    assert.equal(restored.aether, 7);
    assert.equal(
      (await request(`/api/games/${id}/control`, { action: "resume" })).status,
      200,
    );
  } finally {
    child.kill();
    await new Promise<void>((resolve) => {
      if (child.exitCode !== null) resolve();
      else child.once("exit", () => resolve());
    });
    rmSync(dir, { recursive: true, force: true });
  }
});
