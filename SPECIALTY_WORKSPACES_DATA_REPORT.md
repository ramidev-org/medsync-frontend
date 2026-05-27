# Specialty Workspaces Data Report (Schema + Clinical Field Gaps)

Date: 2026-05-26

## Algeria localization notes (applied in this version)

- This report is adapted for Algeria practice context.
- Gynecology/obstetrics fields are framed for prenatal, maternal, and general gynecology care.
- Elective-abortion style data requirements are removed from the recommended default dataset.
- Legal/ethics workflows should still be validated with your clinic legal advisor and Ministry-approved protocols before production.

## Scope reviewed

- Workspaces in app:
  - `dentistry`
  - `dermatology`
  - `orthopedics`
  - `gynecology`
  - `cardiology`
  - `analyses-medicales`
- Current schema (provided JSON) with focus on:
  - `consultations.speciality_key`, `consultations.speciality_payload`
  - `consultation_parameters`, `consultation_vitals`, `consultation_diagnoses`, `consultation_documents`
  - `doctor_profiles`, `virtual_clinics`, `doctor_specialities`

---

## 1) What is currently missing (high level)

1. **No structured per-specialty schema**  
   Most specialty data is either UI-only state or generic text fields; hard to query, audit, and report.

2. **`consultation_parameters` is diabetes/general-biased**  
   Fields like `glycemie`, `hba1c` are useful, but cardiology/dermatology/dentistry/orthopedics/gynecology need their own structured fields.

3. **No strong doctor-specialty data model**  
   `doctor_profiles.speciality` is plain text; no many-to-many mapping for doctors with multiple specialties/subspecialties.

4. **Analyses workspace is not yet specialty-driven**  
   It lacks “ordered by specialty profile”, panel templates, and specialty-specific result views/flags.

---

## 2) Current workspace capture vs recommended minimum dataset

## Cardiology

Current UI captures:
- Chest pain, dyspnea, palpitations, exam, conclusion.

Recommended add:
- Symptom characterization: onset, duration, triggers, exertional/rest, radiation.
- ACS risk context: prior CAD, risk factors, family history.
- ECG summary structured fields.
- Troponin series (time/value/unit) and delta.
- Hemodynamic status, red flags.
- Assessment score(s) (example: HEART-like structured fields, even if score computed app-side).
- Plan: urgency level, imaging/lab orders, disposition.

Why: Chest pain assessment guidelines emphasize history, ECG, and troponin as core decision inputs.

## Dermatology

Current UI captures:
- Complaint, topography, aspect, exam, conclusion.
- In broader components: lesion logs/photos/markers exist but not normalized in DB.

Recommended add:
- Lesion-level structure: site, morphology, size, color, border, asymmetry, evolution, symptoms.
- Dermoscopy findings.
- Photo metadata: body site, date, scale marker, follow-up comparison link.
- Provisional diagnosis + differential + biopsy decision.
- Severity/extent scores when relevant (condition-specific).

Why: ABCDE/evolution style lesion documentation and longitudinal photo comparison are critical.

## Orthopedics

Current UI captures:
- Joint selection + range-of-motion (ROM) measurements.

Recommended add:
- Pain score and pain location map.
- Injury mechanism, onset, functional limitation.
- Exam structure: inspection/palpation, instability tests, neurovascular status.
- ROM with side, active vs passive, pain-limited flag.
- Strength grading (0–5), gait findings.
- Imaging findings link (XR/MRI/US), diagnosis, rehab plan.

Why: MSK documentation usually requires ROM + strength + neurovascular + function.

## Gynecology

Current UI captures:
- LMP/cycle/pregnancy status, exam text, tests text, assessment/plan text.

Recommended add:
- Reproductive profile: gravida/para/living, prior C-sections, prior pregnancy losses (clinically relevant).
- Menstrual details: cycle length, flow, dysmenorrhea.
- Pregnancy profile: gestational dating method, risk factors, warning symptoms.
- Sexual/reproductive health fields: contraception, STI risk/testing.
- Structured antenatal contacts and required screenings by gestational age.
- Maternal/fetal monitoring milestones (if obstetric use case).

Why: ANC workflows are timing-based and require structured, repeated data over pregnancy timeline.

## Dentistry

Current UI captures:
- Tooth selection, procedures, odontogram-like state, treatment history panel.

Recommended add:
- Structured odontogram table (tooth + surface + status/procedure + timestamp + provider).
- Periodontal charting (probing depth, bleeding on probing, recession, mobility, furcation).
- Dental diagnosis coding and treatment plan by tooth.
- Procedure episode data (planned/in-progress/completed, material used, note).
- Imaging linkage per tooth/quadrant.

