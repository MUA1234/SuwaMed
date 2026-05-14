import { Request, Response, NextFunction } from 'express';
import SymptomCheck from '../models/SymptomCheck.model';
import Patient from '../models/Patient.model';
import User from '../models/User.model';
import { AppError } from '../utils/errorResponse';
import {
  analyzeWithOpenAI,
  SYMPTOM_DISCLAIMER,
  type Lang,
  type OpenAiSymptomAnalysis,
  type SymptomAnalysisInput,
} from '../services/openai.service';

// ---------------------------------------------------------------------------
// Deterministic rule-based fallback. Used when:
//   - OPENAI_API_KEY is unset (dev / staging without billing wired)
//   - the OpenAI call fails (rate limit, network error, malformed response)
// ---------------------------------------------------------------------------

function ruleBasedAnalysis(
  symptoms: string[],
  additionalNotes: string,
  language: Lang,
): OpenAiSymptomAnalysis {
  // Combine selected chips with free-text notes for keyword matching.
  const haystack = [...symptoms, additionalNotes].join(' ').toLowerCase();
  const norm = symptoms.map((s) => s.toLowerCase().trim());

  const has = (keywords: string[]): boolean =>
    norm.some((s) => keywords.some((k) => s.includes(k))) ||
    keywords.some((k) => haystack.includes(k));

  const cardiacKeywords = ['chest pain', 'chest tightness', 'palpitation', 'palpitations', 'heart racing', 'shortness of breath'];
  const respiratoryKeywords = ['fever', 'cough', 'sore throat', 'runny nose', 'breathlessness', 'wheezing', 'phlegm', 'sneezing'];
  const neurologicalKeywords = ['headache', 'dizziness', 'migraine', 'confusion', 'seizure', 'numbness', 'tingling', 'fainting'];
  const gastrointestinalKeywords = ['nausea', 'vomiting', 'diarrhoea', 'diarrhea', 'abdominal pain', 'stomach pain', 'bloating', 'constipation'];
  const musculoskeletalKeywords = ['joint pain', 'muscle pain', 'back pain', 'swelling', 'stiffness', 'weakness'];

  const hasCardiac = has(cardiacKeywords);
  const hasRespiratory = has(respiratoryKeywords);
  const hasNeurological = has(neurologicalKeywords);
  const hasGastrointestinal = has(gastrointestinalKeywords);
  const hasMusculoskeletal = has(musculoskeletalKeywords);

  const possibleConditions: { name: string; probability: number; description: string }[] = [];
  const suggestedSpecializations: string[] = [];
  let severity: 'mild' | 'moderate' | 'severe' = 'mild';
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
    assessmentText =
      'Cardiac concern detected. Your symptoms may indicate a serious heart condition. Please seek emergency care immediately.';
  }
  if (hasRespiratory) {
    possibleConditions.push({
      name: 'Respiratory infection',
      probability: 0.7,
      description: 'Symptoms are consistent with an upper or lower respiratory tract infection.',
    });
    suggestedSpecializations.push('General Practitioner', 'Pulmonology');
    if (severity === 'mild') severity = 'moderate';
    if (recommendationRaw !== 'emergency') recommendationRaw = 'consult_doctor';
    if (!assessmentText)
      assessmentText =
        'Respiratory symptoms detected. Likely a respiratory infection. Please consult a doctor for proper diagnosis and treatment.';
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
    if (!assessmentText)
      assessmentText =
        'Neurological symptoms detected. Please consult a doctor to evaluate the cause of your symptoms.';
  }
  if (hasGastrointestinal) {
    possibleConditions.push({
      name: 'Gastrointestinal condition',
      probability: 0.6,
      description: 'Symptoms may indicate a gastrointestinal disorder.',
    });
    suggestedSpecializations.push('Gastroenterology', 'General Practitioner');
    if (!assessmentText)
      assessmentText = 'Gastrointestinal symptoms detected. If symptoms persist, please consult a doctor.';
  }
  if (hasMusculoskeletal) {
    possibleConditions.push({
      name: 'Musculoskeletal condition',
      probability: 0.55,
      description: 'Symptoms may indicate a musculoskeletal disorder.',
    });
    suggestedSpecializations.push('Orthopedics', 'General Practitioner');
    if (!assessmentText)
      assessmentText =
        'Musculoskeletal symptoms detected. Rest and over-the-counter pain relief may help, but consult a doctor if symptoms worsen.';
  }
  if (possibleConditions.length === 0) {
    possibleConditions.push({
      name: 'General consultation recommended',
      probability: 0.5,
      description: 'Your symptoms did not match a specific pattern. A general consultation is recommended.',
    });
    suggestedSpecializations.push('General Practitioner');
    severity = 'mild';
    recommendationRaw = 'consult_doctor';
    assessmentText =
      'Your symptoms do not match a specific pattern in our system. A general consultation with a doctor is recommended.';
  }

  return {
    possibleConditions,
    recommendation: recommendationRaw as 'self_care' | 'consult_doctor' | 'emergency',
    selfCareAdvice:
      'Stay hydrated, rest adequately, and monitor your symptoms. Always seek professional medical advice.',
    suggestedSpecializations: [...new Set(suggestedSpecializations)],
    disclaimer: SYMPTOM_DISCLAIMER[language],
    severity,
    assessmentText,
  };
}

