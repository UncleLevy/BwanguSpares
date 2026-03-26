/**
 * D1 Query Function — Drizzle-style ORM over Cloudflare D1 REST API
 * 
 * Supports: select, insert, update, delete, raw SQL, and migrations
 * 
 * POST body examples:
 *   { action: "migrate" }                          — run schema migrations
 *   { action: "select", table: "orders", where: { status: "pending" }, limit: 20 }
 *   { action: "insert", table: "orders", data: { ... } }
 *   { action: "update", table: "orders", where: { id: "abc" }, data: { status: "confirmed" } }
 *   { action: "delete", table: "orders", where: { id: "abc" } }
 *   { action: "raw", sql: "SELECT ...", params: [] }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ─── D1 REST Client ───────────────────────────────────────────────────────────

function d1Client() {
  const accountId = Deno.env.get("CF_ACCOUNT_ID");
  const databaseId = Deno.env.get("CF_D1_DATABASE_ID");
  const apiToken = Deno.env.get("CF_D1_API_TOKEN");
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`;

  async function query(sql, params = []) {
    const res = await fetch(`${baseUrl}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });
    const json = await res.json();
    if (!json.success) {
      const errMsg = json.errors?.map(e => e.message).join(", ") || "D1 query failed";
      throw new Error(errMsg);
    }
    return json.result?.[0] ?? { results: [], meta: {} };
  }

  async function exec(sql) {
    const res = await fetch(`${baseUrl}/raw`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    });
    const json = await res.json();
    if (!json.success) {
      const errMsg = json.errors?.map(e => e.message).join(", ") || "D1 exec failed";
      throw new Error(errMsg);
    }
    return json.result;
  }

  return { query, exec };
}

// ─── Schema (Drizzle-style definitions) ──────────────────────────────────────

// Each migration is a separate statement (D1 REST API requires one statement per call)
const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), event_name TEXT NOT NULL, user_email TEXT, shop_id TEXT, product_id TEXT, order_id TEXT, metadata TEXT, ip TEXT, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_events_shop ON analytics_events(shop_id)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_email)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at)`,
  `CREATE TABLE IF NOT EXISTS page_views (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), page TEXT NOT NULL, user_email TEXT, session_id TEXT, referrer TEXT, duration_ms INTEGER, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views(page)`,
  `CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at)`,
  `CREATE TABLE IF NOT EXISTS search_logs (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), query TEXT NOT NULL, user_email TEXT, results_count INTEGER DEFAULT 0, filters TEXT, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query)`,
  `CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at)`,
  `CREATE TABLE IF NOT EXISTS price_history (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), product_id TEXT NOT NULL, shop_id TEXT NOT NULL, old_price REAL, new_price REAL NOT NULL, changed_by TEXT, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_price_history_created ON price_history(created_at)`,
  `CREATE TABLE IF NOT EXISTS stock_history (id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), product_id TEXT NOT NULL, shop_id TEXT NOT NULL, old_quantity INTEGER, new_quantity INTEGER NOT NULL, reason TEXT, changed_by TEXT, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_stock_history_created ON stock_history(created_at)`,
];

// ─── Query Builder (Drizzle-style) ────────────────────────────────────────────

function buildSelect(table, { where, orderBy, limit, offset, columns } = {}) {
  const cols = columns?.length ? columns.join(", ") : "*";
  let sql = `SELECT ${cols} FROM ${table}`;
  const params = [];

  if (where && Object.keys(where).length > 0) {
    const conditions = Object.entries(where).map(([k, v]) => {
      params.push(v);
      return `${k} = ?`;
    });
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  if (orderBy) sql += ` ORDER BY ${orderBy}`;
  if (limit)   sql += ` LIMIT ${parseInt(limit)}`;
  if (offset)  sql += ` OFFSET ${parseInt(offset)}`;

  return { sql, params };
}

function buildInsert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
  return { sql, params: values };
}

function buildUpdate(table, where, data) {
  const setClauses = Object.keys(data).map(k => `${k} = ?`);
  const setParams = Object.values(data);
  const whereClauses = Object.keys(where).map(k => `${k} = ?`);
  const whereParams = Object.values(where);
  const sql = `UPDATE ${table} SET ${setClauses.join(", ")} WHERE ${whereClauses.join(" AND ")} RETURNING *`;
  return { sql, params: [...setParams, ...whereParams] };
}

function buildDelete(table, where) {
  const whereClauses = Object.keys(where).map(k => `${k} = ?`);
  const whereParams = Object.values(where);
  const sql = `DELETE FROM ${table} WHERE ${whereClauses.join(" AND ")}`;
  return { sql, params: whereParams };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, table, where, data, orderBy, limit, offset, columns, sql: rawSql, params: rawParams } = body;

    const db = d1Client();

    // ── Debug: verify credentials ──
    if (action === "debug") {
      const accountId = Deno.env.get("CF_ACCOUNT_ID");
      const databaseId = Deno.env.get("CF_D1_DATABASE_ID");
      const apiToken = Deno.env.get("CF_D1_API_TOKEN");
      console.log("Account ID:", accountId);
      console.log("Database ID:", databaseId);
      console.log("Token prefix:", apiToken?.substring(0, 8));
      // Test the token against CF /user endpoint
      const verifyRes = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: { "Authorization": `Bearer ${apiToken}` }
      });
      const verifyJson = await verifyRes.json();
      console.log("Token verify response:", JSON.stringify(verifyJson));
      // Also try listing D1 databases
      const listRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`, {
        headers: { "Authorization": `Bearer ${apiToken}` }
      });
      const listJson = await listRes.json();
      console.log("D1 list response:", JSON.stringify(listJson));
      return Response.json({ token_verify: verifyJson, d1_list: listJson });
    }

    // ── Migrate (admin-only, no user session required for setup) ──
    if (action === "migrate") {
      console.log("Running D1 migrations...");
      let count = 0;
      const errors = [];
      for (const stmt of MIGRATIONS) {
        try {
          await db.query(stmt, []);
          count++;
        } catch (e) {
          console.warn("Migration warning:", e.message, "| SQL:", stmt.substring(0, 80));
          errors.push(e.message);
        }
      }
      console.log(`D1 migrations done: ${count}/${MIGRATIONS.length} statements executed`);
      return Response.json({ success: true, message: `Migrations applied (${count}/${MIGRATIONS.length})`, tables: ["analytics_events", "page_views", "search_logs", "price_history", "stock_history"], errors });
    }

    // All other actions require auth
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // ── Raw SQL ──
    if (action === "raw") {
      if (user.role !== "admin") return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
      const result = await db.query(rawSql, rawParams || []);
      return Response.json({ success: true, results: result.results, meta: result.meta });
    }

    // ── Validate table ──
    const ALLOWED_TABLES = ["analytics_events", "page_views", "search_logs", "price_history", "stock_history"];
    if (!ALLOWED_TABLES.includes(table)) {
      return Response.json({ error: `Table "${table}" not allowed. Allowed: ${ALLOWED_TABLES.join(", ")}` }, { status: 400 });
    }

    // ── Select ──
    if (action === "select") {
      const { sql, params } = buildSelect(table, { where, orderBy, limit, offset, columns });
      console.log(`SELECT ${table}:`, sql, params);
      const result = await db.query(sql, params);
      return Response.json({ success: true, results: result.results, meta: result.meta });
    }

    // ── Insert ──
    if (action === "insert") {
      if (!data) return Response.json({ error: "data is required for insert" }, { status: 400 });
      const { sql, params } = buildInsert(table, data);
      console.log(`INSERT ${table}:`, sql, params);
      const result = await db.query(sql, params);
      return Response.json({ success: true, results: result.results, meta: result.meta });
    }

    // ── Update ──
    if (action === "update") {
      if (!where || !data) return Response.json({ error: "where and data are required for update" }, { status: 400 });
      const { sql, params } = buildUpdate(table, where, data);
      console.log(`UPDATE ${table}:`, sql, params);
      const result = await db.query(sql, params);
      return Response.json({ success: true, results: result.results, meta: result.meta });
    }

    // ── Delete ──
    if (action === "delete") {
      if (!where) return Response.json({ error: "where is required for delete" }, { status: 400 });
      const { sql, params } = buildDelete(table, where);
      console.log(`DELETE ${table}:`, sql, params);
      const result = await db.query(sql, params);
      return Response.json({ success: true, meta: result.meta });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error("D1 query error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});