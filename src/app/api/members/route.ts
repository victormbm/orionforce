import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const rows = await sql`
    SELECT id, nickname, class_id AS "classId", guild_role AS "guildRole",
           status, discord, created_at AS "createdAt"
    FROM members
    ORDER BY created_at ASC
  `;
  return NextResponse.json(rows);
}
