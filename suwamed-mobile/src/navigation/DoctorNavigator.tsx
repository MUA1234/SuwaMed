import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { shadows } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

// Real screens — Tab roots
import DashboardScreen from '../screens/doctor/DashboardScreen';
import MyScheduleScreen from '../screens/doctor/MyScheduleScreen';
import PatientListScreen from '../screens/doctor/PatientListScreen';
import EarningsScreen from '../screens/doctor/EarningsScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';

// Dashboard stack
import AppointmentRequestsScreen from '../screens/doctor/AppointmentRequestsScreen';
import AppointmentDetailScreen from '../screens/doctor/AppointmentDetailScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import VideoCallScreen from '../screens/shared/VideoCallScreen';

// Schedule stack
import SetAvailabilityScreen from '../screens/doctor/SetAvailabilityScreen';
import WritePrescriptionScreen from '../screens/doctor/WritePrescriptionScreen';

// Patients stack
import PatientProfileScreen from '../screens/doctor/PatientProfileScreen';
import PatientHealthRecordsScreen from '../screens/doctor/PatientHealthRecordsScreen';
import PrescriptionHistoryScreen from '../screens/doctor/PrescriptionHistoryScreen';

// Earnings stack
import WithdrawScreen from '../screens/doctor/WithdrawScreen';

// Profile stack
import EditProfileScreen from '../screens/doctor/EditProfileScreen';
import VerificationScreen from '../screens/doctor/VerificationScreen';
import ReviewsScreen from '../screens/doctor/ReviewsScreen';
import NotificationsScreen from '../screens/doctor/NotificationsScreen';
import SettingsScreen from '../screens/doctor/SettingsScreen';
import PrivacyPolicyScreen from '../screens/shared/PrivacyPolicyScreen';
import TermsScreen from '../screens/shared/TermsScreen';

const DashboardStack = createNativeStackNavigator();
const ScheduleStack = createNativeStackNavigator();
const PatientsStack = createNativeStackNavigator();
const EarningsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStackNavigator = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="DashboardScreen" component={DashboardScreen} />
    <DashboardStack.Screen name="AppointmentRequestsScreen" component={AppointmentRequestsScreen} />
    <DashboardStack.Screen name="AppointmentDetailScreen" component={AppointmentDetailScreen} />
    <DashboardStack.Screen name="WritePrescriptionScreen" component={WritePrescriptionScreen} />
    <DashboardStack.Screen name="NotificationsScreen" component={NotificationsScreen} />
    <DashboardStack.Screen name="ChatScreen" component={ChatScreen} />
    <DashboardStack.Screen name="VideoCallScreen" component={VideoCallScreen} options={{ gestureEnabled: false }} />
  </DashboardStack.Navigator>
);

const ScheduleStackNavigator = () => (
  <ScheduleStack.Navigator screenOptions={{ headerShown: false }}>
    <ScheduleStack.Screen name="MyScheduleScreen" component={MyScheduleScreen} />
    <ScheduleStack.Screen name="SetAvailabilityScreen" component={SetAvailabilityScreen} />
    <ScheduleStack.Screen name="AppointmentDetailScreen" component={AppointmentDetailScreen} />
    <ScheduleStack.Screen name="WritePrescriptionScreen" component={WritePrescriptionScreen} />
    <ScheduleStack.Screen name="ChatScreen" component={ChatScreen} />
    <ScheduleStack.Screen name="VideoCallScreen" component={VideoCallScreen} options={{ gestureEnabled: false }} />
  </ScheduleStack.Navigator>
);

const PatientsStackNavigator = () => (
  <PatientsStack.Navigator screenOptions={{ headerShown: false }}>
    <PatientsStack.Screen name="PatientListScreen" component={PatientListScreen} />
    <PatientsStack.Screen name="PatientProfileScreen" component={PatientProfileScreen} />
    <PatientsStack.Screen name="PatientHealthRecordsScreen" component={PatientHealthRecordsScreen} />
    <PatientsStack.Screen name="PrescriptionHistoryScreen" component={PrescriptionHistoryScreen} />
  </PatientsStack.Navigator>
);

const EarningsStackNavigator = () => (
  <EarningsStack.Navigator screenOptions={{ headerShown: false }}>
    <EarningsStack.Screen name="EarningsScreen" component={EarningsScreen} />
    <EarningsStack.Screen name="WithdrawScreen" component={WithdrawScreen} />
  </EarningsStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="DoctorProfileScreen" component={DoctorProfileScreen} />
    <ProfileStack.Screen name="EditProfileScreen" component={EditProfileScreen} />
    <ProfileStack.Screen name="VerificationScreen" component={VerificationScreen} />
    <ProfileStack.Screen name="ReviewsScreen" component={ReviewsScreen} />
    <ProfileStack.Screen name="SettingsScreen" component={SettingsScreen} />
    <ProfileStack.Screen name="NotificationsScreen" component={NotificationsScreen} />
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

const DoctorNavigator = () => {
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
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'view-dashboard' : 'view-dashboard-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'calendar-month' : 'calendar-month-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'account-group' : 'account-group-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'cash-multiple' : 'cash'} color={color} focused={focused} indicatorColor={colors.primary} />
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

export default DoctorNavigator;
