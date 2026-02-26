import { NextRequest, NextResponse } from "next/server";
import { verifyUser, createSession, getSessionCookieName, isPasswordConfigured } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = (body.username as string)?.trim()?.toLowerCase();
    const password = body.password;
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }
    const allowedUsers = ["admin", "ziad", "amira", "may", "maysara", "heba"];
    if (!allowedUsers.includes(username)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const configured = await isPasswordConfigured(username);
    if (!configured) {
      return NextResponse.json(
        {
          error:
            "Password not configured. Add this user in the Users page (admin/ziad) or set the *_PASSWORD_HASH env var in .env.local.",
        },
        { status: 503 }
      );
    }

    const result = await verifyUser(username, password);
    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSession(result.username, result.canAccessDashboard, result.canManageUsers);
    const res = NextResponse.json({
      user: result.username,
      role: result.username,
      canAccessDashboard: result.canAccessDashboard,
      canManageUsers: result.canManageUsers,
    });
    res.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
