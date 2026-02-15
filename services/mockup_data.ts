import dataJson from "@/data/mock/preview_data.json";

type Doctor = typeof dataJson.doctor;
type Patient = typeof dataJson.patients[0];
type Appointment = typeof dataJson.appointments[0];
type Consultation = typeof dataJson.consultations[0];
type Prescription = typeof dataJson.prescriptions[0];

let data = { ...dataJson }; // in-memory copy

export const DataService = {
  getDoctor: () => data.doctor,
  updateDoctor: (newData: Partial<Doctor>) => {
    data.doctor = { ...data.doctor, ...newData };
    return data.doctor;
  },

  getPatients: () => data.patients,
  addPatient: (p: Patient) => { data.patients.push(p); return p; },
  updatePatient: (id: string, newData: Partial<Patient>) => {
    data.patients = data.patients.map(p => p.id === id ? { ...p, ...newData } : p);
    return data.patients.find(p => p.id === id);
  },

  getAppointments: () => data.appointments,
  updateAppointmentStatus: (id: string, status: string) => {
    data.appointments = data.appointments.map(a => a.id === id ? { ...a, status } : a);
    return data.appointments.find(a => a.id === id);
  },

  getConsultations: () => data.consultations,
  addConsultation: (c: Consultation) => { data.consultations.push(c); return c; },
  updateConsultation: (id: string, newData: Partial<Consultation>) => {
    data.consultations = data.consultations.map(c => c.id === id ? { ...c, ...newData } : c);
    return data.consultations.find(c => c.id === id);
  },

  getPrescriptions: () => data.prescriptions,
  addPrescription: (rx: Prescription) => { data.prescriptions.push(rx); return rx; }
};
