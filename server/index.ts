import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

mkdirSync(new URL("../data", import.meta.url), { recursive: true });
const db = new DatabaseSync(new URL("../data/espresso.sqlite", import.meta.url));
db.exec("CREATE TABLE IF NOT EXISTS shots (id TEXT PRIMARY KEY, name TEXT, coffee TEXT, dose REAL, yield_grams REAL, seconds INTEGER, created_at TEXT, method TEXT NOT NULL DEFAULT 'Espresso')");
const columns = db.prepare("PRAGMA table_info(shots)").all() as { name: string }[];
if (!columns.some((column) => column.name === "method")) db.exec("ALTER TABLE shots ADD COLUMN method TEXT NOT NULL DEFAULT 'Espresso'");
const shots = db.prepare("SELECT * FROM shots ORDER BY created_at DESC");
const saveShot = db.prepare("INSERT INTO shots (id, name, coffee, dose, yield_grams, seconds, created_at, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/api/shots" && req.method === "GET") {
    res.end(JSON.stringify(shots.all()));
    return;
  }
  if (req.url !== "/api/shots" || req.method !== "POST") {
    res.statusCode = 404;
    res.end();
    return;
  }
  try {
    let text = "";
    for await (const chunk of req) text += chunk;
    const shot = JSON.parse(text);
    const values = [Number(shot.dose), Number(shot.yield), Number(shot.seconds)];
    if (!shot.name || !shot.coffee || !values.every((n) => Number.isFinite(n) && n > 0)) throw new Error();
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const method = typeof shot.method === "string" ? shot.method : "Espresso";
    saveShot.run(id, shot.name, shot.coffee, values[0], values[1], values[2], createdAt, method);
    res.statusCode = 201;
    res.end(JSON.stringify({ ...shot, id, method, yield_grams: values[1], seconds: values[2], created_at: createdAt }));
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Add a name, coffee, and positive shot values." }));
  }
}).listen(3000, "127.0.0.1");
