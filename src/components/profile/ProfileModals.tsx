import React from 'react';
import { motion } from 'framer-motion';
import { X, Search, CheckCircle, Upload, Camera, Shield, FileText } from 'lucide-react';
import { DALOA_ZONES } from '../../constants/zones';

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
            <select
              value={editPayoutNetwork}
              onChange={(e) => setEditPayoutNetwork(e.target.value)}
              className="w-full px-4 py-3 bg-grey-50 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
            >
              <option value="">Sélectionner un réseau</option>
              <option value="orange-money-ci">Orange Money</option>
              <option value="mtn-ci">MTN Mobile Money</option>
              <option value="moov-ci">Moov Money</option>
              <option value="wave-ci">Wave</option>
            </select>
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

export const VerificationModal = ({
  active,
  onClose,
  updating,
  profile,
  verifyCniFile,
  setVerifyCniFile,
  verifySelfieFile,
  setVerifySelfieFile,
  verifyPortraitFile,
  setVerifyPortraitFile,
  handleVerifyUpload
}: any) => {
  if (!active) return null;
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[100] flex flex-col shadow-strong"
      style={{ maxHeight: '92vh' }}
    >
      <div className="flex-shrink-0">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-grey-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pb-4 border-b border-grey-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-grey-900">Vérification d'identité</h3>
              <p className="text-xs text-grey-500 mt-0.5">Soumettez vos documents pour être vérifié</p>
            </div>
          </div>
          <button
            onClick={() => !updating && onClose()}
            className="w-9 h-9 bg-grey-100 rounded-full flex items-center justify-center text-grey-500 active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {profile.verification_status === 'approved' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h4 className="font-bold text-xl text-grey-900 mb-2">Profil vérifié ✓</h4>
            <p className="text-sm text-grey-500 mb-6">
              Votre identité a été validée par notre équipe. Vous pouvez accepter toutes les commandes.
            </p>
            <div className="flex items-center justify-between p-4 bg-success-50 rounded-xl border border-success-100">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-success" />
                <div className="text-left">
                  <p className="text-sm font-bold text-grey-900">Documents d'identité</p>
                  <p className="text-xs text-success font-medium">Approuvé</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {profile.verification_status === 'rejected' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-danger" />
              </div>
              <h4 className="font-bold text-grey-900 mb-2">Documents refusés</h4>
            </div>
            {profile.verification_rejection_reason && (
              <div className="bg-danger-50 rounded-xl p-4 border border-danger-100">
                <p className="text-xs font-bold text-danger-700 mb-1">Raison du refus :</p>
                <p className="text-sm text-danger-600">{profile.verification_rejection_reason}</p>
              </div>
            )}
            <p className="text-sm text-grey-500 text-center">
              Vous pouvez resoumettre vos documents ci-dessous.
            </p>
          </div>
        )}

        {(profile.verification_status !== 'approved') && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">1. Carte d'identité (CNI)</label>
              <label className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${verifyCniFile ? 'border-success bg-success-50' : 'border-dashed border-grey-200 bg-grey-50 hover:bg-grey-100'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${verifyCniFile ? 'bg-success-100' : 'bg-grey-100'}`}>
                  {verifyCniFile ? <CheckCircle className="w-5 h-5 text-success" /> : <Upload className="w-5 h-5 text-grey-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-grey-700 truncate">
                    {verifyCniFile ? verifyCniFile.name : 'Uploader le recto de la CNI'}
                  </p>
                  <p className="text-xs text-grey-400 mt-0.5">{verifyCniFile ? 'Fichier sélectionné' : 'Image ou PDF'}</p>
                </div>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if(f) setVerifyCniFile(f); }} />
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">2. Selfie avec la CNI</label>
              <label className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${verifySelfieFile ? 'border-success bg-success-50' : 'border-dashed border-grey-200 bg-grey-50 hover:bg-grey-100'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${verifySelfieFile ? 'bg-success-100' : 'bg-grey-100'}`}>
                  {verifySelfieFile ? <CheckCircle className="w-5 h-5 text-success" /> : <Camera className="w-5 h-5 text-grey-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-grey-700 truncate">
                    {verifySelfieFile ? verifySelfieFile.name : 'Prendre un selfie avec votre CNI'}
                  </p>
                  <p className="text-xs text-grey-400 mt-0.5">{verifySelfieFile ? 'Fichier sélectionné' : 'Le visage et la carte doivent être nets'}</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) setVerifySelfieFile(f); }} />
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">3. Photo de profil</label>
              <label className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${verifyPortraitFile ? 'border-success bg-success-50' : 'border-dashed border-grey-200 bg-grey-50 hover:bg-grey-100'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${verifyPortraitFile ? 'bg-success-100' : 'bg-grey-100'}`}>
                  {verifyPortraitFile ? <CheckCircle className="w-5 h-5 text-success" /> : <Camera className="w-5 h-5 text-grey-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-grey-700 truncate">
                    {verifyPortraitFile ? verifyPortraitFile.name : 'Photo de profil (portrait)'}
                  </p>
                  <p className="text-xs text-grey-400 mt-0.5">{verifyPortraitFile ? 'Fichier sélectionné' : 'Pour les clients'}</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) setVerifyPortraitFile(f); }} />
              </label>
            </div>
          </div>
        )}
      </div>

      {(profile.verification_status !== 'approved') && (
        <div className="flex-shrink-0 p-4 border-t border-grey-100 bg-white pb-[env(safe-area-inset-bottom,1rem)]">
          <button
            onClick={handleVerifyUpload}
            disabled={updating || !verifyCniFile || !verifySelfieFile || !verifyPortraitFile}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            {updating ? 'Envoi...' : 'Soumettre pour vérification'}
          </button>
        </div>
      )}
    </motion.div>
  );
};
