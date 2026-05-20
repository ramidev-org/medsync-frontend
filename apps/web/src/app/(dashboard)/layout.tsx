import { AuthGuard } from "@/components/auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requireAuth>
      <DashboardShell
        title="Clinic dashboard"
        subtitle="A Next.js-first shell that preserves the current theme and navigation structure while preparing the app for desktop operations."
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
