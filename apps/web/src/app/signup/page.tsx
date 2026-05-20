"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/auth-guard";

export default function SignupPage() {
  const router = useRouter();
  const [activationToken, setActivationToken] = useState("");
  const [inviteToken, setInviteToken] = useState("");

  return (
    <AuthGuard redirectAuthenticatedTo="/dashboard">
      <main className="auth-page">
        <section className="auth-card">
          <div>
            <p className="hero-eyebrow">Onboarding Links</p>
            <h1>Get started with clinic activation or staff invite</h1>
            <p className="auth-copy">
              This keeps the same onboarding model as the Expo app while we port the
              activation and invitation routes into Next.js.
            </p>
          </div>

          <div className="auth-form">
            <div className="token-card">
              <h2>Activate a clinic</h2>
              <p>Paste the activation token or open the activation route directly.</p>
              <label className="field">
                <span>Activation token</span>
                <input
                  value={activationToken}
                  onChange={(event) => setActivationToken(event.target.value)}
                  placeholder="Activation token"
                />
              </label>
              <button
                type="button"
                className="button button--primary button--full"
                onClick={() =>
                  router.push(
                    activationToken.trim()
                      ? `/activate-clinic?token=${encodeURIComponent(activationToken.trim())}`
                      : "/activate-clinic",
                  )
                }
              >
                Activate clinic
              </button>
            </div>

            <div className="token-card">
              <h2>Accept a staff invite</h2>
              <p>Paste the invite token or open the invite route directly.</p>
              <label className="field">
                <span>Invite token</span>
                <input
                  value={inviteToken}
                  onChange={(event) => setInviteToken(event.target.value)}
                  placeholder="Invite token"
                />
              </label>
              <button
                type="button"
                className="button button--secondary button--full"
                onClick={() =>
                  router.push(
                    inviteToken.trim()
                      ? `/accept-invite?token=${encodeURIComponent(inviteToken.trim())}`
                      : "/accept-invite",
                  )
                }
              >
                Accept invite
              </button>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
