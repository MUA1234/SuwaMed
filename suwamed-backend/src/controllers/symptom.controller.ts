import { Request, Response, NextFunction } from 'express';
import SymptomCheck from '../models/SymptomCheck.model';
import { AppError } from '../utils/errorResponse';

// Rule-based symptom analysis engine
interface AnalysisResult {
  possibleConditions: { name: string; probability: number; description: string }[];
  recommendation: 'self_care' | 'consult_doctor' | 'emergency';
  selfCareAdvice: string;
  suggestedSpecializations: string[];
  disclaimer: string;
  severity: 'mild' | 'moderate' | 'severe';
  assessmentText: string;
}

function analyzeSymptoms(symptoms: string[], bodyArea?: string): AnalysisResult {
  const normalized = symptoms.map((s) => s.toLowerCase().trim());

  const cardiacKeywords = ['chest pain', 'chest tightness', 'palpitation', 'palpitations', 'heart racing', 'shortness of breath'];
  const respiratoryKeywords = ['fever', 'cough', 'sore throat', 'runny nose', 'breathlessness', 'wheezing', 'phlegm', 'sneezing'];
  const neurologicalKeywords = ['headache', 'dizziness', 'migraine', 'confusion', 'seizure', 'numbness', 'tingling', 'fainting'];
  const gastrointestinalKeywords = ['nausea', 'vomiting', 'diarrhoea', 'diarrhea', 'abdominal pain', 'stomach pain', 'bloating', 'constipation'];
  const musculoskeletalKeywords = ['joint pain', 'muscle pain', 'back pain', 'swelling', 'stiffness', 'weakness'];

  const hasCardiac = normalized.some((s) => cardiacKeywords.some((k) => s.includes(k)));
  const hasRespiratory = normalized.some((s) => respiratoryKeywords.some((k) => s.includes(k)));
  const hasNeurological = normalized.some((s) => neurologicalKeywords.some((k) => s.includes(k)));
  const hasGastrointestinal = normalized.some((s) => gastrointestinalKeywords.some((k) => s.includes(k)));
  const hasMusculoskeletal = normalized.some((s) => musculoskeletalKeywords.some((k) => s.includes(k)));

  const possibleConditions: { name: string; probability: number; description: string }[] = [];
  const suggestedSpecializations: string[] = [];
  let severity: 'mild' | 'moderate' | 'severe' = 'mild';
  // Use a string variable to avoid TypeScript narrowing issues when doing conditional reassignments
  let recommendationRaw: string = 'consult_doctor';
  let assessmentText = '';

  if (hasCardiac) {
    possibleConditions.push({
      name: 'Cardiac concern',
      probability: 0.75,
      description: 'Symptoms may indicate a cardiac condition requiring prompt evaluation.',
    });
    suggestedSpecializations.push('Cardiology');
    severity = 'severe';
    recommendationRaw = 'emergency';
    assessmentText = 'Cardiac concern detected. Your symptoms may indicate a serious heart condition. Please seek emergency care immediately.';
  }

  if (hasRespiratory) {
    possibleConditions.push({
      name: 'Respiratory infection',
      probability: 0.70,
      description: 'Symptoms are consistent with an upper or lower respiratory tract infection.',
    });
    suggestedSpecializations.push('General Practitioner', 'Pulmonology');
    if (severity === 'mild') severity = 'moderate';
    if (recommendationRaw !== 'emergency') recommendationRaw = 'consult_doctor';
    if (!assessmentText) assessmentText = 'Respiratory symptoms detected. Likely a respiratory infection. Please consult a doctor for proper diagnosis and treatment.';
  }

  if (hasNeurological) {
    possibleConditions.push({
      name: 'Neurological concern',
      probability: 0.65,
      description: 'Symptoms may suggest a neurological condition that warrants medical attention.',
    });
    suggestedSpecializations.push('Neurology', 'General Practitioner');
    if (severity === 'mild') severity = 'moderate';
    if (recommendationRaw !== 'emergency') recommendationRaw = 'consult_doctor';
    if (!assessmentText) assessmentText = 'Neurological symptoms detected. Please consult a doctor to evaluate the cause of your symptoms.';
  }

  if (hasGastrointestinal) {
    possibleConditions.push({
      name: 'Gastrointestinal condition',
      probability: 0.60,
      description: 'Symptoms may indicate a gastrointestinal disorder.',
    });
    suggestedSpecializations.push('Gastroenterology', 'General Practitioner');
    if (!assessmentText) assessmentText = 'Gastrointestinal symptoms detected. If symptoms persist, please consult a doctor.';
  }

  if (hasMusculoskeletal) {
    possibleConditions.push({
      name: 'Musculoskeletal condition',
      probability: 0.55,
      description: 'Symptoms may indicate a musculoskeletal disorder.',
    });
    suggestedSpecializations.push('Orthopedics', 'General Practitioner');
    if (!assessmentText) assessmentText = 'Musculoskeletal symptoms detected. Rest and over-the-counter pain relief may help, but consult a doctor if symptoms worsen.';
  }

  // Default fallback
  if (possibleConditions.length === 0) {
    possibleConditions.push({
      name: 'General consultation recommended',
      probability: 0.50,
      description: 'Your symptoms did not match a specific pattern. A general consultation is recommended.',
    });
    suggestedSpecializations.push('General Practitioner');
    severity = 'mild';
    recommendationRaw = 'consult_doctor';
    assessmentText = 'Your symptoms do not match a specific pattern in our system. A general consultation with a doctor is recommended.';
  }

  const recommendation = recommendationRaw as 'self_care' | 'consult_doctor' | 'emergency';

  return {
    possibleConditions,
    recommendation,
    selfCareAdvice: 'Stay hydrated, rest adequately, and monitor your symptoms. Always seek professional medical advice.',
    suggestedSpecializations: [...new Set(suggestedSpecializations)],
    disclaimer: 'This symptom analysis is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.',
    severity,
    assessmentText,
  };
}

