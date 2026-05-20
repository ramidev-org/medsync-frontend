"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";

export function AuthGuard({
  children,
  requireAuth = false,
  redirectAuthenticatedTo,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectAuthenticatedTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!requireAuth && user && redirectAuthenticatedTo) {
      router.replace(redirectAuthenticatedTo);
    }
  }, [loading, pathname, redirectAuthenticatedTo, requireAuth, router, user]);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="loading-card">
          <div className="loading-dot" />
          <p>Loading your clinic workspace...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) return null;
  if (!requireAuth && user && redirectAuthenticatedTo) return null;

  return <>{children}</>;
}
