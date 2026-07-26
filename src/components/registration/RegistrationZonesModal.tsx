import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, CheckCircle } from 'lucide-react';
import { DALOA_ZONES } from '../../constants/zones';

export const RegistrationZonesModal = ({
  showZonesModal,
  setShowZonesModal,
  zoneSearch,
  setZoneSearch,
  formData,
  toggleZone
}: any) => {
  const filteredZones = DALOA_ZONES.filter(z => z.toLowerCase().includes(zoneSearch.toLowerCase()));

  return (
    <AnimatePresence>
      {showZonesModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowZonesModal(false)}
            className="fixed inset-0 bg-grey-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[100] h-[85vh] flex flex-col"
          >
            <div className="flex-shrink-0 p-4 border-b border-grey-100">
              <div className="w-12 h-1.5 bg-grey-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl text-grey-900">Zones de couverture</h3>
                  <p className="text-sm text-primary font-bold mt-1">
                    {formData.coverage_zones.length} zone(s) cochée(s)
                  </p>
                </div>
                <button
                  onClick={() => setShowZonesModal(false)}
                  className="w-10 h-10 bg-grey-100 rounded-full flex items-center justify-center text-grey-600 active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
                <input
                  type="text"
                  value={zoneSearch}
                  onChange={(e) => setZoneSearch(e.target.value)}
                  placeholder="Rechercher une zone..."
                  className="w-full pl-12 pr-4 py-3.5 bg-grey-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredZones.map((zone) => {
                const isChecked = formData.coverage_zones.includes(zone);
                return (
                  <button
                    key={zone}
                    onClick={() => toggleZone(zone)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isChecked ? 'border-primary bg-primary-50' : 'border-grey-100 bg-white'
                    }`}
                  >
                    <span className={`font-bold text-sm ${isChecked ? 'text-primary-700' : 'text-grey-700'}`}>
                      {zone}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isChecked ? 'border-primary bg-primary' : 'border-grey-300'
                    }`}>
                      {isChecked && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-grey-100 bg-white pb-[env(safe-area-inset-bottom,1rem)]">
              <button
                onClick={() => setShowZonesModal(false)}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold active:scale-95 transition-transform"
              >
                Valider la sélection
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