// POST /api/symptoms/check — analyze symptoms and save result
export const checkSymptoms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const { symptoms, bodyArea, language } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      throw new AppError('At least one symptom is required', 400);
    }

    const analysis = analyzeSymptoms(symptoms as string[], bodyArea);

    // Map the flat string[] symptoms from the request into the ISymptom[] shape the model expects
    const symptomDocs = (symptoms as string[]).map((s) => ({
      name: s,
      severity: analysis.severity,
      bodyPart: bodyArea,
    }));

    const check = await SymptomCheck.create({
      patientId,
      symptoms: symptomDocs,
      additionalInfo: {
        existingConditions: [],
        currentMedications: [],
      },
      aiResponse: {
        possibleConditions: analysis.possibleConditions,
        recommendation: analysis.recommendation,
        selfCareAdvice: analysis.selfCareAdvice,
        suggestedSpecializations: analysis.suggestedSpecializations,
        disclaimer: analysis.disclaimer,
      },
      language: language && ['en', 'si', 'ta'].includes(language) ? language : 'en',
    });

    res.status(201).json({
      success: true,
      data: {
        checkId: check._id,
        severity: analysis.severity,
        assessment: analysis.assessmentText,
        possibleConditions: analysis.possibleConditions,
        recommendation: analysis.recommendation,
        suggestedSpecializations: analysis.suggestedSpecializations,
        selfCareAdvice: analysis.selfCareAdvice,
        disclaimer: analysis.disclaimer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/symptoms/history — list symptom checks for logged-in patient
export const getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const checks = await SymptomCheck.find({ patientId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: checks });
  } catch (error) {
    next(error);
  }
};

// GET /api/symptoms/:id — single symptom check
export const getResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const check = await SymptomCheck.findOne({ _id: req.params.id, patientId });
    if (!check) throw new AppError('Symptom check not found', 404);
    res.status(200).json({ success: true, data: check });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/symptoms/:id — delete a symptom check
export const deleteCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const check = await SymptomCheck.findOneAndDelete({ _id: req.params.id, patientId });
    if (!check) throw new AppError('Symptom check not found', 404);
    res.status(200).json({ success: true, message: 'Symptom check deleted' });
  } catch (error) {
    next(error);
  }
};
