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
  const [isLiveTracking, setIsLiveTracking] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`course-status-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'delivery_assignments', filter: `id=eq.${id}` },
        (payload) => {
          const next = payload.new as any;
          if (next.status === 'cancelled') {
            toast.error('Cette course a été annulée. Ne vous déplacez plus.');
          } else if (next.status === 'disputed') {
            toast.error('Un litige a été ouvert sur cette course.');
          } else if (next.status === 'awaiting_pickup' && !next.delivery_person_id) {
            toast('Course remise en ligne pour les autres livreurs.');
          }
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchOrder]);

  useEffect(() => {
    if (!order?.id || !['accepted', 'picked_up', 'in_transit'].includes(order.status)) {
      setIsLiveTracking(false);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    let lastSentMs = 0;
    const channel = supabase.channel(`run_tracking:${order.id}`, {
      config: { broadcast: { self: false } },
    });
    channel.subscribe();

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentMs < 5000) return;
        lastSentMs = now;
        setIsLiveTracking(true);

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const heading = pos.coords.heading;
        const speedKmh = pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6) : null;

        channel
          .send({
            type: 'broadcast',
            event: 'location_update',
            payload: {
              assignment_id: order.id,
              driver_person_id: order.assigned_driver_id || '',
              lat,
              lng,
              heading,
              speed: speedKmh,
              updated_at: new Date(now).toISOString(),
            },
          })
          .catch(() => {});

        deliveryOrderService
          .publishDriverLiveLocation(order.id, lat, lng, heading, speedKmh)
          .catch(() => {});
      },
      () => {
        setIsLiveTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      supabase.removeChannel(channel);
      setIsLiveTracking(false);
    };
  }, [order?.id, order?.status, order?.assigned_driver_id]);

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

  const handleReleaseCourse = async () => {
    if (!window.confirm('Voulez-vous remettre cette course en ligne pour les autres livreurs ?')) {
      return;
    }

    setActionLoading(true);
    try {
      await deliveryOrderService.releaseRequest(order.id);
      toast.success('Course remise en ligne.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(friendlyError(err, 'Impossible de libérer cette course'));
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

    const destParam = lat && lng
      ? `${lat},${lng}`
      : encodeURIComponent(`${locationName}, Daloa, Côte d'Ivoire`);

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=two_wheeler`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full min-h-[100dvh] bg-grey-50">
      <div className="hidden lg:flex flex-col h-[100dvh]">
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

        <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden max-w-7xl mx-auto w-full">
          <section className="col-span-7 h-full rounded-3xl overflow-hidden border border-grey-200 shadow-sm relative bg-white">
            <CourseMap order={order} onOpenNavigation={openNavigation} className="h-full w-full" />
          </section>

          <section className="col-span-5 h-full overflow-y-auto bg-white border border-grey-200 rounded-3xl p-6 shadow-sm">
            <CourseControlPanel
              order={order}
              actionLoading={actionLoading}
              isLiveTracking={isLiveTracking}
              onAccept={handleAccept}
              onPickupClick={() => setPickupModalOpen(true)}
              onDeliveryClick={() => setDeliveryModalOpen(true)}
              onReportDispute={handleReportDispute}
              onOpenNavigation={openNavigation}
              onOrderUpdated={fetchOrder}
              onReleaseCourse={handleReleaseCourse}
            />
          </section>
        </main>
      </div>

      <div className="lg:hidden h-[100dvh] w-full relative overflow-hidden">
        <div className="absolute top-4 left-4 z-[400]">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-grey-900 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute inset-0 z-0">
          <CourseMap order={order} onOpenNavigation={openNavigation} showNavButton={false} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-[400] max-h-[55vh] overflow-y-auto pb-safe">
          <div className="w-12 h-1.5 bg-grey-200 rounded-full mx-auto my-3" />
          <div className="px-5 pb-6">
            <CourseControlPanel
              order={order}
              actionLoading={actionLoading}
              isLiveTracking={isLiveTracking}
              onAccept={handleAccept}
              onPickupClick={() => setPickupModalOpen(true)}
              onDeliveryClick={() => setDeliveryModalOpen(true)}
              onReportDispute={handleReportDispute}
              onOpenNavigation={openNavigation}
              onOrderUpdated={fetchOrder}
              onReleaseCourse={handleReleaseCourse}
            />
          </div>
        </div>
      </div>

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
        buyerPhone={order.buyer_phone}
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
