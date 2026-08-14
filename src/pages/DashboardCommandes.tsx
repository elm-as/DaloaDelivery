import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, RefreshCw, XCircle, Inbox } from 'lucide-react';
import { OrderCard } from '../components/dashboard/OrderCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { useSupabase } from '../hooks/useSupabase';
import { isCurfewActive } from '../utils/security';
import type { DeliveryPerson } from '../types/livreur';
import toast from 'react-hot-toast';
import PickupVerificationModal from '../components/livreur/PickupVerificationModal';
import DeliveryVerificationModal from '../components/livreur/DeliveryVerificationModal';

import { supabase } from '../lib/supabase';
import { deliveryAssignmentService, type DeliveryAssignment } from '../services/deliveryAssignmentService';

type TabFilter = 'accepted' | 'delivered';

export default function DashboardCommandes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabase();
  const [profile, setProfile] = useState<DeliveryPerson | null>(null);

  const [myOrders, setMyOrders] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('accepted');
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const profileData = await deliveryPersonService.getDeliveryPersonByUserId(user.id);
      if (!profileData) {
        try {
          const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
          if (userData?.role === 'admin' || userData?.role === 'superadmin') {
            navigate('/admin');
            return;
          }
        } catch (err) {
          console.error("Error checking user role:", err);
        }
        navigate('/devenir-livreur');
        return;
      }
      setProfile(profileData);
      const mine = await deliveryAssignmentService.getMyAssignments(profileData.id);
      setMyOrders(mine);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAcceptOrder = async (assignmentId: string) => {
    if (!profile) return;
    try {
      await deliveryAssignmentService.acceptAssignment(assignmentId, profile.id);
      toast.success('Commande acceptée !');
      fetchData();
    } catch {
      toast.error('Erreur: commande déjà prise ou indisponible.');
    }
  };

  const handlePickupVerification = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    setPickupModalOpen(true);
  };

  const handleDeliveryVerification = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    setDeliveryModalOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const inProgressOrders = myOrders.filter(o => ['accepted', 'picked_up', 'in_transit'].includes(o.status));
  const deliveredOrders = myOrders.filter(o => o.status === 'delivered');

  const tabs: { key: TabFilter; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { key: 'accepted', label: 'En cours', icon: Inbox, count: inProgressOrders.length },
    { key: 'delivered', label: 'Livrées', icon: Package, count: deliveredOrders.length },
  ];

  const filteredOrders = activeTab === 'accepted' ? inProgressOrders : deliveredOrders;

  return (
    <div className="pb-28 bg-slate-50 min-h-screen">
      {/* Header with Stats */}
      <div className="bg-white/90 backdrop-blur-xl px-4 pt-4 pb-5 shadow-2xs border-b border-gray-100 sticky top-14 z-30">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-black text-gray-900">Mes Missions de Livraison</h1>
              <p className="text-xs text-gray-400 font-medium">Courses en cours & historique des livraisons</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-9 h-9 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-700 active:scale-90 transition-all border border-gray-100 shadow-2xs"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-3 text-center shadow-2xs">
              <p className="text-xl font-black text-orange-700">{inProgressOrders.length}</p>
              <p className="text-[10px] font-black text-orange-600 uppercase mt-0.5 tracking-wider">En cours</p>
            </div>
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 text-center shadow-2xs">
              <p className="text-xl font-black text-emerald-700">{deliveredOrders.length}</p>
              <p className="text-[10px] font-black text-emerald-600 uppercase mt-0.5 tracking-wider">Livrées avec succès</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Tab Filter */}
        <div className="bg-gray-200/70 p-1 rounded-2xl flex items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-xl transition-all ${
                  active ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count > 0 && !active && (
                  <span className="bg-gray-300 text-gray-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
          {isCurfewActive() && activeTab !== 'accepted' ? (
            <div className="bg-rose-50 rounded-3xl p-6 text-center border border-rose-200 shadow-sm">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-base font-black text-rose-900 uppercase">
                Couvre-feu de sécurité (22h30 - 05h30)
              </h3>
              <p className="text-xs text-rose-700 font-medium leading-relaxed mt-1 max-w-sm mx-auto">
                Les courses sont suspendues durant la nuit pour votre sécurité.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredOrders.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200 shadow-sm space-y-2 col-span-2"
                >
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                    {activeTab === 'accepted' ? <Inbox className="w-7 h-7" /> : <Package className="w-7 h-7" />}
                  </div>
                  <h3 className="font-black text-gray-900 text-sm">
                    {activeTab === 'accepted' ? 'Aucune mission en cours' : 'Aucune course livrée pour l\'instant'}
                  </h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    {activeTab === 'accepted'
                      ? 'Les courses acceptées depuis votre cockpit apparaîtront ici pour le suivi étape par étape.'
                      : 'Vos courses terminées s\'archiveront ici avec validation par code OTP.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 col-span-2"
                >
                  {filteredOrders.map((order, idx) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      idx={idx}
                      handleAcceptOrder={handleAcceptOrder}
                      handlePickupVerification={handlePickupVerification}
                      handleDeliveryVerification={handleDeliveryVerification}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Verification Modals */}
      {selectedAssignment && (
        <>
          <PickupVerificationModal
            assignmentId={selectedAssignment.id}
            isOpen={pickupModalOpen}
            onClose={() => {
              setPickupModalOpen(false);
              setSelectedAssignment(null);
            }}
            onSuccess={fetchData}
            sellerPhone={selectedAssignment.seller_phone}
          />
          <DeliveryVerificationModal
            assignmentId={selectedAssignment.id}
            isOpen={deliveryModalOpen}
            onClose={() => {
              setDeliveryModalOpen(false);
              setSelectedAssignment(null);
            }}
            onSuccess={fetchData}
            buyerPhone={selectedAssignment.buyer_phone}
          />
        </>
      )}
    </div>
  );
}
