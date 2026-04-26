export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export interface Prescription {
  _id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  diagnosis: string;
  medications: Medication[];
  additionalNotes?: string;
  followUpDate?: string;
  followUpInstructions?: string;
  digitalSignature?: string;
  issuedAt: string;
  createdAt: string;
}
