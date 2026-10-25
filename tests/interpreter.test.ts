import { test } from "node:test";
import assert from "node:assert/strict";
import { Interpreter, parseModelAction } from "../server/interpreter.ts";
import { createGame, command } from "../src/game.ts";
const payload = (text: string) => ({
  status: "completed",
  output: [{ type: "message", content: [{ type: "output_text", text }] }],
});
test("model output cannot invent actions, mutate state, add fields or cross encounters", () => {
  assert.equal(parseModelAction(payload('{"action":"bridge"}'), 0), "bridge");
  for (const p of [
    null,
    {},
    payload("not json"),
    payload('{"action":"infinite_aether"}'),
    payload('{"action":"bridge","aether":99}'),
    payload('{"action":"lens"}'),
    payload('{"action":"unsupported"}'),
    { ...payload('{"action":"bridge"}'), status: "incomplete" },
    {
      status: "completed",
      output: [
        { type: "message", content: [{ type: "refusal", refusal: "No" }] },
      ],
    },
  ])
    assert.equal(parseModelAction(p, 0), null);
});
test("optional model maps bounded input, uses strict schema and respects rate budget", async () => {
  const g = createGame("one", "host", "demo");
  command(g, { id: "luna", name: "Luna" }, "!join weaver", "j");
  let calls = 0;
  const classifier = new Interpreter(true, (async (_url, init) => {
    calls++;
    const b = JSON.parse(init!.body as string);
    assert.equal(b.store, false);
    assert.equal(b.text.format.strict, true);
    assert.equal(b.text.format.schema.additionalProperties, false);
    return new Response(JSON.stringify(payload('{"action":"bridge"}')), {
      status: 200,
    });
  }) as typeof fetch);
  const result = await classifier.prepare(
    g,
    "luna",
    "!weave knit a wooden walkway",
    "p",
  );
  assert.equal(result.source, "model");
  assert.equal(result.text, "!weave bridge");
  assert.equal(g.aether, 10);
  assert.equal(g.proposals.length, 0);
  await classifier.prepare(g, "luna", "!weave another wooden walkway", "p2");
  assert.equal(calls, 1);
});
test("disabled/unavailable/refusing/malformed models preserve deterministic command path", async () => {
  const g = createGame("one", "host", "demo");
  command(g, { id: "luna", name: "Luna" }, "!join weaver", "j");
  const disabled = new Interpreter(false, (() => {
    throw Error("must not call");
  }) as typeof fetch);
  assert.equal(
    (await disabled.prepare(g, "luna", "!weave knit a walkway", "p")).text,
    "!weave knit a walkway",
  );
  for (const response of [
    new Response("{}", { status: 429 }),
    new Response(JSON.stringify(payload("bad json"))),
  ]) {
    const i = new Interpreter(true, (async () => response) as typeof fetch);
    assert.equal(
      (await i.prepare(g, "luna", "!weave knit a walkway", "p")).source,
      "catalogue",
    );
  }
  const failed = new Interpreter(true, (async () => {
    throw Error("timeout");
  }) as typeof fetch);
  assert.equal(
    (await failed.prepare(g, "luna", "!weave bridge", "p")).source,
    "catalogue",
  );
  assert.equal(
    (await failed.prepare(g, "luna", "!weave knit a walkway", "p")).source,
    "catalogue",
  );
});
