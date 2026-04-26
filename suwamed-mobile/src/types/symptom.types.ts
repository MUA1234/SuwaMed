export interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  bodyPart: string;
}

export interface AIResponse {
  possibleConditions: Array<{
    name: string;
    probability: string;
    description: string;
  }>;
  recommendation: 'self_care' | 'consult_doctor' | 'emergency';
  selfCareAdvice: string;
  suggestedSpecializations: string[];
  disclaimer: string;
}

export interface SymptomCheck {
  _id: string;
  patientId: string;
  symptoms: Symptom[];
  additionalInfo: {
    age: number;
    gender: string;
    existingConditions: string[];
    currentMedications: string[];
  };
  aiResponse: AIResponse;
  language: 'en' | 'si' | 'ta';
  createdAt: string;
}
