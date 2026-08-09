import * as Print from "expo-print";
import { Alert, Platform } from "react-native";

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

function buildOrdonnanceHtml(payload: PrintOrdonnancePayload) {
  const now = new Date().toLocaleDateString("fr-FR");

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
<div style="padding:12px 16px; border-bottom:1px solid #dbe3ea; font-family:Arial, Helvetica, sans-serif; display:flex; justify-content:space-between; gap:12px; align-items:center;">
  <div style="font-size:12px; color:#476072;">
    Ordonnance ouverte. Si l'impression automatique ne demarre pas, utilisez le bouton Imprimer.
  </div>
  <button onclick="window.print()" style="border:none; background:#0097a9; color:#fff; padding:10px 14px; border-radius:8px; font-weight:700; cursor:pointer;">
    Imprimer
  </button>
</div>
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
window.onload = () => {
  setTimeout(() => {
    try {
      window.focus();
      window.print();
    } catch (error) {
      console.warn('Auto print failed', error);
    }
  }, 150);
};
</script>

</body>
</html>
`;

  return html;
}

function isEmbeddedBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("vscode") || ua.includes("electron") || ua.includes("webview");
}

function openInlinePrintPreview(html: string) {
  if (typeof document === "undefined") return;
  if (!html || typeof html !== "string") {
    Alert.alert("Impression", "Le document d'ordonnance est vide.");
    return;
  }

  const existing = document.getElementById("ordonnance-inline-preview-root");
  existing?.remove();

  const root = document.createElement("div");
  root.id = "ordonnance-inline-preview-root";
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.zIndex = "9999";
  root.style.background = "rgba(15, 23, 42, 0.58)";
  root.style.display = "flex";
  root.style.alignItems = "center";
  root.style.justifyContent = "center";
  root.style.padding = "20px";

  const panel = document.createElement("div");
  panel.style.width = "min(1120px, 100%)";
  panel.style.height = "min(92vh, 100%)";
  panel.style.background = "#f8fafc";
  panel.style.borderRadius = "18px";
  panel.style.boxShadow = "0 24px 64px rgba(15, 23, 42, 0.24)";
  panel.style.overflow = "hidden";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";

  const toolbar = document.createElement("div");
  toolbar.style.display = "flex";
  toolbar.style.alignItems = "center";
  toolbar.style.justifyContent = "space-between";
  toolbar.style.gap = "12px";
  toolbar.style.padding = "14px 18px";
  toolbar.style.borderBottom = "1px solid #dbe3ea";
  toolbar.style.background = "#ffffff";

  const label = document.createElement("div");
  label.textContent = "Apercu ordonnance";
  label.style.fontFamily = "Arial, Helvetica, sans-serif";
  label.style.fontWeight = "700";
  label.style.color = "#10233b";

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.alignItems = "center";
  actions.style.gap = "10px";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "Fermer";
  closeBtn.style.border = "1px solid #c7d4df";
  closeBtn.style.background = "#fff";
  closeBtn.style.color = "#10233b";
  closeBtn.style.padding = "10px 14px";
  closeBtn.style.borderRadius = "10px";
  closeBtn.style.fontWeight = "700";
  closeBtn.style.cursor = "pointer";

  const printBtn = document.createElement("button");
  printBtn.type = "button";
  printBtn.textContent = "Imprimer";
  printBtn.style.border = "none";
  printBtn.style.background = "#0097a9";
  printBtn.style.color = "#fff";
  printBtn.style.padding = "10px 14px";
  printBtn.style.borderRadius = "10px";
  printBtn.style.fontWeight = "700";
  printBtn.style.cursor = "pointer";

  const frame = document.createElement("iframe");
  frame.style.flex = "1";
  frame.style.width = "100%";
  frame.style.border = "0";
  frame.srcdoc = html;
  if (frame.srcdoc !== html) {
    frame.src = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }

  closeBtn.onclick = () => root.remove();
  root.onclick = (event) => {
    if (event.target === root) root.remove();
  };
  printBtn.onclick = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {}
  };

  actions.append(closeBtn, printBtn);
  toolbar.append(label, actions);
  panel.append(toolbar, frame);
  root.append(panel);
  document.body.append(root);
}

export async function printOrdonnanceA4(payload: PrintOrdonnancePayload) {
  const html = buildOrdonnanceHtml(payload);
  if (!html || typeof html !== "string") {
    Alert.alert("Impression", "Impossible de generer l'ordonnance.");
    return;
  }

  if (Platform.OS !== "web") {
    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.error("Failed to print ordonnance:", error);
      Alert.alert("Impression", "Impossible d'imprimer cette ordonnance pour le moment.");
    }
    return;
  }

  if (isEmbeddedBrowser()) {
    openInlinePrintPreview(html);
    return;
  }

  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) {
    openInlinePrintPreview(html);
    return;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();
  try {
    w.focus();
  } catch {}
}
