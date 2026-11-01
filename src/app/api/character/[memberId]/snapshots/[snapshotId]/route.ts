import { NextResponse } from "next/server";
import { authenticate, forbidden, isManager, unauthorized } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string; snapshotId: string }> }
) {
  const me = await authenticate(req);
  if (!me) return unauthorized();
  const { memberId, snapshotId } = await params;
  if (me.id !== memberId && !isManager(me)) return forbidden();
  const sql = getSql();
  await sql`DELETE FROM snapshots WHERE id = ${snapshotId} AND member_id = ${memberId}`;
  return new NextResponse(null, { status: 204 });
}
