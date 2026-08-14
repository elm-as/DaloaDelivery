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
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header with Stats */}
      <div className="bg-white px-4 pt-5 pb-6 border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Mes livraisons</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Suivez vos courses en temps réel et validez les OTP</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Actualiser les commandes"
              className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-700 active:scale-90 transition-all border border-gray-200/70 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-amber-600 leading-none">{inProgressOrders.length}</p>
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mt-1.5">En cours de livraison</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-3xl p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-emerald-600 leading-none">{deliveredOrders.length}</p>
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mt-1.5">Courses terminées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="px-4 pt-4 max-w-4xl mx-auto">
        <div className="bg-gray-200/70 p-1 rounded-2xl flex items-center mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  isCurrent 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                    isCurrent ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
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
            <div className="bg-gradient-to-br from-red-50 to-rose-100/60 rounded-3xl p-6 text-center border border-red-200 lg:col-span-2">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-600">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-red-950 mb-1.5 uppercase tracking-wide">
                Couvre-feu de sécurité (22h30 - 05h30)
              </h3>
              <p className="text-xs text-red-800 font-medium leading-relaxed max-w-md mx-auto">
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
                  className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200 lg:col-span-2"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                    {activeTab === 'accepted' ? (
                      <Inbox className="w-8 h-8" />
                    ) : (
                      <Package className="w-8 h-8" />
                    )}
                  </div>
                  <h3 className="font-black text-gray-900 text-base mb-1">
                    {activeTab === 'accepted' ? 'Aucune livraison en cours' : 'Aucune course terminée'}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    {activeTab === 'accepted' 
                      ? 'Les livraisons que vous acceptez dans le flux des courses apparaîtront ici pour la validation OTP.'
                      : 'L\'historique complet de vos livraisons effectuées apparaîtra ici.'}
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="mt-4 px-5 py-2.5 bg-gray-100 hover:bg-gray-200/70 text-gray-800 rounded-xl text-xs font-bold active:scale-95 transition-all inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Actualiser
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 lg:space-y-0 lg:contents"
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
