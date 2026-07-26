import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, Clock, Eye, User, FileText,
  RefreshCw, AlertTriangle, Search, Phone, MapPin,
  Bike, Car, Truck, X, AlertCircle, ExternalLink
} from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../hooks/useSupabase';
import type { DeliveryPerson } from '../types/livreur';
import toast from 'react-hot-toast';
import { AdminVerificationModals } from '../components/admin/AdminVerificationModals';

// Access check is done against the public.users table (role = 'admin' or 'superadmin')

type TabFilter = 'pending' | 'approved' | 'rejected' | 'all';
type DeliveryTabFilter = 'all' | 'disputed' | 'active' | 'delivered';
type ModalState = 'none' | 'review' | 'reject';

const VEHICLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Moto: Bike, 'Vélo': Bike, Voiture: Car, Triporteur: Truck, motorcycle: Bike, car: Car,
};

const REJECTION_REASONS = [
  'Document illisible',
  'Document incomplet',
  'Document expiré',
  'Faux document suspect',
  'Photo du document floue',
  'Document ne correspond pas au nom inscrit',
  'Type de document non accepté',
];

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

  // New states for delivery tracing & dispute resolution
  const [viewMode, setViewMode] = useState<'drivers' | 'deliveries'>('drivers');
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveryTab, setDeliveryTab] = useState<DeliveryTabFilter>('all');
  const [deliverySignedUrls, setDeliverySignedUrls] = useState<Record<string, string>>({});
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

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

  const extractDeliveryPhotoPath = (publicUrl: string | null): string | null => {
    if (!publicUrl) return null;
    const marker = '/storage/v1/object/public/delivery-photos/';
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return publicUrl.substring(idx + marker.length).split('#')[0].split('?')[0];
  };

  const fetchDeliveries = useCallback(async () => {
    if (!isAdmin || !isSuperOrAdmin) return;
    try {
      // Étape 1 : récupérer les assignments avec le livreur
      const { data: rawAssignments, error } = await supabase
        .from('delivery_assignments')
        .select('*, delivery_person:delivery_persons(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!rawAssignments || rawAssignments.length === 0) {
        setDeliveries([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Étape 2 : récupérer les commandes associées
      const orderIds = [...new Set(rawAssignments.map((a) => a.order_id).filter(Boolean))];
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, product_amount, delivery_fee, total_amount, delivery_address, buyer_id, seller_id')
        .in('id', orderIds);

      const orderMap = new Map((orders || []).map((o: any) => [o.id, o]));

      // Étape 3 : récupérer noms + téléphones des acheteurs, vendeurs, livreurs et médiateurs
      const driverUserIds = [...new Set(rawAssignments.map((a) => a.delivery_person?.user_id).filter(Boolean))];
      const orderUserIds = [...new Set((orders || []).flatMap((o: any) => [o.buyer_id, o.seller_id]).filter(Boolean))];
      const mediatorUserIds = [...new Set(rawAssignments.map((a) => a.resolved_by).filter(Boolean))];
      const allUserIds = [...new Set([...orderUserIds, ...driverUserIds, ...mediatorUserIds])];

      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, phone')
        .in('id', allUserIds);

      const userMap = new Map((users || []).map((u: any) => [u.id, u]));

      // Fusionner tout
      const data = rawAssignments.map((a) => {
        const order = orderMap.get(a.order_id) as any;
        const dp = a.delivery_person as any;
        // Nom livreur : priorité delivery_persons.name, sinon users.full_name via user_id
        const driverName = dp?.name || (dp?.user_id ? userMap.get(dp.user_id)?.full_name : null) || 'Inconnu';
        const driverPhone = dp?.phone || (dp?.user_id ? userMap.get(dp.user_id)?.phone : null) || null;
        const mediator = a.resolved_by ? userMap.get(a.resolved_by) : null;
        return {
          ...a,
          delivery_person: dp ? { ...dp, name: driverName, phone: driverPhone } : null,
          mediator: mediator,
          order: order
            ? {
                ...order,
                buyer: userMap.get(order.buyer_id) ?? null,
                seller: userMap.get(order.seller_id) ?? null,
              }
            : null,
        };
      });

      setDeliveries(data);

      // Generate signed URLs for delivery photos
      const urls: Record<string, string> = {};
      for (const item of (data || [])) {
        if (item.delivery_photo_url) {
          const path = extractDeliveryPhotoPath(item.delivery_photo_url);
          if (path) {
            const { data: signData, error: signError } = await supabase.storage
              .from('delivery-photos')
              .createSignedUrl(path, 3600);
            if (signData?.signedUrl && !signError) {
              urls[item.id] = signData.signedUrl;
            }
          }
        }
      }
      setDeliverySignedUrls(urls);
    } catch {
      toast.error('Erreur de chargement des livraisons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, isSuperOrAdmin]);

  useEffect(() => {
    if (isAdmin) {
      if (viewMode === 'drivers') {
        fetchDrivers();
      } else if (viewMode === 'deliveries' && isSuperOrAdmin) {
        fetchDeliveries();
      }
    }
  }, [isAdmin, isSuperOrAdmin, viewMode, fetchDrivers, fetchDeliveries]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (viewMode === 'drivers') {
      fetchDrivers();
    } else {
      fetchDeliveries();
    }
  };
  const handleResolveDispute = async (assignmentId: string, action: 'deliver' | 'cancel' | 'refund_complete' | 'refund_partial') => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('resolve_delivery_dispute', {
        p_assignment_id: assignmentId,
        p_action: action
      });
      if (error) throw error;
      
      let msg = '';
      if (action === 'deliver') msg = 'Litige résolu : Commande livrée (tout le monde payé)';
      else if (action === 'refund_complete') msg = 'Litige résolu : Commande annulée et acheteur remboursé à 100%';
      else if (action === 'refund_partial') msg = 'Litige résolu : Commande annulée, acheteur remboursé du produit, livreur payé';
      else msg = 'Litige résolu : Attribution annulée';
      
      toast.success(msg);
      fetchDeliveries();
    } catch (err: any) {
      toast.error(err.message || 'Erreur de résolution');
    } finally {
      setProcessing(false);
    }
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

  // Filter logic for deliveries
  const filteredDeliveries = deliveries.filter((item) => {
    const matchTab =
      deliveryTab === 'all' ? true :
      deliveryTab === 'disputed' ? item.status === 'disputed' :
      deliveryTab === 'active' ? ['accepted', 'picked_up', 'in_transit'].includes(item.status) :
      deliveryTab === 'delivered' ? item.status === 'delivered' : true;
    const matchSearch = searchQuery
      ? item.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.delivery_person?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.delivery_person?.phone || '').includes(searchQuery)
      : true;
    return matchTab && matchSearch;
  });

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

  const getDocType = (cniUrl: string | null) => {
    if (!cniUrl) return null;
    const hash = cniUrl.split('#type=')[1];
    return hash || 'CNI';
  };

  return (
    <div className="pb-8 bg-grey-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-grey-800 to-grey-900 px-4 pt-6 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-grey-400 text-sm font-medium">Panel Admin</p>
              <h1 className="text-xl font-bold text-white">
                {viewMode === 'drivers' ? 'Vérification des livreurs' : 'Suivi des Livraisons'}
              </h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform border border-white/10"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Toggle pour Superadmin et Admin uniquement */}
          {isSuperOrAdmin && (
            <div className="flex bg-white/10 p-1 rounded-2xl mb-4 border border-white/5 max-w-sm mx-auto">
              <button
                onClick={() => {
                  setViewMode('drivers');
                  setSearchQuery('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center ${
                  viewMode === 'drivers' ? 'bg-white text-grey-900 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                Vérif. Livreurs
              </button>
              <button
                onClick={() => {
                  setViewMode('deliveries');
                  setSearchQuery('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center ${
                  viewMode === 'deliveries' ? 'bg-white text-grey-900 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                Livraisons & Litiges
              </button>
            </div>
          )}

          {/* Stats */}
          {viewMode === 'drivers' ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                <p className="text-2xl font-black text-warning-400">{pendingCount}</p>
                <p className="text-[10px] font-bold text-white/60 uppercase">En attente</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                <p className="text-2xl font-black text-success-400">{approvedCount}</p>
                <p className="text-[10px] font-bold text-white/60 uppercase">Approuvés</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                <p className="text-2xl font-black text-red-400">{rejectedCount}</p>
                <p className="text-[10px] font-bold text-white/60 uppercase">Refusés</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                <p className="text-2xl font-black text-red-400">
                  {deliveries.filter((d) => d.status === 'disputed').length}
                </p>
                <p className="text-[10px] font-bold text-white/60 uppercase text-red-300">Litiges</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                <p className="text-2xl font-black text-warning-400">
                  {deliveries.filter((d) => ['accepted', 'picked_up', 'in_transit'].includes(d.status)).length}
                </p>
                <p className="text-[10px] font-bold text-white/60 uppercase">En cours</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                <p className="text-2xl font-black text-success-400">
                  {deliveries.filter((d) => d.status === 'delivered').length}
                </p>
                <p className="text-[10px] font-bold text-white/60 uppercase">Livrées</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-20 space-y-4">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-grey-100 flex items-center px-3 gap-2">
          <Search className="w-4 h-4 text-grey-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={
              viewMode === 'drivers'
                ? 'Rechercher par nom ou téléphone...'
                : 'Rechercher par ID Commande, nom de livreur...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 py-3 text-sm bg-transparent outline-none text-grey-900 placeholder:text-grey-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-grey-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Filter */}
        {viewMode === 'drivers' ? (
          <div className="bg-grey-100 p-1 rounded-2xl flex items-center">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all text-center ${
                  activeTab === tab.key
                    ? 'bg-white text-grey-900 shadow-sm'
                    : 'text-grey-500'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 ${activeTab === tab.key ? tab.color : ''}`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-grey-100 p-1 rounded-2xl flex items-center">
            {(['all', 'disputed', 'active', 'delivered'] as const).map((key) => {
              const count =
                key === 'all' ? deliveries.length :
                key === 'disputed' ? deliveries.filter((d) => d.status === 'disputed').length :
                key === 'active' ? deliveries.filter((d) => ['accepted', 'picked_up', 'in_transit'].includes(d.status)).length :
                deliveries.filter((d) => d.status === 'delivered').length;

              const label =
                key === 'all' ? 'Toutes' :
                key === 'disputed' ? 'Litiges' :
                key === 'active' ? 'En cours' : 'Terminées';

              const color =
                key === 'disputed' ? 'text-red-600 font-black' :
                key === 'active' ? 'text-warning-600' :
                key === 'delivered' ? 'text-success' : 'text-grey-600';

              return (
                <button
                  key={key}
                  onClick={() => setDeliveryTab(key)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all text-center ${
                    deliveryTab === key ? 'bg-white text-grey-900 shadow-sm' : 'text-grey-500'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`ml-1 ${deliveryTab === key ? color : 'text-grey-400'}`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Dynamic List */}
        {viewMode === 'drivers' ? (
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {filteredDrivers.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-16 h-16 bg-grey-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-8 h-8 text-grey-300" />
                  </div>
                  <p className="font-bold text-grey-900">Aucun livreur</p>
                  <p className="text-sm text-grey-500 mt-1">Aucun livreur ne correspond aux filtres.</p>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {filteredDrivers.map((driver, idx) => {
                    const VehicleIcon = VEHICLE_ICONS[driver.vehicle_type] || Bike;
                    return (
                      <motion.div
                        key={driver.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-white rounded-2xl shadow-sm border border-grey-100 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-grey-100 flex items-center justify-center flex-shrink-0">
                              {driver.photo_url ? (
                                <img
                                  src={driver.photo_url}
                                  alt={driver.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=f3f4f6&color=374151&size=96`;
                                  }}
                                />
                              ) : (
                                <User className="w-6 h-6 text-grey-400" />
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-grey-900 text-sm truncate">{driver.name}</h3>
                                {getStatusBadge(driver)}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-grey-500">
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-3 h-3" /> {driver.phone}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <VehicleIcon className="w-3 h-3" /> {driver.vehicle_type}
                                </span>
                              </div>
                              {driver.verification_status === 'rejected' && driver.verification_rejection_reason && (
                                <p className="text-[10px] text-danger-600 mt-1 flex items-center gap-1 font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  {driver.verification_rejection_reason}
                                </p>
                              )}
                            </div>
                            {/* Action */}
                            {driver.cni_url && (
                              <button
                                onClick={() => openReview(driver)}
                                className="w-9 h-9 bg-grey-50 rounded-xl flex items-center justify-center text-grey-600 active:scale-90 transition-transform flex-shrink-0"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {filteredDeliveries.length === 0 ? (
                <motion.div
                  key="empty-del"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-3xl border border-grey-100"
                >
                  <div className="w-16 h-16 bg-grey-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-8 h-8 text-grey-300" />
                  </div>
                  <p className="font-bold text-grey-900">Aucune livraison</p>
                  <p className="text-sm text-grey-500 mt-1">Aucune livraison trouvée pour ce filtre.</p>
                </motion.div>
              ) : (
                <motion.div
                  key="list-del"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {filteredDeliveries.map((item, idx) => {
                    const isExpanded = expandedDeliveryId === item.id;
                    const statusLabel =
                      item.status === 'disputed' ? 'LITIGE' :
                      item.status === 'delivered' ? 'LIVRÉ' :
                      item.status === 'in_transit' || item.status === 'picked_up' ? 'EN ROUTE' :
                      item.status === 'accepted' ? 'ACCEPTÉ' :
                      item.status === 'awaiting_pickup' ? 'EN ATTENTE' :
                      item.status.toUpperCase();
                    const statusColors =
                      item.status === 'disputed' ? 'bg-red-50 text-red-700 border-red-200' :
                      item.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                      ['accepted', 'picked_up', 'in_transit'].includes(item.status) ? 'bg-warning-50 text-warning-700 border-warning-200' :
                      'bg-grey-50 text-grey-600 border-grey-200';

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-white rounded-2xl shadow-sm border border-grey-100 overflow-hidden"
                      >
                        {/* Compact header — always visible, tap to expand */}
                        <button
                          onClick={() => setExpandedDeliveryId(isExpanded ? null : item.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 text-left active:bg-grey-50 transition-colors"
                        >
                          {/* Status dot */}
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            item.status === 'disputed' ? 'bg-red-500' :
                            item.status === 'delivered' ? 'bg-green-500' :
                            ['accepted', 'picked_up', 'in_transit'].includes(item.status) ? 'bg-warning-400' :
                            'bg-grey-300'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-grey-700">Course #{item.id.slice(0, 6)}</span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${statusColors}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-grey-400 mt-0.5 truncate">
                              {item.delivery_person?.name || 'Sans livreur'}
                              {' • '}
                              {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`text-grey-300 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                            ▾
                          </span>
                        </button>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-4 border-t border-grey-50">

                            {/* Acteurs */}
                            <div className="pt-3 space-y-2">
                              <p className="text-[10px] font-black text-grey-400 uppercase tracking-wider">Acteurs</p>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-grey-500 font-semibold">Livreur</span>
                                  <span className="font-bold text-grey-900 text-right">
                                    {item.delivery_person?.name || 'Sans livreur'}
                                    {item.delivery_person?.phone && (
                                      <a href={`tel:${item.delivery_person.phone}`} className="ml-2 text-primary underline">
                                        {item.delivery_person.phone}
                                      </a>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-grey-500 font-semibold">Acheteur</span>
                                  <span className="font-bold text-grey-900 text-right">
                                    {item.order?.buyer?.full_name || 'Inconnu'}
                                    {item.order?.buyer?.phone && (
                                      <a href={`tel:${item.order.buyer.phone}`} className="ml-2 text-primary underline">
                                        {item.order.buyer.phone}
                                      </a>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-grey-500 font-semibold">Vendeur</span>
                                  <span className="font-bold text-grey-900 text-right">
                                    {item.order?.seller?.full_name || 'Inconnu'}
                                    {item.order?.seller?.phone && (
                                      <a href={`tel:${item.order.seller.phone}`} className="ml-2 text-primary underline">
                                        {item.order.seller.phone}
                                      </a>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Trajet */}
                            <div className="space-y-1.5 text-xs">
                              <p className="text-[10px] font-black text-grey-400 uppercase tracking-wider">Trajet</p>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3 h-3 text-grey-400 flex-shrink-0 mt-0.5" />
                                <span className="text-grey-700"><span className="font-bold text-grey-400">De :</span> {item.pickup_location}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-grey-700"><span className="font-bold text-grey-400">À :</span> {item.dropoff_location}</span>
                              </div>
                            </div>

                            {/* Finances */}
                            <div className="bg-grey-50 rounded-xl p-3 space-y-1.5 text-xs">
                              <p className="text-[10px] font-black text-grey-400 uppercase tracking-wider mb-2">Finances</p>
                              <div className="flex justify-between">
                                <span className="text-grey-500">Produit</span>
                                <span className="font-bold text-grey-800">{item.order?.product_amount || 0} FCFA</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-grey-500">Livraison</span>
                                <span className="font-bold text-grey-800">{item.order?.delivery_fee || item.delivery_price} FCFA</span>
                              </div>
                              <div className="flex justify-between border-t border-grey-200 pt-1.5 mt-1">
                                <span className="font-black text-grey-700">Total</span>
                                <span className="font-black text-green-600">{item.order?.total_amount || 0} FCFA</span>
                              </div>
                              {item.delivery_gps_distance_m !== null && (
                                <p className="text-grey-400 text-[10px] pt-1">Distance GPS : {Math.round(item.delivery_gps_distance_m)} m</p>
                              )}
                            </div>

                            {/* Motif litige */}
                            {item.dispute_reason && (
                              <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-start gap-2 text-xs">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[9px] uppercase tracking-wider opacity-75 font-black">Motif du litige</p>
                                  <p className="font-bold mt-0.5">{item.dispute_reason}</p>
                                </div>
                              </div>
                            )}

                            {/* Médiateur de résolution */}
                            {item.resolved_by && (
                              <div className="p-3 bg-grey-50 text-grey-600 rounded-xl flex items-start gap-2 text-xs border border-grey-100">
                                <User className="w-4 h-4 flex-shrink-0 mt-0.5 text-grey-500" />
                                <div>
                                  <p className="text-[9px] uppercase tracking-wider opacity-75 font-black">Résolution Litige</p>
                                  <p className="font-bold mt-0.5 text-grey-800">
                                    Médiateur : {item.mediator?.full_name || 'Admin'}
                                  </p>
                                  {item.resolved_at && (
                                    <p className="text-[10px] text-grey-400 mt-0.5">
                                      Le {new Date(item.resolved_at).toLocaleString('fr-FR')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Photo de livraison */}
                            {item.delivery_photo_url && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-grey-400 uppercase tracking-wider">Preuve livraison</p>
                                {deliverySignedUrls[item.id] ? (
                                  <div className="relative rounded-xl overflow-hidden border border-grey-100">
                                    <img
                                      src={deliverySignedUrls[item.id]}
                                      alt="Preuve livraison"
                                      className="w-full h-36 object-cover cursor-pointer"
                                      onClick={() => window.open(deliverySignedUrls[item.id], '_blank')}
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-lg">
                                      <ExternalLink className="w-3 h-3" />
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-grey-400 italic">Chargement...</p>
                                )}
                              </div>
                            )}

                            {/* Actions résolution litige */}
                            {item.status === 'disputed' && (
                              <div className="flex flex-col gap-2 pt-1">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleResolveDispute(item.id, 'refund_complete')}
                                    disabled={processing}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-black active:scale-[0.97] transition-all disabled:opacity-50"
                                  >
                                    Remb. Complet
                                  </button>
                                  <button
                                    onClick={() => handleResolveDispute(item.id, 'refund_partial')}
                                    disabled={processing}
                                    className="flex-1 py-3 bg-warning-500 text-white rounded-xl text-xs font-black active:scale-[0.97] transition-all disabled:opacity-50"
                                  >
                                    Remb. Partiel
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleResolveDispute(item.id, 'deliver')}
                                  disabled={processing}
                                  className="w-full py-3 bg-success text-white rounded-xl text-xs font-black active:scale-[0.97] transition-all disabled:opacity-50"
                                >
                                  Forcer Livraison (tous payés)
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
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
