import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { shadows } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

// Dashboard
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

// Users stack
import UsersListScreen from '../screens/admin/UsersListScreen';
import UserDetailScreen from '../screens/admin/UserDetailScreen';
import PendingDoctorsScreen from '../screens/admin/PendingDoctorsScreen';
import DoctorVerificationScreen from '../screens/admin/DoctorVerificationScreen';

// Management stack
import ManagementScreen from '../screens/admin/ManagementScreen';
import SpecializationsScreen from '../screens/admin/SpecializationsScreen';
import SystemSettingsScreen from '../screens/admin/SystemSettingsScreen';
import HealthTipsManagementScreen from '../screens/admin/HealthTipsManagementScreen';

// Reports stack
import ReportsScreen from '../screens/admin/ReportsScreen';
import RevenueReportScreen from '../screens/admin/RevenueReportScreen';
import UserAnalyticsScreen from '../screens/admin/UserAnalyticsScreen';
import AppointmentAnalyticsScreen from '../screens/admin/AppointmentAnalyticsScreen';

// More stack
import MoreScreen from '../screens/admin/MoreScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminNotificationsScreen from '../screens/admin/AdminNotificationsScreen';
import PrivacyPolicyScreen from '../screens/shared/PrivacyPolicyScreen';
import TermsScreen from '../screens/shared/TermsScreen';

const DashboardStack = createNativeStackNavigator();
const UsersStack = createNativeStackNavigator();
const ManagementStack = createNativeStackNavigator();
const ReportsStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStackNavigator = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen} />
  </DashboardStack.Navigator>
);

const UsersStackNavigator = () => (
  <UsersStack.Navigator screenOptions={{ headerShown: false }}>
    <UsersStack.Screen name="UsersListScreen" component={UsersListScreen} />
    <UsersStack.Screen name="UserDetailScreen" component={UserDetailScreen} />
    <UsersStack.Screen name="PendingDoctorsScreen" component={PendingDoctorsScreen} />
    <UsersStack.Screen name="DoctorVerificationScreen" component={DoctorVerificationScreen} />
  </UsersStack.Navigator>
);

const ManagementStackNavigator = () => (
  <ManagementStack.Navigator screenOptions={{ headerShown: false }}>
    <ManagementStack.Screen name="ManagementScreen" component={ManagementScreen} />
    <ManagementStack.Screen name="SpecializationsScreen" component={SpecializationsScreen} />
    <ManagementStack.Screen name="SystemSettingsScreen" component={SystemSettingsScreen} />
    <ManagementStack.Screen name="HealthTipsManagementScreen" component={HealthTipsManagementScreen} />
  </ManagementStack.Navigator>
);

const ReportsStackNavigator = () => (
  <ReportsStack.Navigator screenOptions={{ headerShown: false }}>
    <ReportsStack.Screen name="ReportsScreen" component={ReportsScreen} />
    <ReportsStack.Screen name="RevenueReportScreen" component={RevenueReportScreen} />
    <ReportsStack.Screen name="UserAnalyticsScreen" component={UserAnalyticsScreen} />
    <ReportsStack.Screen name="AppointmentAnalyticsScreen" component={AppointmentAnalyticsScreen} />
  </ReportsStack.Navigator>
);

const MoreStackNavigator = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="MoreScreen" component={MoreScreen} />
    <MoreStack.Screen name="AdminProfileScreen" component={AdminProfileScreen} />
    <MoreStack.Screen name="AdminSettingsScreen" component={AdminSettingsScreen} />
    <MoreStack.Screen name="AdminNotificationsScreen" component={AdminNotificationsScreen} />
    <MoreStack.Screen name="Privacy" component={PrivacyPolicyScreen} />
    <MoreStack.Screen name="Terms" component={TermsScreen} />
  </MoreStack.Navigator>
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

const AdminNavigator = () => {
  const { theme: colors } = useTheme();
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
          height: Platform.OS === 'ios' ? 88 : 66,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
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
        name="Users"
        component={UsersStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'account-multiple' : 'account-multiple-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Management"
        component={ManagementStackNavigator}
        options={{
          tabBarLabel: 'Manage',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'cog' : 'cog-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'chart-bar' : 'chart-bar'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'dots-horizontal-circle' : 'dots-horizontal-circle-outline'} color={color} focused={focused} indicatorColor={colors.primary} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
