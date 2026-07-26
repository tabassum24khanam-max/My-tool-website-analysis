import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || './data';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const dbPath = path.join(DATA_DIR, 'intelligence.db');
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      domain TEXT PRIMARY KEY,
      report_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS traffic_snapshots (
      domain TEXT NOT NULL,
      taken_at INTEGER NOT NULL,
      rank INTEGER,
      est_monthly_visits INTEGER,
      PRIMARY KEY (domain, taken_at)
    );

    CREATE TABLE IF NOT EXISTS ai_cache (
      key TEXT PRIMARY KEY,
      response TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_companies (
      domain TEXT PRIMARY KEY,
      favourite INTEGER NOT NULL DEFAULT 0,
      saved_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL,
      searched_at INTEGER NOT NULL
    );
  `);

  return _db;
}

export function getCachedReport(domain: string): string | null {
  const db = getDb();
  const row = db
    .prepare('SELECT report_json, updated_at FROM analyses WHERE domain = ?')
    .get(domain) as { report_json: string; updated_at: number } | undefined;

  if (!row) return null;

  const ageHours = (Date.now() - row.updated_at) / (1000 * 60 * 60);
  if (ageHours > 24) return null;

  return row.report_json;
}

export function storeReport(domain: string, reportJson: string): void {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    `INSERT INTO analyses (domain, report_json, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(domain) DO UPDATE SET report_json = excluded.report_json, updated_at = excluded.updated_at`
  ).run(domain, reportJson, now, now);
}

export function storeTrafficSnapshot(
  domain: string,
  rank: number | null,
  estMonthlyVisits: number | null
): void {
  const db = getDb();
  db.prepare(
    'INSERT OR IGNORE INTO traffic_snapshots (domain, taken_at, rank, est_monthly_visits) VALUES (?, ?, ?, ?)'
  ).run(domain, Date.now(), rank, estMonthlyVisits);
}

export function getTrafficHistory(
  domain: string
): Array<{ taken_at: number; rank: number | null; est_monthly_visits: number | null }> {
  const db = getDb();
  return db
    .prepare(
      'SELECT taken_at, rank, est_monthly_visits FROM traffic_snapshots WHERE domain = ? ORDER BY taken_at ASC'
    )
    .all(domain) as Array<{
    taken_at: number;
    rank: number | null;
    est_monthly_visits: number | null;
  }>;
}

export function getCachedAi(key: string): string | null {
  const db = getDb();
  const row = db
    .prepare('SELECT response, created_at FROM ai_cache WHERE key = ?')
    .get(key) as { response: string; created_at: number } | undefined;

  if (!row) return null;
  const ageHours = (Date.now() - row.created_at) / (1000 * 60 * 60);
  if (ageHours > 72) return null;

  return row.response;
}

export function storeAiCache(key: string, response: string): void {
  const db = getDb();
  db.prepare(
    'INSERT OR REPLACE INTO ai_cache (key, response, created_at) VALUES (?, ?, ?)'
  ).run(key, response, Date.now());
}

export function getAiMode(): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'ai_mode'")
    .get() as { value: string } | undefined;
  return row?.value === 'on';
}

export function setAiMode(on: boolean): void {
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('ai_mode', ?)"
  ).run(on ? 'on' : 'off');
}

export function addSearchHistory(domain: string): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO search_history (domain, searched_at) VALUES (?, ?)'
  ).run(domain, Date.now());
}

export function getSearchHistory(
  limit = 20
): Array<{ domain: string; searched_at: number }> {
  const db = getDb();
  return db
    .prepare(
      'SELECT domain, searched_at FROM search_history ORDER BY searched_at DESC LIMIT ?'
    )
    .all(limit) as Array<{ domain: string; searched_at: number }>;
}

export function saveFavourite(domain: string): void {
  const db = getDb();
  db.prepare(
    'INSERT OR REPLACE INTO saved_companies (domain, favourite, saved_at) VALUES (?, 1, ?)'
  ).run(domain, Date.now());
}

export function removeFavourite(domain: string): void {
  const db = getDb();
  db.prepare('DELETE FROM saved_companies WHERE domain = ?').run(domain);
}

export function getSavedCompanies(): Array<{
  domain: string;
  favourite: number;
  saved_at: number;
}> {
  const db = getDb();
  return db
    .prepare(
      'SELECT domain, favourite, saved_at FROM saved_companies ORDER BY saved_at DESC'
    )
    .all() as Array<{ domain: string; favourite: number; saved_at: number }>;
}

export function getScreenshotDir(): string {
  const dir = path.join(DATA_DIR, 'screenshots');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
