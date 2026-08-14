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
    <div className="pb-24 bg-grey-50 min-h-screen">
      {/* Header with Stats */}
      <div className="bg-white px-4 pt-4 pb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-grey-900">Mes commandes</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-grey-50 flex items-center justify-center text-grey-600 active:scale-90 transition-transform"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-warning-50 to-warning-100/50 rounded-2xl p-3.5 text-center">
            <p className="text-2xl font-black text-warning-600">{inProgressOrders.length}</p>
            <p className="text-[10px] font-bold text-warning-700 uppercase mt-0.5">En cours</p>
          </div>
          <div className="bg-gradient-to-br from-success-50 to-success-100/50 rounded-2xl p-3.5 text-center">
            <p className="text-2xl font-black text-success">{deliveredOrders.length}</p>
            <p className="text-[10px] font-bold text-success-600 uppercase mt-0.5">Livrées</p>
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="px-4 pt-4">
        <div className="bg-grey-100 p-1 rounded-2xl flex items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeTab === tab.key 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-grey-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && activeTab !== tab.key && (
                  <span className="bg-grey-300 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 mt-4 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
        {isCurfewActive() && activeTab !== 'accepted' ? (
          <div className="bg-error-50 rounded-2xl p-6 text-center border-2 border-error-100 mt-4">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-lg font-black text-error-900 mb-2 uppercase">
              Couvre-feu de sécurité (22h30 - 05h30)
            </h3>
            <p className="text-sm text-error-800 font-medium leading-relaxed mb-4">
              Les courses sont suspendues durant la nuit pour votre sécurité. 
              Aucune nouvelle commande ne peut être acceptée pendant cette période.
            </p>
            <div className="bg-error-100/50 p-3 rounded-xl">
              <p className="text-xs font-bold text-error-900">
                Rentrez chez vous en sécurité.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredOrders.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-grey-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'accepted' ? (
                    <Inbox className="w-10 h-10 text-grey-300" />
                  ) : (
                    <Package className="w-10 h-10 text-grey-300" />
                  )}
                </div>
                <h3 className="font-bold text-grey-900 text-lg mb-1">
                  {activeTab === 'accepted' ? 'Aucune commande en cours' : 'Aucune commande'}
                </h3>
                <p className="text-sm text-grey-500 max-w-xs mx-auto">
                  {activeTab === 'accepted' 
                    ? 'Les commandes que vous acceptez apparaîtront ici.'
                    : 'En attente de nouvelles livraisons dans vos zones.'}
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-5 px-5 py-2.5 bg-grey-100 text-grey-700 rounded-xl text-sm font-bold active:scale-95 transition-transform inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualiser
                </button>
              </motion.div>
            ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
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
