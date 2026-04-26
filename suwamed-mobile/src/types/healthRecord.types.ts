export type RecordCategory = 'lab_report' | 'prescription' | 'imaging' | 'vaccination' | 'discharge_summary' | 'other';

export interface HealthRecord {
  _id: string;
  patientId: string;
  title: string;
  category: RecordCategory;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  date?: string;
  doctor?: string;
  hospital?: string;
  tags?: string[];
  isSharedWithDoctor: boolean;
  sharedWith?: string[];
  createdAt: string;
  updatedAt: string;
}
