import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const ALLOWED_TABLES = [
  "user",
  "project",
  "subscription",
  "user_preference",
  "template_favorite",
  "session",
  "account",
  "verification",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

// Validate a column name: only allow alphanumeric and underscores
function isValidColumnName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/* ------------------------------------------------------------------ */
/*  GET — Query any table with pagination, search, and sorting        */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const params = req.nextUrl.searchParams;
    const table = params.get("table") || "";
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(params.get("limit") || "25", 10)));
    const search = params.get("search")?.trim() || "";
    const sort = params.get("sort") || "created_at";
    const order = params.get("order") === "asc" ? "ASC" : "DESC";
    const offset = (page - 1) * limit;

    if (!isAllowedTable(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    if (!isValidColumnName(sort)) {
      return NextResponse.json({ error: "Invalid sort column" }, { status: 400 });
    }

    // Build queries using sql.raw for whitelisted table name
    const tableRef = sql.raw(`"${table}"`);
    const sortRef = sql.raw(`"${sort}"`);
    const orderRef = sql.raw(order);

    // Count total rows (with optional search)
    let totalResult;
    if (search) {
      totalResult = await db.execute(
        sql`SELECT count(*)::int as count FROM ${tableRef} WHERE ${tableRef}::text ILIKE ${"%" + search + "%"}`
      );
    } else {
      totalResult = await db.execute(
        sql`SELECT count(*)::int as count FROM ${tableRef}`
      );
    }

    const total = Number((totalResult as unknown as Record<string, unknown>[])?.[0]?.count ?? 0);

    // Fetch rows
    let rows;
    if (search) {
      rows = await db.execute(
        sql`SELECT * FROM ${tableRef} WHERE ${tableRef}::text ILIKE ${"%" + search + "%"} ORDER BY ${sortRef} ${orderRef} LIMIT ${limit} OFFSET ${offset}`
      );
    } else {
      rows = await db.execute(
        sql`SELECT * FROM ${tableRef} ORDER BY ${sortRef} ${orderRef} LIMIT ${limit} OFFSET ${offset}`
      );
    }

    const rowData = rows as unknown as Record<string, unknown>[];

    // Extract column names from the first row, or return empty
    const columns: string[] = rowData.length > 0 ? Object.keys(rowData[0] as Record<string, unknown>) : [];

    return NextResponse.json({
      rows: rowData,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      columns,
    });
  } catch (error) {
    console.error("Admin database GET error:", error);
    return NextResponse.json(
      { error: "Failed to query table" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Update a specific row by id                               */
/* ------------------------------------------------------------------ */

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const { table, id, updates } = body as {
      table: string;
      id: string;
      updates: Record<string, unknown>;
    };

    if (!table || !id || !updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Missing required fields: table, id, updates" },
        { status: 400 }
      );
    }

    if (!isAllowedTable(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const entries = Object.entries(updates);
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    // Validate all column names
    for (const [key] of entries) {
      if (!isValidColumnName(key)) {
        return NextResponse.json(
          { error: `Invalid column name: ${key}` },
          { status: 400 }
        );
      }
    }

    // Build SET clause with parameterized values
    const setClauses = entries.map(([key, value]) => {
      if (value === null) {
        return sql`${sql.raw(`"${key}"`)} = NULL`;
      }
      if (typeof value === "object") {
        return sql`${sql.raw(`"${key}"`)} = ${JSON.stringify(value)}::jsonb`;
      }
      return sql`${sql.raw(`"${key}"`)} = ${value as string | number | boolean}`;
    });

    // Combine SET clauses
    let combined = setClauses[0];
    for (let i = 1; i < setClauses.length; i++) {
      combined = sql`${combined}, ${setClauses[i]}`;
    }

    const tableRef = sql.raw(`"${table}"`);

    // Determine primary key column — template_favorite and user_preference use different PKs
    // For template_favorite, the PK is (user_id, template_id) — we'll use a composite approach
    // For user_preference, the PK is user_id
    // For all others, it's "id"
    let pkColumn: string;
    if (table === "user_preference") {
      pkColumn = "user_id";
    } else {
      pkColumn = "id";
    }

    const result = await db.execute(
      sql`UPDATE ${tableRef} SET ${combined} WHERE ${sql.raw(`"${pkColumn}"`)} = ${id} RETURNING *`
    );

    const rowData = result as unknown as Record<string, unknown>[];

    if (rowData.length === 0) {
      return NextResponse.json({ error: "Row not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, row: rowData[0] });
  } catch (error) {
    console.error("Admin database PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update row" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Delete a specific row by id                              */
/* ------------------------------------------------------------------ */

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const { table, id } = body as { table: string; id: string };

    if (!table || !id) {
      return NextResponse.json(
        { error: "Missing required fields: table, id" },
        { status: 400 }
      );
    }

    if (!isAllowedTable(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const tableRef = sql.raw(`"${table}"`);

    let pkColumn: string;
    if (table === "user_preference") {
      pkColumn = "user_id";
    } else {
      pkColumn = "id";
    }

    const result = await db.execute(
      sql`DELETE FROM ${tableRef} WHERE ${sql.raw(`"${pkColumn}"`)} = ${id} RETURNING *`
    );

    const rowData = result as unknown as Record<string, unknown>[];

    if (rowData.length === 0) {
      return NextResponse.json({ error: "Row not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin database DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete row" },
      { status: 500 }
    );
  }
}
