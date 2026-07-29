import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SetupProfileScreen from '../screens/SetupProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EmailLoginScreen from '../screens/EmailLoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ModuleScreen from '../screens/ModuleScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import FinalExamScreen from '../screens/FinalExamScreen';
import PDFViewerScreen from '../screens/PDFViewerScreen';
import ScanSolveScreen from '../screens/ScanSolveScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AllModulesScreen from '../screens/AllModulesScreen';
import TaskScreen from '../screens/TaskScreen';
import SetExamScreen from '../screens/SetExamScreen';
import QuestionScreen from '../screens/QuestionScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Module" component={ModuleScreen} />
        <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
        <Stack.Screen name="FinalExam" component={FinalExamScreen} />
        <Stack.Screen name="PDFViewer" component={PDFViewerScreen} />
        <Stack.Screen name="ScanSolve" component={ScanSolveScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AllModules" component={AllModulesScreen} />
        <Stack.Screen name="Tasks" component={TaskScreen} />
        <Stack.Screen name="SetExam" component={SetExamScreen} />
        <Stack.Screen name="Question" component={QuestionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}