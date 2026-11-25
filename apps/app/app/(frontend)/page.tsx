import Link from 'next/link';
export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">
          FIELDNOTES / SaaS starter
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/login">Log in</Link>
          <Link className="button" href="/sign-up">
            Get started
          </Link>
        </nav>
      </header>
      <section className="hero">
        <p className="eyebrow">A clear foundation for your next product</p>
        <h1>Build your product. Start with the essentials.</h1>
        <p className="hero-copy">
          A focused SaaS starter with Better Auth for your customers and Payload for your content
          and admin workflows.
        </p>
        <div className="hero-actions">
          <Link className="button" href="/sign-up">
            Create an account
          </Link>
          <Link className="button secondary" href="/admin">
            Open the CMS
          </Link>
        </div>
      </section>
    </main>
  );
}
