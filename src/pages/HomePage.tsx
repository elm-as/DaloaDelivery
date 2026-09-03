import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bike, Car, Truck, ChevronRight, Star, MapPin, User } from 'lucide-react';
import { deliveryPersonService } from '../services/deliveryPersonService';
import type { DeliveryPerson } from '../types/livreur';
import { useSEO } from '../hooks/useSEO';

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

  const deliveryServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Livraison express et coursier de proximité',
    provider: {
      '@type': 'Organization',
      name: 'DaloaDelivery',
      url: 'https://delivery.daloamarket.com',
    },
    areaServed: {
      '@type': 'City',
      name: 'Daloa',
      addressCountry: 'CI',
    },
    description: 'Trouvez un livreur vérifié à Daloa (moto, vélo, voiture, triporteur) pour vos colis, repas et marchandises.',
  };

  useSEO('Livreurs fiables à Daloa — Service de Livraison Express', {
    description: 'Trouvez rapidement un livreur disponible à Daloa (Côte d\'Ivoire). Coursiers vérifiés par moto, vélo, voiture et triporteur avec suivi en temps réel.',
    keywords: 'livreur Daloa, livraison moto Daloa, coursier Côte d\'Ivoire, livraison express DaloaDelivery',
    canonical: 'https://delivery.daloamarket.com/',
    jsonLd: deliveryServiceSchema,
  });

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
    <div className="pb-12 bg-gray-50 min-h-screen">
      {/* App Header Background */}
      <div className="bg-gradient-to-br from-primary via-primary-600 to-primary-700 px-4 pt-6 pb-20 rounded-b-[36px] shadow-sm relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Service Express Daloa
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Que souhaitez-vous<br />faire livrer ?
            </h1>
            <p className="text-white/85 text-xs font-medium mt-1">Trouvez un livreur disponible à Daloa en quelques secondes.</p>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="w-10 h-10 bg-white/15 hover:bg-white/25 rounded-2xl flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-all border border-white/20 shadow-md"
            title="Espace compte"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-20 space-y-6 max-w-4xl mx-auto">
        {/* Search Bar */}
        <div 
          onClick={() => navigate('/annuaire')}
          className="bg-white rounded-2xl p-3.5 shadow-xl shadow-gray-200/60 border border-gray-100 flex items-center gap-3 cursor-pointer hover:border-primary-200 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Search className="w-4 h-4" />
          </div>
          <span className="text-gray-400 text-xs sm:text-sm font-medium">Rechercher un livreur, un quartier à Daloa...</span>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Moyens de transport</h2>
          </div>
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: cat.delay }}
                  onClick={() => navigate(`/annuaire?type=${cat.id}`)}
                  className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary-200 hover:shadow-md active:scale-95 transition-all cursor-pointer group"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-inner ${cat.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-800 tracking-tight">{cat.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Top Livreurs */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Livreurs en ligne</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <button 
              onClick={() => navigate('/annuaire')}
              className="text-xs font-bold text-primary hover:text-primary-700 flex items-center gap-0.5"
            >
              <span>Voir tout ({topLivreurs.length}+)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 animate-pulse flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))
            ) : topLivreurs.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-gray-200">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Aucun livreur actuellement en ligne à Daloa.</p>
              </div>
            ) : (
              topLivreurs.map((livreur) => (
                <motion.div
                  key={livreur.id}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/livreur/${livreur.id}`)}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center justify-between gap-3 cursor-pointer hover:border-primary-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200/80 flex items-center justify-center">
                        {livreur.photo_url ? (
                          <img 
                            src={livreur.photo_url} 
                            alt={livreur.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary font-black text-base uppercase">
                            {livreur.name?.trim() ? livreur.name.trim().charAt(0) : 'L'}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${livreur.is_available ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    </div>
                    
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-gray-900 truncate leading-tight group-hover:text-primary transition-colors">
                          {livreur.name?.trim() || 'Livreur'}
                        </h3>
                        {livreur.verification_status === 'approved' && (
                          <span className="text-[10px] text-blue-600 font-bold">✓</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <div className="flex items-center gap-0.5 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{livreur.rating.toFixed(1)}</span>
                        </div>
                        <span>·</span>
                        <span className="font-medium text-gray-600">{livreur.vehicle_type}</span>
                        {livreur.coverage_zones && livreur.coverage_zones.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="truncate text-gray-500 max-w-[100px]">{livreur.coverage_zones[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="px-3 py-1.5 bg-gray-50 group-hover:bg-primary group-hover:text-white text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-100 flex items-center gap-1">
                      <span>Voir</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
        
        {/* Banner CTA Espace Livreur */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-5 shadow-lg text-white relative overflow-hidden border border-gray-800">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Truck className="w-36 h-36 -mb-8 -mr-8 text-white" />
          </div>
          <div className="relative z-10">
            <div className="inline-block bg-primary/20 text-primary-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-primary/30">
              Opportunité
            </div>
            <h3 className="font-black text-base sm:text-lg mb-1 text-white">Vous êtes coursier à Daloa ?</h3>
            <p className="text-gray-300 text-xs mb-3.5 max-w-sm leading-relaxed">
              Rejoignez le réseau DaloaDelivery, recevez des courses directement sur votre téléphone et touchez 90% des frais de livraison.
            </p>
            <div className="flex gap-2.5">
              <button 
                onClick={() => navigate('/devenir-livreur')}
                className="flex-1 bg-primary hover:bg-primary-600 text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all text-center shadow-md"
              >
                Devenir livreur
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all text-center border border-white/15"
              >
                Espace livreur
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
