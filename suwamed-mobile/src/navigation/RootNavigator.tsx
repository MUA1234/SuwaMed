import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuthNavigator from './AuthNavigator';
import PatientNavigator from './PatientNavigator';
import DoctorNavigator from './DoctorNavigator';
import AdminNavigator from './AdminNavigator';
import PendingVerificationScreen from '../screens/auth/PendingVerificationScreen';

const RootNavigator = () => {
  const { user, isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const { isLoaded: settingsLoaded } = useSettingsStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  if (isLoading || !settingsLoaded) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Block unverified doctors
  if (user?.role === 'doctor' && (user as any).verificationStatus !== 'verified') {
    return <PendingVerificationScreen />;
  }

  const renderNavigator = () => {
    switch (user?.role) {
      case 'doctor':
        return <DoctorNavigator />;
      case 'admin':
        return <AdminNavigator />;
      case 'patient':
      default:
        return <PatientNavigator />;
    }
  };

  return <NavigationContainer>{renderNavigator()}</NavigationContainer>;
};

export default RootNavigator;
