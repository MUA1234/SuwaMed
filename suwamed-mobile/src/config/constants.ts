// API base URL is the single source of truth for both REST and Socket.io.
// Set EXPO_PUBLIC_API_BASE in eas.json (per build profile) or in .env for local dev.
// The fallback only fires when running `expo start` without any env wiring — handy
// for new contributors but never used in EAS builds (every profile sets the env).
const FALLBACK_DEV_API_BASE = 'http://172.20.10.5:5000';
const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || FALLBACK_DEV_API_BASE).replace(/\/+$/, '');

export const API_URL = `${API_BASE}/api`;
export const SOCKET_URL = API_BASE;

export const SRI_LANKAN_DISTRICTS: string[] = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];

export const SPECIALIZATIONS: string[] = [
  'General Practitioner',
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'Gynecologist',
  'Neurologist',
  'Oncologist',
  'Ophthalmologist',
  'Orthopedic Surgeon',
  'Pediatrician',
  'Psychiatrist',
  'Pulmonologist',
  'Radiologist',
  'Urologist',
  'ENT Specialist',
  'Nephrologist',
  'Rheumatologist',
  'Allergist',
  'Anesthesiologist',
];

export const BLOOD_GROUPS: string[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
  { code: 'ta', label: 'தமிழ்' },
] as const;

export const GENDER_OPTIONS: string[] = ['male', 'female', 'other'];
