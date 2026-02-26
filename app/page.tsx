import Link from "next/link";

const products = [
  { slug: "content-creation", name: "Content Creation", desc: "Content calendar from Instagram, TikTok, or Facebook." },
  { slug: "marketing-research", name: "Marketing Research", desc: "Client marketing research and campaign objectives." },
  { slug: "seo-audit", name: "SEO Audit", desc: "SEO audit for a website." },
  { slug: "new-market-research", name: "New Market Research", desc: "Startup or company market research." },
  { slug: "social-strategy", name: "Social Strategy", desc: "Social strategy for client Instagram and rivals." },
] as const;

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Feel the Buzz of Innovation</h1>
          <p className="hero-tagline">Where Speed Meets Strategy — Whizz API Dashboard</p>
          <p className="hero-desc">Internal tools for content creation, marketing research, SEO audit, and more.</p>
        </div>
      </section>
      <div className="container">
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>Tools</h2>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Choose a product to run a report.
        </p>
        <div className="feature-cards">
          {products.map(({ slug, name, desc }) => (
            <Link key={slug} href={`/run/${slug}`} className="feature-card">
              <strong>{name}</strong>
              <p>{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
