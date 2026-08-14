import { type DeliveryPerson } from '../../types/livreur';
import { Star, Bike, Car, Truck, CheckCircle, ChevronRight, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

const VEHICLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Moto: Bike,
  Vélo: Bike,
  Voiture: Car,
  'Triporteur': Truck,
};

const VEHICLE_LABELS: Record<string, string> = {
  Moto: 'Moto',
  Vélo: 'Vélo',
  Voiture: 'Voiture',
  'Triporteur': 'Triporteur',
};

interface LivreurCardProps {
  livreur: DeliveryPerson;
  index?: number;
}

export function LivreurCard({ livreur, index = 0 }: LivreurCardProps) {
  const VehicleIcon = VEHICLE_ICONS[livreur.vehicle_type] || Truck;
  const vehicleLabel = VEHICLE_LABELS[livreur.vehicle_type] || livreur.vehicle_type;
  const whatsappNumber = livreur.phone ? livreur.phone.replace(/[^0-9]/g, '') : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all flex items-center justify-between gap-3 group"
    >
      {/* Left: Avatar + Details */}
      <Link to={`/livreur/${livreur.id}`} className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200/80">
            {livreur.photo_url ? (
              <img 
                src={getOptimizedImageUrl(livreur.photo_url, 120, 75)} 
                alt={livreur.name} 
                width={48}
                height={48}
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
              <span className="text-base font-black text-primary uppercase">
                {livreur.name.charAt(0)}
              </span>
            )}
          </div>
          <div 
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
              livreur.is_available ? 'bg-emerald-500' : 'bg-gray-400'
            }`} 
            title={livreur.is_available ? 'En ligne' : 'Hors ligne'}
          />
        </div>

        {/* Info Text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-gray-900 truncate leading-tight group-hover:text-primary transition-colors">
              {livreur.name}
            </h3>
            {livreur.verification_status === 'approved' && (
              <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
            {/* Rating */}
            <div className="flex items-center gap-0.5 text-amber-600 font-bold">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{livreur.rating.toFixed(1)}</span>
              <span className="text-[10px] text-gray-400 font-normal">({livreur.total_reviews})</span>
            </div>

            <span>·</span>

            {/* Vehicle */}
            <div className="flex items-center gap-1 text-gray-600 font-medium">
              <VehicleIcon className="w-3 h-3 text-gray-400" />
              <span>{vehicleLabel}</span>
            </div>

            {/* First Zone */}
            {livreur.coverage_zones && livreur.coverage_zones.length > 0 && (
              <>
                <span className="hidden xs:inline">·</span>
                <span className="hidden xs:inline-block px-1.5 py-0.2 bg-gray-100 text-gray-600 text-[10px] rounded-md truncate max-w-[90px]">
                  {livreur.coverage_zones[0]}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {whatsappNumber && (
          <a
            href={`https://wa.me/225${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm border border-emerald-100"
            title="Discuter sur WhatsApp"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}

        <Link
          to={`/livreur/${livreur.id}`}
          className="w-9 h-9 rounded-xl bg-gray-50 text-gray-600 hover:bg-primary hover:text-white flex items-center justify-center active:scale-95 transition-all border border-gray-200/80 shadow-sm"
          title="Consulter le profil"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
