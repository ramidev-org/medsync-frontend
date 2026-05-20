type WorkspacePlaceholderProps = {
  params: Promise<{ slug: string }>;
};

function formatWorkspace(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function WorkspacePlaceholderPage({
  params,
}: WorkspacePlaceholderProps) {
  const { slug } = await params;

  return (
    <section className="content-card">
      <p className="content-card__eyebrow">Specialty Workspace</p>
      <h2>{formatWorkspace(slug)}</h2>
      <p className="auth-copy">
        This page is the placeholder for the specialty workspace migration. It is where
        we will port the React Native consultation tools into web-native Next.js screens,
        starting with the most browser-dependent workflows first.
      </p>
    </section>
  );
}
