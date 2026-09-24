import { motion } from 'framer-motion';
import { Star, User, Truck, Bike, Car } from 'lucide-react';
import ProBadge from '../ui/ProBadge';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import type { DeliveryPerson } from '../../types/livreur';
import { RevealablePhone } from './RevealablePhone';

const VEHICLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Moto: Bike,
  Vélo: Bike,
  Voiture: Car,
  Triporteur: Truck,
  motorcycle: Bike,
  car: Car,
};

interface LivreurHeaderCardProps {
  livreur: DeliveryPerson;
}

export function LivreurHeaderCard({ livreur }: LivreurHeaderCardProps) {
  const VehicleIcon = VEHICLE_ICONS[livreur.vehicle_type] || Truck;
  const whatsappNumber = livreur.phone ? livreur.phone.replace(/[^0-9]/g, '') : '';

  return (
    <div className="space-y-4">
      {/* Header Hero Card */}
      <div
        className={`px-4 pt-8 pb-12 rounded-b-[36px] lg:rounded-3xl relative overflow-hidden text-white shadow-sm transition-colors ${
          livreur.is_available
            ? 'bg-gradient-to-br from-primary via-primary-600 to-primary-700'
            : 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900'
        }`}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-xl pointer-events-none" />

        <div className="flex flex-col items-center text-center relative z-10">
          {/* Avatar */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 p-1 ring-4 ring-white/30 shadow-xl backdrop-blur-sm">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {livreur.photo_url && !livreur.photo_url.startsWith('blob:') ? (
                  <img
                    src={getOptimizedImageUrl(livreur.photo_url, 300, 80) || livreur.photo_url}
                    alt={livreur.name}
                    width={96}
                    height={96}
                    loading="eager"
                    {...({ fetchpriority: 'high' } as any)}
                    decoding="async"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        livreur.name || 'Livreur'
                      )}&background=ea580c&color=ffffff&bold=true&size=256`;
                    }}
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
            </div>
            <div
              className={`absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md ${
                livreur.is_available ? 'bg-emerald-500' : 'bg-gray-400'
              }`}
            >
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <h1 className="text-xl font-black text-white">{livreur.name}</h1>
            {livreur.is_verified && <ProBadge iconOnly size="sm" className="flex-shrink-0" />}
          </div>

          <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-white/90">
            <span
              className={`w-2 h-2 rounded-full ${
                livreur.is_available ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span>{livreur.is_available ? 'Disponible pour vos courses' : 'Actuellement indisponible'}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            <div className="bg-black/20 px-3 py-1 rounded-xl flex items-center gap-1.5 backdrop-blur-md">
              <VehicleIcon className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">{livreur.vehicle_type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlapping Stats Strip */}
      <div className="px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-3 gap-2.5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            {livreur.total_reviews > 0 ? (
              <div className="flex items-center justify-center gap-0.5 text-xl font-black text-amber-600 tabular-nums">
                <span>{livreur.rating.toFixed(1)}</span>
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
            ) : (
              <div className="flex items-center justify-center text-sm font-bold text-gray-700 py-0.5">
                <span>Nouveau</span>
              </div>
            )}
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
              {livreur.total_reviews > 0 ? 'Note' : '0 avis'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <p className="text-xl font-black text-indigo-600 leading-tight tabular-nums">
              {livreur.total_reviews}
            </p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Avis</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <p className="text-xl font-black text-primary leading-tight tabular-nums">
              {livreur.total_deliveries || 0}
            </p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Courses</p>
          </motion.div>
        </div>
      </div>

      {/* Desktop Contact Buttons */}
      <div className="hidden lg:flex flex-col gap-2 px-4 pt-2">
        {whatsappNumber && (
          <RevealablePhone phone={livreur.phone} />
        )}
      </div>
    </div>
  );
}
