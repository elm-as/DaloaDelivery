import React from 'react';
import { type DeliveryPerson } from '../../types/livreur';
import { Star, MapPin, Bike, Car, Truck, CheckCircle2, Phone, MessageCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

const VEHICLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Moto: Bike,
  Vélo: Bike,
  Voiture: Car,
  Triporteur: Truck,
};

const VEHICLE_LABELS: Record<string, string> = {
  Moto: 'Moto',
  Vélo: 'Vélo',
  Voiture: 'Voiture',
  Triporteur: 'Triporteur',
};

interface LivreurCardProps {
  livreur: DeliveryPerson;
  index?: number;
}

export function LivreurCard({ livreur, index = 0 }: LivreurCardProps) {
  const VehicleIcon = VEHICLE_ICONS[livreur.vehicle_type] || Bike;
  const vehicleLabel = VEHICLE_LABELS[livreur.vehicle_type] || livreur.vehicle_type || 'Moto';
  const whatsappNumber = (livreur.phone || '').replace(/[^0-9]/g, '');
  const isAvailable = Boolean(livreur.is_available);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.25) }}
      className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-100/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between gap-2.5 group"
    >
      {/* Clickable Profile Link Area */}
      <Link
        to={`/livreur/${livreur.id}`}
        className="flex items-center gap-2.5 min-w-0 flex-1 group-hover:opacity-95"
      >
        {/* Compact Avatar (42px) */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-gray-200/80 shadow-2xs">
            {livreur.photo_url ? (
              <img
                src={getOptimizedImageUrl(livreur.photo_url, 120, 70)}
                alt={livreur.name}
                loading={index < 6 ? 'eager' : 'lazy'}
                decoding="async"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (livreur.photo_url && target.src !== livreur.photo_url) {
                    target.src = livreur.photo_url;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 text-white font-black flex items-center justify-center text-sm">
                {livreur.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              isAvailable ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
            title={isAvailable ? 'En ligne' : 'Hors ligne'}
          />
        </div>

        {/* Deliverer Info (2 compact lines) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-xs sm:text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {livreur.name}
            </h3>
            {livreur.verification_status === 'approved' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            )}
            <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md shrink-0">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              {(livreur.rating || 5.0).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 truncate">
            <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
              <VehicleIcon className="w-3 h-3 text-orange-500 shrink-0" />
              {vehicleLabel}
            </span>
            <span className="text-gray-300">•</span>
            <span className="truncate flex items-center gap-0.5 text-gray-400">
              <MapPin size={10} className="shrink-0" />
              {livreur.coverage_zones && livreur.coverage_zones.length > 0
                ? livreur.coverage_zones.slice(0, 2).join(', ')
                : 'Daloa'}
            </span>
          </div>
        </div>
      </Link>

      {/* Quick Action Icons */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {livreur.phone && (
          <a
            href={`tel:${livreur.phone}`}
            className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center active:scale-95 transition-all shadow-2xs"
            title="Appeler"
          >
            <Phone size={13} />
          </a>
        )}
        {whatsappNumber && (
          <a
            href={`https://wa.me/225${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center active:scale-95 transition-all shadow-2xs"
            title="WhatsApp"
          >
            <MessageCircle size={13} />
          </a>
        )}
        <Link
          to={`/livreur/${livreur.id}`}
          className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center active:scale-95 transition-all"
          title="Détails"
        >
          <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}