// POST /api/symptoms/check — analyze symptoms and save result
export const checkSymptoms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = (req as any).user.id;
    const { symptoms, bodyArea, language, additionalNotes } = req.body as {
      symptoms?: unknown;
      bodyArea?: string;
      language?: string;
      additionalNotes?: string;
    };

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      throw new AppError('At least one symptom is required', 400);
    }
    const symptomStrings = (symptoms as unknown[])
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter((s) => s.length > 0);
    if (symptomStrings.length === 0) {
      throw new AppError('At least one symptom is required', 400);
    }

    const lang: Lang = language && ['en', 'si', 'ta'].includes(language) ? (language as Lang) : 'en';
    const notes = typeof additionalNotes === 'string' ? additionalNotes.trim() : '';

    // Pull lightweight patient context so the AI can tune triage by age/sex/PMH.
    // Demographics live on User; medical lists live on Patient.
    let age: number | undefined;
    let gender: string | undefined;
    let existingConditions: string[] = [];
    const currentMedications: string[] = [];
    try {
      const [user, patient] = await Promise.all([
        User.findById(patientId).lean(),
        Patient.findOne({ userId: patientId }).lean(),
      ]);
      if (user?.dateOfBirth) {
        const dob = new Date(user.dateOfBirth as unknown as string);
        if (!isNaN(dob.getTime())) {
          const ageMs = Date.now() - dob.getTime();
          age = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
        }
      }
      if (user?.gender) gender = String(user.gender);
      if (patient?.chronicConditions && Array.isArray(patient.chronicConditions)) {
        existingConditions = patient.chronicConditions.map((c) => String(c)).filter(Boolean);
      }
    } catch {
      // Patient context is optional — never block analysis on it.
    }

    const aiInput: SymptomAnalysisInput = {
      symptoms: symptomStrings,
      additionalNotes: notes,
      bodyArea,
      language: lang,
      age,
      gender,
      existingConditions,
      currentMedications,
    };

    let analysis = await analyzeWithOpenAI(aiInput);
    let source: 'openai' | 'rule_based' = 'openai';
    if (!analysis) {
      analysis = ruleBasedAnalysis(symptomStrings, notes, lang);
      source = 'rule_based';
    }

    const symptomDocs = symptomStrings.map((s) => ({
      name: s,
      severity: analysis!.severity,
      bodyPart: bodyArea,
    }));

    const check = await SymptomCheck.create({
      patientId,
      symptoms: symptomDocs,
      additionalInfo: {
        age,
        gender,
        existingConditions,
        currentMedications,
      },
      aiResponse: {
        possibleConditions: analysis.possibleConditions,
        recommendation: analysis.recommendation,
        selfCareAdvice: analysis.selfCareAdvice,
        suggestedSpecializations: analysis.suggestedSpecializations,
        disclaimer: analysis.disclaimer,
      },
      language: lang,
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
        source,
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
