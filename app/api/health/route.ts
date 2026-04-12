import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Used by Docker / load balancers; does not call the backend. */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "geniusdigital-frontend" },
    { status: 200 }
  );
}
