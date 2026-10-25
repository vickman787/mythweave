import { test } from "node:test";
import assert from "node:assert/strict";
import { WebSocketServer } from "ws";
import { Twitch } from "../server/twitch.ts";
import { Store } from "../server/store.ts";
const until = async (fn: () => boolean) => {
  for (let i = 0; i < 100; i++) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw Error("Fixture did not reach expected state.");
};
test("mock EventSub requires subscription readiness, forwards identity, and pauses on revocation", async () => {
  const server = new WebSocketServer({ host: "127.0.0.1", port: 0 });
  await new Promise<void>((r) => server.once("listening", r));
  const store = new Store(":memory:");
  let received: any,
    disconnected = 0,
    subscription: any;
  const t = new Twitch(
    store,
    "ab".repeat(32),
    async (owner, user, text, id) => {
      received = { owner, user, text, id };
      return undefined;
    },
    () => {
      disconnected++;
    },
  );
  t.valid = async () => ({
    access_token: "fixture",
    refresh_token: "fixture",
    expires_in: 3600,
    scope: ["user:read:chat", "user:write:chat"],
    expiresAt: Date.now() + 3600000,
  });
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  t.api = async (path, _token, body) => {
    subscription = { path, body };
    await gate;
    return {};
  };
  server.on("connection", (socket) =>
    socket.send(
      JSON.stringify({
        metadata: { message_type: "session_welcome" },
        payload: {
          session: { id: "fixture-session", keepalive_timeout_seconds: 10 },
        },
      }),
    ),
  );
  try {
    await t.connect("host", `ws://127.0.0.1:${(server.address() as any).port}`);
    await until(() => !!subscription);
    assert.equal(t.ready("host"), false);
    assert.equal(subscription.path, "eventsub/subscriptions");
    assert.equal(subscription.body.type, "channel.chat.message");
    assert.equal(subscription.body.condition.user_id, "host");
    assert.equal(subscription.body.transport.session_id, "fixture-session");
    release();
    await until(() => t.ready("host"));
    const socket = [...server.clients][0];
    socket.send(
      JSON.stringify({
        metadata: { message_type: "notification" },
        payload: {
          subscription: { type: "channel.chat.message" },
          event: {
            chatter_user_id: "viewer-42",
            chatter_user_name: "Real identity fixture",
            message_id: "event-42",
            message: { text: "!join weaver" },
          },
        },
      }),
    );
    await until(() => !!received);
    assert.equal(received.user.id, "viewer-42");
    assert.equal(received.text, "!join weaver");
    assert.equal(received.id, "event-42");
    socket.send(
      JSON.stringify({ metadata: { message_type: "revocation" }, payload: {} }),
    );
    await until(() => t.status("host") === "revoked");
    assert.equal(t.ready("host"), false);
    assert.ok(disconnected > 0);
  } finally {
    release();
    t.stop("host");
    for (const s of server.clients) s.terminate();
    await new Promise<void>((r) => server.close(() => r()));
    store.db.close();
  }
});
