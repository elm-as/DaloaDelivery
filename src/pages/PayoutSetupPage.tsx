import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { DeliveryPerson } from '../types/livreur';

const PayoutSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabase();
  const [profile, setProfile] = useState<DeliveryPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [payoutNetwork, setPayoutNetwork] = useState('');
  const [payoutNumber, setPayoutNumber] = useState('');
  const [payoutNumberError, setPayoutNumberError] = useState('');
  const [payoutNetworkError, setPayoutNetworkError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const data = await deliveryPersonService.getDeliveryPersonByUserId(user.id);
        if (data) {
          setProfile(data);
          setPayoutNetwork(data.payout_network || '');
          setPayoutNumber(data.payout_number || '');
        } else {
          toast.error("Profil livreur introuvable.");
          navigate('/dashboard/profil');
        }
      } catch (err) {
        console.error("Error fetching delivery person profile:", err);
        toast.error("Erreur de chargement du profil.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, navigate]);

  const validatePayoutNumber = (number: string, network: string) => {
    if (!network && !number) return '';
    if (network && !number) return 'Le numéro est requis pour le retrait';
    if (number) {
      const cleaned = number.replace(/\D/g, '');
      if (cleaned.startsWith('225') && cleaned.length === 13) return '';
      if (cleaned.length === 10) return '';
      return 'Numéro invalide (ex: 0701020304)';
    }
    return '';
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Validate network
    if (payoutNumber && !payoutNetwork) {
      setPayoutNetworkError('Veuillez sélectionner un réseau si vous entrez un numéro');
      return;
    } else {
      setPayoutNetworkError('');
    }

    const numErr = validatePayoutNumber(payoutNumber, payoutNetwork);
    if (numErr) {
      setPayoutNumberError(numErr);
      return;
    } else {
      setPayoutNumberError('');
    }

    setSaving(true);
    try {
      await deliveryPersonService.updateDeliveryPerson(profile.id, {
        payout_network: payoutNetwork || null,
        payout_number: payoutNumber || null,
      });
      toast.success('Coordonnées de paiement mises à jour !');
      navigate('/dashboard/profil');
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour des coordonnées.');
    } finally {
      setSaving(false);
    }
  };

  const networks = [
    { id: 'wave-ci', label: 'Wave', logo: '/wave-logo.png', color: 'border-blue-200 bg-blue-50/10' },
    { id: 'orange-money-ci', label: 'Orange', logo: '/Orange_logo.svg', color: 'border-orange-200 bg-orange-50/10' },
    { id: 'mtn-ci', label: 'MTN', logo: '/MTN logo.jpeg', color: 'border-yellow-200 bg-yellow-50/10' },
    { id: 'moov-ci', label: 'Moov', logo: '/moov-logo.png', color: 'border-emerald-200 bg-emerald-50/10' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Moyen de réception</h1>
          <p className="text-xs text-gray-400">Coordonnées de paiement de vos courses</p>
        </div>
      </div>

      <div className="px-4 pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-bold">Coordonnées confidentielles</p>
              <p className="mt-0.5">Ces informations sont strictement personnelles et sécurisées. C'est ici que vous recevrez automatiquement les reversements de vos livraisons effectuées sur la plateforme.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 pl-1">
              Sélectionnez votre réseau de retrait
            </label>
            <div className="grid grid-cols-2 gap-3">
              {networks.map((net) => {
                const isSelected = payoutNetwork === net.id;
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => {
                      setPayoutNetwork(isSelected ? '' : net.id);
                      setPayoutNetworkError('');
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                        : `${net.color} border-gray-200 hover:border-gray-300`
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm mb-2 p-1 border border-gray-100">
                      <img src={net.logo} alt={net.label} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs font-bold text-gray-800">{net.label}</span>
                    
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {payoutNetworkError && (
              <p className="text-red-500 text-xs mt-1 pl-1 font-semibold">{payoutNetworkError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 pl-1">
              Numéro de réception
            </label>
            <input
              type="tel"
              value={payoutNumber}
              onChange={(e) => {
                setPayoutNumber(e.target.value);
                setPayoutNumberError('');
              }}
              placeholder="Ex: 0701020304"
              className={`w-full px-4 py-4 rounded-2xl border bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm font-semibold ${
                payoutNumberError ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {payoutNumberError && (
              <p className="text-red-500 text-xs mt-1 pl-1 font-semibold">{payoutNumberError}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-1.5 pl-1">
              Entrez votre numéro de compte Mobile Money actif à 10 chiffres.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-primary hover:bg-primary-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Enregistrer les coordonnées</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayoutSetupPage;
