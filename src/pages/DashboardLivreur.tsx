import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, User, ToggleLeft, ToggleRight, XCircle, AlertTriangle,
  MapPin, Package, Clock, ChevronRight, Moon,
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
      <div className="relative overflow-hidden px-4 pt-6 pb-10 bg-gradient-to-br from-primary via-primary-600 to-primary-700 text-white">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Top Row: Avatar + Name + Action buttons */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => navigate('/dashboard/profil')}
                className="relative cursor-pointer group"
                title="Voir mon profil"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/40 shadow-xl group-hover:scale-105 transition-transform">
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
                    <User className="w-7 h-7 text-white/90" />
                  )}
                </div>
                <div 
                  className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                    profile.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                  }`} 
                />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{greeting}</p>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {profile.name.split(' ')[0]} 👋
                </h1>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Actualiser les courses"
              className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all border border-white/20 shadow-md hover:bg-white/25"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Interactive Online/Offline Switcher */}
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all backdrop-blur-md border shadow-lg ${
              profile.is_available
                ? 'bg-white/20 border-white/40 shadow-emerald-950/20'
                : 'bg-black/20 border-white/15 shadow-black/20'
            } active:scale-[0.99]`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                profile.is_available ? 'bg-emerald-500 text-white' : 'bg-white/15 text-white/70'
              }`}>
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-lg text-white">
                    {profile.is_available ? 'En ligne' : 'Hors ligne'}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    profile.is_available ? 'bg-emerald-400 text-emerald-950' : 'bg-white/20 text-white/80'
                  }`}>
                    {profile.is_available ? 'Actif' : 'Pause'}
                  </span>
                </div>
                <p className="text-xs text-white/85 font-medium mt-0.5">
                  {profile.is_available ? 'Prêt à recevoir des courses en direct' : 'Touchez pour recevoir des courses'}
                </p>
              </div>
            </div>
            {toggling ? (
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : profile.is_available ? (
              <ToggleRight className="w-14 h-14 text-white flex-shrink-0" />
            ) : (
              <ToggleLeft className="w-14 h-14 text-white/50 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      <div className="px-4 -mt-5 relative z-20 space-y-4 max-w-4xl mx-auto">
        {/* Payout Warning */}
        {(!profile.payout_network || !profile.payout_number) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex gap-3.5 items-start shadow-sm"
          >
            <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-950 text-sm mb-0.5">Mode de retrait non configuré</h3>
              <p className="text-amber-800 text-xs mb-2.5 leading-relaxed">
                Renseignez votre compte Wave ou MTN pour recevoir automatiquement vos gains de livraisons.
              </p>
              <button
                onClick={() => navigate('/dashboard/profil/payout')}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black active:scale-95 transition-transform shadow-sm"
              >
                Configurer mon retrait Wave / MTN
              </button>
            </div>
          </motion.div>
        )}

        {/* Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Gains du jour (net de commission)
            </span>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{todayEarnings.toLocaleString('fr-FR')}</h2>
              <span className="text-sm font-extrabold text-primary">FCFA</span>
            </div>
          </div>
          <button
            onClick={() => setShowEarningsModal(true)}
            className="h-11 px-4 bg-primary-50 hover:bg-primary-100/80 rounded-2xl flex items-center gap-1.5 text-primary text-xs font-bold active:scale-95 transition-all"
          >
            <span>Détails</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center"
          >
            <div className="w-9 h-9 bg-amber-50 rounded-2xl flex items-center justify-center mb-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-xl font-black text-gray-900 leading-none">{profile.rating.toFixed(1)}</p>
            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">{profile.total_reviews} avis</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center"
          >
            <div className="w-9 h-9 bg-primary-50 rounded-2xl flex items-center justify-center mb-1.5">
              <VehicleIcon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-black text-gray-900 leading-tight truncate max-w-[90px]">{profile.vehicle_type}</p>
            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">{profile.coverage_zones.length} zones</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={handleUpdateLocation}
            className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 text-center cursor-pointer active:scale-95 transition-transform flex flex-col items-center justify-center"
          >
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-1.5 ${
              profile.current_location ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
            }`}>
              <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
            </div>
            <p className="text-sm font-black text-gray-900 leading-tight">GPS</p>
            <p className={`text-[10px] font-bold mt-1 uppercase ${
              profile.current_location ? 'text-emerald-600' : 'text-gray-500'
            }`}>
              {locating ? 'En cours...' : profile.current_location ? 'À jour' : 'Activer'}
            </p>
          </motion.div>
        </div>

        {/* Courses Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Courses disponibles</h2>
              {!isCurfewActive() && pendingOrders.length > 0 && (
                <span className="bg-primary text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm">
                  {pendingOrders.length}
                </span>
              )}
            </div>
          </div>

          {isCurfewActive() ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-gray-900 rounded-3xl p-6 text-center border border-indigo-800/40 shadow-xl text-white mt-2">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400 border border-white/15 shadow-inner">
                  <Moon className="w-7 h-7" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Sécurité Nocturne Active
                </div>
                <h3 className="text-base font-black text-white mb-1 tracking-tight">
                  Couvre-feu de sécurité (22h30 — 05h30)
                </h3>
                <p className="text-xs text-gray-300 font-medium leading-relaxed max-w-md mx-auto">
                  Les attributions de courses sont automatiquement suspendues durant la nuit pour protéger les livreurs et les marchandises à Daloa.
                </p>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-amber-200/90 font-bold">
                  <span>✨ Reposez-vous et reprenez dès 05h30 en toute sécurité.</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Bar */}
              <div className="bg-gray-200/70 p-1 rounded-2xl flex items-center mb-4">
                <button
                  onClick={() => setActiveTab('commandes')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'commandes' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Liste ({pendingOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'map' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Carte en direct
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
                      <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200 lg:col-span-2">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                          <Package className="w-8 h-8" />
                        </div>
                        <h3 className="font-black text-gray-900 text-base mb-1">Aucune course pour le moment</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                          Restez en ligne, les nouvelles livraisons dans vos zones apparaîtront ici automatiquement avec une alerte sonore.
                        </p>
                        <button
                          onClick={handleRefresh}
                          className="mt-4 px-5 py-2.5 bg-gray-100 hover:bg-gray-200/70 text-gray-800 rounded-xl text-xs font-bold active:scale-95 transition-all inline-flex items-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Actualiser
                        </button>
                      </div>
                    ) : (
                      pendingOrders.map((order, idx) => {
                        const inDriverZone = profile.coverage_zones?.some(z =>
                          order.pickup_location?.toLowerCase().includes(z.toLowerCase()) ||
                          order.dropoff_location?.toLowerCase().includes(z.toLowerCase())
                        );

                        return (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => navigate(`/course/${order.id}`)}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group"
                          >
                            {/* Order Top */}
                            <div className="p-4 pb-3">
                              <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 bg-primary-50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                    <Package className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-black text-gray-900 text-sm">Course #{order.id.slice(0, 6)}</p>
                                      {inDriverZone && (
                                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black border border-amber-200">
                                          ★ Prioritaire
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      <span>Disponible immédiatement</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-gradient-to-br from-primary to-primary-600 text-white px-3.5 py-2 rounded-2xl text-center shadow-sm">
                                  <span className="text-lg font-black leading-none block">{Math.round(order.proposed_price * 0.9)}</span>
                                  <span className="text-[9px] font-bold opacity-90 uppercase">FCFA net</span>
                                </div>
                              </div>

                              {/* Route */}
                              <div className="relative pl-3 space-y-3">
                                <div className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-gray-200" />

                                <div className="flex items-start gap-3 relative">
                                  <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary-50 relative z-10 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Récupération</p>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate mt-0.5">{order.pickup_location}</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3 relative">
                                  <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50 relative z-10 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Livraison</p>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate mt-0.5">{order.dropoff_location}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order.id); }}
                                className="w-full py-3 bg-primary hover:bg-primary-600 text-white rounded-2xl text-xs sm:text-sm font-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                              >
                                Accepter pour {Math.round(order.proposed_price * 0.9)} FCFA net
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
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
