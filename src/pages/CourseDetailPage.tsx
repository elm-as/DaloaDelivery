import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Navigation, XCircle, AlertTriangle, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { deliveryOrderService, type DeliveryRequest } from '../services/deliveryOrderService';
import { useSupabase } from '../hooks/useSupabase';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { isCurfewActive } from '../utils/security';
import { friendlyError } from '../lib/messages';
import PickupVerificationModal from '../components/livreur/PickupVerificationModal';
import DeliveryVerificationModal from '../components/livreur/DeliveryVerificationModal';

// Fix icons
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const sellerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const buyerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    const bounds = L.latLngBounds(coords);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
}

import { deliveryPersonService } from '../services/deliveryPersonService';

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
    } catch (err) {
      toast.error("Erreur de chargement de la commande");
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

  // Real coordinates from DB with default fallbacks
  const daloaCenter: [number, number] = [6.8774, -6.4502];
  const driverCoords: [number, number] = [6.8770, -6.4510];
  const sellerCoords: [number, number] = [
    order.pickup_lat ?? 6.8785,
    order.pickup_lng ?? -6.4490
  ];
  const buyerCoords: [number, number] = [
    order.dropoff_lat ?? 6.8750,
    order.dropoff_lng ?? -6.4530
  ];

  const handleAccept = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const profile = await deliveryPersonService.getDeliveryPersonByUserId(user.id);
      if (!profile) {
        toast.error("Profil livreur introuvable");
        return;
      }
      const data = await deliveryOrderService.acceptRequest(order.id, profile.id);
      setOrder(data);
      toast.success("Course acceptée !");
    } catch (err: any) {
      toast.error(friendlyError(err, "Impossible d'accepter cette course"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportDispute = async () => {
    const reason = window.prompt("Quel est le problème avec cette livraison ? (ex: Client injoignable, Adresse incorrecte, Vendeur absent, etc.)");
    if (!reason || !reason.trim()) return;

    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('report_delivery_dispute', {
        p_assignment_id: order.id,
        p_reason: reason.trim()
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.reason || 'Erreur inconnue');

      toast.success("Litige signalé avec succès. L'administration va l'étudier.");
      fetchOrder();
    } catch (err: any) {
      toast.error(friendlyError(err, "Erreur lors du signalement du litige"));
    } finally {
      setActionLoading(false);
    }
  };

  // Determine which coords to show bounds for
  let boundsCoords: [number, number][] = [];
  let polylineCoords: [number, number][] = [];
  
  if (order.status === 'awaiting_pickup' || order.status === 'pending') {
    boundsCoords = [sellerCoords, buyerCoords];
  } else if (order.status === 'accepted') {
    boundsCoords = [driverCoords, sellerCoords];
    polylineCoords = [driverCoords, sellerCoords];
  } else if (order.status === 'picked_up' || order.status === 'in_transit') {
    boundsCoords = [driverCoords, buyerCoords];
    polylineCoords = [driverCoords, buyerCoords];
  } else {
    boundsCoords = [sellerCoords, buyerCoords];
  }

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

    // Launch Google Maps Turn-by-Turn navigation (two_wheeler for moto)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=two_wheeler`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-[100dvh] w-full bg-grey-50 relative overflow-hidden">
      {/* Header (floating over map) */}
      <div className="absolute top-0 left-0 right-0 px-4 py-4 z-[400] flex items-center justify-between pointer-events-none">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-grey-900 active:scale-95 pointer-events-auto">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Map Section (Fullscreen) */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={daloaCenter}
          zoom={14}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBounds coords={boundsCoords} />

          {/* Driver Marker */}
          {['accepted', 'picked_up', 'in_transit'].includes(order.status) && (
            <Marker position={driverCoords} icon={driverIcon}>
              <Popup>Votre position</Popup>
            </Marker>
          )}

          {/* Seller Marker */}
          <Marker position={sellerCoords} icon={sellerIcon}>
            <Popup>Point de ramassage : {order.pickup_location}</Popup>
          </Marker>

          {/* Buyer Marker */}
          <Marker position={buyerCoords} icon={buyerIcon}>
            <Popup>Point de livraison : {order.dropoff_location}</Popup>
          </Marker>

          {/* Route Line */}
          {polylineCoords.length > 0 && (
            <Polyline positions={polylineCoords} color="#f97316" weight={5} opacity={0.8} dashArray="10, 10" />
          )}
        </MapContainer>
      </div>

      {/* Bottom Info Sheet (Floating above map) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[400] max-h-[50vh] overflow-y-auto pb-safe">
        <div className="w-12 h-1.5 bg-grey-200 rounded-full mx-auto my-3" />
        
        <div className="px-5 space-y-5 pb-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-grey-900">
              {order.status === 'awaiting_pickup' ? 'Nouvelle course' : 
               order.status === 'accepted' ? 'En route vers le vendeur' :
               order.status === 'picked_up' || order.status === 'in_transit' ? 'En route vers le client' : 
               'Course terminée'}
            </h2>
            <div className="px-3 py-1 bg-primary-50 text-primary rounded-lg font-bold text-sm">
              {Math.round(order.proposed_price * 0.9)} FCFA net
            </div>
          </div>

          {/* Trajectory */}
          <div className="relative pl-5 border-l-2 border-grey-100 space-y-6 py-2">
            <div className="relative">
              <div className={`absolute -left-[27px] w-5 h-5 rounded-full border-4 border-white ${['accepted'].includes(order.status) ? 'bg-primary ring-4 ring-primary-50' : 'bg-grey-300'}`} />
              
              <div className="flex items-center gap-2 mb-1">
                {order.seller_avatar ? (
                  <img
                    src={order.seller_avatar}
                    alt={order.seller_name || 'Vendeur'}
                    className="w-6 h-6 rounded-full object-cover border border-grey-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary text-[10px] font-bold flex items-center justify-center border border-primary-200 flex-shrink-0">
                    {(order.seller_name || 'V')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-grey-900">
                  {order.seller_name || order.shop_name || 'Vendeur'}
                </span>
                {order.seller_phone && (
                  <a href={`tel:${order.seller_phone}`} className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <Phone className="w-3 h-3" />
                    Appeler
                  </a>
                )}
              </div>

              <p className="text-[11px] font-bold text-grey-400 uppercase tracking-wider mb-0.5">Point de ramassage</p>
              <p className="font-bold text-grey-900">{order.pickup_location}</p>
            </div>
            <div className="relative">
              <div className={`absolute -left-[27px] w-5 h-5 rounded-full border-4 border-white ${['picked_up', 'in_transit'].includes(order.status) ? 'bg-secondary ring-4 ring-secondary-50' : 'bg-grey-300'}`} />
              <p className="text-[11px] font-bold text-grey-400 uppercase tracking-wider mb-1">Point de livraison</p>
              <p className="font-bold text-grey-900">{order.dropoff_location}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-3">
            {order.status === 'awaiting_pickup' && (
              isCurfewActive() ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-gray-900 rounded-3xl p-5 text-center border border-indigo-800/40 text-white shadow-xl">
                  <div className="flex items-center justify-center gap-2 mb-2 text-amber-400">
                    <Moon className="w-5 h-5" />
                    <span className="font-black text-xs uppercase tracking-wider">Couvre-feu Actif (22h30 — 05h30)</span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium leading-relaxed">
                    L'acceptation des nouvelles courses est suspendue la nuit pour votre sécurité. Reprise dès 05h30.
                  </p>
                </div>
              ) : (
                <button 
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black text-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {actionLoading ? <LoadingSpinner size="sm" /> : 'Accepter la course'}
                </button>
              )
            )}

            {order.status === 'accepted' && (
              <>
                <button 
                  onClick={openNavigation}
                  className="w-full h-14 bg-grey-900 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" /> Naviguer (GPS)
                </button>
                <button 
                  onClick={() => setPickupModalOpen(true)}
                  disabled={actionLoading}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black text-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {actionLoading ? <LoadingSpinner size="sm" /> : "J'ai récupéré le colis"}
                </button>
              </>
            )}

            {(order.status === 'picked_up' || order.status === 'in_transit') && (
              <>
                <button 
                  onClick={openNavigation}
                  className="w-full h-14 bg-grey-900 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" /> Naviguer (GPS)
                </button>
                <button 
                  onClick={() => setDeliveryModalOpen(true)}
                  disabled={actionLoading}
                  className="w-full h-14 bg-secondary text-white rounded-2xl font-black text-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {actionLoading ? <LoadingSpinner size="sm" /> : 'Confirmer la livraison'}
                </button>
              </>
            )}

            {['accepted', 'picked_up', 'in_transit'].includes(order.status) && (
              <button 
                onClick={handleReportDispute}
                disabled={actionLoading}
                className="w-full py-3.5 bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 rounded-2xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 mt-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Signaler un problème / Litige
              </button>
            )}
          </div>
        </div>
      </div>

      <PickupVerificationModal
        assignmentId={order.id}
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
