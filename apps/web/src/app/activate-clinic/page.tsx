type ActivateClinicPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ActivateClinicPage({
  searchParams,
}: ActivateClinicPageProps) {
  const { token } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div>
          <p className="hero-eyebrow">Activation Route Placeholder</p>
          <h1>Clinic activation</h1>
          <p className="auth-copy">
            This route is reserved for the Next.js clinic activation flow. The token is
            already being passed through so we can connect the existing backend logic next.
          </p>
          <div className="token-preview">
            <span>Activation token</span>
            <code>{token || "No token provided"}</code>
          </div>
        </div>
      </section>
    </main>
  );
}
