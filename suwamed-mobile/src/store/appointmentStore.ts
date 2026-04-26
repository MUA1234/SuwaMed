import { create } from 'zustand';

interface Appointment {
  _id: string;
  patientId: string;
  doctorId: any;
  date: string;
  startTime: string;
  endTime: string;
  type: 'video' | 'chat' | 'follow_up';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  symptoms?: string[];
  notes?: string;
  payment?: {
    amount: number;
    status: string;
    transactionId?: string;
  };
}

interface AppointmentStore {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  setCurrentAppointment: (appointment: Appointment | null) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAppointments: () => void;
}

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  appointments: [],
  currentAppointment: null,
  isLoading: false,
  error: null,
  setAppointments: (appointments) => set({ appointments }),
  addAppointment: (appointment) =>
    set((state) => ({ appointments: [appointment, ...state.appointments] })),
  setCurrentAppointment: (appointment) => set({ currentAppointment: appointment }),
  updateAppointment: (id, data) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a._id === id ? { ...a, ...data } : a
      ),
      currentAppointment:
        state.currentAppointment?._id === id
          ? { ...state.currentAppointment, ...data }
          : state.currentAppointment,
    })),
  removeAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a._id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearAppointments: () => set({ appointments: [], currentAppointment: null }),
}));
