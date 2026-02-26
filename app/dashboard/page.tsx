"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "recharts";
import type { ByUserRow } from "@/lib/audit";

interface ByFeatureRow {
  feature: string;
  total: number;
  byUser: { user: string; count: number }[];
}

interface TimeRow {
  date: string;
  count: number;
}

const FEATURE_LABELS: Record<string, string> = {
  "content-creation": "Content Creation",
  "marketing-research": "Marketing Research",
  "seo-audit": "SEO Audit",
  "new-market-research": "New Market Research",
  "social-strategy": "Social Strategy",
};

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316"];

export default function DashboardPage() {
  const [byUser, setByUser] = useState<ByUserRow[]>([]);
  const [byFeature, setByFeature] = useState<ByFeatureRow[]>([]);
  const [overTime, setOverTime] = useState<TimeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/audit?groupBy=user", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Unauthorized"))
      ),
      fetch("/api/audit?groupBy=feature", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Unauthorized"))
      ),
      fetch("/api/audit?groupBy=time", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Unauthorized"))
      ),
    ])
      .then(([userRes, featureRes, timeRes]) => {
        setByUser(userRes.data ?? []);
        setByFeature(featureRes.data ?? []);
        setOverTime(timeRes.data ?? []);
      })
      .catch((e) => setError(e.message || "Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading">Loading dashboard…</p>
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

  const featureChartData = byFeature.map((r) => ({
    name: FEATURE_LABELS[r.feature] || r.feature,
    uses: r.total,
    fill: CHART_COLORS[byFeature.indexOf(r) % CHART_COLORS.length],
  }));

  const userChartData = byUser.map((r) => ({
    name: r.user,
    total: r.total,
  }));

  const totalUses = byUser.reduce((s, r) => s + r.total, 0);

  return (
    <div className="dashboard-container">
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/">← Back to Tools</Link>
      </p>
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">
        Who used which feature, when, and how many times.
      </p>

      <div className="dashboard-summary">
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{totalUses}</span>
          <span className="dashboard-stat-label">Total report runs</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{byUser.length}</span>
          <span className="dashboard-stat-label">Active users</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{byFeature.filter((r) => r.total > 0).length}</span>
          <span className="dashboard-stat-label">Features used</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Usage over time (last 14 days)</h2>
        <div className="dashboard-chart">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={overTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted)" fontSize={12} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="var(--muted)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                labelStyle={{ color: "var(--muted)" }}
                formatter={(value: number) => [value, "Runs"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={{ fill: "var(--accent)", r: 4 }} name="Runs" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Usage by feature</h2>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={featureChartData} layout="vertical" margin={{ top: 8, right: 24, left: 80, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted)" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="var(--muted)" fontSize={12} width={70} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(value: number) => [value, "Runs"]}
                />
                <Bar dataKey="uses" radius={[0, 4, 4, 0]} name="Runs">
                  {featureChartData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="dashboard-section-title">Usage by user</h2>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={userChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} />
                <YAxis stroke="var(--muted)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(value: number) => [value, "Total runs"]}
                />
                <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Total runs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="dashboard-section-title">By user (detail)</h2>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>User</th>
                <th className="num">Content Creation</th>
                <th className="num">Marketing Research</th>
                <th className="num">SEO Audit</th>
                <th className="num">New Market Research</th>
                <th className="num">Social Strategy</th>
                <th className="num total">Total</th>
              </tr>
            </thead>
            <tbody>
              {byUser.map((row) => (
                <tr key={row.user}>
                  <td>{row.user}</td>
                  <td className="num">{row.content_creation}</td>
                  <td className="num">{row.marketing_research}</td>
                  <td className="num">{row.seo_audit}</td>
                  <td className="num">{row.new_market_research}</td>
                  <td className="num">{row.social_strategy}</td>
                  <td className="num total">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="dashboard-section-title">By feature (who used it)</h2>
        <div className="dashboard-feature-grid">
          {byFeature.map((row) => (
            <div key={row.feature} className="dashboard-feature-card">
              <h3 className="dashboard-feature-card-title">
                {FEATURE_LABELS[row.feature] || row.feature}
                <span className="dashboard-feature-card-count">{row.total} run{row.total !== 1 ? "s" : ""}</span>
              </h3>
              <ul className="dashboard-feature-list">
                {row.byUser.map((u) => (
                  <li key={u.user}>
                    <span>{u.user}</span>
                    <span className="num">{u.count}</span>
                  </li>
                ))}
                {row.byUser.length === 0 && <li className="muted">No usage yet</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
