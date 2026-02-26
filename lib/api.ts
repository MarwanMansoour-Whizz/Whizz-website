export type ProductSlug =
  | "content-creation"
  | "marketing-research"
  | "seo-audit"
  | "new-market-research"
  | "social-strategy";

/** Calls the internal proxy (which logs audit and forwards to Whizz API). Requires session cookie. */
export async function runReport(
  product: ProductSlug,
  body: Record<string, unknown>
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/proxy/${product}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        typeof data.error === "string"
          ? data.error
          : data.detail?.toString?.() || `Request failed (${res.status})`;
      return { ok: false, error: msg };
    }
    return { ok: true, data: data as Record<string, unknown> };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg };
  }
}
