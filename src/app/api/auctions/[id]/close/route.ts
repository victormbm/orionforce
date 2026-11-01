import { NextResponse } from "next/server";
import { authenticate, forbidden, isManager, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!isManager(me)) return forbidden();
  const { id } = await params;
  const sql = getSql();
  await sql`UPDATE auction_lots SET closed = true WHERE id = ${id}`;
  return new NextResponse(null, { status: 204 });
}
