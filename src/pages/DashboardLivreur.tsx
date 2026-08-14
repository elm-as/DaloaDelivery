import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, User, ToggleLeft, ToggleRight, XCircle, AlertTriangle,
  MapPin, Package, Clock, ChevronRight,
  Zap, Navigation, RefreshCw, Bike, Car, Truck
} from 'lucide-react';
import { EarningsModal } from '../components/dashboard/EarningsModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DeliveryMap } from '../components/ui/DeliveryMap';
import { supabase } from '../lib/supabase';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { deliveryOrderService, type DeliveryRequest } from '../services/deliveryOrderService';
import { useSupabase } from '../hooks/useSupabase';
import { useDriverCourseNotifications } from '../hooks/useDriverCourseNotifications';
import type { DeliveryPerson } from '../types/livreur';
import toast from 'react-hot-toast';
import { isCurfewActive } from '../utils/security';

const VEHICLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Moto: Bike, Vélo: Bike, Voiture: Car, Triporteur: Truck, motorcycle: Bike, car: Car,
};

export default function DashboardLivreur() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabase();
  const [profile, setProfile] = useState<DeliveryPerson | null>(null);

  // Activate real-time PWA Push, Audio Synth Beep & Vibration alerts for new available courses
  useDriverCourseNotifications({
    isAvailable: !!profile?.is_available,
    driverZone: profile?.coverage_zones,
  });
  const [pendingOrders, setPendingOrders] = useState<DeliveryRequest[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveryRequest[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [locating, setLocating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'commandes' | 'map'>('commandes');
  const pendingOrderIdsRef = useRef<Set<string>>(new Set());

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
        // Check if user is an admin before forcing them to become a driver
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
        toast("Créez votre profil de livreur d'abord", { icon: 'ℹ️' });
        return;
      }
      setProfile(profileData);
      const [orders, myOrders] = await Promise.all([
        deliveryOrderService.getPendingRequests(),
        deliveryOrderService.getMyOrders(profileData.id)
      ]);

      // Trier les commandes pour mettre en avant celles de la zone du livreur
      const isOrderInZone = (order: DeliveryRequest) => {
        const zones = profileData.coverage_zones || [];
        if (zones.length === 0) return false;

        const pickup = (order.pickup_location || '').toLowerCase();
        const dropoff = (order.dropoff_location || '').toLowerCase();

        return zones.some(zone => {
          const z = zone.toLowerCase();
          return pickup.includes(z) || dropoff.includes(z);
        });
      };

      const sortedOrders = [...orders].sort((a, b) => {
        const aInZone = isOrderInZone(a) ? 1 : 0;
        const bInZone = isOrderInZone(b) ? 1 : 0;
        // Tri décroissant : les courses dans la zone (1) avant les autres (0)
        return bInZone - aInZone;
      });

      setPendingOrders(sortedOrders);

      // Alert with beep and vibration on new order if online
      const newOrders = sortedOrders.filter(o => !pendingOrderIdsRef.current.has(o.id));
      if (pendingOrderIdsRef.current.size > 0 && newOrders.length > 0 && profileData.is_available) {
        // Dual-tone Synth Beep (HTML5 Web Audio API)
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.35);
        } catch (e) {
          console.error("Audio beep failed:", e);
        }
        navigator.vibrate?.([200, 100, 200]);
      }
      pendingOrderIdsRef.current = new Set(sortedOrders.map(o => o.id));

      const delivered = myOrders.filter(o => o.status === 'delivered');
      setDeliveredOrders(delivered);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const earnings = delivered
        .filter(o => new Date(o.delivered_at || o.created_at) >= today)
        .reduce((sum, o) => sum + (o.proposed_price || 0) * 0.9, 0); // 10% de commission de la plateforme déduite
      setTodayEarnings(Math.round(earnings));
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

  useEffect(() => {
    if (!profile?.is_available) return;

    const channel = supabase
      .channel('delivery-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_assignments' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.is_available, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      const updated = await deliveryPersonService.toggleAvailability(profile.id, !profile.is_available);
      setProfile(updated);
      toast.success(updated.is_available ? 'Vous êtes en ligne ! 🟢' : 'Vous êtes hors ligne');
    } catch {
      toast.error('Erreur lors du changement de disponibilité');
    } finally {
      setToggling(false);
    }
  };

  const handleUpdateLocation = () => {
    if (!profile) return;
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée");
      return;
    }
    setLocating(true);
    toast.loading('Localisation...', { id: 'loc' });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const updated = await deliveryPersonService.updateDeliveryPerson(profile.id, {
            current_location: { lat: latitude, lng: longitude }
          });
          setProfile(updated);
          toast.success('Position mise à jour !', { id: 'loc' });
        } catch {
          toast.error('Erreur de mise à jour', { id: 'loc' });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Impossible de récupérer la position', { id: 'loc' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!profile) return;
    try {
      await deliveryOrderService.acceptRequest(orderId, profile.id);
      toast.success('Commande acceptée !');
      setPendingOrders((prev) => prev.filter(o => o.id !== orderId));
    } catch {
      toast.error('Erreur: commande déjà prise ou indisponible.');
    }
  };



  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-grey-900 mb-2">Profil introuvable</h1>
        <p className="text-grey-500 mb-6">Vous n'avez pas encore créé votre profil de livreur.</p>
        <button
          onClick={() => navigate('/devenir-livreur')}
          className="px-6 py-4 bg-primary text-white rounded-2xl font-bold w-full max-w-sm active:scale-95 transition-transform"
        >
          Devenir livreur
        </button>
      </div>
    );
  }

  const VehicleIcon = VEHICLE_ICONS[profile.vehicle_type] || Bike;
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="pb-24 bg-grey-50 min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-6 pb-8 bg-gradient-to-br from-primary to-primary-700">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          {/* Top Row: Avatar + Name + Refresh */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30 shadow-lg">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=ffffff&color=ea580c&size=128`;
                      }}
                    />
                  ) : (
                    <User className="w-7 h-7 text-white/70" />
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-white rounded-full ${profile.is_available ? 'bg-success' : 'bg-grey-400'}`} />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">{greeting}</p>
                <h1 className="text-xl font-bold text-white leading-tight">{profile.name.split(' ')[0]} 👋</h1>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform border border-white/10"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Big Online/Offline Toggle */}
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all backdrop-blur-sm border ${profile.is_available
                ? 'bg-white/20 border-white/30'
                : 'bg-white/10 border-white/20'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.is_available ? 'bg-success-500/80' : 'bg-white/10'
                }`}>
                <Zap className={`w-5 h-5 ${profile.is_available ? 'text-white' : 'text-white/60'}`} />
              </div>
              <div className="text-left">
                <h2 className={`font-bold text-lg leading-tight ${profile.is_available ? 'text-white' : 'text-white/80'}`}>
                  {profile.is_available ? 'En ligne' : 'Hors ligne'}
                </h2>
                <p className={`text-sm ${profile.is_available ? 'text-white/90' : 'text-white/60'}`}>
                  {profile.is_available ? 'Prêt à recevoir des courses' : 'Touchez pour passer en ligne'}
                </p>
              </div>
            </div>
            {toggling ? (
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : profile.is_available ? (
              <ToggleRight className="w-14 h-14 text-white flex-shrink-0" />
            ) : (
              <ToggleLeft className="w-14 h-14 text-white/50 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-20 space-y-4">
        {/* Payout Warning */}
        {(!profile.payout_network || !profile.payout_number) && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 text-sm mb-1">Configuration paiement manquante</h3>
              <p className="text-red-700 text-xs mb-3">
                Vous devez configurer votre numéro de retrait pour recevoir vos gains de livraison.
              </p>
              <button
                onClick={() => navigate('/profil')}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-xl text-xs font-bold active:scale-95 transition-transform"
              >
                Configurer maintenant
              </button>
            </div>
          </div>
        )}

        {/* Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-grey-100 flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-bold text-grey-500 mb-0.5">Gains du jour (net)</p>
            <div className="flex items-baseline gap-1">
              <h2 className="text-2xl font-black text-grey-900">{todayEarnings.toLocaleString('fr-FR')}</h2>
              <span className="text-sm font-bold text-grey-500">FCFA</span>
            </div>
          </div>
          <button
            onClick={() => setShowEarningsModal(true)}
            className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary active:scale-95 transition-transform"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-grey-100 text-center"
          >
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Star className="w-4 h-4 text-primary fill-primary" />
            </div>
            <p className="text-xl font-black text-grey-900">{profile.rating.toFixed(1)}</p>
            <p className="text-[10px] text-grey-500 font-bold mt-0.5">{profile.total_reviews} avis</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-grey-100 text-center"
          >
            <div className="w-9 h-9 bg-secondary-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <VehicleIcon className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-sm font-bold text-grey-900">{profile.vehicle_type}</p>
            <p className="text-[10px] text-grey-500 font-bold mt-0.5">{profile.coverage_zones.length} zones</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={handleUpdateLocation}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-grey-100 text-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${profile.current_location ? 'bg-success-50' : 'bg-grey-50'
              }`}>
              <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse' : ''} ${profile.current_location ? 'text-success' : 'text-grey-400'
                }`} />
            </div>
            <p className="text-sm font-bold text-grey-900">GPS</p>
            <p className="text-[10px] text-grey-500 font-bold mt-0.5">
              {locating ? 'En cours...' : profile.current_location ? 'À jour' : 'Activer'}
            </p>
          </motion.div>
        </div>


        {/* Courses Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-grey-900">Courses disponibles</h2>
              {!isCurfewActive() && pendingOrders.length > 0 && (
                <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              )}
            </div>
          </div>

          {isCurfewActive() ? (
            <div className="bg-error-50 rounded-2xl p-6 text-center border-2 border-error-100 mt-4">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-lg font-black text-error-900 mb-2 uppercase">
                Couvre-feu de sécurité (22h30 - 05h30)
              </h3>
              <p className="text-sm text-error-800 font-medium leading-relaxed mb-4">
                Les courses sont suspendues durant la nuit pour votre sécurité.
                Aucune commande ne peut être acceptée pendant cette période.
              </p>
              <div className="bg-error-100/50 p-3 rounded-xl">
                <p className="text-xs font-bold text-error-900">
                  Rentrez chez vous en sécurité.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Bar */}
              <div className="bg-grey-100 p-1 rounded-2xl flex items-center mb-4">
                <button
                  onClick={() => setActiveTab('commandes')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'commandes' ? 'bg-white text-primary shadow-sm' : 'text-grey-500'
                    }`}
                >
                  <Package className="w-4 h-4" />
                  Liste
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'map' ? 'bg-white text-primary shadow-sm' : 'text-grey-500'
                    }`}
                >
                  <MapPin className="w-4 h-4" />
                  Carte
                </button>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'map' ? (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-grey-100 overflow-hidden"
                  >
                    <DeliveryMap livreurs={[profile]} orders={pendingOrders} className="h-[400px] w-full" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4"
                  >
                    {pendingOrders.length === 0 ? (
                      <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-grey-200">
                        <div className="w-20 h-20 bg-grey-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <Package className="w-10 h-10 text-grey-300" />
                        </div>
                        <h3 className="font-bold text-grey-900 mb-1">Pas de courses pour le moment</h3>
                        <p className="text-sm text-grey-500 max-w-xs mx-auto">
                          Restez en ligne, les nouvelles courses dans vos zones apparaîtront ici automatiquement.
                        </p>
                        <button
                          onClick={handleRefresh}
                          className="mt-4 px-5 py-2.5 bg-grey-50 text-grey-700 rounded-xl text-sm font-bold active:scale-95 transition-transform inline-flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Actualiser
                        </button>
                      </div>
                    ) : (
                      pendingOrders.map((order, idx) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          onClick={() => navigate(`/course/${order.id}`)}
                          className="bg-white rounded-2xl shadow-sm border border-grey-100 overflow-hidden cursor-pointer hover:border-primary-200 transition-colors"
                        >
                          {/* Order Top */}
                          <div className="p-4 pb-3">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                  <Package className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-bold text-grey-900 text-sm">Course #{order.id.slice(0, 6)}</p>
                                  <div className="flex items-center gap-1 text-xs text-grey-500 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    <span>À l'instant</span>
                                  </div>
                                  {profile.coverage_zones?.some(z =>
                                    order.pickup_location?.toLowerCase().includes(z.toLowerCase()) ||
                                    order.dropoff_location?.toLowerCase().includes(z.toLowerCase())
                                  ) && (
                                      <div className="mt-1 inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                        <MapPin className="w-3 h-3" />
                                        Zone prioritaire
                                      </div>
                                    )}
                                </div>
                              </div>
                              <div className="bg-primary text-white px-3 py-2 rounded-xl text-center">
                                <span className="text-lg font-black leading-none block">{Math.round(order.proposed_price * 0.9)}</span>
                                <span className="text-[9px] font-bold opacity-80 uppercase">FCFA net</span>
                              </div>
                            </div>

                            {/* Route */}
                            <div className="relative pl-4">
                              <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-grey-200" />

                              <div className="flex items-start gap-3 mb-3.5 relative">
                                <div className="w-3 h-3 rounded-full bg-grey-300 ring-4 ring-white relative z-10 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-grey-400 uppercase tracking-wider">Récupération</p>
                                  <p className="text-sm font-medium text-grey-900 mt-0.5">{order.pickup_location}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 relative">
                                <div className="w-3 h-3 rounded-full bg-secondary ring-4 ring-white relative z-10 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-grey-400 uppercase tracking-wider">Livraison</p>
                                  <p className="text-sm font-medium text-grey-900 mt-0.5">{order.dropoff_location}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="px-4 pb-4 pt-2 border-t border-grey-50">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order.id); }}
                              className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-bold active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
                            >
                              Accepter pour {Math.round(order.proposed_price * 0.9)} FCFA net
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
      {/* Modal Historique des gains */}
      <EarningsModal
        show={showEarningsModal}
        onClose={() => setShowEarningsModal(false)}
        deliveredOrders={deliveredOrders}
      />
    </div>
  );
}
