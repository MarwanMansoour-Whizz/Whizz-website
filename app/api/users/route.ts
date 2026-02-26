import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getSessionFromToken, getSessionCookieName, canManageUsers } from "@/lib/auth";
import { prisma } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSessionFromToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageUsers(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { username: "asc" },
      select: {
        id: true,
        username: true,
        canAccessDashboard: true,
        canManageUsers: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list users";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSessionFromToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageUsers(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { username?: string; password?: string; canAccessDashboard?: boolean; canManageUsers?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = (body.username as string)?.trim()?.toLowerCase();
  const password = body.password;
  const canAccessDashboard = !!body.canAccessDashboard;
  const canManageUsers = !!body.canManageUsers;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }
  if (username.length < 2) {
    return NextResponse.json(
      { error: "Username must be at least 2 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { username },
  }).catch(() => null);
  if (existing) {
    return NextResponse.json(
      { error: "A user with this username already exists" },
      { status: 409 }
    );
  }

  try {
    const passwordHash = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        canAccessDashboard,
        canManageUsers,
      },
      select: {
        id: true,
        username: true,
        canAccessDashboard: true,
        canManageUsers: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create user";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
