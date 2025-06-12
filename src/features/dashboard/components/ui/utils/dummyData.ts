// src/features/dashboard/components/new-ui/utils/dummyData.ts

// Chart data for patient visits
export const patientVisitData = [
  { name: 'Jan', visits: 65, target: 90 },
  { name: 'Feb', visits: 80, target: 90 },
  { name: 'Mar', visits: 110, target: 90 },
  { name: 'Apr', visits: 95, target: 90 },
  { name: 'May', visits: 75, target: 90 },
  { name: 'Jun', visits: 85, target: 90 },
  { name: 'Jul', visits: 130, target: 90 },
  { name: 'Aug', visits: 120, target: 90 },
  { name: 'Sep', visits: 85, target: 90 },
  { name: 'Oct', visits: 105, target: 90 },
  { name: 'Nov', visits: 90, target: 90 },
  { name: 'Dec', visits: 125, target: 90 },
];

// Patient data for table
export const patientsData = [
  {
    id: '1',
    name: 'Jenny Wilson',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    date: 'Dec 18, 2021',
    diagnostic: 'Geriatrician',
    status: 'Confirmed' as const,
  },
  {
    id: '2',
    name: 'Albert Flores',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    date: 'Dec 18, 2021',
    diagnostic: 'Internist',
    status: 'Incoming' as const,
  },
  {
    id: '3',
    name: 'Floyd Miles',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    date: 'Dec 18, 2021',
    diagnostic: 'Urogynecologist',
    status: 'Confirmed' as const,
  },
  {
    id: '4',
    name: 'Marvin McKinney',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    date: 'Dec 18, 2021',
    diagnostic: 'Cardiologist',
    status: 'Cancelled' as const,
  },
];

// Summary data
export const summaryData = {
  appointments: 153,
  earnings: 23425,
  patients: 1925,
  claims: {
    approved: 65,
    pending: 25,
    rejected: 10
  }
};

// Practitioner info
export const practitionerInfo = {
  name: 'Dr. Dilip Anmangandla, MD',
  avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
  totalPatients: 32100,
  appointments: 4250,
  rating: 4.8,
};

// Patient satisfaction data
export const satisfactionData = {
  excellent: 65,
  good: 25,
  poor: 10,
  total: 45251,
};

// Upcoming appointments
export const upcomingAppointments = [
  {
    id: '1',
    title: 'Nurse Visit 20',
    Practitioner: 'Dr. Carol D. Pollack-rundle',
    time: '08:30 am - 10:30 am',
    date: 'July 30, 2022',
  },
  {
    id: '2',
    title: 'Annual Visit 15',
    Practitioner: 'Dr. Donald F. Watren',
    time: '08:30 am - 10:30 am',
    date: 'July 30, 2022',
  },
];