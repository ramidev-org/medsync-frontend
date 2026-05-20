"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppData, useAuth } from "@/components/providers";
import { dashboardNav } from "@/lib/theme";

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { clinic, runtimeRole, runtimeSpeciality, subscription } = useAppData();

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark">MD</div>
          {!collapsed ? (
            <div>
              <p className="sidebar__brand-title">
                {clinic?.name ? String(clinic.name) : "MyDoctor"}
              </p>
              <p className="sidebar__brand-copy">
                {user?.fullname || "Clinic operations cloud"}
              </p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="sidebar__toggle"
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>

        <nav className="sidebar__nav">
          {dashboardNav.map((section) => (
            <div key={section.section} className="sidebar__section">
              {!collapsed ? <p className="sidebar__section-title">{section.section}</p> : null}
              <div className="sidebar__items">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar__link ${active ? "is-active" : ""}`}
                    >
                      <span className="sidebar__link-icon">{collapsed ? item.short : item.short[0]}</span>
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed ? (
          <div className="sidebar__footer">
            <div className="sidebar__meta">
              <p>{runtimeRole === "doctor" ? "Doctor account" : "Assistant account"}</p>
              <span>{runtimeSpeciality || subscription.tier_plan || "Clinic workspace"}</span>
            </div>
            <button type="button" className="sidebar__signout" onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        ) : null}
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-topbar__eyebrow">Next.js Migration Shell</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="dashboard-topbar__actions">
            <button type="button" className="button button--secondary">
              Print Preview
            </button>
            <button type="button" className="button button--primary">
              New Consultation
            </button>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
