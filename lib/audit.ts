import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type FeatureSlug =
  | "content-creation"
  | "marketing-research"
  | "seo-audit"
  | "new-market-research"
  | "social-strategy";

export async function logAudit(user: string, feature: FeatureSlug): Promise<void> {
  await prisma.auditLog.create({
    data: { user, feature },
  });
}

export interface ByUserRow {
  user: string;
  content_creation: number;
  marketing_research: number;
  seo_audit: number;
  new_market_research: number;
  social_strategy: number;
  total: number;
}

export async function getAggregatesByUser(): Promise<ByUserRow[]> {
  const rows = await prisma.auditLog.groupBy({
    by: ["user"],
    _count: { id: true },
  });
  const byFeature = await prisma.auditLog.groupBy({
    by: ["user", "feature"],
    _count: { id: true },
  });
  const userMap = new Map<string, ByUserRow>();
  for (const r of rows) {
    userMap.set(r.user, {
      user: r.user,
      content_creation: 0,
      marketing_research: 0,
      seo_audit: 0,
      new_market_research: 0,
      social_strategy: 0,
      total: r._count.id,
    });
  }
  for (const r of byFeature) {
    const row = userMap.get(r.user);
    if (!row) continue;
    const key = r.feature.replace(/-/g, "_") as keyof Omit<ByUserRow, "user" | "total">;
    if (key in row && typeof (row as unknown as Record<string, number>)[key] === "number") {
      (row as unknown as Record<string, number>)[key] = r._count.id;
    }
  }
  return Array.from(userMap.values()).sort((a, b) => a.user.localeCompare(b.user));
}

export interface ByFeatureRow {
  feature: string;
  total: number;
  byUser: { user: string; count: number }[];
}

export async function getAggregatesByFeature(): Promise<ByFeatureRow[]> {
  const features: FeatureSlug[] = [
    "content-creation",
    "marketing-research",
    "seo-audit",
    "new-market-research",
    "social-strategy",
  ];
  const result: ByFeatureRow[] = [];
  for (const feature of features) {
    const byUser = await prisma.auditLog.groupBy({
      by: ["user"],
      where: { feature },
      _count: { id: true },
    });
    const total = byUser.reduce((s, r) => s + r._count.id, 0);
    result.push({
      feature,
      total,
      byUser: byUser.map((r) => ({ user: r.user, count: r._count.id })),
    });
  }
  return result;
}

export interface UsageOverTimeRow {
  date: string;
  count: number;
}

/** Usage count per day for the last 14 days. */
export async function getUsageOverTime(days = 14): Promise<UsageOverTimeRow[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "asc" },
  });
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  const byDate = new Map<string, number>();
  for (let d = 0; d < days; d++) {
    const date = new Date(cutoff);
    date.setDate(date.getDate() + d);
    byDate.set(date.toISOString().slice(0, 10), 0);
  }
  for (const log of logs) {
    const t = new Date(log.timestamp);
    if (t < cutoff) continue;
    const key = t.toISOString().slice(0, 10);
    if (byDate.has(key)) byDate.set(key, (byDate.get(key) ?? 0) + 1);
  }
  return Array.from(byDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
