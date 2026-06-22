import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }           from '@/contexts/AuthContext'
import { AuthProvider }      from '@/contexts/AuthContext'
import { CandidateAuthProvider } from '@/contexts/CandidateAuthContext'
import { ClientAuthProvider }    from '@/contexts/ClientAuthContext'
import { SuperAdminAuthProvider } from '@/contexts/SuperAdminAuthContext'

// ── Layouts ──────────────────────────────────────────────────────
import AppLayout         from '@/components/layout/AppLayout'
import PortalLayout      from '@/components/layout/PortalLayout'
import ClientLayout      from '@/components/layout/ClientLayout'
import SuperAdminLayout  from '@/components/layout/SuperAdminLayout'

// ── Recruiter / Internal pages ───────────────────────────────────
import LoginPage                from '@/pages/auth/LoginPage'
import AdminForgotPasswordPage  from '@/pages/auth/AdminForgotPasswordPage'
import AdminResetPasswordPage   from '@/pages/auth/AdminResetPasswordPage'
import DashboardPage            from '@/pages/dashboard/DashboardPage'
import JobsPage                 from '@/pages/jobs/JobsPage'
import JobDetailPage            from '@/pages/jobs/JobDetailPage'
import CandidatesPage           from '@/pages/candidates/CandidatesPage'
import CandidateDetailPage      from '@/pages/candidates/CandidateDetailPage'
import ApplicationsPage         from '@/pages/applications/ApplicationsPage'
import InterviewsPage           from '@/pages/interviews/InterviewsPage'
import OffersPage               from '@/pages/offers/OffersPage'
import AssessmentsPage          from '@/pages/assessments/AssessmentsPage'
import AnalyticsPage            from '@/pages/analytics/AnalyticsPage'
import SettingsPage             from '@/pages/settings/SettingsPage'
import UsersPage                from '@/pages/settings/UsersPage'

// ── Candidate portal pages ────────────────────────────────────────
import PortalLandingPage     from '@/pages/portal/PortalLandingPage'
import PortalLoginPage      from '@/pages/portal/PortalLoginPage'
import PortalRegisterPage   from '@/pages/portal/PortalRegisterPage'
import ForgotPasswordPage   from '@/pages/portal/ForgotPasswordPage'
import ResetPasswordPage    from '@/pages/portal/ResetPasswordPage'
import PortalAssessmentPage from '@/pages/portal/PortalAssessmentPage'
import PortalDashboardPage  from '@/pages/portal/PortalDashboardPage'
import PortalJobsPage       from '@/pages/portal/PortalJobsPage'
import PortalApplicationsPage from '@/pages/portal/PortalApplicationsPage'
import PortalProfilePage    from '@/pages/portal/PortalProfilePage'
import PortalJobDetailPage     from '@/pages/portal/PortalJobDetailPage'
import PortalShortIntroPage  from '@/pages/portal/PortalShortIntroPage'

// ── Client portal pages ───────────────────────────────────────────
import ClientLandingPage          from '@/pages/client/ClientLandingPage'
import ClientLoginPage           from '@/pages/client/ClientLoginPage'
import ClientOnboardingPage      from '@/pages/client/ClientOnboardingPage'
import ClientDashboardPage       from '@/pages/client/ClientDashboardPage'
import ClientJobsPage            from '@/pages/client/ClientJobsPage'
import ClientCandidatesPage      from '@/pages/client/ClientCandidatesPage'
import ClientSettingsPage        from '@/pages/client/ClientSettingsPage'
import ClientAssessmentsPage     from '@/pages/client/ClientAssessmentsPage'
import ClientApplicationsPage    from '@/pages/client/ClientApplicationsPage'
import ClientCompanyProfilePage  from '@/pages/client/ClientCompanyProfilePage'
import ClientJDRequestsPage      from '@/pages/client/ClientJDRequestsPage'
import ClientInterviewsPage      from '@/pages/client/ClientInterviewsPage'

// ── Super admin pages ─────────────────────────────────────────────
import SuperAdminLoginPage        from '@/pages/super-admin/SuperAdminLoginPage'
import SuperAdminDashboardPage    from '@/pages/super-admin/SuperAdminDashboardPage'
import SuperAdminClientsPage      from '@/pages/super-admin/SuperAdminClientsPage'
import SuperAdminClientDetailPage from '@/pages/super-admin/SuperAdminClientDetailPage'
import SuperAdminCandidatesPage   from '@/pages/super-admin/SuperAdminCandidatesPage'
// SuperAdminAnalyticsPage removed — analytics route redirects to dashboard
import SuperAdminSettingsPage     from '@/pages/super-admin/SuperAdminSettingsPage'
import SuperAdminJDRequestsPage   from '@/pages/super-admin/SuperAdminJDRequestsPage'
import SuperAdminInterviewsPage   from '@/pages/super-admin/SuperAdminInterviewsPage'
import SuperAdminQuestionBankPage from '@/pages/super-admin/SuperAdminQuestionBankPage'

