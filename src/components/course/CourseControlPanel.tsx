import React from 'react';
import { Phone, Navigation, AlertTriangle, Moon, ShieldCheck, MapPin } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { isCurfewActive } from '../../utils/security';
import type { DeliveryRequest } from '../../services/deliveryOrderService';
import { getNetAmount } from '../../lib/formatUtils';

export const COURSE_STATUS_LABELS: Record<string, string> = {
  pending_seller_confirmation: 'En attente du vendeur',
  awaiting_pickup: 'Nouvelle course disponible',
  accepted: 'En route vers le vendeur',
  picked_up: 'En route vers le client',
  in_transit: 'En route vers le client',
  delivered: 'Course terminée',
  auto_released: 'Course terminée',
  disputed: 'Litige en cours',
  cancelled: 'Course annulée',
};

interface CourseControlPanelProps {
  order: DeliveryRequest;
  actionLoading: boolean;
  onAccept: () => void;
  onPickupClick: () => void;
  onDeliveryClick: () => void;
  onReportDispute: () => void;
  onOpenNavigation: () => void;
}

export const CourseControlPanel: React.FC<CourseControlPanelProps> = ({
  order,
  actionLoading,
  onAccept,
  onPickupClick,
  onDeliveryClick,
  onReportDispute,
  onOpenNavigation,
}) => {
  const netEarnings = getNetAmount(order.proposed_price);
  const isAwaitingPickup = order.status === 'awaiting_pickup';
  const isAccepted = order.status === 'accepted';
  const isInTransit = order.status === 'picked_up' || order.status === 'in_transit';
  const isActive = ['accepted', 'picked_up', 'in_transit'].includes(order.status);
  const curfew = isCurfewActive();

  return (
    <div className="space-y-6">
      {/* En-tête Statut & Rémunération nette */}
      <div className="flex items-center justify-between pb-4 border-b border-grey-100">
        <div>
          <span className="text-xs font-bold text-grey-400 uppercase tracking-wider block mb-1">
            Statut de la course
          </span>
          <h2 className="text-xl font-black text-grey-900">
            {COURSE_STATUS_LABELS[order.status] ?? 'Course en attente'}
          </h2>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-grey-400 uppercase tracking-wider block mb-1">
            Gains livreur
          </span>
          <div className="px-3.5 py-1.5 bg-primary-50 text-primary border border-primary-100 rounded-xl font-mono font-extrabold text-base tabular-nums">
            {netEarnings.toLocaleString('fr-FR')} FCFA <span className="text-xs font-bold font-sans">net</span>
          </div>
        </div>
      </div>

      {/* Trajet & Coordonnées (Stepper) */}
      <div className="relative pl-6 border-l-2 border-grey-200 space-y-7 py-2">
        {/* Point de Ramassage (Vendeur) */}
        <div className="relative">
          <div
            className={`absolute -left-[31px] w-5 h-5 rounded-full border-4 border-white ${
              isAccepted ? 'bg-primary ring-4 ring-primary-100' : 'bg-grey-300'
            }`}
          />

          <div className="flex items-center gap-2 mb-1.5">
            {order.seller_avatar ? (
              <img
                src={order.seller_avatar}
                alt={order.seller_name || 'Vendeur'}
                className="w-7 h-7 rounded-full object-cover border border-grey-200 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary-100 text-primary text-xs font-bold flex items-center justify-center border border-primary-200 shrink-0">
                {(order.seller_name || 'V')[0].toUpperCase()}
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-grey-900 block">
                {order.seller_name || order.shop_name || 'Boutique Partenaire'}
              </span>
              <span className="text-[10px] text-grey-400 block font-medium">Point de retrait marchand</span>
            </div>

            {order.seller_phone && (
              <a
                href={`tel:${order.seller_phone}`}
                className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition border border-emerald-200"
              >
                <Phone className="w-3.5 h-3.5" />
                Appeler
              </a>
            )}
          </div>

          <p className="text-xs font-bold text-grey-500 uppercase tracking-wider mb-0.5 mt-2 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-grey-400" />
            Adresse vendeur
          </p>
          <p className="font-bold text-grey-900 text-sm">{order.pickup_location}</p>
        </div>

        {/* Point de Livraison (Client) */}
        <div className="relative">
          <div
            className={`absolute -left-[31px] w-5 h-5 rounded-full border-4 border-white ${
              isInTransit ? 'bg-secondary ring-4 ring-secondary-100' : 'bg-grey-300'
            }`}
          />

          <p className="text-xs font-bold text-grey-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-grey-400" />
            Destination acheteur
          </p>
          <p className="font-bold text-grey-900 text-sm">{order.dropoff_location}</p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Remise sécurisée sous code OTP à l'acheteur
          </div>
        </div>
      </div>

      {/* Actions Métier selon le statut */}
      <div className="pt-2 space-y-3">
        {isAwaitingPickup && (
          curfew ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-gray-900 rounded-2xl p-4 text-center border border-indigo-800/40 text-white shadow-md">
              <div className="flex items-center justify-center gap-2 mb-1.5 text-amber-400">
                <Moon className="w-4 h-4" />
                <span className="font-black text-xs uppercase tracking-wider">Couvre-feu Actif (22h30 à 05h30)</span>
              </div>
              <p className="text-xs text-gray-300 font-medium leading-relaxed">
                L'acceptation des nouvelles courses est suspendue la nuit à Daloa pour votre sécurité. Reprise dès 05h30.
              </p>
            </div>
          ) : (
            <button
              onClick={onAccept}
              disabled={actionLoading}
              className="w-full h-14 bg-primary hover:bg-primary-600 text-white rounded-2xl font-black text-base active:scale-98 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {actionLoading ? <LoadingSpinner size="sm" /> : 'Accepter cette course'}
            </button>
          )
        )}

        {isAccepted && (
          <>
            <button
              onClick={onOpenNavigation}
              className="w-full h-13 bg-grey-900 hover:bg-grey-800 text-white rounded-2xl font-bold text-sm active:scale-98 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-primary" />
              Naviguer vers le vendeur (GPS)
            </button>
            <button
              onClick={onPickupClick}
              disabled={actionLoading}
              className="w-full h-14 bg-primary hover:bg-primary-600 text-white rounded-2xl font-black text-base active:scale-98 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {actionLoading ? <LoadingSpinner size="sm" /> : "J'ai récupéré le colis (OTP Vendeur)"}
            </button>
          </>
        )}

        {isInTransit && (
          <>
            <button
              onClick={onOpenNavigation}
              className="w-full h-13 bg-grey-900 hover:bg-grey-800 text-white rounded-2xl font-bold text-sm active:scale-98 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-secondary" />
              Naviguer vers le client (GPS)
            </button>
            <button
              onClick={onDeliveryClick}
              disabled={actionLoading}
              className="w-full h-14 bg-secondary hover:bg-secondary-600 text-white rounded-2xl font-black text-base active:scale-98 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {actionLoading ? <LoadingSpinner size="sm" /> : 'Confirmer la livraison (OTP Client)'}
            </button>
          </>
        )}

        {isActive && (
          <button
            onClick={onReportDispute}
            disabled={actionLoading}
            className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-bold text-xs active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Signaler un problème ou litige sur la course
          </button>
        )}
      </div>
    </div>
  );
};