Why: Dental records should support objective charting, periodontal findings, and procedure traceability.

## Analyses médicales (Lab workspace)

Current UI behavior:
- Generic request/manual entry/details/history/report flow (good UX), but data is not specialty-governed.

Recommended add:
- Specialty-based test ordering templates.
- Order structure:
  - test code (LOINC or internal mapped code),
  - specimen type,
  - collection datetime,
  - method/analyzer (optional),
  - result value + unit + reference range + interpretation flag.
- Critical value flags + acknowledgment workflow.
- Result trend view by patient/test and by specialty.
- “Doctor-specific profile” controlling:
  - visible panels,
  - default tests,
  - custom reference ranges or alert thresholds (where clinically valid).

Why: Lab interoperability and safe clinical interpretation depend on structured result fields (code/unit/reference range/interpretation/specimen/time).

---

## 3) Database upgrades recommended

## A. Normalize doctor-specialty relation

Current gap:
- `doctor_profiles.speciality` is single text.

Add:
- `doctor_profile_specialities`  
  - `id`, `doctor_id`, `speciality_id`, `is_primary`, `active`, `created_at`.

Benefit:
- One doctor can have multiple specialties/subspecialties.
- Workspaces and analysis templates can be assigned correctly.

## B. Add structured specialty payload tables (instead of only JSON)

Keep `consultations.speciality_payload` for compatibility, but add normalized tables:

- `consultation_cardiology`
- `consultation_dermatology`
- `consultation_orthopedics`
- `consultation_gynecology`
- `consultation_dentistry`

Each with:
- `consultation_id` (unique FK), structured fields, `created_at`, `updated_at`.

Benefit:
- Queryability, analytics, alerts, reporting, cleaner validation.

## C. Add lab domain tables

Recommended:

- `lab_test_catalog`
  - `id`, `code` (LOINC/internal), `name`, `specimen_type_default`, `unit_default`, `active`.
- `lab_test_panels`
  - `id`, `speciality_key`, `name`, `description`, `active`.
- `lab_test_panel_items`
  - `panel_id`, `test_id`, `sort_order`, `required`.
- `lab_orders`
  - `id`, `clinic_id`, `patient_id`, `doctor_id`, `consultation_id`, `speciality_key`, `priority`, `status`, `ordered_at`.
- `lab_order_items`
  - `id`, `order_id`, `test_id`, `specimen_type`, `collected_at`, `result_status`.
- `lab_results`
  - `id`, `order_item_id`, `value_text`, `value_numeric`, `unit`, `reference_range_text`, `interpretation`, `reported_at`, `critical_flag`.

Benefit:
- Full specialty-driven analyses workflow, trend and alert features, cleaner reporting.

## D. Add configuration tables for doctor-specific fields/views

- `speciality_field_definitions`
  - define per-specialty fields (key, label, type, required, options, validation).
- `doctor_field_preferences`
  - doctor-level visibility/order/defaults for those fields.

Benefit:
- “Each doctor has his own fields” without hardcoding UI per user.

## E. Improve coding and standards mapping

- Map diagnosis to ICD-10/SNOMED where possible.
- Map lab tests to LOINC.
- Keep units standardized (UCUM where feasible).

---

## 4) What to do in Analyses workspace specifically

For each specialty, create default panels:

- **Cardiology**: troponin, CK-MB (if used), lipid profile, BNP/NT-proBNP, electrolytes, renal function.
- **Gynecology/Obstetrics**: CBC, blood group/Rh, glucose tests, urinalysis, infection screening (per local protocol).
- **Dermatology**: inflammation/basic panels as needed, biopsy/pathology linkage.
- **Orthopedics**: inflammatory markers, metabolic bone profile (when indicated), pre-op labs.
- **Dentistry**: mainly pre-procedural or systemic-risk related tests when needed.

And enforce:

1. Doctor picks specialty context (or inherited from consultation).  
2. UI loads specialty panels + optional custom tests.  
3. Result entry requires: value, unit, reference range, interpretation, timestamp.  
4. Abnormal/critical flags route to responsible doctor.  
5. Trend graph by test over time in patient profile.

Algeria-specific default policy in this workspace:

- Keep gynecology templates focused on prenatal follow-up, maternal risk screening, infection/anemia/metabolic monitoring, and non-pregnancy gynecology investigations.
- Do not expose elective-termination workflow fields in default gynecology panels.
- If sensitive legal cases must be recorded, use restricted-access fields + audit logging, not standard clinic-wide templates.

---

## 5) Priority implementation plan

