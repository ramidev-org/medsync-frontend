"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/providers";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { configured, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      router.replace(nextPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard redirectAuthenticatedTo="/dashboard">
      <main className="auth-page">
        <section className="auth-card">
          <div>
            <p className="hero-eyebrow">Clinic Login</p>
            <h1>Sign in to your clinic workspace</h1>
            <p className="auth-copy">
              This login is now wired to Supabase and will redirect into the Next.js
              dashboard shell using the current role-aware user metadata flow.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!configured ? (
              <div className="setup-notice">
                <p className="setup-notice__title">Supabase configuration required</p>
                <p className="setup-notice__copy">
                  Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
                  `apps/web/.env.local`, then restart the Next.js dev server.
                </p>
              </div>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={!configured}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={!configured}
              />
            </label>

            {error ? <p className="auth-error">{error}</p> : null}

            <button
              type="submit"
              className="button button--primary button--full"
              disabled={submitting || !configured}
            >
              {submitting ? "Signing in..." : "Continue"}
            </button>
          </form>

          <div className="auth-links">
            <Link href="/signup" className="button button--secondary button--full">
              Activation and invite links
            </Link>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
