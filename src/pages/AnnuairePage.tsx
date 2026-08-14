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
    canonical: 'https://delivery.daloamarket.com/annuaire',
  });

  const [searchParams] = useSearchParams();
  const [livreurs, setLivreurs] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  // Read ?type= and ?q= from URL if present
  const initialType = searchParams.get('type') || undefined;
  const initialQuery = searchParams.get('q') || '';
  const [search, setSearch] = useState(initialQuery);
  
  const [filters, setFilters] = useState<DeliveryPersonSearchFilters>({
    vehicle_type: initialType,
    search: initialQuery || undefined,
  });
  const [localFilters, setLocalFilters] = useState<DeliveryPersonSearchFilters>({
    vehicle_type: initialType,
    search: initialQuery || undefined,
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
    setFilters((prev) => ({ ...prev, search: search.trim() || undefined }));
    setPage(1);
  };

  const handleQuickVehicleSelect = (type?: string) => {
    setFilters((prev) => ({ ...prev, vehicle_type: type }));
    setLocalFilters((prev) => ({ ...prev, vehicle_type: type }));
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
    <div className="bg-slate-50 min-h-screen pb-24 flex flex-col">
      {/* Sticky Modern Search & Control Header */}
      <div className="bg-white/95 backdrop-blur-xl px-4 py-3 sticky top-14 z-30 shadow-2xs border-b border-gray-100">
        <div className="max-w-6xl mx-auto space-y-2.5">
          {/* Row 1: Search input + Action buttons */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Rechercher par livreur, quartier (Tazibouo...)"
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilters((prev) => ({ ...prev, search: undefined }));
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-2xs active:scale-95 transition-all shrink-0"
            >
              Chercher
            </button>

            <button
              onClick={openFilters}
              className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl flex items-center justify-center shrink-0 relative active:scale-95 transition-all border border-gray-200/80"
              title="Filtres avancés"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {Object.keys(filters).filter(k => k !== 'search' && filters[k as keyof DeliveryPersonSearchFilters] !== undefined).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* Row 2: Vehicle Type Horizontal Filter & View Toggle */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 pl-0.5">
              <button
                onClick={() => handleQuickVehicleSelect(undefined)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                  !filters.vehicle_type
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                }`}
              >
                Tous
              </button>
              {VEHICLE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleQuickVehicleSelect(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filters.vehicle_type === type
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex p-0.5 bg-slate-100 rounded-xl shrink-0 border border-gray-200/60">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Liste</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'map' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Carte</span>
              </button>
            </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