## Phase 1 (fast wins)

- Add `doctor_profile_specialities`.
- Add lab tables (`lab_orders`, `lab_order_items`, `lab_results`, `lab_test_catalog`).
- Connect analyses workspace to these tables.

## Phase 2

- Add specialty consultation tables (cardio/derm/ortho/gyn/dentistry).
- Persist current workspace state into normalized tables.

## Phase 3

- Add dynamic field definitions + doctor preferences.
- Add coding normalization (LOINC/ICD/SNOMED mappings).
- Add analytics dashboards (outcomes, abnormal rates, workload).

---

## 6) Sources used for field-set rationale

- Algeria Ministry pregnancy/perinatal protocol material (hosted copy; verify against official clinic copy before production):  
  https://www.fichier-pdf.fr/2026/04/18/protocoles-et-procedures-de-prise-en-charge-de-la-grossessede-la/

- Algeria news report on Ministry pregnancy guide/risk classification pathway:  
  https://www.algerie360.com/elaboration-dun-nouveau-guide-sur-la-prise-en-charge-de-la-femme-enceinte/

- Algeria-facing cardiology practice examples (ECG, echo, Doppler, Holter/MAPA, stress testing):  
  https://drsaal-cardio.dz/  
  https://www.annumed.sante-dz.com/detail/medecin/akila-allag

- Algerian academic dermatology source describing ABCDE, dermoscopy and histology confirmation for melanoma:  
  https://fac.umc.edu.dz/snv/bibliotheque/biblio/mmf/2023/Le%20m%C3%A9lanome%20cutan%C3%A9%20%20Propri%C3%A9t%C3%A9s%20anti-inflammatoire%20du.pdf

- Algerian dental-record standardization / forensic odontostomatology source:  
  https://journals.lagh-univ.dz/index.php/amr/article/download/3455/2780/

- AHA/ACC chest pain guideline hub:  
  https://professional.heart.org/en/guidelines-statements/2021-ahaaccasechestsaemscctscmr-guideline-for-the-evaluation-and-diagnosis-ofcir0000000000001029

- ESC chronic coronary syndrome guideline (history/exam/ECG-focused workflow):  
  https://academic.oup.com/eurheartj/article/45/36/3415/7743115

- WHO antenatal care recommendations + ANC digital adaptation kit:  
  https://www.who.int/publications/i/item/9789241549912/  
  https://www.who.int/publications/i/item/9789240020306

- ACOG prenatal care and routine pregnancy tests (initial visit + follow-up labs):  
  https://www.acog.org/womens-health/faqs/prenatal-care  
  https://www.acog.org/womens-health/faqs/routine-tests-during-pregnancy

- AAD ABCDE melanoma documentation concept:  
  https://www.aad.org/public/diseases/skin-cancer/find/at-risk/abcdes

- ADA dental record/charting guidance:  
  https://www.ada.org/resources/practice/legal-and-regulatory/what-is-the-dental-record  
  https://www.ada.org/resources/practice/practice-management/writing-in-the-dental-record

- HL7 FHIR US Core lab observation profile + FHIR Observation base:  
  https://hl7.org/fhir/us/core/STU4/StructureDefinition-us-core-observation-lab.html  
  https://hl7.org/fhir/r4/observation.html

- LOINC basics:  
  https://loinc.org/get-started/loinc-term-basics/

- Musculoskeletal exam structure references (screening/ROM/strength context):  
  https://www.ncbi.nlm.nih.gov/books/NBK551505/

---

## Final note

Your current architecture is already close to supporting multi-specialty workflows (`consultations.speciality_key` + payload).  
The biggest upgrade is moving from **UI-state text capture** to **structured specialty + lab domain tables** so every doctor can have the right fields, while still keeping one shared platform.

---

## Evidence validation status (deep web review)

Important:
- The specialty fields in this file are based on real medical documentation standards/guidelines and common clinical workflows.
- This document is a product/data specification aid, not a substitute for local medical governance.
- Final production set must be signed off by Algerian specialty leads (cardiology, gynecology/obstetrics, dermatology, orthopedics, dentistry) and legal/compliance.
- Algeria-specific public guideline documents are easiest to verify for pregnancy/perinatal care. For cardiology, dermatology, orthopedics, dentistry, and lab interoperability, the field set is verified against international clinical standards plus Algeria-facing academic/local-practice evidence where available.

### Algeria-centered validation matrix

