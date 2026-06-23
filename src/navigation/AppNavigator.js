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

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Module" component={ModuleScreen} />
        <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}