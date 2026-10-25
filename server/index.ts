import "node:process";
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
import express from "express";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { Store } from "./store.ts";
import { Twitch, type Identity } from "./twitch.ts";
import { createGame, command, approve, tick, type Game } from "../src/game.ts";
import { Interpreter } from "./interpreter.ts";
const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 3010),
  origin = process.env.APP_URL ?? `http://localhost:${port}`;
const key = process.env.TOKEN_KEY ?? randomBytes(32).toString("hex");
if (!/^[a-f0-9]{64}$/i.test(key))
  throw Error("TOKEN_KEY must contain 64 hex characters.");
if (production && (!process.env.TOKEN_KEY || !origin.startsWith("https://")))
  throw Error("Production requires TOKEN_KEY and HTTPS APP_URL.");
const store = new Store(process.env.DB_PATH ?? "data/mythweave.sqlite");
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "8kb" }));
app.use((req, res, next) => {
  res.set({
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    "X-Frame-Options": "SAMEORIGIN",
  });
  if (production)
    res.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; frame-ancestors 'self'",
    );
  next();
});
const cookie = (req: express.Request, name: string) =>
  req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + "="))
    ?.slice(name.length + 1);
const who = (req: express.Request): Identity | null =>
  store.session(cookie(req, "mw_auth") ?? "");
function login(res: express.Response, user: Identity) {
  const id = randomBytes(32).toString("hex");
  store.auth(id, user);
  res.cookie("mw_auth", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    maxAge: 86400000,
    path: "/",
  });
}
const clients = new Map<string, Set<express.Response>>();
const interpreter = new Interpreter();
const pendingInput = new Map<
  string,
  Promise<{ reply: string; error: string }>
>();
function receive(id: string, user: Identity, text: string, eventId: string) {
  const dedupeKey = id + ":" + eventId;
  const pending = pendingInput.get(dedupeKey);
  if (pending) return pending;
  const task = (async () => {
    if (text.length > 280) return { reply: "", error: "Command is too long." };
    const prepared = await interpreter.prepare(
      store.get(id),
      user.id,
      text,
      eventId,
    );
    let reply = "",
      error = "";
    store.mutate(id, (s) => {
      try {
        if (prepared.source === "model" && s.encounter !== prepared.encounter)
          throw Error(
            "The world changed while interpreting. Propose again for the current objective.",
          );
        if (s.mode === "live" && !twitch.ready(s.owner))
          throw Error("Twitch chat is disconnected. Wait for the streamer.");
        reply = command(
          s,
          user,
          prepared.text,
          eventId,
          Date.now(),
          prepared.source,
        );
      } catch (e) {
        error = (e as Error).message;
      }
    });
    broadcast(id);
    return { reply, error };
  })();
  pendingInput.set(dedupeKey, task);
  void task.finally(() => pendingInput.delete(dedupeKey)).catch(() => {});
  return task;
}
function publicGame(g: Game) {
  const { owner, seen, lastProposal, ...safe } = g;
  return {
    ...safe,
    participants: Object.values(g.participants).reduce(
      (a, p) => {
        a[p.role]++;
        return a;
      },
      { weaver: 0, warden: 0, seeker: 0 },
    ),
    proposals: g.proposals.map(({ proposer, supporters, ...p }) => ({
      ...p,
      supporters: supporters.length,
    })),
  };
}
function broadcast(id: string) {
  const g = store.get(id);
  for (const res of clients.get(id) ?? []) {
    if (!canRead(res.req, g)) {
      res.end();
      continue;
    }
    res.write(`data: ${JSON.stringify(publicGame(g))}\n\n`);
  }
}
const twitch = new Twitch(
  store,
  key,
  async (owner, user, text, eventId) => {
    const g = store
      .list(owner)
      .find(
        (g) => g.mode === "live" && ["active", "paused"].includes(g.status),
      );
    if (!g) return;
    const result = await receive(g.id, user, text, eventId);
    return result.error || result.reply;
  },
  (owner) => {
    for (const g of store.list(owner))
      if (g.mode === "live" && g.status === "active") {
        store.mutate(g.id, (s) => {
          tick(s);
          s.status = "paused";
          s.pauseReason = "Twitch chat disconnected. Reconnect and resume.";
        });
        broadcast(g.id);
      }
  },
);
for (const g of store.all())
  if (g.status === "active")
    store.mutate(g.id, (s) => {
      s.status = "paused";
      s.pauseReason = "Server restarted. Review the checkpoint and resume.";
      s.updated = Date.now();
    });
