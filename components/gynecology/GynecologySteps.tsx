import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import DatePickerField from "@/components/datepicker";
import { Dropdown, TextArea, TextField } from "@/components/input_fields";

type StepKey = "triage" | "history" | "exam" | "pregnancy" | "tests" | "assessment" | "plan";

const STEPS: { key: StepKey; title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: "triage", title: "Triage", subtitle: "Chief complaint, vitals, urgency flags.", icon: "clipboard-alert-outline" },
  { key: "history", title: "History", subtitle: "Cycle, obstetric history, contraception, symptoms.", icon: "book-outline" },
  { key: "exam", title: "Exam", subtitle: "General + pelvic exam findings.", icon: "stethoscope" },
  { key: "pregnancy", title: "Pregnancy", subtitle: "LMP, gestational age, risk factors, red flags.", icon: "human-pregnant" },
  { key: "tests", title: "Tests", subtitle: "Requested follow-up and result notes.", icon: "clipboard-text-outline" },
  { key: "assessment", title: "Assessment", subtitle: "Working diagnosis and differentials.", icon: "clipboard-text-outline" },
  { key: "plan", title: "Plan", subtitle: "Treatment, counseling, follow-up.", icon: "check-decagram-outline" },
];

export function GynecologySteps({
  theme,
}: {
  theme: any;
}) {
  const [active, setActive] = React.useState<StepKey>("triage");

  const [form, setForm] = React.useState<any>({
    triage: { complaint: "", urgency: "Routine" },
    history: { lmp: new Date(), cycle: "Regular", contraception: "None", notes: "" },
    exam: { general: "", pelvic: "" },
    pregnancy: { status: "Unknown", gaWeeks: "", redFlags: "None" },
    tests: { requested: "", results: "" },
    assessment: { diagnosis: "", differentials: "" },
    plan: { treatment: "", counseling: "", followUp: "" },
  });

  const step = STEPS.find((s) => s.key === active) ?? STEPS[0]!;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {STEPS.map((s) => {
          const isActive = s.key === active;
          return (
            <Pressable
              key={s.key}
              onPress={() => setActive(s.key)}
              style={{
                borderWidth: 1,
                borderColor: isActive ? theme.colors.primary : theme.colors.border,
                backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 9,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MaterialCommunityIcons name={s.icon} size={16} color={isActive ? theme.colors.textOnPrimary : theme.colors.textSecondary} />
              <Text style={{ fontWeight: "700", fontSize: 12, color: isActive ? theme.colors.textOnPrimary : theme.colors.textSecondary }}>{s.title}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.background, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border }}>
              <MaterialCommunityIcons name={step.icon} size={16} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={{ fontWeight: "700", color: theme.colors.text }}>{step.title}</Text>
              <Text style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>{step.subtitle}</Text>
            </View>
          </View>
        </View>

        {active === "triage" ? (
          <View style={{ gap: 2 }}>
            <TextField label="Chief complaint" value={form.triage.complaint} onChangeText={(complaint) => setForm((f: any) => ({ ...f, triage: { ...f.triage, complaint } }))} prefixIcon={"chatbubble-ellipses-outline" as any} placeholder="e.g. pelvic pain, bleeding..." />
            <Dropdown label="Urgency" value={form.triage.urgency} options={["Routine", "Urgent", "Emergency"]} onChange={(urgency) => setForm((f: any) => ({ ...f, triage: { ...f.triage, urgency } }))} prefixIcon={"alert-circle-outline" as any} />
          </View>
        ) : active === "history" ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
              <View style={{ flexDirection: "column", gap: 6 }}>
                <Text style={{ fontWeight: "600", color: theme.colors.textSecondary, fontSize: 12 }}>LMP</Text>
                <DatePickerField label="LMP" date={form.history.lmp} setDate={(lmp) => setForm((f: any) => ({ ...f, history: { ...f.history, lmp } }))} />
              </View>
              <View style={{ minWidth: 220, flexGrow: 1, flexBasis: 220 }}>
                <Dropdown label="Cycle" value={form.history.cycle} options={["Regular", "Irregular", "Amenorrhea"]} onChange={(cycle) => setForm((f: any) => ({ ...f, history: { ...f.history, cycle } }))} prefixIcon={"repeat-outline" as any} />
              </View>
              <View style={{ minWidth: 220, flexGrow: 1, flexBasis: 220 }}>
                <Dropdown label="Contraception" value={form.history.contraception} options={["None", "OCP", "IUD", "Implant", "Barrier", "Other"]} onChange={(contraception) => setForm((f: any) => ({ ...f, history: { ...f.history, contraception } }))} prefixIcon={"shield-checkmark-outline" as any} />
              </View>
            </View>
            <TextArea label="History notes" value={form.history.notes} onChangeText={(notes) => setForm((f: any) => ({ ...f, history: { ...f.history, notes } }))} prefixIcon={"document-text-outline" as any} rows={4} placeholder="Obstetric history, STIs, meds, allergies..." />
          </View>
        ) : active === "exam" ? (
          <View style={{ gap: 2 }}>
            <TextArea label="General exam" value={form.exam.general} onChangeText={(general) => setForm((f: any) => ({ ...f, exam: { ...f.exam, general } }))} prefixIcon={"medkit-outline" as any} rows={4} placeholder="Vitals, abdomen..." />
            <TextArea label="Pelvic exam" value={form.exam.pelvic} onChangeText={(pelvic) => setForm((f: any) => ({ ...f, exam: { ...f.exam, pelvic } }))} prefixIcon={"body-outline" as any} rows={4} placeholder="Speculum, bimanual..." />
          </View>
        ) : active === "pregnancy" ? (
          <View style={{ gap: 2 }}>
            <Dropdown label="Pregnancy status" value={form.pregnancy.status} options={["Unknown", "Positive", "Negative"]} onChange={(status) => setForm((f: any) => ({ ...f, pregnancy: { ...f.pregnancy, status } }))} prefixIcon={"help-circle-outline" as any} />
            <TextField label="Gestational age (weeks)" value={form.pregnancy.gaWeeks} onChangeText={(gaWeeks) => setForm((f: any) => ({ ...f, pregnancy: { ...f.pregnancy, gaWeeks } }))} prefixIcon={"calendar-outline" as any} placeholder="e.g. 8" />
            <Dropdown label="Red flags" value={form.pregnancy.redFlags} options={["None", "Severe pain", "Heavy bleeding", "Syncope", "Fever"]} onChange={(redFlags) => setForm((f: any) => ({ ...f, pregnancy: { ...f.pregnancy, redFlags } }))} prefixIcon={"alert-outline" as any} />
          </View>
        ) : active === "tests" ? (
          <View style={{ gap: 2 }}>
            <TextArea label="Requested tests" value={form.tests.requested} onChangeText={(requested) => setForm((f: any) => ({ ...f, tests: { ...f.tests, requested } }))} prefixIcon={"flask-outline" as any} rows={4} placeholder="CBC, β-hCG, urinalysis, swabs, ultrasound..." />
            <TextArea label="Results" value={form.tests.results} onChangeText={(results) => setForm((f: any) => ({ ...f, tests: { ...f.tests, results } }))} prefixIcon={"document-text-outline" as any} rows={4} placeholder="Paste key results..." />
          </View>
        ) : active === "assessment" ? (
          <View style={{ gap: 2 }}>
            <TextField label="Working diagnosis" value={form.assessment.diagnosis} onChangeText={(diagnosis) => setForm((f: any) => ({ ...f, assessment: { ...f.assessment, diagnosis } }))} prefixIcon={"medkit-outline" as any} placeholder="e.g. PID, ovarian cyst..." />
            <TextArea label="Differentials" value={form.assessment.differentials} onChangeText={(differentials) => setForm((f: any) => ({ ...f, assessment: { ...f.assessment, differentials } }))} prefixIcon={"list-outline" as any} rows={4} placeholder="Important rule-outs..." />
          </View>
        ) : (
          <View style={{ gap: 2 }}>
            <TextArea label="Treatment" value={form.plan.treatment} onChangeText={(treatment) => setForm((f: any) => ({ ...f, plan: { ...f.plan, treatment } }))} prefixIcon={"medkit-outline" as any} rows={3} placeholder="Meds, procedures..." />
            <TextArea label="Counseling" value={form.plan.counseling} onChangeText={(counseling) => setForm((f: any) => ({ ...f, plan: { ...f.plan, counseling } }))} prefixIcon={"chatbubble-ellipses-outline" as any} rows={3} placeholder="Education, contraception, warning signs..." />
            <TextArea label="Follow-up" value={form.plan.followUp} onChangeText={(followUp) => setForm((f: any) => ({ ...f, plan: { ...f.plan, followUp } }))} prefixIcon={"calendar-outline" as any} rows={3} placeholder="Timing + red flags..." />
          </View>
        )}

        <Pressable
          onPress={() => {}}
          style={{
            alignSelf: "flex-start",
            borderWidth: 1,
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MaterialCommunityIcons name="content-save-outline" size={16} color={theme.colors.textOnPrimary} />
          <Text style={{ fontWeight: "700", color: theme.colors.textOnPrimary }}>Save step</Text>
        </Pressable>
      </View>
    </View>
  );
}
