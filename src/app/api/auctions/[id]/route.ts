import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getSql();
  await sql`DELETE FROM auction_lots WHERE id = ${id}`;
  return new NextResponse(null, { status: 204 });
}
