import { NextRequest, NextResponse } from "next/server";
import { getSessionFromToken, getSessionCookieName, canAccessAudit } from "@/lib/auth";
import { getAggregatesByUser, getAggregatesByFeature, getUsageOverTime } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSessionFromToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessAudit(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const groupBy = request.nextUrl.searchParams.get("groupBy") || "user";
  try {
    if (groupBy === "feature") {
      const data = await getAggregatesByFeature();
      return NextResponse.json({ groupBy: "feature", data });
    }
    if (groupBy === "time") {
      const data = await getUsageOverTime(14);
      return NextResponse.json({ groupBy: "time", data });
    }
    const data = await getAggregatesByUser();
    return NextResponse.json({ groupBy: "user", data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Dashboard query failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
