import { motion } from 'framer-motion';
import { Clock, MapPin, ChevronRight, Phone, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStatusIcon, getNetAmount, formatRelativeDate } from '../../lib/formatUtils';

export const PendingOrderCard = ({
  order,
  idx,
  profile,
  handleAcceptOrder
}: any) => {
  const navigate = useNavigate();
  const StatusIcon = getStatusIcon('awaiting_pickup');
  const netAmount = getNetAmount(order.proposed_price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      onClick={() => navigate(`/course/${order.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-grey-100 overflow-hidden cursor-pointer hover:border-primary-200 transition-colors"
    >
      <div className="p-4 pb-3">
        {order.is_private && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Commande Privée (Vendeur Affilié)</span>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <StatusIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-grey-900 text-sm">Course #{order.id.slice(0, 6)}</p>
              <div className="flex items-center gap-1 text-xs text-grey-500 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeDate(order.created_at)}</span>
              </div>
              {profile.coverage_zones?.some((z: string) => 
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
            <span className="text-lg font-black leading-none block">{netAmount}</span>
            <span className="text-[9px] font-bold opacity-80 uppercase">FCFA net</span>
          </div>
        </div>

        <div className="relative pl-4">
          <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-grey-200" />
          
          <div className="flex items-start gap-3 mb-3.5 relative">
            <div className="w-3 h-3 rounded-full bg-grey-300 ring-4 ring-white relative z-10 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
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
                <span className="text-xs font-bold text-grey-800 truncate">
                  {order.seller_name || order.shop_name || 'Vendeur'}
                </span>
              </div>
              <p className="text-[10px] font-bold text-grey-400 uppercase tracking-wider">Récupération</p>
              <p className="text-sm font-medium text-grey-900 mt-0.5">{order.pickup_location}</p>
              {order.seller_phone && (
                <a href={`tel:${order.seller_phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 mt-1 text-[12px] font-semibold text-green-600 hover:text-green-800 hover:underline">
                  <Phone className="w-3 h-3" />
                  {order.seller_phone}
                </a>
              )}
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

      <div className="px-4 pb-4 pt-2 border-t border-grey-50">
        <button
          onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order.id); }}
          className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-bold active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
        >
          Accepter pour {netAmount} FCFA net
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
