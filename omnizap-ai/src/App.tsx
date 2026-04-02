import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import ConversationsPage from './pages/ConversationsPage';
import LeadsPage from './pages/LeadsPage';
import AgentsPage from './pages/AgentsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import PlansPage from './pages/PlansPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => 
    !!localStorage.getItem('omni_onboarding')
  );

  useEffect(() => {
    // Sync if localStorage changes in other tabs
    const checkOnboarding = () => {
      setHasCompletedOnboarding(!!localStorage.getItem('omni_onboarding'));
    };
    window.addEventListener('storage', checkOnboarding);
    return () => window.removeEventListener('storage', checkOnboarding);
  }, []);

  const isDone = !!profile?.empresa || hasCompletedOnboarding;

  if (loading) {
    return <div className="min-h-screen bg-muted flex items-center justify-center">Carregando...</div>;
  }


  return (
    <ErrorBoundary>
      <Router>
        <Toaster 
        position="top-right" 
        richColors 
        theme="dark" 
        toastOptions={{
          style: {
            background: '#151619',
            border: '1px solid #27282D',
            color: '#FFFFFF',
            borderRadius: '24px',
            padding: '16px',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/app" /> : <LoginPage />} />
          <Route path="/signup" element={user ? <Navigate to="/app" /> : <SignupPage />} />

          {/* Protected Routes */}
          <Route
            path="/onboarding"
            element={
              user ? (
                isDone ? (
                  <Navigate to="/app" />
                ) : (
                  <OnboardingPage onComplete={() => setHasCompletedOnboarding(true)} />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />


          <Route
            path="/app/*"
            element={
              user ? (
                isDone ? (
                  <DashboardLayout>
                    <Routes>
                      <Route index element={<DashboardHome />} />
                      <Route path="conversations" element={<ConversationsPage />} />
                      <Route path="leads" element={<LeadsPage />} />
                      <Route path="agents" element={<AgentsPage />} />
                      <Route path="appointments" element={<AppointmentsPage />} />
                      <Route path="insights" element={<InsightsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="plans" element={<PlansPage />} />
                      <Route path="admin" element={<AdminPage />} />
                    </Routes>
                  </DashboardLayout>
                ) : (
                  <Navigate to="/onboarding" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      </Router>
    </ErrorBoundary>
  );
}
