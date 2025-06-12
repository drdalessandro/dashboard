export interface IPatient {
    id?: string;
    name: string;
    gender: "male" | "female" | "unknown";
    birthDate: string;
    phone: string;
    address: string;
    email: string;
    insurance: string;
}

export interface IAppointment {
    id?: string;
    title: string;
    patientId: string;
    patientName?: string;
    date: string;
    time?: string;
    duration?: number;
    status?: "scheduled" | "confirmed" | "cancelled" | "completed";
    type?: string;
    notes?: string;
}

export interface IDashboardStats {
    appointmentsToday: number;
    totalPatients: number;
    pendingPrescriptions: number;
    recentTests: number;
}