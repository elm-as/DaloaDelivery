import React, { useState } from 'react';
import {
  Zap,
  Layers,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Phone,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryOrderService, type DeliveryRequest } from '../../services/deliveryOrderService';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface CourseV2SectionsProps {
  order: DeliveryRequest;
  isLiveTracking?: boolean;
  onOrderUpdated: () => void;
}

const COD_REFUSAL_REASONS = [
  { id: 'buyer_unreachable', label: 'Client injoignable (téléphone éteint / ne répond pas)' },
  { id: 'buyer_refused_no_money', label: "Client n'a pas l'argent à l'arrivée" },
  { id: 'buyer_refused_changed_mind', label: "Client a changé d'avis" },
  { id: 'buyer_fake_location', label: 'Adresse ou numéro introuvable' },
] as const;

export const CourseV2Sections: React.FC<CourseV2SectionsProps> = ({
  order,
  isLiveTracking,
  onOrderUpdated,
}) => {
  const [stopOtpBySeller, setStopOtpBySeller] = useState<Record<string, string>>({});
  const [confirmingSellerId, setConfirmingSellerId] = useState<string | null>(null);
  const [showRefusalBox, setShowRefusalBox] = useState(false);
  const [refusalReason, setRefusalReason] = useState<string>('buyer_unreachable');
  const [refusalNotes, setRefusalNotes] = useState('');
  const [submittingRefusal, setSubmittingRefusal] = useState(false);

  const isActive = ['accepted', 'picked_up', 'in_transit'].includes(order.status);
  const isCod = order.payment_method === 'cod';
  const isRiskyBuyer =
    (order.buyer_cod_refused_count || 0) > 0 || (order.buyer_cod_score ?? 100) < 75;

  const handleConfirmStop = async (sellerId: string) => {
    if (!order.delivery_group_id) return;
    setConfirmingSellerId(sellerId);
    try {
      const otp = stopOtpBySeller[sellerId] || '';
      const res = await deliveryOrderService.confirmGroupedPickupStop(
        order.delivery_group_id,
        sellerId,
        otp
      );
      toast.success(
        res.all_picked_up
          ? 'Tous les arrêts marchands sont récupérés ! En route vers le client.'
          : `Arrêt validé (${res.completed_stops}/${res.total_stops}) !`
      );
      onOrderUpdated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur de validation de cet arrêt');
    } finally {
      setConfirmingSellerId(null);
    }
  };

  const handleReportCodRefusal = async () => {
    setSubmittingRefusal(true);
    try {
      const res = await deliveryOrderService.reportCodRefusal(
        order.order_id,
        refusalReason,
        refusalNotes
      );
      toast.success(
        res.is_now_blocked
          ? 'Refus enregistré : acheteur suspendu du paiement à la livraison (14j).'
          : 'Refus enregistré et stock libéré.'
      );
      setShowRefusalBox(false);
      onOrderUpdated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du signalement');
    } finally {
      setSubmittingRefusal(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Indicateur GPS temps réel actif (F01) */}
      {isActive && isLiveTracking && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-bold">
            <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span>Position GPS partagée en temps réel avec le client</span>
          </div>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white uppercase">
            Live
          </span>
        </div>
      )}

      {/* 2. Encart Course Express (F05) */}
      {order.is_express && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black text-white uppercase">
              <Zap className="h-3 w-3" /> Course Express Directe
            </span>
            <span className="text-[11px] font-bold text-amber-900">
              {order.payer_role === 'recipient'
                ? `Encaisser ${order.proposed_price} F chez le destinataire`
                : `Encaisser ${order.proposed_price} F au départ`}
            </span>
          </div>
          {order.package_description && (
            <p className="text-xs font-semibold text-amber-950">
              Colis : {order.package_description}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-amber-900">
            <span>
              Expéditeur : <strong>{order.sender_name || 'Client'}</strong>
            </span>
            <span>
              Destinataire : <strong>{order.recipient_name || 'Destinataire'}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 3. Frise Livraison Groupée Multi-Marchands (F06) */}
      {order.is_grouped && order.grouped_stops && order.grouped_stops.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Course Groupée Multi-Marchands</span>
            </div>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-800 tabular-nums">
              {order.group_completed_stops || 0}/{order.group_total_stops || order.grouped_stops.length} arrêts
            </span>
          </div>

          <div className="space-y-2">
            {order.grouped_stops.map((stop, idx) => {
              const isPicked = stop.status === 'picked_up';
              return (
                <div
                  key={`${stop.seller_id}-${idx}`}
                  className="rounded-xl border border-indigo-100 bg-white p-2.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        Arrêt {idx + 1} · {stop.seller_name || 'Marchand'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {stop.pickup_address || stop.district || 'Daloa'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {stop.seller_phone && (
                        <a
                          href={`tel:${stop.seller_phone}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {isPicked ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Récupéré
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {!isPicked && order.status === 'accepted' && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={stopOtpBySeller[stop.seller_id] || ''}
                        onChange={(e) =>
                          setStopOtpBySeller((prev) => ({
                            ...prev,
                            [stop.seller_id]: e.target.value.replace(/\D/g, ''),
                          }))
                        }
                        placeholder="OTP vendeur (si requis)"
                        className="h-8 flex-1 rounded-lg border border-gray-200 px-2.5 text-xs font-mono"
                      />
                      <button
                        type="button"
                        disabled={confirmingSellerId === stop.seller_id}
                        onClick={() => handleConfirmStop(stop.seller_id)}
                        className="h-8 rounded-lg bg-indigo-600 px-3 text-[11px] font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {confirmingSellerId === stop.seller_id ? '...' : 'Valider retrait'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Indice Anti-Lapin COD & Signalement de refus client (F02) */}
      {isCod && !order.is_express && (
        <div className="space-y-2">
          <div
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
              isRiskyBuyer
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {isRiskyBuyer ? (
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              <span>
                Indice Anti-Lapin Client : {order.buyer_cod_score ?? 100}% fiable
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold tabular-nums">
              {order.buyer_cod_delivered_count ?? 0} liv. · {order.buyer_cod_refused_count ?? 0} lapin(s)
            </span>
          </div>

          {isActive && !showRefusalBox && (
            <button
              type="button"
              onClick={() => setShowRefusalBox(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-900 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Signaler un refus client / injoignable (Anti-Lapin)</span>
            </button>
          )}

          {isActive && showRefusalBox && (
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-3.5 space-y-2.5">
              <p className="text-xs font-black text-red-900">
                Motif de non-remise (Anti-Lapin COD)
              </p>
              <div className="space-y-1.5">
                {COD_REFUSAL_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 rounded-lg bg-white p-2 text-xs border border-gray-200 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="driver_cod_refusal"
                      checked={refusalReason === r.id}
                      onChange={() => setRefusalReason(r.id)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                value={refusalNotes}
                onChange={(e) => setRefusalNotes(e.target.value)}
                placeholder="Note facultative..."
                className="w-full h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={submittingRefusal}
                  onClick={handleReportCodRefusal}
                  className="flex-1 h-9 rounded-lg bg-red-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  {submittingRefusal ? <LoadingSpinner size="sm" /> : null}
                  <span>Confirmer le refus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRefusalBox(false)}
                  className="px-3 h-9 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
