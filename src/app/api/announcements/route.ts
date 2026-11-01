import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const rows = await sql`
    SELECT id, title, body, author_id AS "authorId", created_at AS "createdAt"
    FROM announcements ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { title, body, authorId } = await req.json();
  if (!String(title ?? "").trim() || !String(body ?? "").trim()) {
    return NextResponse.json(
      { message: "Preencha título e mensagem." },
      { status: 400 }
    );
  }
  const sql = getSql();
  const rows = await sql`
    INSERT INTO announcements (title, body, author_id)
    VALUES (${String(title).trim()}, ${String(body).trim()}, ${authorId})
    RETURNING id, title, body, author_id AS "authorId", created_at AS "createdAt"
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
