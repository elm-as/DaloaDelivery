import React from 'react';
import { type DeliveryPerson } from '../../types/livreur';
import { Star, MapPin, Bike, Car, Truck, CheckCircle2, Phone, MessageCircle } from 'lucide-react';
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100/90 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-orange-200/80 transition-all space-y-3.5 group"
    >
      {/* Top row: Avatar + Identity + Status Pill */}
      <div className="flex items-start justify-between gap-3">
        <Link to={`/livreur/${livreur.id}`} className="flex items-center gap-3 min-w-0 flex-1 group-hover:opacity-95">
          <div className="relative shrink-0">
            <div className="w-13 h-13 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200/80 shadow-2xs">
              {livreur.photo_url ? (
                <img
                  src={getOptimizedImageUrl(livreur.photo_url, 160, 75)}
                  alt={livreur.name}
                  loading={index < 4 ? 'eager' : 'lazy'}
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
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black flex items-center justify-center text-lg">
                  {livreur.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                isAvailable ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-gray-400'
              }`}
              title={isAvailable ? 'En ligne' : 'Hors ligne'}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-sm sm:text-base text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                {livreur.name}
              </h3>
              {livreur.verification_status === 'approved' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
              <span className="font-semibold text-gray-700">{livreur.phone}</span>
              <span className="text-gray-300">•</span>
              <span className="text-amber-700 font-black flex items-center gap-0.5 text-[11.5px]">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                {(livreur.rating || 5.0).toFixed(1)}
              </span>
              <span className="text-gray-400 font-medium">({livreur.total_reviews || 0})</span>
            </div>
          </div>
        </Link>

        {/* Availability Badge */}
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-black border flex items-center gap-1 ${
            isAvailable
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs'
              : 'bg-gray-50 text-gray-400 border-gray-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {isAvailable ? 'Disponible' : 'Hors ligne'}
        </span>
      </div>

      {/* Middle row: Vehicle type & coverage zones */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50/80 text-orange-700 text-[11px] font-black border border-orange-100">
          <VehicleIcon className="w-3.5 h-3.5 text-orange-600" />
          {vehicleLabel}
        </span>

        {livreur.coverage_zones && livreur.coverage_zones.length > 0 ? (
          livreur.coverage_zones.slice(0, 3).map((zone) => (
            <span
              key={zone}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-50 text-gray-600 text-[11px] font-bold border border-gray-100"
            >
              <MapPin size={10} className="text-gray-400" />
              {zone}
            </span>
          ))
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-50 text-gray-400 text-[11px] font-bold">
            <MapPin size={10} /> Tout Daloa
          </span>
        )}
      </div>

      {/* Bottom row: Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <a
          href={`tel:${livreur.phone}`}
          className="flex-1 h-9.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs"
          title="Appeler directement"
        >
          <Phone size={13} className="text-blue-600" />
          <span>Appeler</span>
        </a>

        {whatsappNumber && (
          <a
            href={`https://wa.me/225${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-9.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs"
            title="Contacter sur WhatsApp"
          >
            <MessageCircle size={13} className="text-emerald-600" />
            <span>WhatsApp</span>
          </a>
        )}

        <Link
          to={`/livreur/${livreur.id}`}
          className="px-3.5 h-9.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/60 font-bold text-xs flex items-center justify-center active:scale-95 transition-all shadow-2xs"
        >
          Détails
        </Link>
      </div>
    </motion.div>
  );
}
