export type RootStackParamList = {
  Auth: undefined;
  Patient: undefined;
  Doctor: undefined;
  Admin: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  OnboardingConsent: undefined;
  RoleSelection: undefined;
  Login: undefined;
  Register: { role: 'patient' | 'doctor' };
  OTPVerification: { phone: string; role?: string };
  ForgotPassword: undefined;
  ResetPassword: { emailOrPhone: string };
  Privacy: undefined;
  Terms: undefined;
};

export type PatientTabParamList = {
  Home: undefined;
  Appointments: undefined;
  SymptomCheck: undefined;
  Records: undefined;
  Profile: undefined;
};

export type DoctorTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Patients: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Management: undefined;
  Reports: undefined;
  More: undefined;
};
