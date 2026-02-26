"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface UserRow {
  id: number;
  username: string;
  canAccessDashboard: boolean;
  canManageUsers: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDashboard, setNewDashboard] = useState(false);
  const [newUsers, setNewUsers] = useState(false);
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [passwordId, setPasswordId] = useState<number | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function loadUsers() {
    setLoading(true);
    setError(null);
    fetch("/api/users", { credentials: "include" })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.error || "Failed to load")));
        return r.json();
      })
      .then((data) => setUsers(data.users ?? []))
      .catch((e) => setError(e.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function showMsg(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    const username = newUsername.trim().toLowerCase();
    if (!username || !newPassword) {
      setMessage("Username and password required");
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          password: newPassword,
          canAccessDashboard: newDashboard,
          canManageUsers: newUsers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      setNewUsername("");
      setNewPassword("");
      setNewDashboard(false);
      setNewUsers(false);
      showMsg("User created");
      loadUsers();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleDashboard(user: UserRow) {
    setUpdatingId(user.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ canAccessDashboard: !user.canAccessDashboard }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, canAccessDashboard: !u.canAccessDashboard } : u
        )
      );
      showMsg("Dashboard access updated");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleUsers(user: UserRow) {
    setUpdatingId(user.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ canManageUsers: !user.canManageUsers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, canManageUsers: !u.canManageUsers } : u
        )
      );
      showMsg("Users access updated");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSetPassword(userId: number) {
    if (!passwordValue || passwordValue.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }
    setMessage(null);
    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: passwordValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set password");
      setPasswordId(null);
      setPasswordValue("");
      showMsg("Password updated");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to set password");
    }
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    setDeletingId(user.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showMsg("User deleted");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading">Loading users…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <p className="error-msg">{error}</p>
        <Link href="/">← Back to Tools</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">User management</h1>
      <Link href="/" className="back-link">
        ← Back to Tools
      </Link>

      {message && (
        <p className={message.startsWith("User") || message.includes("updated") ? "success-msg" : "error-msg"}>
          {message}
        </p>
      )}

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Add user</h2>
        <form onSubmit={handleAddUser} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span className="muted">Username</span>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="username"
              autoComplete="off"
              style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", minWidth: 140 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span className="muted">Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="password"
              autoComplete="new-password"
              style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", minWidth: 140 }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "fit-content", marginTop: "1.25rem" }}>
            <input
              type="checkbox"
              checked={newDashboard}
              onChange={(e) => setNewDashboard(e.target.checked)}
            />
            <span className="muted">Dashboard access</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "fit-content", marginTop: "1.25rem" }}>
            <input
              type="checkbox"
              checked={newUsers}
              onChange={(e) => setNewUsers(e.target.checked)}
            />
            <span className="muted">Users access</span>
          </label>
          <button type="submit" className="btn" disabled={adding}>
            {adding ? "Adding…" : "Add user"}
          </button>
        </form>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Users</h2>
        {users.length === 0 ? (
          <p className="muted">No users in database. Add one above or run the seed script.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Username</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Dashboard access</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Users access</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Set password</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.5rem 0.75rem" }}>{user.username}</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.9rem" }}
                        disabled={updatingId === user.id}
                        onClick={() => handleToggleDashboard(user)}
                      >
                        {updatingId === user.id ? "…" : user.canAccessDashboard ? "Yes" : "No"}
                      </button>
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.9rem" }}
                        disabled={updatingId === user.id}
                        onClick={() => handleToggleUsers(user)}
                      >
                        {updatingId === user.id ? "…" : user.canManageUsers ? "Yes" : "No"}
                      </button>
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      {passwordId === user.id ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <input
                            type="password"
                            value={passwordValue}
                            onChange={(e) => setPasswordValue(e.target.value)}
                            placeholder="New password"
                            autoComplete="new-password"
                            style={{ padding: "0.35rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", width: 120 }}
                          />
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.9rem" }}
                            onClick={() => handleSetPassword(user.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.9rem" }}
                            onClick={() => { setPasswordId(null); setPasswordValue(""); }}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.9rem" }}
                          onClick={() => setPasswordId(user.id)}
                        >
                          Set password
                        </button>
                      )}
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.9rem", background: "var(--error)" }}
                        disabled={deletingId === user.id}
                        onClick={() => handleDelete(user)}
                      >
                        {deletingId === user.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
