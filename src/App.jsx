import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ForceResetPasswordPage from './pages/auth/ForceResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ROLES } from './utils/constants';

const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const ProfilePage = lazy(() => import('./pages/users/ProfilePage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'));
const BugsPage = lazy(() => import('./pages/bugs/BugsPage'));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'));
const DocumentEditor = lazy(() => import('./pages/documents/DocumentEditor'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const MyTasksPage = lazy(() => import('./pages/tasks/MyTasksPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const AuditLogPage = lazy(() => import('./pages/settings/AuditLogPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/force-reset-password" element={<ForceResetPasswordPage />} />

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                {/* Phase 2 — Projects & Tasks */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                {/* Phase 3 — Bugs */}
                <Route path="/bugs" element={<BugsPage />} />
                {/* Phase 4 — Documents */}
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/new" element={<DocumentEditor />} />
                <Route path="/documents/:id" element={<DocumentEditor />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/my-tasks" element={<MyTasksPage />} />
                <Route path="/reports" element={
                  <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER]}>
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/audit-log" element={
                  <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
                    <AuditLogPage />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            </Suspense>
            </ErrorBoundary>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
