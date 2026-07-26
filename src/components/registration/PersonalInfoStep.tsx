import { motion } from 'framer-motion';
import { User, Camera, Phone } from 'lucide-react';

export const PersonalInfoStep = ({ formData, updateField, handlePhotoChange }: any) => {
  return (
    <motion.div
      key="step-infos"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-3xl shadow-strong p-6 border border-grey-100"
    >
      <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
        <User className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-grey-900 mb-6">Informations personnelles</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Photo de profil</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-grey-50 border-2 border-dashed border-grey-200 flex items-center justify-center">
              {formData.photoPreview ? (
                <img src={formData.photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-grey-300" />
              )}
            </div>
            <label className="flex-1 py-3 border-2 border-grey-100 bg-grey-50 text-grey-700 rounded-2xl text-center font-bold text-sm active:scale-95 transition-transform cursor-pointer">
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              Sélectionner une image
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Nom complet *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Jean Dupont"
            className="w-full px-4 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Numéro de téléphone *</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+225 XX XX XX XX XX"
              className="w-full pl-12 pr-4 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-grey-100">
          <h3 className="text-sm font-bold text-grey-900 mb-2 pl-1">Informations de paiement (Obligatoire)</h3>
          <p className="text-xs text-grey-500 mb-4 pl-1">
            C'est sur ce compte que vos frais de livraisons (moins les 10% de service) seront automatiquement virés.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Réseau de retrait</label>
              <select
                value={formData.payout_network || ''}
                onChange={(e) => updateField('payout_network', e.target.value)}
                className="w-full px-4 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium text-sm appearance-none"
              >
                <option value="">Sélectionnez un réseau</option>
                <option value="wave-ci">Wave</option>
                <option value="orange-money-ci">Orange Money</option>
                <option value="mtn-ci">MTN Money</option>
                <option value="moov-ci">Moov Money</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">Numéro de retrait</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-400" />
                <input
                  type="tel"
                  value={formData.payout_number || ''}
                  onChange={(e) => updateField('payout_number', e.target.value)}
                  placeholder="Numéro qui recevra l'argent"
                  className="w-full pl-12 pr-4 py-3.5 bg-grey-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
