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
    <div className="bg-gray-50 min-h-screen pb-16 flex flex-col">
      {/* Search & Quick Filter Header (Natural Flow) */}
      <div className="bg-white px-4 pt-4 pb-3.5 shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
          {/* Search Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Chercher un livreur, quartier (Tazibouo, Soleil...)"
                className="w-full pl-10 pr-8 py-2.5 bg-gray-100/90 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-transparent focus:border-primary/30"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setFilters(prev => ({ ...prev, search: undefined })); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={openFilters}
              className="h-10 px-3.5 bg-gray-100 hover:bg-gray-200/70 text-gray-700 rounded-2xl flex items-center justify-center gap-1.5 flex-shrink-0 relative active:scale-95 transition-all text-xs font-bold"
              title="Filtres avancés"
            >
              <SlidersHorizontal className="w-4 h-4 text-gray-600" />
              <span className="hidden sm:inline">Filtres</span>
              {Object.keys(filters).filter(k => k !== 'search' && filters[k as keyof DeliveryPersonSearchFilters] !== undefined).length > 0 && (
                <span className="w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex p-0.5 bg-gray-100 rounded-2xl flex-shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Affichage Liste"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Affichage Carte"
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Vehicle Type Horizontal Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, vehicle_type: undefined }));
                setLocalFilters(prev => ({ ...prev, vehicle_type: undefined }));
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                !filters.vehicle_type ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
              }`}
            >
              Tous
            </button>
            {VEHICLE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilters(prev => ({ ...prev, vehicle_type: type }));
                  setLocalFilters(prev => ({ ...prev, vehicle_type: type }));
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filters.vehicle_type === type ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 flex-1 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : paginatedLivreurs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-3xl shadow-sm mt-4 border border-gray-100"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="font-black text-gray-900 text-base mb-1">Aucun livreur trouvé</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Essayez de modifier votre recherche ou vos filtres de quartier.
            </p>
            <button
              onClick={() => {
                setFilters({});
                setLocalFilters({});
                setSearch('');
              }}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200/70 text-gray-800 rounded-xl text-xs font-bold active:scale-95 transition-all"
            >
              Réinitialiser les filtres
            </button>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {livreurs.length} coursier{livreurs.length > 1 ? 's' : ''} disponible{livreurs.length > 1 ? 's' : ''}
              </p>
            </div>

            {viewMode === 'map' ? (
              <div className="flex-1 min-h-[420px] rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <DeliveryMap livreurs={livreurs} />
              </div>
            ) : (
              <>
                <div className="space-y-2.5 sm:space-y-3">
                  {paginatedLivreurs.map((livreur, index) => (
                    <LivreurCard key={livreur.id} livreur={livreur} index={index} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-1.5 mt-6 pb-4">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                          page === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 shadow-sm border border-gray-200'
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[80] max-h-[85vh] flex flex-col shadow-2xl max-w-lg mx-auto overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
                <h3 className="font-black text-base text-gray-900">Filtres avancés</h3>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Filters Body */}
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-2">Type de véhicule</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange('vehicle_type', undefined)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        !localFilters.vehicle_type ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Tous
                    </button>
                    {VEHICLE_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleFilterChange('vehicle_type', type)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          localFilters.vehicle_type === type ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-2">Zone de couverture</label>
                  <select
                    value={localFilters.zone || ''}
                    onChange={(e) => handleFilterChange('zone', e.target.value || undefined)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-xs font-medium"
                  >
                    <option value="">Toutes les zones de Daloa</option>
                    {DALOA_ZONES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-2">Disponibilité</label>
                  <div className="flex gap-2">
                    {[
                      { label: 'Tous', value: undefined },
                      { label: 'En ligne 🟢', value: true },
                      { label: 'Hors ligne', value: false }
                    ].map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFilterChange('available_only', opt.value)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          localFilters.available_only === opt.value ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Action Buttons Footer */}
              <div className="bg-white px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] border-t border-gray-100 flex gap-3 flex-shrink-0 shadow-lg">
                <button
                  onClick={() => {
                    setLocalFilters({});
                    setSearch('');
                  }}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-xs active:scale-95 transition-transform"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-[2] py-3.5 bg-primary hover:bg-primary-600 text-white rounded-2xl font-black text-xs active:scale-95 transition-transform shadow-md"
                >
                  Appliquer les filtres
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
