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
import MaintenancePage from './pages/MaintenancePage';
import { useSupabase } from './hooks/useSupabase';
import { supabase } from './lib/supabase';
import { useState, useEffect } from 'react';

export default function App() {
  const { userProfile } = useSupabase();
  const location = useLocation();
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message?: string; expected_reopening?: string | null }>({
    enabled: false,
  });

  useEffect(() => {
    // Un builder Supabase n'expose que `then` : on passe par async/await.
    (async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      if (data?.value) {
        setMaintenance(data.value as any);
      }
    })().catch(() => {});
  }, []);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';
  const isBannedPath = location.pathname === '/banned';
  if (userProfile?.banned && !isBannedPath) {
    return <Navigate to="/banned" replace />;
  }
  if (!userProfile?.banned && isBannedPath) {
    return <Navigate to="/" replace />;
  }

  // Maintenance mode (les admins restent autorisés à naviguer)
  if (maintenance.enabled && !isAdmin && location.pathname !== '/admin') {
    return <MaintenancePage message={maintenance.message} expectedReopening={maintenance.expected_reopening} />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        
        <Route path="/annuaire" element={<AnnuairePage />} />
        <Route path="/livreur/:id" element={<LivreurDetailPage />} />
        <Route path="/devenir-livreur" element={<InscriptionLivreur />} />
        {/* Alias historiques : une seule URL canonique pour l'inscription. */}
        <Route path="/inscription" element={<Navigate to="/devenir-livreur" replace />} />
        
        <Route path="/dashboard" element={<DashboardLivreur />} />
        <Route path="/dashboard/profil" element={<DashboardProfil />} />
        <Route path="/dashboard/profil/payout" element={<PayoutSetupPage />} />
        <Route path="/dashboard/profil/verification" element={<VerificationPage />} />
        <Route path="/affiliations" element={<AffiliationsPage />} />
        <Route path="/dashboard/commandes" element={<DashboardCommandes />} />
        <Route path="/livraisons" element={<Navigate to="/dashboard/commandes" replace />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
        
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/banned" element={<BannedPage />} />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/devenir-livreur" replace />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