// ── Auth guard for internal recruiter portal ──────────────────────
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
        <ClientAuthProvider>
          <SuperAdminAuthProvider>
            <Routes>

              {/* ── Internal Recruiter Portal ────────────────────── */}
              <Route path="/login"                element={<LoginPage />} />
              <Route path="/forgot-password"      element={<AdminForgotPasswordPage />} />
              <Route path="/admin-reset-password" element={<AdminResetPasswordPage />} />
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"    element={<DashboardPage />} />
                <Route path="jobs"         element={<JobsPage />} />
                <Route path="jobs/:id"     element={<JobDetailPage />} />
                <Route path="candidates"   element={<CandidatesPage />} />
                <Route path="candidates/:id" element={<CandidateDetailPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="interviews"   element={<InterviewsPage />} />
                <Route path="offers"       element={<OffersPage />} />
                <Route path="assessments"  element={<AssessmentsPage />} />
                <Route path="analytics"    element={<AnalyticsPage />} />
                <Route path="settings"     element={<SettingsPage />} />
                <Route path="users"        element={<UsersPage />} />
              </Route>

              {/* ── Candidate Portal: public (no layout) ─────────── */}
              <Route path="/portal/login"             element={<PortalLoginPage />} />
              <Route path="/portal/register"          element={<PortalRegisterPage />} />
              <Route path="/portal/forgot-password"   element={<ForgotPasswordPage />} />
              <Route path="/portal/reset-password"    element={<ResetPasswordPage />} />
              <Route path="/portal/assessment/:token" element={<PortalAssessmentPage />} />

              {/* ── Candidate Portal: authenticated (shared layout) ── */}
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<PortalLandingPage />} />
                <Route path="dashboard"    element={<PortalDashboardPage />} />
                <Route path="jobs"         element={<PortalJobsPage />} />
                <Route path="jobs/:id"     element={<PortalJobDetailPage />} />
                <Route path="applications" element={<PortalApplicationsPage />} />
                <Route path="profile"      element={<PortalProfilePage />} />
                <Route path="intro"        element={<PortalShortIntroPage />} />
              </Route>

              {/* ── Client Portal: public (no layout) ────────────── */}
              <Route path="/client/login"       element={<ClientLoginPage />} />
              <Route path="/client/onboarding"  element={<ClientOnboardingPage />} />

              {/* ── Client Portal: authenticated (shared layout) ──── */}
              <Route path="/client" element={<ClientLayout />}>
                <Route index element={<Navigate to="/client/dashboard" replace />} />
                <Route path="dashboard"       element={<ClientDashboardPage />} />
                <Route path="jobs"            element={<ClientJobsPage />} />
                <Route path="candidates"      element={<ClientCandidatesPage />} />
                <Route path="jd-requests"     element={<ClientJDRequestsPage />} />
                <Route path="interviews"      element={<ClientInterviewsPage />} />
                <Route path="applications"    element={<ClientApplicationsPage />} />
                <Route path="assessments"     element={<ClientAssessmentsPage />} />
                <Route path="company-profile" element={<ClientCompanyProfilePage />} />
                <Route path="settings"        element={<ClientSettingsPage />} />
              </Route>

              {/* ── Super Admin Portal: public (no layout) ────────── */}
              <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />

              {/* ── Super Admin Portal: authenticated (shared layout) ─ */}
              <Route path="/super-admin" element={<SuperAdminLayout />}>
                <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
                <Route path="dashboard"    element={<SuperAdminDashboardPage />} />
                <Route path="jd-requests"  element={<SuperAdminJDRequestsPage />} />
                <Route path="interviews"   element={<SuperAdminInterviewsPage />} />
                <Route path="question-bank" element={<SuperAdminQuestionBankPage />} />
                <Route path="clients"      element={<SuperAdminClientsPage />} />
                <Route path="clients/:id"  element={<SuperAdminClientDetailPage />} />
                <Route path="candidates"   element={<SuperAdminCandidatesPage />} />
                <Route path="analytics"    element={<Navigate to="/super-admin/dashboard" replace />} />
                <Route path="settings"     element={<SuperAdminSettingsPage />} />
              </Route>

            </Routes>
          </SuperAdminAuthProvider>
        </ClientAuthProvider>
      </CandidateAuthProvider>
    </AuthProvider>
  )
}
