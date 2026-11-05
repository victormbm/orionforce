import { NextResponse } from "next/server";
import { authenticate, canLead, forbidden, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await authenticate(req))) return unauthorized();
  const sql = getSql();
  const rows = await sql`
    SELECT id, title, type, starts_at AS "startsAt", notes,
           created_by AS "createdBy", created_at AS "createdAt"
    FROM events ORDER BY starts_at ASC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!canLead(me)) return forbidden();
  const { title, type, startsAt, notes, createdBy } = await req.json();
  if (!String(title ?? "").trim() || !startsAt || !type) {
    return NextResponse.json(
      { message: "Preencha título, tipo e data." },
      { status: 400 }
    );
  }
  const sql = getSql();
  const rows = await sql`
    INSERT INTO events (title, type, starts_at, notes, created_by)
    VALUES (${String(title).trim()}, ${type}, ${startsAt}, ${notes || null}, ${createdBy})
    RETURNING id, title, type, starts_at AS "startsAt", notes,
              created_by AS "createdBy", created_at AS "createdAt"
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
