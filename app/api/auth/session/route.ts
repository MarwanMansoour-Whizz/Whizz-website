import { NextRequest, NextResponse } from "next/server";
import { getSessionFromToken, getSessionCookieName } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ user: null, role: null, canAccessDashboard: false, canManageUsers: false });
  }
  const session = await getSessionFromToken(token);
  if (!session) {
    return NextResponse.json({ user: null, role: null, canAccessDashboard: false, canManageUsers: false });
  }
  return NextResponse.json({
    user: session.user,
    role: session.role,
    canAccessDashboard: session.canAccessDashboard,
    canManageUsers: session.canManageUsers,
  });
}
