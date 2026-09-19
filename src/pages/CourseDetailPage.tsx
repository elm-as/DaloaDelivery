import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { deliveryOrderService, type DeliveryRequest } from '../services/deliveryOrderService';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { useSupabase } from '../hooks/useSupabase';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { friendlyError } from '../lib/messages';
import PickupVerificationModal from '../components/livreur/PickupVerificationModal';
import DeliveryVerificationModal from '../components/livreur/DeliveryVerificationModal';
import { CourseMap } from '../components/course/CourseMap';
import { CourseControlPanel } from '../components/course/CourseControlPanel';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabase();

  const [order, setOrder] = useState<DeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      const data = await deliveryOrderService.getRequestById(id);
      setOrder(data);
    } catch {
      toast.error('Erreur de chargement de la commande');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) return null;

  const handleAccept = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const profile = await deliveryPersonService.getDeliveryPersonByUserId(user.id);
      if (!profile) {
        toast.error('Profil livreur introuvable');
        return;
      }
      const data = await deliveryOrderService.acceptRequest(order.id, profile.id);
      setOrder(data);
      toast.success('Course acceptée ! Bonne route.');
    } catch (err: any) {
      toast.error(friendlyError(err, "Impossible d'accepter cette course"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportDispute = async () => {
    const reason = window.prompt(
      'Quel est le problème avec cette livraison ? (ex: Client injoignable, Adresse incorrecte, Vendeur absent, etc.)'
    );
    if (!reason || !reason.trim()) return;

    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('report_delivery_dispute', {
        p_assignment_id: order.id,
        p_reason: reason.trim(),
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.reason || 'Erreur inconnue');

      toast.success("Litige signalé avec succès. L'administration étudie le dossier.");
      fetchOrder();
    } catch (err: any) {
      toast.error(friendlyError(err, 'Erreur lors du signalement du litige'));
    } finally {
      setActionLoading(false);
    }
  };

  const openNavigation = () => {
    const isPickup = order.status === 'accepted';
    const lat = isPickup ? order.pickup_lat : order.dropoff_lat;
    const lng = isPickup ? order.pickup_lng : order.dropoff_lng;
    const locationName = isPickup ? order.pickup_location : order.dropoff_location;

    let destParam = '';
    if (lat && lng) {
      destParam = `${lat},${lng}`;
    } else {
      destParam = encodeURIComponent(`${locationName}, Daloa, Côte d'Ivoire`);
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=two_wheeler`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full min-h-[100dvh] bg-grey-50">
      {/* ─── VUE DESKTOP (Split-Screen 2 colonnes) ─── */}
      <div className="hidden lg:flex flex-col h-[100dvh]">
        {/* Barre de navigation supérieure Desktop */}
        <header className="h-16 px-8 border-b border-grey-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-grey-100 hover:bg-grey-200 flex items-center justify-center text-grey-700 transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-grey-900 flex items-center gap-2">
                <span>Mission de Livraison</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-grey-100 text-grey-700 font-bold tabular-nums">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </h1>
              <p className="text-xs text-grey-400">DaloaDelivery • Réseau de coursiers express</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-grey-500 font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            Zone Daloa intra-muros
          </div>
        </header>

        {/* Grille Principale 2 Colonnes */}
        <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden max-w-7xl mx-auto w-full">
          {/* Colonne Gauche (Carte GPS 60%) */}
          <section className="col-span-7 h-full rounded-3xl overflow-hidden border border-grey-200 shadow-sm relative bg-white">
            <CourseMap order={order} onOpenNavigation={openNavigation} className="h-full w-full" />
          </section>

          {/* Colonne Droite (Pupitre de contrôle 40%) */}
          <section className="col-span-5 h-full overflow-y-auto bg-white border border-grey-200 rounded-3xl p-6 shadow-sm">
            <CourseControlPanel
              order={order}
              actionLoading={actionLoading}
              onAccept={handleAccept}
              onPickupClick={() => setPickupModalOpen(true)}
              onDeliveryClick={() => setDeliveryModalOpen(true)}
              onReportDispute={handleReportDispute}
              onOpenNavigation={openNavigation}
            />
          </section>
        </main>
      </div>

      {/* ─── VUE MOBILE (< 1024px, Carte Plein Écran + Tiroir) ─── */}
      <div className="lg:hidden h-[100dvh] w-full relative overflow-hidden">
        {/* Bouton Retour Flottant */}
        <div className="absolute top-4 left-4 z-[400]">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-grey-900 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Carte Plein Écran */}
        <div className="absolute inset-0 z-0">
          <CourseMap order={order} onOpenNavigation={openNavigation} showNavButton={false} />
        </div>

        {/* Tiroir d'action bas */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-[400] max-h-[55vh] overflow-y-auto pb-safe">
          <div className="w-12 h-1.5 bg-grey-200 rounded-full mx-auto my-3" />
          <div className="px-5 pb-6">
            <CourseControlPanel
              order={order}
              actionLoading={actionLoading}
              onAccept={handleAccept}
              onPickupClick={() => setPickupModalOpen(true)}
              onDeliveryClick={() => setDeliveryModalOpen(true)}
              onReportDispute={handleReportDispute}
              onOpenNavigation={openNavigation}
            />
          </div>
        </div>
      </div>

      {/* Modales de vérification OTP */}
      <PickupVerificationModal
        assignmentId={order.id}
        sellerPhone={order.seller_phone}
        isOpen={pickupModalOpen}
        onClose={() => setPickupModalOpen(false)}
        onSuccess={() => {
          setPickupModalOpen(false);
          fetchOrder();
        }}
      />

      <DeliveryVerificationModal
        assignmentId={order.id}
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        onSuccess={() => {
          setDeliveryModalOpen(false);
          fetchOrder();
        }}
      />
    </div>
  );
}
