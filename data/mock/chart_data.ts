export const chartData = {
  "RDV - CONS": {
    type: "line",
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [
      { data: [20, 25, 30, 28, 35, 40, 38], strokeWidth: 3, label: "RDV" },
      { data: [15, 18, 22, 20, 25, 30, 28], strokeWidth: 3, label: "Consultations" },
    ],
  },
  "EFFICACITÉ RDV": {
    type: "line",
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [
      { data: [80, 90, 75, 85, 90, 95, 88], strokeWidth: 3, label: "Efficacité %" },
    ],
  },
  REVENU: {
    type: "bar",
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [{ data: [1500, 2000, 1800, 2200, 2100, 2500, 2300] }],
  },
  MALADIES: {
    type: "pie",
    data: [
      { name: "Grippe", population: 15, color: "#0077B6", legendFontColor: "#4A5568", legendFontSize: 13 },
      { name: "Covid", population: 8, color: "#00B4D8", legendFontColor: "#4A5568", legendFontSize: 13 },
      { name: "Diabète", population: 22, color: "#06D6A0", legendFontColor: "#4A5568", legendFontSize: 13 },
      { name: "Hypertension", population: 18, color: "#FFB703", legendFontColor: "#4A5568", legendFontSize: 13 },
      { name: "Autres", population: 12, color: "#EF476F", legendFontColor: "#4A5568", legendFontSize: 13 },
    ],
  },
} as const; // ✅ IMPORTANT
