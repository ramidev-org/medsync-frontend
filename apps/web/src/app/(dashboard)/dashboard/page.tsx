"use client";

import { useAppData, useAuth } from "@/components/providers";
import { dashboardMetrics } from "@/lib/theme";

const tableRows = [
  { patient: "Amina K.", slot: "09:30", type: "Dermatology follow-up", status: "Confirmed" },
  { patient: "Karim B.", slot: "10:15", type: "Dental consultation", status: "Waiting" },
  { patient: "Nesrine T.", slot: "11:00", type: "Prescription renewal", status: "Ready to print" },
  { patient: "Samir H.", slot: "14:20", type: "Cardiology review", status: "Invoice pending" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { clinic, subscription, runtimeSpeciality } = useAppData();

  return (
    <div className="dashboard-grid">
      <section className="metric-grid">
        {dashboardMetrics.map((item) => (
          <article key={item.label} className="metric-card">
            <p className="metric-card__label">{item.label}</p>
            <h2>{item.value}</h2>
            <p className="metric-card__helper">{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="content-card">
        <div className="content-card__header">
          <div>
            <p className="content-card__eyebrow">Today overview</p>
            <h2>Appointments and actions</h2>
          </div>
          <button type="button" className="button button--secondary">
            Export PDF
          </button>
        </div>

        <div className="table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Time</th>
                <th>Consultation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={`${row.patient}-${row.slot}`}>
                  <td>{row.patient}</td>
                  <td>{row.slot}</td>
                  <td>{row.type}</td>
                  <td>
                    <span className="status-pill">{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-card content-card--split">
        <div>
          <p className="content-card__eyebrow">Clinic context</p>
          <h2>{clinic?.name ? String(clinic.name) : "Clinic profile loading"}</h2>
          <ul className="check-list">
            <li>Signed in as: {user?.fullname || "Unknown user"}</li>
            <li>Role: {user?.user_type || "assistant"}</li>
            <li>Speciality: {runtimeSpeciality}</li>
          </ul>
        </div>
        <div>
          <p className="content-card__eyebrow">Subscription context</p>
          <h2>{subscription.tier_plan || "No active tier yet"}</h2>
          <ul className="check-list">
            <li>Status: {subscription.status}</li>
            <li>Doctors active: {subscription.current_doctors ?? 0}</li>
            <li>Assistants active: {subscription.current_assistants ?? 0}</li>
          </ul>
        </div>
      </section>

      <section className="content-card content-card--split">
        <div>
          <p className="content-card__eyebrow">Migration note</p>
          <h2>What is already preserved</h2>
          <ul className="check-list">
            <li>Primary palette and surface system from the Expo theme</li>
            <li>Permanent left navigation pattern from the current drawer</li>
            <li>Dashboard header card feel for clinic operations pages</li>
          </ul>
        </div>
        <div>
          <p className="content-card__eyebrow">Next migration steps</p>
          <h2>What we port next</h2>
          <ul className="check-list">
            <li>Supabase auth and clinic role redirects</li>
            <li>Patients, visits, and consultations tables</li>
            <li>Prescription print and PDF document workflow</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
