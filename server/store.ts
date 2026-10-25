import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import type { Game } from "../src/game.ts";
export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS games(id TEXT PRIMARY KEY, owner TEXT NOT NULL, data TEXT NOT NULL, overlay TEXT UNIQUE NOT NULL); CREATE TABLE IF NOT EXISTS auth(id TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS tokens(id TEXT PRIMARY KEY, data TEXT NOT NULL)",
    );
  }
  add(g: Game) {
    this.db
      .prepare("INSERT INTO games VALUES(?,?,?,?)")
      .run(g.id, g.owner, JSON.stringify(g), randomBytes(24).toString("hex"));
  }
  get(id: string): Game {
    const r = this.db.prepare("SELECT data FROM games WHERE id=?").get(id);
    if (!r) throw Error("Adventure not found.");
    return JSON.parse(r.data as string);
  }
  mutate<T>(id: string, fn: (g: Game) => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const g = this.get(id);
      const r = fn(g);
      this.db
        .prepare("UPDATE games SET data=? WHERE id=?")
        .run(JSON.stringify(g), id);
      this.db.exec("COMMIT");
      return r;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  list(owner: string) {
    return this.db
      .prepare(
        "SELECT data FROM games WHERE owner=? ORDER BY rowid DESC LIMIT 20",
      )
      .all(owner)
      .map((r) => JSON.parse(r.data as string) as Game);
  }
  all() {
    return this.db
      .prepare("SELECT data FROM games")
      .all()
      .map((r) => JSON.parse(r.data as string) as Game);
  }
  overlay(id: string) {
    return this.db.prepare("SELECT overlay FROM games WHERE id=?").get(id)
      ?.overlay as string;
  }
  rotate(id: string) {
    this.db
      .prepare("UPDATE games SET overlay=? WHERE id=?")
      .run(randomBytes(24).toString("hex"), id);
  }
  session(id: string) {
    const r = this.db
      .prepare("SELECT data FROM auth WHERE id=? AND expires>?")
      .get(id, Date.now());
    return r ? JSON.parse(r.data as string) : null;
  }
  auth(id: string, data: unknown) {
    this.db
      .prepare("INSERT OR REPLACE INTO auth VALUES(?,?,?)")
      .run(id, JSON.stringify(data), Date.now() + 86400000);
  }
  saveToken(id: string, token: unknown, key: string) {
    const iv = randomBytes(12),
      cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
    const data = Buffer.concat([
      cipher.update(JSON.stringify(token)),
      cipher.final(),
    ]);
    this.db
      .prepare("INSERT OR REPLACE INTO tokens VALUES(?,?)")
      .run(
        id,
        JSON.stringify([
          iv.toString("hex"),
          cipher.getAuthTag().toString("hex"),
          data.toString("hex"),
        ]),
      );
  }
  token(id: string, key: string) {
    const r = this.db.prepare("SELECT data FROM tokens WHERE id=?").get(id);
    if (!r) return null;
    const [iv, tag, data] = JSON.parse(r.data as string);
    const c = createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      Buffer.from(iv, "hex"),
    );
    c.setAuthTag(Buffer.from(tag, "hex"));
    return JSON.parse(
      Buffer.concat([c.update(Buffer.from(data, "hex")), c.final()]).toString(),
    );
  }
}
