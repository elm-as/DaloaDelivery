import React from 'react';
import { motion } from 'framer-motion';
import { X, Search, CheckCircle } from 'lucide-react';
import { DALOA_ZONES } from '../../constants/zones';

const PAYOUT_NETWORKS = [
  { id: 'wave-ci', label: 'Wave', logo: '/wave-logo.png' },
  { id: 'orange-money-ci', label: 'Orange Money', logo: '/Orange_logo.svg' },
  { id: 'mtn-ci', label: 'MTN MoMo', logo: '/MTN logo.jpeg' },
  { id: 'moov-ci', label: 'Moov Money', logo: '/moov-logo.png' },
];

export const ZonesModal = ({
  active,
  onClose,
  updating,
  editZones,
  setEditZones,
  zoneSearch,
  setZoneSearch,
  handleUpdate
}: any) => {
  if (!active) return null;
  const filteredZones = DALOA_ZONES.filter(z => z.toLowerCase().includes(zoneSearch.toLowerCase()));
  const toggleZone = (zone: string) => {
    setEditZones((prev: string[]) => prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]);
  };

  return (
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
              {editZones.length} zone(s) sélectionnée(s)
            </p>
          </div>
          <button
            onClick={() => !updating && onClose()}
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
          const isChecked = editZones.includes(zone);
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
          onClick={() => handleUpdate({ coverage_zones: editZones })}
          disabled={updating || editZones.length === 0}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          {updating ? 'Enregistrement...' : 'Enregistrer les zones'}
        </button>
      </div>
    </motion.div>
  );
};

export const ProfileModal = ({ active, onClose, updating, editName, setEditName, editDescription, setEditDescription, handleUpdate }: any) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 pointer-events-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-strong pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-grey-900">Modifier le profil</h3>
          <button onClick={() => !updating && onClose()} className="text-grey-400 hover:text-grey-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Nom complet</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 bg-grey-50 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-grey-50 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium resize-none"
            />
          </div>
          <button
            onClick={() => handleUpdate({ name: editName, description: editDescription })}
            disabled={updating || !editName.trim()}
            className="w-full py-3.5 mt-2 bg-primary text-white rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            {updating ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const PhoneModal = ({ active, onClose, updating, editPhone, setEditPhone, handleUpdate }: any) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 pointer-events-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-strong pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-grey-900">Modifier le téléphone</h3>
          <button onClick={() => !updating && onClose()} className="text-grey-400 hover:text-grey-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Nouveau numéro</label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-4 py-3 bg-grey-50 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
            />
          </div>
          <button
            onClick={() => handleUpdate({ phone: editPhone })}
            disabled={updating || !editPhone.trim()}
            className="w-full py-3.5 mt-2 bg-primary text-white rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            {updating ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const PayoutModal = ({ active, onClose, updating, editPayoutNetwork, setEditPayoutNetwork, editPayoutNumber, setEditPayoutNumber, handleUpdate }: any) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 pointer-events-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-strong pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-grey-900">Moyen de réception</h3>
          <button onClick={() => !updating && onClose()} className="text-grey-400 hover:text-grey-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Réseau Mobile Money</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYOUT_NETWORKS.map((net) => {
                const isSelected = editPayoutNetwork === net.id;
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => setEditPayoutNetwork(net.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all text-left relative ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-grey-200/80 bg-grey-50 hover:bg-white hover:border-grey-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-white p-0.5 border border-grey-200/60 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <img src={net.logo} alt={net.label} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs font-bold text-grey-800 truncate">{net.label}</span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Numéro du compte</label>
            <input
              type="tel"
              value={editPayoutNumber}
              onChange={(e) => setEditPayoutNumber(e.target.value)}
              placeholder="Ex: 0700000000"
              className="w-full px-4 py-3 bg-grey-50 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
            />
          </div>
          <button
            onClick={() => handleUpdate({ payout_network: editPayoutNetwork, payout_number: editPayoutNumber })}
            disabled={updating || (!editPayoutNetwork && !!editPayoutNumber) || (!!editPayoutNetwork && !editPayoutNumber)}
            className="w-full py-3.5 mt-2 bg-primary text-white rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            {updating ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