function canRead(req: express.Request, g: Game) {
  return (
    who(req)?.id === g.owner ||
    req.query.key === store.overlay(g.id) ||
    req.path.includes("/companion/")
  );
}
function getGame(req: express.Request, control = false) {
  const g = store.get(String(req.params.id));
  if (control ? who(req)?.id !== g.owner : !canRead(req, g))
    throw Error("Access denied.");
  return g;
}
app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin !== origin
  )
    return res.status(403).json({ error: "Invalid request origin." });
  next();
});
const limits = new Map<string, { at: number; count: number }>();
app.use("/api", (req, res, next) => {
  const k = who(req)?.id ?? req.ip ?? "unknown";
  const now = Date.now();
  if (limits.size > 10000) limits.clear();
  let l = limits.get(k);
  if (!l || now - l.at > 60000) {
    l = { at: now, count: 0 };
    limits.set(k, l);
  }
  if (++l.count > 240)
    return res.status(429).json({ error: "Too many requests. Wait a minute." });
  next();
});
app.get("/api/me", (req, res) => {
  const user = who(req);
  res.json({
    user,
    configured: !!(
      process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET
    ),
    chat: user?.mode === "live" ? twitch.status(user.id) : "demo",
    sessions: user
      ? store.list(user.id).map((g) => ({
          id: g.id,
          status: g.status,
          mode: g.mode,
          at: g.updated,
          encounter: g.encounter,
        }))
      : [],
  });
});
app.post("/api/demo", (req, res) => {
  if (who(req)?.mode === "demo") return res.json({ ok: true });
  login(res, {
    id: "demo:" + randomBytes(12).toString("hex"),
    name: "Demo storyteller",
    mode: "demo",
  });
  res.json({ ok: true });
});
app.post("/api/logout", (req, res) => {
  const id = cookie(req, "mw_auth");
  if (id) store.db.prepare("DELETE FROM auth WHERE id=?").run(id);
  res.clearCookie("mw_auth");
  res.json({ ok: true });
});
const oauth = new Map<
  string,
  { chat: boolean; expires: number; user?: string; returnTo?: string }
