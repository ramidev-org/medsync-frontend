export interface Payment {
  code: string;
  nom: string;
  prenom: string;
  amount: number;
  method: "Espèces" | "Carte" | "Virement";
  status: "Payé" | "En attente";
  createdAt: string; // YYYY-MM-DD HH:mm
}

export const MOCK_PAYMENTS: Payment[] = [
  {
    code: "001",
    nom: "Benali",
    prenom: "Ahmed",
    amount: 5000,
    method: "Espèces",
    status: "Payé",
    createdAt: "2024-01-15 09:30",
  },
  {
    code: "002",
    nom: "Kaci",
    prenom: "Sara",
    amount: 8000,
    method: "Carte",
    status: "Payé",
    createdAt: "2024-02-03 11:45",
  },
  {
    code: "003",
    nom: "Toumi",
    prenom: "Yacine",
    amount: 12000,
    method: "Virement",
    status: "En attente",
    createdAt: "2024-02-20 14:10",
  },
];
