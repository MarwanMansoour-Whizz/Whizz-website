import { NextRequest, NextResponse } from "next/server";
import { fetch as undiciFetch, Agent } from "undici";
import { getSessionFromToken, getSessionCookieName } from "@/lib/auth";
import { logAudit, type FeatureSlug } from "@/lib/audit";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes – match Cloud Run
const longFetchAgent = new Agent({
  headersTimeout: TIMEOUT_MS,
  bodyTimeout: TIMEOUT_MS,
});

const FEATURES: FeatureSlug[] = [
  "content-creation",
  "marketing-research",
  "seo-audit",
  "new-market-research",
  "social-strategy",
];

function isFeature(s: string): s is FeatureSlug {
  return FEATURES.includes(s as FeatureSlug);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ feature: string }> }
) {
  const { feature } = await params;
  if (!isFeature(feature)) {
    return NextResponse.json({ error: "Unknown feature" }, { status: 400 });
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSessionFromToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = (process.env.WHIZZ_API_URL || "").replace(/\/$/, "");
  if (!base) {
    return NextResponse.json(
      { error: "WHIZZ_API_URL is not configured" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = `${base}/${feature}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log("[PROXY] Forwarding to Whizz API:", url);
    const res = await undiciFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      dispatcher: longFetchAgent,
    });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    console.log("[PROXY] Whizz API response:", res.status, res.ok ? "OK" : "FAIL", res.statusText);
    if (!res.ok) {
      console.log("[PROXY] Response body:", JSON.stringify(data).slice(0, 500));
    }

    if (res.ok) {
      await logAudit(session.user, feature);
    }

    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    clearTimeout(timeoutId);
    const isTimeout = e instanceof Error && e.name === "AbortError";
    const msg = isTimeout
      ? "Whizz API did not respond within 30 minutes. The request may still be running on Cloud Run."
      : e instanceof Error
        ? e.message
        : "Proxy error";
    console.error("[PROXY] Error calling Whizz API:", e);
    return NextResponse.json(
      { error: msg, detail: "Whizz API request failed" },
      { status: 502 }
    );
  }
}
