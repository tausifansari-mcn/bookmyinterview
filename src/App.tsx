import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { CandidateAuthProvider } from '@/contexts/CandidateAuthContext'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import AdminForgotPasswordPage from '@/pages/auth/AdminForgotPasswordPage'
import AdminResetPasswordPage from '@/pages/auth/AdminResetPasswordPage'
import PortalLoginPage from '@/pages/portal/PortalLoginPage'
import PortalRegisterPage from '@/pages/portal/PortalRegisterPage'
import PortalDashboardPage from '@/pages/portal/PortalDashboardPage'
import PortalJobsPage from '@/pages/portal/PortalJobsPage'
import PortalApplicationsPage from '@/pages/portal/PortalApplicationsPage'
import PortalProfilePage from '@/pages/portal/PortalProfilePage'
import ForgotPasswordPage from '@/pages/portal/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/portal/ResetPasswordPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import JobsPage from '@/pages/jobs/JobsPage'
import JobDetailPage from '@/pages/jobs/JobDetailPage'
import CandidatesPage from '@/pages/candidates/CandidatesPage'
import CandidateDetailPage from '@/pages/candidates/CandidateDetailPage'
import ApplicationsPage from '@/pages/applications/ApplicationsPage'
import InterviewsPage from '@/pages/interviews/InterviewsPage'
import OffersPage from '@/pages/offers/OffersPage'
import AssessmentsPage from '@/pages/assessments/AssessmentsPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import UsersPage from '@/pages/settings/UsersPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <CandidateAuthProvider>
        <Routes>
          {/* ── Admin / Recruiter routes ── */}
          <Route path="/login"                element={<LoginPage />} />
          <Route path="/forgot-password"      element={<AdminForgotPasswordPage />} />
          <Route path="/admin-reset-password" element={<AdminResetPasswordPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"           element={<DashboardPage />} />
            <Route path="jobs"                element={<JobsPage />} />
            <Route path="jobs/:id"            element={<JobDetailPage />} />
            <Route path="candidates"          element={<CandidatesPage />} />
            <Route path="candidates/:id"      element={<CandidateDetailPage />} />
            <Route path="applications"        element={<ApplicationsPage />} />
            <Route path="interviews"          element={<InterviewsPage />} />
            <Route path="offers"              element={<OffersPage />} />
            <Route path="assessments"         element={<AssessmentsPage />} />
            <Route path="analytics"           element={<AnalyticsPage />} />
            <Route path="settings"            element={<SettingsPage />} />
            <Route path="users"               element={<UsersPage />} />
          </Route>

          {/* ── Candidate portal routes ── */}
          <Route path="/portal/login"           element={<PortalLoginPage />} />
          <Route path="/portal/register"        element={<PortalRegisterPage />} />
          <Route path="/portal/dashboard"       element={<PortalDashboardPage />} />
          <Route path="/portal/jobs"            element={<PortalJobsPage />} />
          <Route path="/portal/applications"    element={<PortalApplicationsPage />} />
          <Route path="/portal/profile"         element={<PortalProfilePage />} />
          <Route path="/portal/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/portal/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/portal"                 element={<Navigate to="/portal/dashboard" replace />} />
        </Routes>
      </CandidateAuthProvider>
    </AuthProvider>
  )
}
