import { type DeliveryPerson } from '../../types/livreur';
import { Star, MapPin, Bike, Car, Truck, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
  const whatsappNumber = livreur.phone.replace(/[^0-9]/g, '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-grey-100 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-grey-200 flex items-center justify-center border border-grey-100">
            {livreur.photo_url ? (
              <img src={livreur.photo_url} alt={livreur.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-grey-400">
                {livreur.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${livreur.is_available ? 'bg-green-500' : 'bg-grey-400'}`} />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link to={`/livreur/${livreur.id}`} className="hover:text-primary transition-colors block min-w-0">
              <h3 className="font-bold text-base text-grey-900 truncate">{livreur.name}</h3>
            </Link>
            {livreur.verification_status === 'approved' && (
              <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500 text-white flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap text-sm">
            {/* Rating */}
            <div className="flex items-center gap-1 text-grey-700">
              <Star className="w-3.5 h-3.5 fill-warning text-warning" />
              <span className="font-semibold">{livreur.rating.toFixed(1)}</span>
              <span className="text-grey-400">({livreur.total_reviews})</span>
            </div>

            {/* Vehicle */}
            <div className="flex items-center gap-1.5 text-grey-500">
              <VehicleIcon className="w-3.5 h-3.5 text-grey-400" />
              <span>{vehicleLabel}</span>
            </div>
          </div>

          {/* Zones */}
          {livreur.coverage_zones && livreur.coverage_zones.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {livreur.coverage_zones.slice(0, 3).map((zone) => (
                <span key={zone} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full font-medium">
                  {zone}
                </span>
              ))}
              {livreur.coverage_zones.length > 3 && (
                <span className="px-2 py-0.5 bg-grey-100 text-grey-500 text-xs rounded-full">
                  +{livreur.coverage_zones.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 sm:flex-col justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-grey-100">
        <Link
          to={`/livreur/${livreur.id}`}
          className="flex-1 sm:flex-none py-2 px-4 bg-grey-50 text-grey-700 text-sm font-semibold rounded-xl border border-grey-200 hover:bg-grey-100 active:scale-95 transition-all text-center min-w-[100px]"
        >
          Profil
        </Link>
        <a
          href={`https://wa.me/225${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-[1.5] sm:flex-none py-2 px-4 bg-success text-white text-sm font-semibold rounded-xl hover:bg-success-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-w-[120px]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>
      </div>
    </motion.div>
  );
}
