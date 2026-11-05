import { NextResponse } from "next/server";
import { authenticate, canLead, forbidden, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  if (!canLead(me)) return forbidden();
  const { id } = await params;
  const sql = getSql();
  await sql`DELETE FROM auction_lots WHERE id = ${id}`;
  return new NextResponse(null, { status: 204 });
}
