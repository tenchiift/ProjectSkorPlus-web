import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import AppLayout from './components/AppLayout';

function ProtectedLayout() {
  const location = useLocation();
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet key={location.pathname} />
      </AppLayout>
    </ProtectedRoute>
  );
}

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
const FriendsScreen = lazy(() => import('./screens/FriendsScreen'));
const FriendProfileScreen = lazy(() => import('./screens/FriendProfileScreen'));
const SubmitWorkScreen = lazy(() => import('./screens/SubmitWorkScreen'));
const MySubmissionsScreen = lazy(() => import('./screens/MySubmissionsScreen'));
const LecturerInboxScreen = lazy(() => import('./screens/LecturerInboxScreen'));
const SubmissionThreadScreen = lazy(() => import('./screens/SubmissionThreadScreen'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const AiChatScreen = lazy(() => import('./screens/AiChatScreen'));
const MessagesScreen = lazy(() => import('./screens/MessagesScreen'));
const FriendChatScreen = lazy(() => import('./screens/FriendChatScreen'));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/email-login" element={<EmailLoginScreen />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/setup-profile" element={<SetupProfileScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/modules" element={<AllModulesScreen />} />
            <Route path="/module/:id" element={<ModuleScreen />} />
            <Route path="/question/:moduleId" element={<QuestionScreen />} />
            <Route path="/final-exam" element={<FinalExamScreen />} />
            <Route path="/pdf-viewer" element={<PDFViewerScreen />} />
            <Route path="/scan-solve" element={<ScanSolveScreen />} />
            <Route path="/set-exam" element={<SetExamScreen />} />
            <Route path="/tasks" element={<TaskScreen />} />
            <Route path="/friends" element={<FriendsScreen />} />
            <Route path="/friend/:id" element={<FriendProfileScreen />} />
            <Route path="/submit-work" element={<SubmitWorkScreen />} />
            <Route path="/my-submissions" element={<MySubmissionsScreen />} />
            <Route path="/inbox" element={<LecturerInboxScreen />} />
            <Route path="/submission/:id" element={<SubmissionThreadScreen />} />
            <Route path="/notifications" element={<NotificationsScreen />} />
            <Route path="/ai-chat" element={<AiChatScreen />} />
            <Route path="/messages" element={<MessagesScreen />} />
            <Route path="/chat/:friendId" element={<FriendChatScreen />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
