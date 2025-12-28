import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

/* ================= TYPES ================= */

interface Patient {
  code: string;
  nom: string;
  prenom: string;
  age: string;
  sexe: string;
  situation: string;
  telephone: string;
  adresse: string;
  createdAt: string; // YYYY-MM-DD
}

/* ================= MOCK DATA ================= */

const MOCK_PATIENTS: Patient[] = [
  {
    code: "001",
    nom: "Benali",
    prenom: "Ahmed",
    age: "30",
    sexe: "Masculin",
    situation: "Marié",
    telephone: "0550123456",
    adresse: "Alger",
    createdAt: "2024-01-10",
  },
  {
    code: "002",
    nom: "Kaci",
    prenom: "Sara",
    age: "26",
    sexe: "Féminin",
    situation: "Célibataire",
    telephone: "0660789456",
    adresse: "Oran",
    createdAt: "2024-02-05",
  },
  {
    code: "003",
    nom: "Toumi",
    prenom: "Yacine",
    age: "41",
    sexe: "Masculin",
    situation: "Marié",
    telephone: "0770234511",
    adresse: "Blida",
    createdAt: "2024-02-18",
  },
  {
    code: "004",
    nom: "Haddad",
    prenom: "Lina",
    age: "33",
    sexe: "Féminin",
    situation: "Mariée",
    telephone: "0559988776",
    adresse: "Tizi",
    createdAt: "2024-03-01",
  },
  {
    code: "005",
    nom: "Bouzid",
    prenom: "Karim",
    age: "29",
    sexe: "Masculin",
    situation: "Célibataire",
    telephone: "0544123698",
    adresse: "Sétif",
    createdAt: "2024-03-20",
  },
  {
    code: "006",
    nom: "Amrani",
    prenom: "Nadia",
    age: "37",
    sexe: "Féminin",
    situation: "Mariée",
    telephone: "0666012345",
    adresse: "Annaba",
    createdAt: "2024-04-02",
  },
  {
    code: "007",
    nom: "Cherif",
    prenom: "Samir",
    age: "45",
    sexe: "Masculin",
    situation: "Marié",
    telephone: "0557788996",
    adresse: "Batna",
    createdAt: "2024-04-15",
  },
  {
    code: "008",
    nom: "Meziane",
    prenom: "Ines",
    age: "24",
    sexe: "Féminin",
    situation: "Célibataire",
    telephone: "0778899001",
    adresse: "Bejaia",
    createdAt: "2024-05-01",
  },
  {
    code: "009",
    nom: "Rahmani",
    prenom: "Omar",
    age: "39",
    sexe: "Masculin",
    situation: "Marié",
    telephone: "0544998877",
    adresse: "Laghouat",
    createdAt: "2024-05-12",
  },
  {
    code: "010",
    nom: "Ziani",
    prenom: "Meriem",
    age: "31",
    sexe: "Féminin",
    situation: "Mariée",
    telephone: "0665123499",
    adresse: "Chlef",
    createdAt: "2024-05-25",
  },
];

function ColumnFilter({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const nextValue = () => {
    const index = options.indexOf(value);
    const next = options[(index + 1) % options.length];
    onChange(next);
  };

  return (
    <Pressable onPress={nextValue} style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 12 }}>
        {value || "🔽"}
      </Text>
    </Pressable>
  );
}




/* ================= PAGE ================= */

export default function PatientsPage() {
  const { theme } = useTheme();

  const [fromDate, setFromDate] = useState("2024-01-01");
  const [toDate, setToDate] = useState("2024-12-31");
  const [globalSearch, setGlobalSearch] = useState("");

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );

  /* ================= FILTER LOGIC ================= */

  const filteredPatients = useMemo(() => {
    return MOCK_PATIENTS.filter((p) => {
      // date filter
      if (p.createdAt < fromDate || p.createdAt > toDate) return false;

      // global name search
      const nameMatch =
        p.nom.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.prenom.toLowerCase().includes(globalSearch.toLowerCase());

      if (!nameMatch) return false;

      // column filters
      for (const key in columnFilters) {
        if (
          columnFilters[key] &&
          !String((p as any)[key])
            .toLowerCase()
            .includes(columnFilters[key].toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  }, [fromDate, toDate, globalSearch, columnFilters]);

  /* ================= UI ================= */

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TopBar theme={theme} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* ===== FILTER CARDS ===== */}
        <View style={styles.filterRow}>
          {/* Date Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Date</Text>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
                marginBottom: 8,
              }}
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
                marginBottom: 8,
              }}
            />
 

          </View>

          {/* Search Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nom / Prénom</Text>
            <TextInput
              placeholder="Rechercher..."
              value={globalSearch}
              onChangeText={setGlobalSearch}
              style={styles.input}
            />
          </View>
        </View>

        {/* ===== TABLE ===== */}
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.row, styles.headerRow]}>
            {[
              "PHOTO",
              "code",
              "nom",
              "prenom",
              "age",
              "sexe",
              "situation",
              "telephone",
              "adresse",
              "ACTIONS",
            ].map((col) => (
              <Text key={col} style={styles.headerCell}>
                {col.toUpperCase()}
              </Text>
            ))}
          </View>

          {/* Column Filters */}
          <View style={styles.row}>
            <Text style={styles.cell} />
            {[
              "code",
              "nom",
              "prenom",
              "age",
              "sexe",
              "situation",
              "telephone",
              "adresse",
            ].map((key) => (
              <TextInput
                key={key}
                placeholder="Filtrer"
                value={columnFilters[key] || ""}
                onChangeText={(v) =>
                  setColumnFilters((p) => ({ ...p, [key]: v }))
                }
                style={styles.filterInput}
              />
            ))}
            <Text style={styles.cell} />
          </View>

          {/* Rows */}
          {filteredPatients.map((p, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.cell}>-</Text>
              <Text style={styles.cell}>{p.code}</Text>
              <Text style={styles.cell}>{p.nom}</Text>
              <Text style={styles.cell}>{p.prenom}</Text>
              <Text style={styles.cell}>{p.age}</Text>
              <Text style={styles.cell}>{p.sexe}</Text>
              <Text style={styles.cell}>{p.situation}</Text>
              <Text style={styles.cell}>{p.telephone}</Text>
              <Text style={styles.cell}>{p.adresse}</Text>
              <Pressable style={styles.cell}>
                <Text>⋮</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 24 },
  filterRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#0ea5e9",
  },
  cardTitle: { color: "#fff", fontWeight: "bold", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  table: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8 },
  row: { flexDirection: "row", padding: 8, alignItems: "center" },
  headerRow: { backgroundColor: "#0ea5e9" },
  headerCell: { flex: 1, color: "#fff", fontWeight: "bold", textAlign: "center" },
  cell: { flex: 1, textAlign: "center" },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 2,
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
  },
});
