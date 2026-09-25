import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, User, ToggleLeft, ToggleRight, AlertTriangle,
  MapPin, Package, Clock, ChevronRight, Moon,
  Navigation, RefreshCw, LogOut
} from 'lucide-react';
import { EarningsModal } from '../components/dashboard/EarningsModal';
import { CodDebtBanner } from '../components/dashboard/CodDebtBanner';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DeliveryMap } from '../components/ui/DeliveryMap';
import { supabase } from '../lib/supabase';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { deliveryOrderService, type DeliveryRequest } from '../services/deliveryOrderService';
import { useSupabase } from '../hooks/useSupabase';
import { useDriverCourseNotifications } from '../hooks/useDriverCourseNotifications';
import { registerDeliveryWebPush } from '../lib/pushNotifications';
import type { DeliveryPerson } from '../types/livreur';
import toast from 'react-hot-toast';
import { isCurfewActive } from '../utils/security';
import { friendlyError } from '../lib/messages';
import { getNetAmount } from '../lib/formatUtils';

export default function DashboardLivreur() {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useSupabase();
  const [profile, setProfile] = useState<DeliveryPerson | null>(null);

  // Activate real-time PWA Push, Audio Synth Beep & Vibration alerts for new available courses
  useDriverCourseNotifications({
    isAvailable: !!profile?.is_available,
    driverZone: profile?.coverage_zones,
  });
  /* Création du jeton push à la connexion : tant qu'un livreur n'a pas de ligne
     dans `push_subscriptions`, aucune course ne peut lui être poussée hors de
     l'onglet ouvert. Déclenché une seule fois par profil livreur chargé. */
  const pushRegisteredRef = useRef(false);
  useEffect(() => {
    if (!user?.id || !profile?.id || pushRegisteredRef.current) return;
    pushRegisteredRef.current = true;
    registerDeliveryWebPush(user.id).catch(() => undefined);
  }, [user?.id, profile?.id]);

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
      // Un compte peut être admin ET livreur : la fiche livreur passe en premier.
      // Seul un admin sans fiche est envoyé vers la console (il y garde l'accès
      // par le lien « Admin » de la barre du haut).
      const profileData = await deliveryPersonService.getDeliveryPersonByUserId(user.id);
      if (!profileData) {
        const role = userProfile?.role;
        if (role === 'admin' || role === 'superadmin') {
          navigate('/admin', { replace: true });
          return;
        }
      }
      if (!profileData || !profileData.name || !profileData.name.trim()) {
        navigate('/devenir-livreur', { replace: true });
        toast("Complétez votre profil de livreur d'abord", { icon: 'ℹ️' });
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
        .reduce((sum, o) => sum + getNetAmount(o.proposed_price || 0), 0); // part livreur, comme le versement
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
            current_location: JSON.stringify({ lat: latitude, lng: longitude })
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
      // On relit la base : le retrait local ne prouve pas que l'écriture a eu lieu,
      // et « Mes courses » doit voir la course apparaître immédiatement.
      await fetchData();
      navigate(`/course/${orderId}`);
    } catch (err: any) {
      toast.error(friendlyError(err, 'Erreur : commande déjà prise ou indisponible.'));
      fetchData();
    }
  };



  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch {
      toast.error('Erreur lors de la déconnexion');
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
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => navigate('/devenir-livreur')}
            className="px-6 py-4 bg-primary text-white rounded-2xl font-bold active:scale-95 transition-transform shadow-md"
          >
            Devenir livreur
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold border border-red-100 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="pb-24 bg-grey-50 min-h-screen">
      {/* Tableau de bord allégé : l'interrupteur En ligne puis les courses.
          L'ancien bandeau en dégradé, la carte des gains et la rangée de trois
          tuiles repoussaient la première course sous la ligne de flottaison. */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/dashboard/profil')}
              className="flex items-center gap-3 text-left"
              title="Voir mon profil"
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
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
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                    profile.is_available ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">{greeting}</p>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{profile.name.split(' ')[0]}</h1>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Actualiser les courses"
                title="Actualiser les courses"
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-red-50 hover:text-red-600 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* L'action principale du livreur */}
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-colors active:scale-[0.99] ${
              profile.is_available ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="text-left">
              <p className={`font-bold ${profile.is_available ? 'text-emerald-800' : 'text-gray-900'}`}>
                {profile.is_available ? 'En ligne' : 'Hors ligne'}
              </p>
              <p className="text-xs text-gray-600">
                {profile.is_available ? 'Vous recevez les nouvelles courses' : 'Touchez pour recevoir des courses'}
              </p>
            </div>
            {toggling ? (
              <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            ) : profile.is_available ? (
              <ToggleRight className="w-11 h-11 text-emerald-600 flex-shrink-0" />
            ) : (
              <ToggleLeft className="w-11 h-11 text-gray-400 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-4xl mx-auto">
        {(!profile.payout_network || !profile.payout_number) && (
          <button
            type="button"
            onClick={() => navigate('/dashboard/profil/payout')}
            className="w-full flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="flex-1 text-sm text-amber-900">Ajoutez votre compte Wave ou MTN pour être payé.</span>
            <ChevronRight className="w-4 h-4 shrink-0 text-amber-700" />
          </button>
        )}

        <CodDebtBanner userId={user?.id} role="delivery" />

        {/* Gains, note et GPS sur une seule bande */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          <button type="button" onClick={() => setShowEarningsModal(true)} className="px-3 py-3 text-left hover:bg-gray-50 rounded-l-2xl">
            <p className="text-[11px] text-gray-500">Aujourd’hui</p>
            <p className="text-base font-bold tabular-nums text-gray-900">{todayEarnings.toLocaleString('fr-FR')} F</p>
          </button>
          <div className="px-3 py-3">
            <p className="text-[11px] text-gray-500">Note</p>
            <p className="flex items-center gap-1 text-base font-bold text-gray-900">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {profile.total_reviews > 0 ? profile.rating.toFixed(1) : 'Nouveau'}
            </p>
          </div>
          <button type="button" onClick={handleUpdateLocation} className="px-3 py-3 text-left hover:bg-gray-50 rounded-r-2xl">
            <p className="text-[11px] text-gray-500">GPS</p>
            <p className={`flex items-center gap-1 text-base font-bold ${profile.current_location ? 'text-emerald-700' : 'text-gray-900'}`}>
              <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-pulse' : ''}`} />
              {locating ? '…' : profile.current_location ? 'À jour' : 'Activer'}
            </p>
          </button>
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
                  Couvre-feu de sécurité (22h30 à 05h30)
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
                                  <span className="text-lg font-black leading-none block">{getNetAmount(order.proposed_price)}</span>
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
                                Accepter pour {getNetAmount(order.proposed_price)} FCFA net
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
