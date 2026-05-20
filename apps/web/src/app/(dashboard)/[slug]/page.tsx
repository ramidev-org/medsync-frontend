type PlaceholderPageProps = {
  params: Promise<{ slug: string }>;
};

function formatLabel(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PlaceholderPage({ params }: PlaceholderPageProps) {
  const { slug } = await params;
  const label = formatLabel(slug);

  return (
    <section className="content-card">
      <p className="content-card__eyebrow">Migration Placeholder</p>
      <h2>{label}</h2>
      <p className="auth-copy">
        This route is reserved for the Next.js port of the current Expo screen. The
        layout, spacing, and shell are already in place, so this page can be migrated
        component by component without changing the dashboard chrome.
      </p>
    </section>
  );
}
