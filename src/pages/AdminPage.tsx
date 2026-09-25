import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, Clock, Eye, User, FileText,
  RefreshCw, AlertTriangle, Search, Phone,
  Bike, Car, Truck, ExternalLink, Scale
} from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../hooks/useSupabase';
import type { DeliveryPerson } from '../types/livreur';
import toast from 'react-hot-toast';
import { AdminVerificationModals } from '../components/admin/AdminVerificationModals';

// Access check is done against the public.users table (role = 'admin' or 'superadmin')

type TabFilter = 'pending' | 'approved' | 'rejected' | 'all';
type ModalState = 'none' | 'review' | 'reject';

const VEHICLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Moto: Bike, 'Vélo': Bike, Voiture: Car, Triporteur: Truck, motorcycle: Bike, car: Car,
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabase();
  const [drivers, setDrivers] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [activeModal, setActiveModal] = useState<ModalState>('none');
  const [selectedDriver, setSelectedDriver] = useState<DeliveryPerson | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const isSuperOrAdmin = userRole ? ['superadmin', 'admin'].includes(userRole) : false;

  // Auth check and role verification
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const checkAdminRole = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const allowedRoles = ['admin', 'superadmin', 'moderator', 'helper'];
        if (error || !data?.role || !allowedRoles.includes(data.role)) {
          toast.error("Accès refusé : vous n'avez pas les droits nécessaires");
          navigate('/dashboard');
        } else {
          setIsAdmin(true);
          setUserRole(data.role);
        }
      } catch {
        toast.error("Erreur lors de la vérification des droits");
        navigate('/dashboard');
      }
    };

    checkAdminRole();
  }, [user, authLoading, navigate]);

  const fetchDrivers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data, error } = await supabase
        .from('delivery_persons')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrivers((data || []) as DeliveryPerson[]);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchDrivers();
  }, [isAdmin, fetchDrivers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };
  // Extraire le chemin du fichier depuis une URL publique Supabase
  const extractFilePath = (publicUrl: string | null): string | null => {
    if (!publicUrl) return null;
    // URL format: .../storage/v1/object/public/livreur-cni/path/to/file
    const marker = '/storage/v1/object/public/livreur-cni/';
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    // Enlever les fragments (#type=...) 
    return publicUrl.substring(idx + marker.length).split('#')[0].split('?')[0];
  };

  const openReview = async (driver: DeliveryPerson) => {
    setSelectedDriver(driver);
    setActiveModal('review');
    setSignedUrls({});

    // Générer les URLs signées pour les images privées
    const urls: Record<string, string> = {};
    const fields = [
      { key: 'cni', url: driver.cni_url },
      { key: 'selfie', url: driver.selfie_cni_url },
      { key: 'portrait', url: driver.portrait_live_url },
      { key: 'licence', url: driver.licence_url },
    ];

    for (const field of fields) {
      const path = extractFilePath(field.url);
      if (path) {
        const { data, error } = await supabase.storage
          .from('livreur-cni')
          .createSignedUrl(path, 3600); // 1 heure
        if (data?.signedUrl && !error) {
          urls[field.key] = data.signedUrl;
        }
      }
    }
    setSignedUrls(urls);
  };

  const handleApprove = async () => {
    if (!selectedDriver) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('delivery_persons')
        .update({
          is_verified: true,
          verification_status: 'approved',
          verification_rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedDriver.id);

      if (error) throw error;
      toast.success(`${selectedDriver.name} a été vérifié !`);
      setActiveModal('none');
      setSelectedDriver(null);
      fetchDrivers();
    } catch {
      toast.error('Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDriver) return;
    const reason = rejectionReason === 'custom' ? customReason : rejectionReason;
    if (!reason.trim()) {
      toast.error('Veuillez indiquer la raison du refus');
      return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('delivery_persons')
        .update({
          is_verified: false,
          verification_status: 'rejected',
          verification_rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedDriver.id);

      if (error) throw error;
      toast.success(`Document de ${selectedDriver.name} refusé`);
      setActiveModal('none');
      setSelectedDriver(null);
      setRejectionReason('');
      setCustomReason('');
      fetchDrivers();
    } catch {
      toast.error('Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Filter logic for drivers
  const filteredDrivers = drivers.filter((d) => {
    const status = d.verification_status || (d.cni_url ? 'pending' : 'none');
    const matchTab =
      activeTab === 'all' ? true :
      activeTab === 'pending' ? (status === 'pending' || (d.cni_url && status === 'none')) :
      status === activeTab;
    const matchSearch = searchQuery
      ? d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone.includes(searchQuery)
      : true;
    return matchTab && matchSearch;
  });

  const pendingCount = drivers.filter(d => {
    const s = d.verification_status || (d.cni_url ? 'pending' : 'none');
    return s === 'pending' || (d.cni_url && s === 'none');
  }).length;
  const approvedCount = drivers.filter(d => d.verification_status === 'approved').length;
  const rejectedCount = drivers.filter(d => d.verification_status === 'rejected').length;

  const tabs: { key: TabFilter; label: string; count: number; color: string }[] = [
    { key: 'pending', label: 'En attente', count: pendingCount, color: 'text-warning-600' },
    { key: 'approved', label: 'Approuvés', count: approvedCount, color: 'text-success' },
    { key: 'rejected', label: 'Refusés', count: rejectedCount, color: 'text-danger' },
    { key: 'all', label: 'Tous', count: drivers.length, color: 'text-grey-600' },
  ];

  const getStatusBadge = (driver: DeliveryPerson) => {
    const status = driver.verification_status || (driver.cni_url ? 'pending' : 'none');
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-50 text-success-700 rounded-lg text-[10px] font-bold border border-success-100">
            <CheckCircle className="w-3 h-3" /> Vérifié
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-danger-50 text-danger-700 rounded-lg text-[10px] font-bold border border-danger-100">
            <XCircle className="w-3 h-3" /> Refusé
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning-50 text-warning-700 rounded-lg text-[10px] font-bold border border-warning-100">
            <Clock className="w-3 h-3" /> En attente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-grey-100 text-grey-500 rounded-lg text-[10px] font-bold">
            <FileText className="w-3 h-3" /> Aucun doc
          </span>
        );
    }
  };

  // Arbitrage des litiges et suivi des courses : un seul endroit, l'admin
  // DaloaMarket. Cette page en avait une copie avec ses propres boutons.
  const MARKET_ADMIN = 'https://daloamarket.com/admin';

  const stats = [
    { key: 'pending' as TabFilter, label: 'En attente', value: pendingCount },
    { key: 'approved' as TabFilter, label: 'Vérifiés', value: approvedCount },
    { key: 'rejected' as TabFilter, label: 'Refusés', value: rejectedCount },
  ];

  return (
    <div className="pb-10 bg-grey-50 min-h-screen">
      {/* ── En-tête aux couleurs DaloaDelivery ── */}
      <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-primary via-primary-600 to-primary-700 px-4 pt-6 pb-16">
        <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/80">Administration</p>
              <h1 className="text-xl font-bold text-white">Vérification des livreurs</h1>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Actualiser"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative mx-auto mt-5 grid max-w-4xl grid-cols-3 gap-2">
          {stats.map((st) => (
            <button
              key={st.key}
              onClick={() => setActiveTab(st.key)}
              className={`rounded-2xl px-2 py-2.5 text-center transition-colors ${
                activeTab === st.key ? 'bg-white/30' : 'bg-white/15 hover:bg-white/25'
              }`}
            >
              <p className="text-lg font-bold leading-none text-white tabular-nums">{st.value}</p>
              <p className="mt-1 text-[11px] font-medium text-white/85">{st.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 -mt-10 mx-auto max-w-4xl space-y-3 px-4">
        {/* Litiges et livraisons : gérés dans l'admin DaloaMarket */}
        {isSuperOrAdmin && (
          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-white p-2 shadow-lg shadow-orange-900/5 ring-1 ring-grey-100">
            <a
              href={`${MARKET_ADMIN}/litiges`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 hover:bg-primary-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <Scale className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-grey-900">Litiges</span>
              <ExternalLink className="h-3.5 w-3.5 text-grey-400" />
            </a>
            <a
              href={`${MARKET_ADMIN}/livraisons`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 hover:bg-primary-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <Truck className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-grey-900">Livraisons</span>
              <ExternalLink className="h-3.5 w-3.5 text-grey-400" />
            </a>
          </div>
        )}

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nom ou téléphone du livreur"
            className="w-full rounded-2xl border border-grey-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        {/* Onglets : 4 colonnes égales */}
        <div className="grid grid-cols-4 gap-1.5">
          {tabs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex h-10 items-center justify-center rounded-xl text-[13px] font-semibold transition-colors ${
                  selected ? 'bg-primary text-white shadow-md shadow-orange-500/20' : 'bg-white text-grey-600 ring-1 ring-grey-200'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-1 min-w-[18px] rounded-full px-1 text-center text-[10px] font-bold leading-[18px] ring-2 ring-grey-50 ${
                      selected ? 'bg-grey-900 text-white' : 'bg-primary text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Liste des livreurs */}
        <AnimatePresence mode="wait">
          {filteredDrivers.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl bg-white py-14 text-center ring-1 ring-grey-100"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-grey-100">
                <Shield className="h-7 w-7 text-grey-300" />
              </div>
              <p className="font-bold text-grey-900">Aucun livreur</p>
              <p className="mt-1 text-sm text-grey-500">Aucun livreur ne correspond à ce filtre.</p>
            </motion.div>
          ) : (
            <motion.ul
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0"
            >
              {filteredDrivers.map((driver) => {
                const VehicleIcon = VEHICLE_ICONS[driver.vehicle_type] || Bike;
                const canReview = Boolean(driver.cni_url);
                return (
                  <li key={driver.id}>
                    <button
                      type="button"
                      onClick={() => canReview && openReview(driver)}
                      disabled={!canReview}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left ring-1 ring-grey-100 transition-colors hover:bg-grey-50 disabled:cursor-default disabled:hover:bg-white"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-grey-100">
                        {driver.photo_url ? (
                          <img
                            src={driver.photo_url}
                            alt={driver.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=f3f4f6&color=374151&size=96`;
                            }}
                          />
                        ) : (
                          <User className="h-6 w-6 text-grey-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-grey-900">{driver.name}</p>
                          {getStatusBadge(driver)}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-grey-500">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {driver.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <VehicleIcon className="h-3 w-3" /> {driver.vehicle_type}
                          </span>
                        </div>
                        {driver.verification_status === 'rejected' && driver.verification_rejection_reason && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger-600">
                            <AlertTriangle className="h-3 w-3" /> {driver.verification_rejection_reason}
                          </p>
                        )}
                      </div>
                      {canReview ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-xl bg-primary-50 px-3 py-2 text-xs font-semibold text-primary">
                          <Eye className="h-3.5 w-3.5" /> Examiner
                        </span>
                      ) : (
                        <span className="shrink-0 text-[11px] text-grey-400">Pièces non envoyées</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Verifications Modals */}
      <AdminVerificationModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        selectedDriver={selectedDriver}
        setSelectedDriver={setSelectedDriver}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        customReason={customReason}
        setCustomReason={setCustomReason}
        processing={processing}
        handleApprove={handleApprove}
        handleReject={handleReject}
        getStatusBadge={getStatusBadge}
        signedUrls={signedUrls}
      />
    </div>
  );
}
