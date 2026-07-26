import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AnnuairePage from './pages/AnnuairePage';
import InscriptionLivreur from './pages/InscriptionLivreur';
import DashboardLivreur from './pages/DashboardLivreur';
import DashboardProfil from './pages/DashboardProfil';
import DashboardCommandes from './pages/DashboardCommandes';
import LivreurDetailPage from './pages/LivreurDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import MentionsLegalesPage from './pages/MentionsLegalesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import PayoutSetupPage from './pages/PayoutSetupPage';
import VerificationPage from './pages/VerificationPage';
import AffiliationsPage from './pages/AffiliationsPage';
import BannedPage from './pages/BannedPage';
import { useSupabase } from './hooks/useSupabase';

export default function App() {
  const { user, userProfile } = useSupabase();
  const location = useLocation();

  const isBannedPath = location.pathname === '/banned';
  if (userProfile?.banned && !isBannedPath) {
    return <Navigate to="/banned" replace />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* If user is logged in, they are a livreur, redirect from Home to Dashboard */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        
        <Route path="/annuaire" element={<AnnuairePage />} />
        <Route path="/livreur/:id" element={<LivreurDetailPage />} />
        <Route path="/devenir-livreur" element={<InscriptionLivreur />} />
        
        <Route path="/dashboard" element={<DashboardLivreur />} />
        <Route path="/dashboard/profil" element={<DashboardProfil />} />
        <Route path="/dashboard/profil/payout" element={<PayoutSetupPage />} />
        <Route path="/dashboard/profil/verification" element={<VerificationPage />} />
        <Route path="/affiliations" element={<AffiliationsPage />} />
        <Route path="/dashboard/commandes" element={<DashboardCommandes />} />
        <Route path="/livraisons" element={<DashboardCommandes />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
        
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/banned" element={<BannedPage />} />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
