"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { runReport, type ProductSlug } from "@/lib/api";

const PRODUCTS: Record<string, { name: string }> = {
  "content-creation": { name: "Content Creation" },
  "marketing-research": { name: "Marketing Research" },
  "seo-audit": { name: "SEO Audit" },
  "new-market-research": { name: "New Market Research" },
  "social-strategy": { name: "Social Strategy" },
};

function isProduct(s: string): s is ProductSlug {
  return Object.keys(PRODUCTS).includes(s);
}

export default function RunProductPage() {
  const params = useParams();
  const router = useRouter();
  const product = params.product as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});

  if (!isProduct(product)) {
    return (
      <div className="container">
        <p>Unknown product.</p>
        <Link href="/">← Back</Link>
      </div>
    );
  }

  const update = (key: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    let body: Record<string, unknown> = {};
    try {
      if (product === "content-creation") {
        body = {
          platform: (formData.platform as string) || "instagram",
          page_link: formData.page_link as string,
          industry: formData.industry as string,
          region: formData.region as string,
          language: (formData.language as string) || "english",
          monthly_focus: (formData.monthly_focus as string) || "",
        };
      } else if (product === "marketing-research") {
        const objs = (formData.campaign_objectives as string) || "";
        body = {
          client_name: formData.client_name as string,
          website: formData.website as string,
          industry: formData.industry as string,
          region: formData.region as string,
          campaign_objectives: objs.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
        };
        if ((formData.competitor_name as string)?.trim() && (formData.competitor_website as string)?.trim()) {
          body.competitors_focus = [{ name: (formData.competitor_name as string).trim(), website: (formData.competitor_website as string).trim() }];
        }
      } else if (product === "seo-audit") {
        body = {
          website: formData.website as string,
          region: formData.region as string,
          industry: formData.industry as string,
        };
      } else if (product === "new-market-research") {
        const objs = (formData.objectives as string) || "";
        const list = objs.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
        if (list.length < 2 || list.length > 5) {
          setError("Objectives must be 2 to 5 items.");
          setLoading(false);
          return;
        }
        body = {
          research_type: (formData.research_type as string) || "startup",
          brief: formData.brief as string,
          industry: formData.industry as string,
          region: formData.region as string,
          objectives: list,
        };
        if ((formData.competitor_name as string)?.trim() && (formData.competitor_website as string)?.trim()) {
          body.competitors_focus = [{ name: (formData.competitor_name as string).trim(), website: (formData.competitor_website as string).trim() }];
        }
      } else if (product === "social-strategy") {
        const rivals = (formData.rival_instagram_handles as string) || "";
        const list = rivals.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
        if (list.length < 1) {
          setError("At least one rival Instagram handle is required.");
          setLoading(false);
          return;
        }
        body = {
          client_instagram_handle: formData.client_instagram_handle as string,
          region: formData.region as string,
          industry: formData.industry as string,
          client_name: formData.client_name as string,
          target_audience: formData.target_audience as string,
          rival_instagram_handles: list,
        };
      }

      const res = await runReport(product, body);
      setLoading(false);
      if (res.ok) setResult(res.data);
      else setError(res.error);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const pdfUrl = result && typeof result.pdf_url === "string" ? result.pdf_url : null;
  const report = result && result.report ? result.report : null;

  return (
    <div className="container">
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/">← Back</Link>
      </p>
      <h1 style={{ marginBottom: "0.5rem" }}>{PRODUCTS[product].name}</h1>

      {!result && (
        <form onSubmit={handleSubmit} className="card">
          {product === "content-creation" && (
            <>
              <div className="form-group">
                <label>Platform</label>
                <select value={(formData.platform as string) || "instagram"} onChange={(e) => update("platform", e.target.value)}>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <div className="form-group">
                <label>Page link</label>
                <input
                  type="url"
                  required
                  value={(formData.page_link as string) || ""}
                  onChange={(e) => update("page_link", e.target.value)}
                  placeholder={
                    (formData.platform as string) === "tiktok"
                      ? "https://tiktok.com/..."
                      : (formData.platform as string) === "facebook"
                        ? "https://facebook.com/..."
                        : "https://instagram.com/..."
                  }
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input type="text" required value={(formData.industry as string) || ""} onChange={(e) => update("industry", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Region</label>
                <input type="text" required value={(formData.region as string) || ""} onChange={(e) => update("region", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Language</label>
                <select value={(formData.language as string) || "english"} onChange={(e) => update("language", e.target.value)}>
                  <option value="english">English</option>
                  <option value="arabic">Arabic</option>
                </select>
              </div>
              <div className="form-group">
                <label>Monthly focus (optional)</label>
                <input type="text" value={(formData.monthly_focus as string) || ""} onChange={(e) => update("monthly_focus", e.target.value)} />
              </div>
            </>
          )}

          {product === "marketing-research" && (
            <>
              <div className="form-group">
                <label>Client name</label>
                <input type="text" required value={(formData.client_name as string) || ""} onChange={(e) => update("client_name", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input type="url" required value={(formData.website as string) || ""} onChange={(e) => update("website", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input type="text" required value={(formData.industry as string) || ""} onChange={(e) => update("industry", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Region</label>
                <input type="text" required value={(formData.region as string) || ""} onChange={(e) => update("region", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Campaign objectives (one per line or comma-separated)</label>
                <textarea value={(formData.campaign_objectives as string) || ""} onChange={(e) => update("campaign_objectives", e.target.value)} placeholder="Brand awareness&#10;Lead generation" />
              </div>
              <div className="form-group">
                <label>Competitor name (optional)</label>
                <input type="text" value={(formData.competitor_name as string) || ""} onChange={(e) => update("competitor_name", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Competitor website (optional)</label>
                <input type="url" value={(formData.competitor_website as string) || ""} onChange={(e) => update("competitor_website", e.target.value)} />
              </div>
            </>
          )}

          {product === "seo-audit" && (
            <>
              <div className="form-group">
                <label>Website</label>
                <input type="url" required value={(formData.website as string) || ""} onChange={(e) => update("website", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Region</label>
                <input type="text" required value={(formData.region as string) || ""} onChange={(e) => update("region", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input type="text" required value={(formData.industry as string) || ""} onChange={(e) => update("industry", e.target.value)} />
              </div>
            </>
          )}

          {product === "new-market-research" && (
            <>
              <div className="form-group">
                <label>Research type</label>
                <select value={(formData.research_type as string) || "startup"} onChange={(e) => update("research_type", e.target.value)}>
                  <option value="startup">Startup</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <div className="form-group">
                <label>Brief</label>
                <textarea required value={(formData.brief as string) || ""} onChange={(e) => update("brief", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input type="text" required value={(formData.industry as string) || ""} onChange={(e) => update("industry", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Region</label>
                <input type="text" required value={(formData.region as string) || ""} onChange={(e) => update("region", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Objectives (2–5 items, one per line or comma-separated)</label>
                <textarea value={(formData.objectives as string) || ""} onChange={(e) => update("objectives", e.target.value)} placeholder="Market size&#10;Competition&#10;Entry strategy" />
              </div>
              <div className="form-group">
                <label>Competitor name (optional)</label>
                <input type="text" value={(formData.competitor_name as string) || ""} onChange={(e) => update("competitor_name", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Competitor website (optional)</label>
                <input type="url" value={(formData.competitor_website as string) || ""} onChange={(e) => update("competitor_website", e.target.value)} />
              </div>
            </>
          )}

          {product === "social-strategy" && (
            <>
              <div className="form-group">
                <label>Client Instagram handle</label>
                <input type="text" required value={(formData.client_instagram_handle as string) || ""} onChange={(e) => update("client_instagram_handle", e.target.value)} placeholder="@handle" />
              </div>
              <div className="form-group">
                <label>Client name</label>
                <input type="text" required value={(formData.client_name as string) || ""} onChange={(e) => update("client_name", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Region</label>
                <input type="text" required value={(formData.region as string) || ""} onChange={(e) => update("region", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input type="text" required value={(formData.industry as string) || ""} onChange={(e) => update("industry", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Target audience</label>
                <input type="text" required value={(formData.target_audience as string) || ""} onChange={(e) => update("target_audience", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Rival Instagram handles (one per line or comma-separated, at least one)</label>
                <textarea value={(formData.rival_instagram_handles as string) || ""} onChange={(e) => update("rival_instagram_handles", e.target.value)} placeholder="@rival1&#10;@rival2" />
              </div>
            </>
          )}

          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn" disabled={loading} style={{ marginTop: "0.5rem" }}>
            {loading ? "Running…" : "Run report"}
          </button>
        </form>
      )}

      {loading && <p className="loading">Running report… This can take 5–15 minutes. Please keep this tab open.</p>}

      {result && !loading && (
        <div className="card result-card">
          <h2 style={{ marginTop: 0 }}>Result</h2>
          {pdfUrl && (
            <>
              <div className="result-actions">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-download" download>
                  Download PDF
                </a>
              </div>
              <div className="pdf-viewer-wrap">
                <iframe src={pdfUrl} title="Report PDF" className="pdf-viewer" />
              </div>
            </>
          )}
          {!pdfUrl && result.report ? (
            <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>Report completed. No PDF link available.</p>
          ) : null}
          <button type="button" className="btn" style={{ marginTop: "1rem" }} onClick={() => { setResult(null); setError(null); }}>
            Run another
          </button>
        </div>
      )}
    </div>
  );
}
