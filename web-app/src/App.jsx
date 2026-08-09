import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';

const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const RegisterScreen = lazy(() => import('./screens/RegisterScreen'));
const EmailLoginScreen = lazy(() => import('./screens/EmailLoginScreen'));
const SetupProfileScreen = lazy(() => import('./screens/SetupProfileScreen'));
const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen'));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const AllModulesScreen = lazy(() => import('./screens/AllModulesScreen'));
const ModuleScreen = lazy(() => import('./screens/ModuleScreen'));
const QuestionScreen = lazy(() => import('./screens/QuestionScreen'));
const FinalExamScreen = lazy(() => import('./screens/FinalExamScreen'));
const PDFViewerScreen = lazy(() => import('./screens/PDFViewerScreen'));
const ScanSolveScreen = lazy(() => import('./screens/ScanSolveScreen'));
const SetExamScreen = lazy(() => import('./screens/SetExamScreen'));
const TaskScreen = lazy(() => import('./screens/TaskScreen'));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/email-login" element={<EmailLoginScreen />} />
          <Route path="/setup-profile" element={<ProtectedRoute><SetupProfileScreen /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingScreen /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
          <Route path="/modules" element={<ProtectedRoute><AllModulesScreen /></ProtectedRoute>} />
          <Route path="/module/:id" element={<ProtectedRoute><ModuleScreen /></ProtectedRoute>} />
          <Route path="/question/:moduleId" element={<ProtectedRoute><QuestionScreen /></ProtectedRoute>} />
          <Route path="/final-exam" element={<ProtectedRoute><FinalExamScreen /></ProtectedRoute>} />
          <Route path="/pdf-viewer" element={<ProtectedRoute><PDFViewerScreen /></ProtectedRoute>} />
          <Route path="/scan-solve" element={<ProtectedRoute><ScanSolveScreen /></ProtectedRoute>} />
          <Route path="/set-exam" element={<ProtectedRoute><SetExamScreen /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TaskScreen /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
