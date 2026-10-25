import WebSocket from "ws";
import type { Store } from "./store.ts";
export type Identity = { id: string; name: string; mode: "demo" | "live" };
type Token = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string[];
  expiresAt: number;
};
export class Twitch {
  states = new Map<string, string>();
  sockets = new Map<string, WebSocket>();
  timers = new Map<string, ReturnType<typeof setTimeout>>();
  lastReply = new Map<string, number>();
  stopped = new Set<string>();
  constructor(
    public store: Store,
    public key: string,
    public onMessage: (
      owner: string,
      user: Identity,
      text: string,
      id: string,
    ) => Promise<string | undefined>,
    public onDisconnect: (id: string) => void,
  ) {}
  ready(id: string) {
    return this.states.get(id) === "ready";
  }
  status(id: string) {
    return this.states.get(id) ?? "disconnected";
  }
  async api(path: string, token: string, body?: unknown) {
    const r = await fetch("https://api.twitch.tv/helix/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw Error(`Twitch API ${r.status}. Reconnect chat.`);
    return r.json() as Promise<any>;
  }
  save(id: string, t: any) {
    this.store.saveToken(
      id,
      { ...t, expiresAt: Date.now() + t.expires_in * 1000 },
      this.key,
    );
  }
  async valid(id: string): Promise<Token> {
    let t = this.store.token(id, this.key) as Token | null;
    if (!t) throw Error("Connect Twitch chat first.");
    if (Date.now() > t.expiresAt - 120000) {
      const r = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: t.refresh_token,
          client_id: process.env.TWITCH_CLIENT_ID!,
          client_secret: process.env.TWITCH_CLIENT_SECRET!,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw Error("Twitch access expired. Reconnect chat.");
      const next = (await r.json()) as Token;
      this.save(id, next);
      t = this.store.token(id, this.key);
    }
    const r = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: { Authorization: `OAuth ${t!.access_token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw Error("Twitch permission revoked. Reconnect chat.");
    const v = (await r.json()) as any;
    if (
      v.user_id !== id ||
      !v.scopes.includes("user:read:chat") ||
      !v.scopes.includes("user:write:chat")
    )
      throw Error("Chat permissions are missing. Reconnect chat.");
    return t!;
  }
  async connect(
    id: string,
    url = "wss://eventsub.wss.twitch.tv/ws",
    transfer = false,
  ) {
    this.stopped.delete(id);
    clearTimeout(this.timers.get(id));
    this.states.set(id, "connecting");
    try {
      const t = await this.valid(id);
      const old = this.sockets.get(id);
      const ws = new WebSocket(url);
      this.sockets.set(id, ws);
      let watchdog: ReturnType<typeof setTimeout>;
      const arm = (seconds = 20) => {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => ws.terminate(), (seconds + 5) * 1000);
      };
      arm();
      ws.on("message", async (raw) => {
        try {
          const m = JSON.parse(raw.toString());
          arm(m.payload?.session?.keepalive_timeout_seconds ?? 20);
          const type = m.metadata.message_type;
          if (type === "session_welcome") {
            if (!transfer)
              await this.api("eventsub/subscriptions", t.access_token, {
                type: "channel.chat.message",
                version: "1",
                condition: { broadcaster_user_id: id, user_id: id },
                transport: {
                  method: "websocket",
                  session_id: m.payload.session.id,
                },
              });
            this.states.set(id, "ready");
            if (old && old !== ws) old.close();
          }
          if (type === "session_reconnect") {
            const next = m.payload.session.reconnect_url;
            if (
              typeof next !== "string" ||
              !next.startsWith("wss://eventsub.wss.twitch.tv/")
            )
              throw Error("Invalid reconnect URL.");
            void this.connect(id, next, true);
          }
          if (type === "revocation") {
            this.stopped.add(id);
            this.states.set(id, "revoked");
            ws.close();
            this.onDisconnect(id);
          }
          if (
            type === "notification" &&
            m.payload.subscription.type === "channel.chat.message"
          ) {
            const e = m.payload.event;
            const text = e.message?.text;
            if (typeof text === "string" && text.startsWith("!")) {
              const reply = await this.onMessage(
                id,
                {
                  id: e.chatter_user_id,
                  name: e.chatter_user_name,
                  mode: "live",
                },
                text,
                e.message_id,
              );
              if (reply && Date.now() - (this.lastReply.get(id) ?? 0) > 1500) {
                this.lastReply.set(id, Date.now());
                const current = await this.valid(id);
                await this.api("chat/messages", current.access_token, {
                  broadcaster_id: id,
                  sender_id: id,
                  message: reply.slice(0, 450),
                });
              }
            }
          }
        } catch {
          this.states.set(id, "error");
          this.onDisconnect(id);
          ws.close();
        }
      });
      ws.on("error", () => ws.close());
      ws.on("close", () => {
        clearTimeout(watchdog);
        if (this.sockets.get(id) !== ws) return;
        if (this.status(id) !== "revoked") this.states.set(id, "disconnected");
        this.onDisconnect(id);
        if (!this.stopped.has(id))
          this.timers.set(
            id,
            setTimeout(() => void this.connect(id), 10000),
          );
      });
    } catch {
      this.states.set(id, "authorization required");
      this.onDisconnect(id);
    }
  }
  stop(id: string) {
    this.stopped.add(id);
    clearTimeout(this.timers.get(id));
    this.states.set(id, "disconnected");
    this.sockets.get(id)?.close();
    this.onDisconnect(id);
  }
}
