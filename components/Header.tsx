"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Session {
  user: string | null;
  role: string | null;
  canAccessDashboard: boolean;
  canManageUsers: boolean;
}

export default function Header() {
  const router = useRouter();
  const [session, setSession] = useState<Session>({ user: null, role: null, canAccessDashboard: false, canManageUsers: false });

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) =>
        setSession({
          user: data.user ?? null,
          role: data.role ?? null,
          canAccessDashboard: !!data.canAccessDashboard,
          canManageUsers: !!data.canManageUsers,
        })
      )
      .catch(() => setSession({ user: null, role: null, canAccessDashboard: false, canManageUsers: false }));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  const showDashboard = session.canAccessDashboard;
  const showUsers = session.canManageUsers;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <span className="logo-name">Whizz</span>
          <span className="logo-tagline">Marketing Solutions</span>
        </Link>
        <nav className="nav">
          <Link href="/">Tools</Link>
          {showDashboard && <Link href="/dashboard">Dashboard</Link>}
          {showUsers && <Link href="/users">Users</Link>}
          {session.user && (
            <span className="user-menu">
              <span className="user-name">{session.user}</span>
              <button type="button" onClick={handleLogout} className="btn btn-ghost">
                Logout
              </button>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
