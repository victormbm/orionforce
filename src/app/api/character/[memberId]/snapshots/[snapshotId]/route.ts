import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ memberId: string; snapshotId: string }> }
) {
  const { memberId, snapshotId } = await params;
  const sql = getSql();
  await sql`DELETE FROM snapshots WHERE id = ${snapshotId} AND member_id = ${memberId}`;
  return new NextResponse(null, { status: 204 });
}
