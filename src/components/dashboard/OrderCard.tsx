import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, CheckCircle2, Phone, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStatusColor, getStatusIcon, getStatusLabel, formatPrice, formatRelativeDate } from '../../lib/formatUtils';

const STATUS_ACTIONS: Record<string, { label: string; action: string; variant: 'primary' | 'secondary' }> = {
  awaiting_pickup: { label: 'Accepter la course', action: 'accept', variant: 'primary' },
  pending_seller_confirmation: { label: 'En attente du vendeur', action: 'none', variant: 'primary' },
  accepted: { label: 'Valider récupération (OTP)', action: 'pickup', variant: 'primary' },
  picked_up: { label: 'Valider livraison (OTP)', action: 'delivery', variant: 'secondary' },
  in_transit: { label: 'Valider livraison (OTP)', action: 'delivery', variant: 'secondary' },
};

export const OrderCard = ({ order, idx, handleAcceptOrder, handlePickupVerification, handleDeliveryVerification }: any) => {
  const navigate = useNavigate();
  const status = order.status;
  const StatusIcon = getStatusIcon(status);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const isPrePickup = ['pending_seller_confirmation', 'awaiting_pickup', 'accepted'].includes(status);
  const isPostPickup = ['picked_up', 'in_transit'].includes(status);
  const isTerminal = ['delivered', 'cancelled', 'disputed', 'auto_released', 'completed'].includes(status);
  const isActive = ['accepted', 'picked_up', 'in_transit'].includes(status);
  const action = STATUS_ACTIONS[status];

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (action?.action === 'accept') handleAcceptOrder(order.id);
    if (action?.action === 'pickup') handlePickupVerification(order);
    if (action?.action === 'delivery') handleDeliveryVerification(order);
  };

  const handleOpenNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isPickup = status === 'accepted';
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={() => navigate(`/course/${order.id}`)}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:border-primary-200 hover:shadow-md active:scale-[0.99] transition-all group"
    >
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${statusColor} group-hover:scale-105 transition-transform`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-tight">Course #{order.id.slice(0, 6)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
                  {statusLabel}
                </span>
                <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeDate(order.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary to-primary-600 text-white px-3.5 py-1.5 rounded-2xl text-center shadow-sm">
            <span className="text-base font-black leading-none block">{formatPrice(Math.round(order.delivery_price * 0.9))}</span>
            <span className="text-[9px] font-bold opacity-90 mt-0.5 uppercase tracking-wider leading-none">Net</span>
          </div>
        </div>

        <div className="relative pl-3 space-y-3">
          <div className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-gray-200" />
          
          <div className="flex items-start gap-3 relative">
            <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary-50 relative z-10 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Récupération</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate mt-0.5">{order.pickup_location}</p>
              {isPrePickup && order.seller_phone && (
                <a 
                  href={`tel:${order.seller_phone}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  {order.seller_phone}
                </a>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-3 relative">
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50 relative z-10 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Livraison</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate mt-0.5">{order.dropoff_location}</p>
              {isPostPickup && order.buyer_phone && (
                <a 
                  href={`tel:${order.buyer_phone}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  {order.buyer_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-gray-50">
        {!isTerminal && action && action.action !== 'none' ? (
          <div className="flex items-center gap-2">
            {isActive && (
              <button
                type="button"
                onClick={handleOpenNavigation}
                className="py-3 px-4 bg-gray-900 text-white rounded-2xl text-xs font-black active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 shadow-sm hover:bg-black"
                title="Lancer l'itinéraire Google Maps"
              >
                <Navigation className="w-4 h-4 text-amber-400" />
                <span>GPS</span>
              </button>
            )}
            <button
              onClick={handleAction}
              className={`flex-1 py-3 text-white rounded-2xl text-xs sm:text-sm font-black active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                action.variant === 'secondary' ? 'bg-secondary hover:bg-secondary-600' : 'bg-primary hover:bg-primary-600'
              }`}
            >
              <span>{action.label}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : isTerminal ? (
          <div className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 ${statusColor}`}>
            {status === 'delivered' || status === 'completed' ? (
              <><CheckCircle2 className="w-4 h-4" />Course terminée avec succès</>
            ) : (
              <><StatusIcon className="w-4 h-4" />{statusLabel}</>
            )}
          </div>
        ) : (
          <div className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 opacity-60 ${statusColor}`}>
            <StatusIcon className="w-4 h-4" />
            {statusLabel}
          </div>
        )}
      </div>
    </motion.div>
  );
};