>();
app.get("/auth/twitch", (req, res) => {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
    return res.redirect(
      "/?error=" +
        encodeURIComponent(
          "Twitch is not configured. Try Demo mode or follow docs/SETUP.md.",
        ),
    );
  const state = randomBytes(24).toString("hex");
  const chat = req.query.chat === "1";
  const user = who(req);
  if (chat && user?.mode !== "live")
    return res.redirect("/?error=Sign+in+first");
  for (const [k, v] of oauth) if (v.expires < Date.now()) oauth.delete(k);
  const returnTo =
    typeof req.query.returnTo === "string" &&
    /^\/join\/[a-f0-9]{24}$/.test(req.query.returnTo)
      ? req.query.returnTo
      : undefined;
  oauth.set(state, {
    chat,
    expires: Date.now() + 600000,
    user: user?.id,
    returnTo,
  });
  res.cookie("mw_oauth", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    maxAge: 600000,
  });
  res.redirect(
    "https://id.twitch.tv/oauth2/authorize?" +
      new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        redirect_uri: origin + "/auth/twitch/callback",
        response_type: "code",
        scope: chat ? "user:read:chat user:write:chat" : "",
        state,
      }),
  );
});
app.get("/auth/twitch/callback", async (req, res) => {
  try {
    const state = String(req.query.state ?? ""),
      pending = oauth.get(state);
    oauth.delete(state);
    res.clearCookie("mw_oauth");
    if (
      !pending ||
      pending.expires < Date.now() ||
      cookie(req, "mw_oauth") !== state
    )
      throw Error("Authentication expired. Please try again.");
    if (req.query.error) throw Error("Twitch authorization cancelled.");
    if (typeof req.query.code !== "string")
      throw Error("Missing authorization code.");
    const r = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        code: req.query.code,
        grant_type: "authorization_code",
        redirect_uri: origin + "/auth/twitch/callback",
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw Error("Twitch sign-in failed. Try again.");
    const token = (await r.json()) as any;
    const v = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: { Authorization: "OAuth " + token.access_token },
      signal: AbortSignal.timeout(10000),
    });
    if (!v.ok) throw Error("Could not validate Twitch identity.");
    const identity = (await v.json()) as any;
    if (identity.client_id !== process.env.TWITCH_CLIENT_ID)
      throw Error("Unexpected Twitch application.");
    if (pending.chat && pending.user !== identity.user_id)
      throw Error("Authorize the same Twitch account that is signed in.");
    login(res, { id: identity.user_id, name: identity.login, mode: "live" });
    if (pending.chat) {
      twitch.save(identity.user_id, token);
      void twitch.connect(identity.user_id);
    }
    res.redirect(pending.returnTo ?? "/dashboard");
  } catch (e) {
    const error = e as Error & { cause?: { code?: string } };
    const message =
      error.message === "fetch failed"
        ? error.cause?.code === "EACCES" || error.cause?.code === "EPERM"
          ? "The local server cannot reach Twitch because network access is blocked. Restart the server with network access, then try signing in again."
          : "The server could not reach Twitch. Check the connection and try signing in again."
        : error.message;
    res.redirect("/?error=" + encodeURIComponent(message));
  }
});
app.post("/api/chat/reconnect", async (req, res) => {
  const u = who(req);
  if (!u || u.mode !== "live") throw Error("Sign in with Twitch first.");
  await twitch.connect(u.id);
  res.json({ chat: twitch.status(u.id) });
});
app.post("/api/games", (req, res) => {
  const u = who(req);
  if (!u) throw Error("Sign in first.");
  if (u.mode === "live" && !twitch.ready(u.id))
    throw Error("Connect Twitch chat before launching a live session.");
  if (store.list(u.id).some((g) => ["active", "paused"].includes(g.status)))
    throw Error("End or resume your current adventure first.");
  const threshold = Number(req.body.threshold ?? 1);
  if (![1, 2, 3].includes(threshold))
    throw Error("Support threshold must be 1, 2, or 3.");
  const id = randomBytes(12).toString("hex");
  store.add(createGame(id, u.id, u.mode, threshold));
  res.json({ id });
});
app.get("/api/games/:id", (req, res) => res.json(publicGame(getGame(req))));
app.get("/api/companion/:id", (req, res) => {
  const g = store.get(String(req.params.id));
  res.json({
    ...publicGame(g),
    yourRole: g.participants[who(req)?.id ?? ""]?.role ?? null,
  });
});
app.get("/api/games/:id/overlay", (req, res) => {
  const g = getGame(req, true);
  res.json({ url: `${origin}/overlay/${g.id}?key=${store.overlay(g.id)}` });
});
app.post("/api/games/:id/overlay", (req, res) => {
  const g = getGame(req, true);
  store.rotate(g.id);
  broadcast(g.id);
  res.json({ ok: true });
});
app.get("/api/games/:id/events", (req, res) => {
  const g = getGame(req);
  res.set({ "Content-Type": "text/event-stream", Connection: "keep-alive" });
  res.flushHeaders();
  if (!clients.has(g.id)) clients.set(g.id, new Set());
  clients.get(g.id)!.add(res);
  res.write(`data: ${JSON.stringify(publicGame(g))}\n\n`);
  const heartbeat = setInterval(() => {
    if (!canRead(req, store.get(g.id))) return res.end();
    res.write(": heartbeat\n\n");
  }, 15000);
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.get(g.id)?.delete(res);
  });
});
app.post("/api/games/:id/control", (req, res) => {
  const g = getGame(req, true);
  const { action, proposal, version } = req.body;
  store.mutate(g.id, (s) => {
    tick(s);
    if (action === "approve")
      approve(
        s,
        String(proposal),
        version,
        s.owner,
        s.mode === "demo" || twitch.ready(s.owner),
      );
    else if (action === "reject") {
      const p = s.proposals.find(
        (p) => p.id === proposal && p.status === "pending",
      );
      if (!p) throw Error("Proposal unavailable.");
      p.status = "rejected";
      p.reason = "Declined by the streamer.";
    } else if (action === "pause") {
      if (s.status !== "active") throw Error("Only active sessions can pause.");
      s.status = "paused";
      s.pauseReason = "Paused by the streamer.";
    } else if (action === "resume") {
      if (s.status !== "paused")
        throw Error("Only paused sessions can resume.");
      if (s.mode === "live" && !twitch.ready(s.owner))
        throw Error("Reconnect chat first.");
      s.status = "active";
      s.updated = Date.now();
      delete s.pauseReason;
    } else if (action === "end") {
      if (!["active", "paused"].includes(s.status))
        throw Error("Session already finished.");
      s.status = "ended";
    } else throw Error("Unknown control.");
  });
  broadcast(g.id);
  res.json({ ok: true });
});
app.post("/api/games/:id/command", async (req, res) => {
  const g = store.get(String(req.params.id)),
    u = who(req);
  if (!u) throw Error("Sign in to participate.");
  let actor = u;
  if (g.mode === "demo") {
    if (g.owner !== u.id)
      throw Error("Only the demo owner can simulate events.");
    const alias = String(req.body.actor ?? "Luna");
    if (!["Luna", "Orin", "Sable"].includes(alias))
      throw Error("Select a demo participant.");
    actor = { id: "sim:" + alias, name: alias + " (demo)", mode: "demo" };
  } else if (u.mode !== "live" || !twitch.ready(g.owner))
    throw Error("Live participation requires Twitch identity and ready chat.");
  if (typeof req.body.text !== "string" || req.body.text.length > 280)
    throw Error("Invalid command.");
  if (typeof req.body.eventId !== "string" || req.body.eventId.length > 80)
    throw Error("A stable event ID is required.");
  const { reply, error } = await receive(
    g.id,
    actor,
    req.body.text,
    req.body.eventId,
  );
  if (error) return res.status(400).json({ error });
  res.json({ reply });
});
setInterval(() => {
  for (const g of store.all())
    if (g.status === "active") {
      store.mutate(g.id, (s) => tick(s));
      broadcast(g.id);
    }
}, 1000).unref();
setInterval(() => {
  for (const [id, status] of twitch.states)
    if (status === "ready") void twitch.valid(id).catch(() => twitch.stop(id));
  store.db.prepare("DELETE FROM auth WHERE expires<?").run(Date.now());
}, 3600000).unref();
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "API route not found." }),
);
if (production) {
  app.use(express.static(resolve("dist"), { index: false }));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (!res.headersSent)
      res.status(400).json({
        error: err.message.includes("SQLITE")
          ? "Storage operation failed. Try again."
          : err.message,
      });
  },
);
app.listen(port, process.env.HOST ?? "127.0.0.1", () =>
  console.log(`Mythweave ready at ${origin}`),
);
