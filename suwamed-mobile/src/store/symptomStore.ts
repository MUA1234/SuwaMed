import { create } from 'zustand';

interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  bodyPart: string;
}

interface SymptomResult {
  _id: string;
  symptoms: Symptom[];
  aiResponse: {
    possibleConditions: Array<{
      name: string;
      probability: string;
      description: string;
    }>;
    recommendation: 'self_care' | 'consult_doctor' | 'emergency';
    selfCareAdvice: string;
    suggestedSpecializations: string[];
    disclaimer: string;
  };
  createdAt: string;
}

interface SymptomStore {
  currentSymptoms: Symptom[];
  results: SymptomResult[];
  currentResult: SymptomResult | null;
  isAnalyzing: boolean;
  addSymptom: (symptom: Symptom) => void;
  removeSymptom: (name: string) => void;
  updateSymptom: (name: string, data: Partial<Symptom>) => void;
  clearSymptoms: () => void;
  setResults: (results: SymptomResult[]) => void;
  setCurrentResult: (result: SymptomResult | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
}

export const useSymptomStore = create<SymptomStore>((set) => ({
  currentSymptoms: [],
  results: [],
  currentResult: null,
  isAnalyzing: false,
  addSymptom: (symptom) =>
    set((state) => ({
      currentSymptoms: [...state.currentSymptoms, symptom],
    })),
  removeSymptom: (name) =>
    set((state) => ({
      currentSymptoms: state.currentSymptoms.filter((s) => s.name !== name),
    })),
  updateSymptom: (name, data) =>
    set((state) => ({
      currentSymptoms: state.currentSymptoms.map((s) =>
        s.name === name ? { ...s, ...data } : s
      ),
    })),
  clearSymptoms: () => set({ currentSymptoms: [] }),
  setResults: (results) => set({ results }),
  setCurrentResult: (currentResult) => set({ currentResult }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
}));