| Specialty | Fields checked in this report | Medical-field validation | Algeria-specific status | Action before production |
| --- | --- | --- | --- | --- |
| Cardiology | Chest pain characterization, dyspnea, palpitations, ECG summary, troponin values, hemodynamic status, risk context, disposition | Valid clinical fields. Chest pain guidelines emphasize history, physical exam, ECG and troponin-based risk stratification. Local Algerian cardiology practices publicly list ECG, echocardiography, Doppler, Holter/MAPA and stress testing. | Good practical fit for Algeria, but detailed Algerian ministry cardiology templates were not publicly found. | Keep fields, have a cardiologist validate labels and emergency workflow. |
| Dermatology | Lesion site, morphology, size, color, border, asymmetry, evolution, symptoms, dermoscopy, photos, biopsy decision | Valid clinical fields. ABCDE, evolution, dermoscopy and histology confirmation are standard for suspicious pigmented lesions; Algerian academic material also describes ABCDE and dermoscopy. | Good fit. The local evidence supports lesion/dermoscopy fields, but specialty society template should still be reviewed. | Keep fields, add body-site vocabulary and photo consent policy. |
| Orthopedics | Pain score/location, injury mechanism, functional limitation, inspection/palpation, ROM, active/passive limitation, strength, neurovascular, gait, imaging | Valid clinical fields. MSK exam references consistently include observation/inspection, palpation, ROM, strength, sensory/reflex/neurovascular and gait. | No Algeria-specific public orthopedic dataset found; fields are standard clinical orthopedic exam fields. | Keep as core fields, localize joint names and common injury workflows. |
| Gynecology/Obstetrics | LMP, cycle, gravida/para/living, prior C-section, pregnancy dating, risk factors, red flags, prenatal contacts, maternal/fetal monitoring, baseline labs | Strongly valid. Algeria-facing Ministry pregnancy/perinatal protocol material and news about national pregnancy guides support structured prenatal follow-up, risk classification and prescribed exams. | Strongest Algeria-specific validation among the specialties. Elective termination workflow fields should not be default. | Keep fields, align visit schedule and required labs with Algerian protocol used by the clinic. |
| Dentistry | Odontogram, tooth/surface status, treatment by tooth, periodontal charting, radiographs, materials/procedures, provider/timestamp | Valid clinical fields. ADA record guidance and Algerian dental/forensic literature both stress accurate, dated dental charting, radiographs and a usable initial oral status record. | Good fit. Algeria literature specifically highlights poor/incomplete dental records and the need for standardized computerized data. | Keep fields, implement FDI tooth numbering and audit trail. |
| Analyses medicales | Test code, specimen, collection time, result value, unit, reference range, interpretation, report time, critical flag, trend | Strongly valid. FHIR Observation and LOINC define core lab-result structure around code/analyte, specimen/system, time, value, unit, method, interpretation and reference range. | Lab data model is universal; Algeria-specific part is the test catalog, naming and panels offered by local labs/clinics. | Keep model, build local test catalog and panel presets per specialty. |

### Field-to-evidence confidence

- **Cardiology fields** (history pattern, ECG, troponin, risk context, disposition): **High confidence**  
  Backed by chest-pain/chronic coronary syndrome guideline structures. Algeria-specific source strength: **moderate**.

- **Gynecology/obstetrics fields** (initial prenatal history, exam, baseline labs, follow-up milestones): **High confidence**  
  Backed by ANC/ACOG-style first-visit + routine follow-up structures and Algeria pregnancy/perinatal protocol material. Algeria-specific source strength: **strong**.

- **Dermatology fields** (lesion morphology, site, evolution, photo follow-up, biopsy decision): **High confidence**  
  Backed by AAD lesion screening framework, standard dermatology documentation practice, and Algeria academic material describing ABCDE/dermoscopy. Algeria-specific source strength: **moderate**.

- **Orthopedics fields** (pain/function, ROM, strength, neurovascular, gait, imaging linkage): **High confidence**  
  Backed by standard musculoskeletal exam structure references. Algeria-specific source strength: **limited public evidence**, but fields are standard of care.

- **Dentistry fields** (odontogram, periodontal charting, treatment documentation): **High confidence**  
  Backed by ADA dental record/charting recommendations and Algeria dental-record standardization literature. Algeria-specific source strength: **moderate**.

- **Laboratory (analyses) fields** (test code, specimen, value, unit, reference range, interpretation, timestamp): **High confidence**  
  Backed by HL7 FHIR Observation/US Core lab profile and LOINC modeling principles. Algeria-specific source strength: **local catalog needed**, because panels and names vary by local laboratories.

### Algeria-specific caution

- This version intentionally avoids elective-termination default workflows in gynecology templates.
- Any legally sensitive reproductive-health pathway must be implemented only after local legal review and Ministry-aligned policy validation.
