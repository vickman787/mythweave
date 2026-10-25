export type Role = "weaver" | "warden" | "seeker";
export type Action = {
  id: string;
  title: string;
  role: Role;
  encounter: number;
  cost: number;
  idea: string;
  consequence: string;
};
export const actions: Action[] = [
  {
    id: "bridge",
    title: "Weave a branch bridge",
    role: "weaver",
    encounter: 0,
    cost: 3,
    idea: "weave fallen branches into a bridge",
    consequence:
      "Branches knit across the void. The party crosses safely, but the exposed route strengthens the storm.",
  },
  {
    id: "path",
    title: "Reveal the hidden stepping stones",
    role: "seeker",
    encounter: 0,
    cost: 2,
    idea: "reveal the hidden stone path",
    consequence:
      "Moonlit stepping stones rise from the mist. The sheltered route weakens the coming storm.",
  },
  {
    id: "shield",
    title: "Raise a storm ward",
    role: "warden",
    encounter: 1,
    cost: 3,
    idea: "shield the party from the storm",
    consequence:
      "A violet ward turns the storm aside. Its captured lightning will power the observatory.",
  },
  {
    id: "shelter",
    title: "Restore the ruined shelter",
    role: "weaver",
    encounter: 1,
    cost: 2,
    idea: "restore the shelter",
    consequence:
      "The ruined arch seals against the wind. The party survives, but must power the final lens themselves.",
  },
  {
    id: "lens",
    title: "Restore the celestial lens",
    role: "weaver",
    encounter: 2,
    cost: 3,
    idea: "restore the celestial lens",
    consequence:
      "The lens blooms with starlight. The Shattered Observatory is whole again.",
  },
  {
    id: "stars",
    title: "Align the star runes",
    role: "seeker",
    encounter: 2,
    cost: 3,
    idea: "align the star runes",
    consequence:
      "Ancient constellations lock into place. A beacon lights the way home.",
  },
];
export const encounters = [
  {
    name: "The Broken Crossing",
    objective: "Find a way across the shattered bridge.",
    description:
      "Beyond the mist, an ancient observatory waits. Only your community can weave a way forward.",
  },
  {
    name: "The Gathering Storm",
    objective: "Protect the party from the Aether storm.",
    description:
      "The crossing is behind you. A living storm gathers around the observatory gates.",
  },
  {
    name: "The Celestial Heart",
    objective: "Restore the observatory and light the beacon.",
    description:
      "The storm quiets. Beneath the fractured dome, a celestial lens waits for its final spark.",
  },
];
export type Proposal = {
  id: string;
  action: string;
  proposer: string;
  name: string;
  supporters: string[];
  status: "pending" | "accepted" | "rejected" | "stale";
  encounter: number;
  cost: number;
  interpretation: "catalogue" | "model";
  reason?: string;
};
export type GameEvent = {
  id: string;
  sessionId: string;
  sequence: number;
  version: number;
  action: string;
  contributor: string;
  supporters: number;
  consequence: string;
  at: string;
  cost: number;
};
export type Game = {
  id: string;
  owner: string;
  mode: "demo" | "live";
  status: "active" | "paused" | "won" | "ended" | "lost";
  encounter: number;
  aether: number;
  version: number;
  remaining: number;
  updated: number;
  participants: Record<string, { name: string; role: Role }>;
  proposals: Proposal[];
  events: GameEvent[];
  seen: string[];
  lastProposal: Record<string, number>;
  threshold: number;
  pauseReason?: string;
};
export function createGame(
  id: string,
  owner: string,
  mode: "demo" | "live",
  threshold = 1,
): Game {
  return {
    id,
    owner,
    mode,
    status: "active",
    encounter: 0,
    aether: 10,
    version: 0,
    remaining: 480,
    updated: Date.now(),
    participants: {},
    proposals: [],
    events: [],
    seen: [],
    lastProposal: {},
    threshold,
  };
}
export function tick(g: Game, now = Date.now()) {
  if (g.status === "active") {
    g.remaining = Math.max(
      0,
      g.remaining - Math.max(0, now - g.updated) / 1000,
    );
    if (g.remaining === 0) g.status = "lost";
  }
  g.updated = now;
}
export function cost(g: Pick<Game, "events">, a: Action) {
  return Math.max(
    1,
    a.cost +
      (a.encounter === 1 && g.events[0]?.action === "bridge" ? 1 : 0) -
      (a.encounter === 2 && g.events[1]?.action === "shield" ? 2 : 0),
  );
}
export function interpret(idea: unknown, encounter: number): Action {
  if (typeof idea !== "string" || idea.length < 3 || idea.length > 240)
    throw Error("Use an idea between 3 and 240 characters.");
  const s = idea.toLowerCase();
  const match = actions
    .filter((a) => a.encounter === encounter)
    .find(
      (a) =>
        s === a.id ||
        s === a.idea ||
        {
          bridge: /\b(bridge|branches|crossing)\b/,
          path: /\b(path|stones|route)\b/,
          shield: /\b(shield|ward|protect)\b/,
          shelter: /\b(shelter|arch)\b/,
          lens: /\b(lens|beacon)\b/,
          stars: /\b(stars?|runes?|constellations?)\b/,
        }[a.id]!.test(s),
    );
  if (!match)
    throw Error(
      "Unsupported idea. Try: " +
        actions
          .filter((a) => a.encounter === encounter)
          .map((a) => a.idea)
          .join(" / "),
    );
  return match;
}
export function command(
  g: Game,
  user: { id: string; name: string },
  text: string,
  eventId: string,
  now = Date.now(),
  interpretation: "catalogue" | "model" = "catalogue",
): string {
  if (g.seen.includes(eventId)) return "Already received.";
  g.seen.push(eventId);
  g.seen = g.seen.slice(-2000);
  tick(g, now);
  const [cmd, ...rest] = text.trim().split(/\s+/);
  const value = rest.join(" ");
  if (cmd === "!help")
    return "!join weaver|warden|seeker · !weave <idea> · !vote <id>. Your streamer approves supported actions.";
  if (g.status !== "active")
    throw Error("The adventure is paused or finished. Wait for the streamer.");
  if (cmd === "!join") {
    if (!["weaver", "warden", "seeker"].includes(value))
      throw Error("Choose !join weaver, !join warden, or !join seeker.");
    if (g.participants[user.id]?.role === value)
      return "You already hold that role.";
    g.participants[user.id] = {
      name: user.name.slice(0, 40),
      role: value as Role,
    };
    return `Joined as ${value}.`;
  }
  if (!g.participants[user.id])
    throw Error("Join a role first: !join weaver|warden|seeker.");
  if (cmd === "!vote") {
    const p = g.proposals.find((p) => p.id === value && p.status === "pending");
    if (!p) throw Error("No pending proposal with that ID.");
    if (p.supporters.includes(user.id))
      throw Error("Your support is already counted.");
    p.supporters.push(user.id);
    return `Supported ${p.id}.`;
  }
  if (cmd !== "!weave") throw Error("Unknown command. Use !help.");
  const a = interpret(value, g.encounter);
  if (g.participants[user.id].role !== a.role)
    throw Error(`This action needs a ${a.role}. Use !join ${a.role}.`);
  if (g.aether < cost(g, a)) throw Error("Not enough Aether for that action.");
  const existing = g.proposals.find(
    (p) => p.action === a.id && p.status === "pending",
  );
  if (existing) {
    if (!existing.supporters.includes(user.id))
      existing.supporters.push(user.id);
    return `Idea grouped with ${existing.id}.`;
  }
  if (now - (g.lastProposal[user.id] ?? 0) < 3000)
    throw Error("Wait 3 seconds before proposing again.");
  if (g.proposals.filter((p) => p.status === "pending").length >= 12)
    throw Error("The queue is full. Support an existing idea.");
  g.lastProposal[user.id] = now;
  const p: Proposal = {
    id: `P${g.proposals.length + 1}`,
    action: a.id,
    proposer: user.id,
    name: user.name.slice(0, 40),
    supporters: [user.id],
    status: "pending",
    encounter: g.encounter,
    cost: cost(g, a),
    interpretation,
  };
  g.proposals.push(p);
  return `${p.id}: ${a.title} (${p.cost} Aether). Support with !vote ${p.id}.`;
}
export function approve(
  g: Game,
  id: string,
  version: number,
  actor: string,
  ready = true,
) {
  tick(g);
  if (actor !== g.owner) throw Error("Only the streamer can approve.");
  if (g.status !== "active" || !ready)
    throw Error("Resume with a ready connection before approving.");
  if (version !== g.version)
    throw Error("State changed. Review the current proposal again.");
  const p = g.proposals.find((p) => p.id === id);
  if (!p || p.status !== "pending" || p.encounter !== g.encounter)
    throw Error("Proposal is no longer available.");
  const a = actions.find((a) => a.id === p.action)!;
  if (g.participants[p.proposer]?.role !== a.role)
    throw Error(
      "The proposer changed roles. Ask them to rejoin the required role.",
    );
  if (p.supporters.length < g.threshold)
    throw Error(`Needs ${g.threshold} supporters.`);
  const price = cost(g, a);
  if (g.aether < price) throw Error("Not enough Aether.");
  g.aether -= price;
  g.version++;
  p.status = "accepted";
  g.events.push({
    id: `${g.id}:${g.version}`,
    sessionId: g.id,
    sequence: g.events.length + 1,
    version: g.version,
    action: a.id,
    contributor: p.name,
    supporters: p.supporters.length,
    consequence: a.consequence,
    at: new Date().toISOString(),
    cost: price,
  });
  for (const other of g.proposals)
    if (other.status === "pending") {
      other.status = "stale";
      other.reason = "The party moved to the next encounter.";
    }
  if (g.encounter === 2) g.status = "won";
  else g.encounter++;
}
