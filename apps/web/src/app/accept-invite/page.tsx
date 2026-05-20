type AcceptInvitePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const { token } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div>
          <p className="hero-eyebrow">Invite Route Placeholder</p>
          <h1>Staff invite acceptance</h1>
          <p className="auth-copy">
            This route is reserved for the Next.js staff onboarding flow. The invite token
            is already wired so we can port the remaining form and verification logic next.
          </p>
          <div className="token-preview">
            <span>Invite token</span>
            <code>{token || "No token provided"}</code>
          </div>
        </div>
      </section>
    </main>
  );
}
