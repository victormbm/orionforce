import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getSql();
  await sql`UPDATE auction_lots SET closed = true WHERE id = ${id}`;
  return new NextResponse(null, { status: 204 });
}
