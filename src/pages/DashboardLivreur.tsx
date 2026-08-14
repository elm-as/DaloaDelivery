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
    <div className="pb-28 bg-slate-50 min-h-screen">
      {/* ── 1. COCKPIT HERO HEADER (Bleu - Blanc - Orange) ── */}
      <div className="relative overflow-hidden px-4 pt-6 pb-12 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 rounded-b-[2.5rem] shadow-xl shadow-blue-900/15 text-white">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          {/* Top Row: Avatar + Name + Fast Refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/20 p-0.5 ring-2 ring-white/40 shadow-md flex items-center justify-center">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=ffffff&color=0066cc&size=128`;
                      }}
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                    profile.is_available ? 'bg-emerald-400 ring-2 ring-emerald-200' : 'bg-gray-400'
                  }`}
                />
              </div>

              <div>
                <span className="text-blue-200 text-xs font-semibold">{greeting}</span>
                <h1 className="text-lg font-black text-white leading-tight">{profile.name.split(' ')[0]} 👋</h1>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all border border-white/20 shadow-2xs"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Big Interactive Availability Toggle */}
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all backdrop-blur-md border shadow-lg ${
              profile.is_available
                ? 'bg-white/20 border-white/30 shadow-blue-950/20'
                : 'bg-black/20 border-white/15'
            } active:scale-[0.99]`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs transition-colors ${
                  profile.is_available ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white/70'
                }`}
              >
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <h2 className="font-black text-sm sm:text-base text-white leading-tight">
                  {profile.is_available ? '🟢 En ligne — Prêt pour course' : '⚪ Hors ligne — En pause'}
                </h2>
                <p className="text-xs text-blue-100 font-medium mt-0.5">
                  {profile.is_available ? 'Vous recevez les alertes de courses' : 'Touchez pour passer en ligne'}
                </p>
              </div>
            </div>

            {toggling ? (
              <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
            ) : profile.is_available ? (
              <ToggleRight className="w-10 h-10 text-emerald-400 shrink-0" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-white/50 shrink-0" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-20 space-y-4">
        {/* Payout Warning Alert */}
        {(!profile.payout_network || !profile.payout_number) && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-4 flex gap-3 items-start shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-black text-amber-900 text-xs sm:text-sm">Numéro de retrait manquant</h3>
              <p className="text-amber-800 text-xs mt-0.5 font-medium">
                Configurez votre numéro Wave / Orange / MTN pour recevoir directement vos gains.
              </p>
              <button
                onClick={() => navigate('/dashboard/profil/payout')}
                className="mt-2.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black active:scale-95 transition-all shadow-xs"
              >
                Configurer mon compte de retrait
              </button>
            </div>
          </div>
        )}

        {/* ── 2. EARNINGS CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gains du jour (net)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{todayEarnings.toLocaleString('fr-FR')}</h2>
              <span className="text-xs font-black text-orange-600">FCFA</span>
            </div>
          </div>
          <button
            onClick={() => setShowEarningsModal(true)}
            className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/60 rounded-2xl flex items-center gap-1.5 text-xs font-black active:scale-95 transition-all shadow-2xs"
          >
            <span>Détails</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* ── 3. QUICK STATS ROW ── */}
        <div className="grid grid-cols-3 gap-2.5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-center"
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-base sm:text-lg font-black text-gray-900">{(profile.rating || 5).toFixed(1)}</p>
            <p className="text-[10px] text-gray-400 font-bold">{profile.total_reviews || 0} avis</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-center"
          >
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <VehicleIcon className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm font-black text-gray-900 truncate">{profile.vehicle_type}</p>
            <p className="text-[10px] text-gray-400 font-bold">{profile.coverage_zones?.length || 1} zones</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={handleUpdateLocation}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-center cursor-pointer active:scale-95 transition-all hover:border-orange-200"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${
                profile.current_location ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
              }`}
            >
              <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse text-orange-500' : ''}`} />
            </div>
            <p className="text-xs sm:text-sm font-black text-gray-900">GPS</p>
            <p className="text-[10px] text-gray-400 font-bold">
              {locating ? 'En cours...' : profile.current_location ? 'Actif' : 'Positionner'}
            </p>
          </motion.div>
        </div>

        {/* ── 4. COURSES DISPONIBLES ── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900">Missions disponibles</h2>
              {!isCurfewActive() && pendingOrders.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  {pendingOrders.length}
                </span>
              )}
            </div>
          </div>

          {isCurfewActive() ? (
            <div className="bg-rose-50 rounded-3xl p-6 text-center border border-rose-200 shadow-sm">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-base font-black text-rose-900 uppercase">Couvre-feu de sécurité (22h30 - 05h30)</h3>
              <p className="text-xs text-rose-700 font-medium leading-relaxed mt-1 max-w-sm mx-auto">
                Les livraisons nocturnes sont temporairement suspendues pour votre sécurité. Rentrez chez vous en toute sérénité.
              </p>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="bg-gray-200/70 p-1 rounded-2xl flex items-center">
                <button
                  onClick={() => setActiveTab('commandes')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-xl transition-all ${
                    activeTab === 'commandes' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Liste des courses</span>
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-xl transition-all ${
                    activeTab === 'map' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Carte radar</span>
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
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <DeliveryMap livreurs={[profile]} orders={pendingOrders} className="h-[380px] w-full" />
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
                      <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-gray-200 shadow-sm space-y-2">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-2 text-gray-400">
                          <Package className="w-7 h-7" />
                        </div>
                        <h3 className="font-black text-gray-900 text-sm">Aucune course en attente</h3>
                        <p className="text-xs text-gray-400 max-w-xs mx-auto">
                          Gardez votre statut en ligne 🟢. Dès qu'un client ou commerçant fait une demande, elle apparaîtra ici.
                        </p>
                        <button
                          onClick={handleRefresh}
                          className="mt-3 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/60 rounded-xl text-xs font-black active:scale-95 transition-all inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Actualiser le radar</span>
                        </button>
                      </div>
                    ) : (
                      pendingOrders.map((order, idx) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => navigate(`/course/${order.id}`)}
                          className="bg-white rounded-3xl shadow-md shadow-gray-200/40 border border-gray-100 overflow-hidden cursor-pointer hover:border-orange-300 transition-all group"
                        >
                          <div className="p-4 sm:p-5 space-y-3.5">
                            {/* Order Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-black">
                                  <Package className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-black text-gray-900 text-xs sm:text-sm">Course #{order.id.slice(0, 6)}</h4>
                                  <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                    <Clock size={11} />
                                    <span>Disponible</span>
                                  </div>
                                </div>
                              </div>

                              {/* Price Badge */}
                              <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white px-3 py-1.5 rounded-2xl text-center shadow-xs">
                                <span className="text-base font-black leading-tight block">
                                  {Math.round((order.proposed_price || 1000) * 0.9)}
                                </span>
                                <span className="text-[9px] font-bold uppercase opacity-90">FCFA net</span>
                              </div>
                            </div>

                            {/* Route Stepper */}
                            <div className="relative pl-3.5 space-y-2 border-l-2 border-dashed border-gray-200 ml-2">
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Récupération</span>
                                <p className="text-xs font-bold text-gray-800">{order.pickup_location}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Livraison</span>
                                <p className="text-xs font-bold text-gray-800">{order.dropoff_location}</p>
                              </div>
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptOrder(order.id);
                              }}
                              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-xs font-black active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md"
                            >
                              <span>Accepter la course</span>
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
