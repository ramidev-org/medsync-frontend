import { Platform } from "react-native";

type DrugLine = {
  name: string;
  qty?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

type PrintOrdonnancePayload = {
  reference: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  patientName: string;
  patientAge?: string;
  patientSex?: string;
  doctorName?: string;
  doctorSpeciality?: string;
  doctorLicenseNumber?: string;
  signedBy?: string;
  drugs: DrugLine[];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function printOrdonnanceA4(payload: PrintOrdonnancePayload) {
  if (Platform.OS !== "web") return;

  const w = window.open("", "_blank");
  if (!w) return;

  const now = new Date().toLocaleDateString("fr-FR");

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const lines =
    payload.drugs?.length
      ? payload.drugs
          .map(
            (d) => `
        <div class="rx-row">
          <div class="rx-left">
            <div class="drug-name">- ${escapeHtml(d.name || "-")}</div>
          </div>
          <div class="rx-right">Qté: ${escapeHtml(d.qty || "-")}</div>
        </div>`
          )
          .join("")
      : `<div class="rx-row">
          <div class="rx-left">- Aucun médicament</div>
          <div class="rx-right">Qté: -</div>
        </div>`;

  const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Ordonnance</title>

<style>
@page { size: A4; margin: 0; }

* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

body {
  margin: 0;
  background: #fff;
  font-family: Arial, Helvetica, sans-serif;
}

.sheet {
  width: 210mm;
  height: 297mm;
  position: relative;
  overflow: hidden;
}

/* ===== TOP BAR ===== */
.top-band {
  position: absolute;
  top: 5mm;
  left: 30mm;
  right: 20mm;
  height: 10mm;
  background: #0097a9;
  transform: skewX(15deg);
}

/* ===== CONTENT ===== */
.content {
  padding: 30mm 22mm 20mm;
}

/* HEADER GRID */
.header {
  display: grid;
  grid-template-columns: 60mm 1fr 60mm;
  align-items: start;
}

/* ===== LEFT (DOCTOR) ===== */
.doctor {
  padding-top: 8mm;
}

.doctor-name {
  font-size: 4.8mm;
  font-weight: 900;
}

.doctor-spec {
  font-size: 4mm;
  margin-top: 1mm;
}

.doctor-order {
  margin-top: 4mm;
  font-size: 3.6mm;
}

.barcode {
  margin-top: 2mm;
  width: 38mm;
  height: 8mm;
  background: repeating-linear-gradient(
    90deg,
    #000 0,
    #000 0.7mm,
    #fff 0.7mm,
    #fff 1.2mm
  );
}

.patient {
  margin-top: 2mm;
  font-size: 3.5mm;
}

/* ===== CENTER ===== */
.clinic {
  text-align: center;
  padding-top: 2mm;
  color: #007f91;
}

.clinic-name {
  font-size: 7mm;
  font-weight: 900;
}

.clinic-ar {
  font-size: 6.5mm;
  margin-top: 1mm;
}

/* ===== RIGHT ===== */
.right-info {
  text-align: right;
  padding-top: 12mm;
}

.right-ar {
  direction: rtl;
  font-size: 4mm;
}

.right-spec {
  direction: rtl;
  margin-top: 2mm;
  font-size: 4mm;
}

.meta {
  margin-top: 4mm;
  font-size: 3.5mm;
}

/* ===== LINE + TITLE ===== */
.divider {
  margin-top: 10mm;
  border-top: 0.4mm solid #111;
}

.title {
  text-align: center;
  margin-top: 4mm;
  font-size: 7mm;
  color: #007f91;
  font-weight: 900;
}

/* ===== DRUG LIST ===== */
.rx-list {
  margin-top: 10mm;
}

.rx-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6mm;
}

.drug-name {
  font-size: 4.2mm;
  font-weight: 900;
}

.rx-right {
  font-size: 4.2mm;
  font-weight: 900;
}

/* ===== WATERMARK ===== */
.watermark {
  position: absolute;
  left: 50%;
  top: 60%;
  transform: translate(-50%, -50%);
  opacity: 0.07;
}

.watermark svg {
  width: 110mm;
}

/* ===== FOOTER ===== */
.footer {
  position: absolute;
  bottom: 8mm;
  left: 12mm;
  right: 12mm;
  height: 10mm;
  background: #0097a9;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10mm;
  font-size: 3.5mm;
}
</style>
</head>

<body>
<div class="sheet">

<div class="top-band"></div>

<div class="watermark">
<svg viewBox="0 0 300 300">
<path d="M150 270 C120 230 55 180 45 115 C38 65 75 35 115 52 C135 60 145 78 150 90 C155 78 165 60 185 52 C225 35 262 65 255 115 C245 180 180 230 150 270 Z"
fill="none" stroke="#008fa0" stroke-width="16"/>
</svg>
</div>

<div class="content">

<div class="header">

<div class="doctor">
<div class="doctor-name">${escapeHtml(payload.doctorName || "")}</div>
<div class="doctor-spec">${escapeHtml(payload.doctorSpeciality || "")}</div>
<div class="doctor-order">N° d'ordre : ${escapeHtml(payload.doctorLicenseNumber || "")}</div>
<div class="barcode"></div>
<div class="patient">Nom et prénom: ${escapeHtml(payload.patientName || "")}</div>
</div>

<div class="clinic">
<div class="clinic-name">${escapeHtml(payload.clinicName || "CLINIQUE")}</div>
<div class="clinic-ar">عيادة البتراء</div>
</div>

<div class="right-info">
<div class="right-ar">فحوصات ورعاية طبية</div>
<div class="right-spec">طب عام</div>
<div class="meta">
Le: ${now} &nbsp;&nbsp; Age: ${escapeHtml(payload.patientAge || "-")}
</div>
</div>

</div>

<div class="divider"></div>
<div class="title">ORDONNANCE</div>

<div class="rx-list">
${lines}
</div>

</div>

<div class="footer">
  <div>
    ☎ ${escapeHtml(payload.clinicPhone || "0561847312")}
  </div>

  <div style="text-align:right;">
    ${escapeHtml(payload.clinicAddress || "Rue Tayeb Slimane, Soumaa, Blida")}
  </div>
</div>

</div>

<script>
window.onload = () => setTimeout(() => window.print(), 100);
</script>

</body>
</html>
`;

  w.document.write(html);
  w.document.close();
}