import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bike, Car, Truck, ChevronRight, Star, MapPin, User } from 'lucide-react';
import { deliveryPersonService } from '../services/deliveryPersonService';
import type { DeliveryPerson } from '../types/livreur';

const CATEGORIES = [
  { id: 'Moto', label: 'Moto', icon: Bike, color: 'bg-primary-50 text-primary', delay: 0.1 },
  { id: 'Vélo', label: 'Vélo', icon: Bike, color: 'bg-secondary-50 text-secondary', delay: 0.2 },
  { id: 'Voiture', label: 'Voiture', icon: Car, color: 'bg-success-50 text-success', delay: 0.3 },
  { id: 'Triporteur', label: 'Triporteur', icon: Truck, color: 'bg-warning-50 text-warning', delay: 0.4 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [topLivreurs, setTopLivreurs] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const data = await deliveryPersonService.searchDeliveryPersons({ available_only: true });
        setTopLivreurs(data.slice(0, 3));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, []);

  return (
    <div className="pb-8 bg-grey-50 min-h-screen">
      {/* App-like Header Background */}
      <div className="bg-primary px-4 pt-6 pb-24 rounded-b-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Que voulez-vous<br/>faire livrer ?</h1>
            <p className="text-primary-100 text-sm">Trouvez le livreur idéal en un clic.</p>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm active:scale-95 transition-transform border border-white/10"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-16 relative z-20 space-y-6">
        {/* Search Bar */}
        <div 
          onClick={() => navigate('/annuaire')}
          className="bg-white rounded-2xl p-4 shadow-strong flex items-center gap-3 cursor-text"
        >
          <Search className="w-5 h-5 text-grey-400" />
          <span className="text-grey-400 text-sm font-medium">Rechercher un livreur, un quartier...</span>
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-lg font-bold text-grey-900 mb-3">Catégories</h2>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: cat.delay }}
                  onClick={() => navigate(`/annuaire?type=${cat.id}`)}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${cat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-grey-700">{cat.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Top Livreurs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-grey-900">Livreurs disponibles</h2>
            <button 
              onClick={() => navigate('/annuaire')}
              className="text-sm font-semibold text-primary flex items-center"
            >
              Voir tout <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse flex gap-4">
                  <div className="w-16 h-16 bg-grey-200 rounded-xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-grey-200 rounded w-1/2" />
                    <div className="h-3 bg-grey-200 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : topLivreurs.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <MapPin className="w-10 h-10 text-grey-300 mx-auto mb-2" />
                <p className="text-sm text-grey-500 font-medium">Aucun livreur disponible pour le moment.</p>
              </div>
            ) : (
              topLivreurs.map((livreur) => (
                <motion.div
                  key={livreur.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/livreur/${livreur.id}`)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-grey-100 flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-16 h-16 bg-grey-100 rounded-xl overflow-hidden flex-shrink-0">
                    {livreur.photo_url ? (
                      <img src={livreur.photo_url} alt={livreur.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary">
                        <Bike className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-grey-900 truncate">{livreur.name}</h3>
                      <div className="flex items-center gap-1 bg-warning-50 px-1.5 py-0.5 rounded text-xs font-bold text-warning-700">
                        <Star className="w-3 h-3 fill-warning-700" />
                        {livreur.rating.toFixed(1)}
                      </div>
                    </div>
                    
                    <p className="text-xs font-medium text-primary mb-1">{livreur.vehicle_type}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {livreur.coverage_zones.slice(0, 2).map((zone, idx) => (
                        <span key={idx} className="text-[10px] bg-grey-100 text-grey-600 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                          {zone}
                        </span>
                      ))}
                      {livreur.coverage_zones.length > 2 && (
                        <span className="text-[10px] bg-grey-100 text-grey-600 px-1.5 py-0.5 rounded-full">
                          +{livreur.coverage_zones.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
        
        {/* Banner call to action */}
        <div className="bg-gradient-to-r from-secondary to-secondary-600 rounded-2xl p-5 shadow-sm text-white relative overflow-hidden mt-6">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Truck className="w-32 h-32 -mb-8 -mr-8" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-1">Espace Livreur</h3>
            <p className="text-secondary-100 text-sm mb-4">Gérez votre activité ou devenez livreur.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/devenir-livreur')}
                className="flex-1 bg-white text-secondary py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform text-center"
              >
                S'inscrire
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="flex-1 bg-secondary-700 text-white py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform text-center border border-secondary-500"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
