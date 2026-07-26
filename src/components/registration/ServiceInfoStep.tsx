import React from 'react';
import { motion } from 'framer-motion';
import { Bike, Car, Truck, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const VEHICLE_TYPES = ['Moto', 'Vélo', 'Voiture', 'Triporteur'];

const VEHICLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Moto: Bike,
  'Vélo': Bike,
  Voiture: Car,
  Triporteur: Truck,
};

export const ServiceInfoStep = ({ formData, updateField, setShowZonesModal }: any) => {
  return (
    <motion.div
      key="step-service"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-3xl shadow-strong p-6 border border-grey-100"
    >
      <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
        <Bike className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-grey-900 mb-6">Informations de service</h2>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-grey-900 mb-3 pl-1">Type de véhicule *</label>
          <div className="grid grid-cols-2 gap-3">
            {VEHICLE_TYPES.map((type) => {
              const Icon = VEHICLE_ICONS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateField('vehicle_type', type)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    formData.vehicle_type === type
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-grey-100 bg-white text-grey-500'
                  }`}
                >
                  {Icon && <Icon className="w-6 h-6" />}
                  <span className="font-bold text-sm">{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">
            Zones de couverture *
          </label>
          <button
            type="button"
            onClick={() => setShowZonesModal(true)}
            className="w-full flex items-center justify-between px-4 py-4 bg-grey-50 rounded-2xl border border-grey-100"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <span className={`text-sm font-bold ${formData.coverage_zones.length > 0 ? 'text-grey-900' : 'text-grey-400'}`}>
                {formData.coverage_zones.length > 0 
                  ? `${formData.coverage_zones.length} zone(s) sélectionnée(s)` 
                  : 'Sélectionner mes zones'
                }
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-grey-400" />
          </button>
          {formData.coverage_zones.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.coverage_zones.slice(0, 5).map((z: string) => (
                <span key={z} className="text-[10px] bg-primary-50 text-primary-700 font-bold px-2 py-1 rounded-md">{z}</span>
              ))}
              {formData.coverage_zones.length > 5 && (
                <span className="text-[10px] bg-grey-100 text-grey-600 font-bold px-2 py-1 rounded-md">+{formData.coverage_zones.length - 5}</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-grey-900 mb-2 pl-1">
            Détails véhicule & Tarifs <span className="font-normal text-grey-400">(opt.)</span>
          </label>
          <input
            type="text"
            value={formData.vehicle_details}
            onChange={(e) => updateField('vehicle_details', e.target.value)}
            placeholder="Ex: Moto Yamaha Rouge"
            className="w-full px-4 py-3.5 bg-grey-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-sm mb-3"
          />
          <textarea
            value={formData.pricing_description}
            onChange={(e) => updateField('pricing_description', e.target.value)}
            rows={2}
            placeholder="Ex: 500F dans le quartier..."
            className="w-full px-4 py-3.5 bg-grey-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium text-sm resize-none"
          />
        </div>

        <label className="flex items-start gap-3 bg-primary-50/50 p-4 rounded-2xl mt-4">
          <input
            type="checkbox"
            checked={formData.terms_accepted}
            onChange={(e) => updateField('terms_accepted', e.target.checked)}
            className="w-5 h-5 mt-0.5 text-primary rounded-md focus:ring-primary accent-primary"
          />
          <span className="text-xs font-medium text-grey-700 leading-relaxed">
            J'accepte les{' '}
            <Link to="/terms" target="_blank" className="text-primary font-bold underline">
              Conditions Générales d'Utilisation
            </Link>
            {' '}de DaloaDelivery. Je certifie que les informations sont exactes et m'engage à fournir un service de qualité.
          </span>
        </label>
      </div>
    </motion.div>
  );
};
