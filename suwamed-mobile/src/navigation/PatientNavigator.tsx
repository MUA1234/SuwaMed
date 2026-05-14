import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { shadows } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

// Real screens — Tab roots
import HomeScreen from '../screens/patient/HomeScreen';
import MyAppointmentsScreen from '../screens/patient/MyAppointmentsScreen';
import SymptomCheckerScreen from '../screens/patient/SymptomCheckerScreen';
import HealthRecordsScreen from '../screens/patient/HealthRecordsScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';

// Home stack
import DoctorSearchScreen from '../screens/patient/DoctorSearchScreen';
import DoctorProfileScreen from '../screens/patient/DoctorProfileScreen';
import BookAppointmentScreen from '../screens/patient/BookAppointmentScreen';
import PaymentScreen from '../screens/patient/PaymentScreen';
import AppointmentConfirmationScreen from '../screens/patient/AppointmentConfirmationScreen';
import HealthTipsScreen from '../screens/patient/HealthTipsScreen';
import HealthTipDetailScreen from '../screens/patient/HealthTipDetailScreen';
import NearbyPharmaciesScreen from '../screens/patient/NearbyPharmaciesScreen';
import EmergencyScreen from '../screens/patient/EmergencyScreen';

// Appointments stack
import AppointmentDetailScreen from '../screens/patient/AppointmentDetailScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import VideoCallScreen from '../screens/shared/VideoCallScreen';
import ReviewDoctorScreen from '../screens/patient/ReviewDoctorScreen';

// Symptom stack
import SymptomResultScreen from '../screens/patient/SymptomResultScreen';
import SymptomHistoryScreen from '../screens/patient/SymptomHistoryScreen';

// Records stack
import UploadRecordScreen from '../screens/patient/UploadRecordScreen';
import RecordDetailScreen from '../screens/patient/RecordDetailScreen';
import PrescriptionsScreen from '../screens/patient/PrescriptionsScreen';
import PrescriptionDetailScreen from '../screens/patient/PrescriptionDetailScreen';
import MedicationRemindersScreen from '../screens/patient/MedicationRemindersScreen';

// Profile stack
import EditProfileScreen from '../screens/patient/EditProfileScreen';
import SubscriptionScreen from '../screens/patient/SubscriptionScreen';
import PaymentHistoryScreen from '../screens/patient/PaymentHistoryScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import PrivacyPolicyScreen from '../screens/shared/PrivacyPolicyScreen';
import TermsScreen from '../screens/shared/TermsScreen';
import HelpSupportScreen from '../screens/patient/HelpSupportScreen';
import SubmitTicketScreen from '../screens/patient/SubmitTicketScreen';

const HomeStack = createNativeStackNavigator();
const AppointmentsStack = createNativeStackNavigator();
const SymptomCheckStack = createNativeStackNavigator();
const RecordsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
    <HomeStack.Screen name="DoctorSearchScreen" component={DoctorSearchScreen} />
    <HomeStack.Screen name="DoctorProfileScreen" component={DoctorProfileScreen} />
    <HomeStack.Screen name="BookAppointmentScreen" component={BookAppointmentScreen} />
    <HomeStack.Screen name="PaymentScreen" component={PaymentScreen} />
    <HomeStack.Screen name="AppointmentConfirmationScreen" component={AppointmentConfirmationScreen} />
    <HomeStack.Screen name="HealthTipsScreen" component={HealthTipsScreen} />
    <HomeStack.Screen name="HealthTipDetailScreen" component={HealthTipDetailScreen} />
    <HomeStack.Screen name="NearbyPharmaciesScreen" component={NearbyPharmaciesScreen} />
    <HomeStack.Screen name="EmergencyScreen" component={EmergencyScreen} />
  </HomeStack.Navigator>
);

const AppointmentsStackNavigator = () => (
  <AppointmentsStack.Navigator screenOptions={{ headerShown: false }}>
    <AppointmentsStack.Screen name="MyAppointmentsScreen" component={MyAppointmentsScreen} />
    <AppointmentsStack.Screen name="AppointmentDetailScreen" component={AppointmentDetailScreen} />
    <AppointmentsStack.Screen name="ChatScreen" component={ChatScreen} />
    <AppointmentsStack.Screen name="VideoCallScreen" component={VideoCallScreen} options={{ gestureEnabled: false }} />
    <AppointmentsStack.Screen name="ReviewDoctorScreen" component={ReviewDoctorScreen} />
  </AppointmentsStack.Navigator>
);

const SymptomCheckStackNavigator = () => (
  <SymptomCheckStack.Navigator screenOptions={{ headerShown: false }}>
    <SymptomCheckStack.Screen name="SymptomCheckerScreen" component={SymptomCheckerScreen} />
    <SymptomCheckStack.Screen name="SymptomResultScreen" component={SymptomResultScreen} />
    <SymptomCheckStack.Screen name="SymptomHistoryScreen" component={SymptomHistoryScreen} />
  </SymptomCheckStack.Navigator>
);

const RecordsStackNavigator = () => (
  <RecordsStack.Navigator screenOptions={{ headerShown: false }}>
    <RecordsStack.Screen name="HealthRecordsScreen" component={HealthRecordsScreen} />
    <RecordsStack.Screen name="UploadRecordScreen" component={UploadRecordScreen} />
    <RecordsStack.Screen name="RecordDetailScreen" component={RecordDetailScreen} />
    <RecordsStack.Screen name="PrescriptionsScreen" component={PrescriptionsScreen} />
    <RecordsStack.Screen name="PrescriptionDetailScreen" component={PrescriptionDetailScreen} />
    <RecordsStack.Screen name="MedicationRemindersScreen" component={MedicationRemindersScreen} />
  </RecordsStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfileScreen" component={EditProfileScreen} />
    <ProfileStack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
    <ProfileStack.Screen name="PaymentHistoryScreen" component={PaymentHistoryScreen} />
    <ProfileStack.Screen name="NotificationsScreen" component={NotificationsScreen} />
    <ProfileStack.Screen name="SettingsScreen" component={SettingsScreen} />
    <ProfileStack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
    <ProfileStack.Screen name="SubmitTicketScreen" component={SubmitTicketScreen} />
    <ProfileStack.Screen name="Privacy" component={PrivacyPolicyScreen} />
    <ProfileStack.Screen name="Terms" component={TermsScreen} />
  </ProfileStack.Navigator>
);

const TabIcon = ({ name, color, focused, indicatorColor }: { name: string; color: string; focused: boolean; indicatorColor: string }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    {focused && (
      <View
        style={{
          position: 'absolute',
          top: -12,
          width: 24,
          height: 3,
          borderRadius: 2,
          backgroundColor: indicatorColor,
        }}
      />
    )}
    <MaterialCommunityIcons name={name as any} color={color} size={focused ? 26 : 24} />
  </View>
);

const PatientNavigator = () => {
  const { theme: colors } = useTheme();
  const insets = useSafeAreaInsets();
  const baseHeight = Platform.OS === 'ios' ? 60 : 56;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.1,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderTopColor: colors.border,
          height: baseHeight + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
          ...shadows.lg,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'calendar-clock' : 'calendar-clock-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="SymptomCheck"
        component={SymptomCheckStackNavigator}
        options={{
          tabBarLabel: 'Symptoms',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="stethoscope" color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Records"
        component={RecordsStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'folder-heart' : 'folder-heart-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'account-circle' : 'account-circle-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default PatientNavigator;
