import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, MapPin, X, List, Map as MapIcon } from 'lucide-react';
import { LivreurCard } from '../components/livreur/LivreurCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { DeliveryMap } from '../components/ui/DeliveryMap';
import type { DeliveryPerson, DeliveryPersonSearchFilters } from '../types/livreur';
import { DALOA_ZONES } from '../constants/zones';

import { useSEO } from '../hooks/useSEO';

const VEHICLE_TYPES = ['Moto', 'Vélo', 'Voiture', 'Triporteur'];
const ITEMS_PER_PAGE = 12;

export default function AnnuairePage() {
  useSEO('Annuaire des Livreurs à Daloa', {
    description: "Consultez l'annuaire complet des livreurs professionnels vérifiés à Daloa. Moto, vélo, voiture et triporteur avec avis et notations.",
    keywords: "livreur Daloa, annuaire livreurs Daloa, coursier moto Daloa, livraison rapide Côte d'Ivoire",
    canonical: 'https://daloa-delivery.shop/annuaire',
  });

  const [searchParams] = useSearchParams();
  const [livreurs, setLivreurs] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [search, setSearch] = useState('');
  
  // Read ?type= from URL if present
  const initialType = searchParams.get('type') || undefined;
  const [filters, setFilters] = useState<DeliveryPersonSearchFilters>({
    vehicle_type: initialType
  });
  const [localFilters, setLocalFilters] = useState<DeliveryPersonSearchFilters>({
    vehicle_type: initialType
  });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const fetchLivreurs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await deliveryPersonService.searchDeliveryPersons(filters);
      setLivreurs(data);
    } catch {
      setLivreurs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLivreurs();
  }, [fetchLivreurs]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(1);
  };

  const handleFilterChange = (key: keyof DeliveryPersonSearchFilters, value: unknown) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const openFilters = () => {
    setLocalFilters(filters);
    setShowFiltersModal(true);
  };

  const applyFilters = () => {
    setFilters(localFilters);
    setShowFiltersModal(false);
    setPage(1);
  };

  const totalPages = Math.ceil(livreurs.length / ITEMS_PER_PAGE);
  const paginatedLivreurs = livreurs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="bg-grey-50 min-h-screen pb-6 flex flex-col">
      {/* Sticky Search Header */}
      <div className="bg-white px-4 py-3 sticky top-14 z-30 shadow-sm border-b border-grey-100">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Chercher un livreur..."
                className="w-full pl-9 pr-4 py-2.5 bg-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              onClick={openFilters}
              className="w-10 h-10 bg-primary-50 text-primary rounded-xl flex items-center justify-center flex-shrink-0 relative"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {Object.keys(filters).filter(k => k !== 'search' && filters[k as keyof DeliveryPersonSearchFilters] !== undefined).length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-primary-50" />
              )}
            </button>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex p-1 bg-grey-100 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-grey-500'
              }`}
            >
              <List className="w-4 h-4" /> Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-grey-500'
              }`}
            >
              <MapIcon className="w-4 h-4" /> Carte
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 flex-1">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : paginatedLivreurs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-3xl shadow-sm mt-4 border border-grey-100"
          >
            <div className="w-20 h-20 bg-grey-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-grey-400" />
            </div>
            <h3 className="font-bold text-grey-900 text-lg mb-1">Aucun livreur</h3>
            <p className="text-sm text-grey-500 max-w-xs mx-auto">
              Essayez de modifier vos filtres ou d'élargir votre recherche.
            </p>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col">
            <p className="text-sm font-bold text-grey-500 mb-3 px-1">
              {livreurs.length} livreur{livreurs.length > 1 ? 's' : ''} trouvé{livreurs.length > 1 ? 's' : ''}
              {filters.vehicle_type && ` - ${filters.vehicle_type}`}
            </p>

            {viewMode === 'map' ? (
              <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden shadow-sm border border-grey-100">
                <DeliveryMap livreurs={livreurs} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paginatedLivreurs.map((livreur, index) => (
                    <LivreurCard key={livreur.id} livreur={livreur} index={index} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8 pb-4">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                          page === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-white text-grey-600 shadow-sm border border-grey-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Filters Bottom Sheet */}
      <AnimatePresence>
        {showFiltersModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFiltersModal(false)}
              className="fixed inset-0 bg-grey-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto pb-safe"
            >
              <div className="sticky top-0 bg-white px-4 py-4 flex justify-between items-center border-b border-grey-100 z-10">
                <h3 className="font-bold text-lg text-grey-900">Filtres</h3>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="w-8 h-8 bg-grey-100 rounded-full flex items-center justify-center text-grey-600 active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-grey-900 mb-2">Type de véhicule</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange('vehicle_type', undefined)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        !localFilters.vehicle_type ? 'bg-primary text-white' : 'bg-grey-100 text-grey-600'
                      }`}
                    >
                      Tous
                    </button>
                    {VEHICLE_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleFilterChange('vehicle_type', type)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          localFilters.vehicle_type === type ? 'bg-primary text-white' : 'bg-grey-100 text-grey-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-grey-900 mb-2">Zone</label>
                  <select
                    value={localFilters.zone || ''}
                    onChange={(e) => handleFilterChange('zone', e.target.value || undefined)}
                    className="w-full px-4 py-3 bg-grey-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                  >
                    <option value="">Toutes les zones</option>
                    {DALOA_ZONES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-grey-900 mb-2">Disponibilité</label>
                  <div className="flex gap-2">
                    {[
                      { label: 'Tous', value: undefined },
                      { label: 'En ligne', value: true },
                      { label: 'Hors ligne', value: false }
                    ].map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFilterChange('available_only', opt.value)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                          localFilters.available_only === opt.value ? 'bg-primary text-white' : 'bg-grey-100 text-grey-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setLocalFilters({});
                      setSearch('');
                    }}
                    className="flex-1 py-3.5 bg-grey-100 text-grey-700 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-[2] py-3.5 bg-primary text-white rounded-xl font-bold text-sm active:scale-95 transition-transform shadow-md"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
