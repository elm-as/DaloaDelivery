import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { useSupabase } from '../hooks/useSupabase';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { supabase } from '../lib/supabase';
import { AuthStep } from '../components/registration/AuthStep';
import { PersonalInfoStep } from '../components/registration/PersonalInfoStep';
import { ServiceInfoStep } from '../components/registration/ServiceInfoStep';
import { RegistrationZonesModal } from '../components/registration/RegistrationZonesModal';
import {
  type RegistrationFormData,
  initialRegistrationFormData,
} from '../types/registration';

export default function InscriptionLivreur() {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useSupabase();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modal des zones de couverture
  const [showZonesModal, setShowZonesModal] = useState(false);
  const [zoneSearch, setZoneSearch] = useState('');

  const [formData, setFormData] = useState<RegistrationFormData>(initialRegistrationFormData);

  // État de connexion réactif : jamais figé dans un useState
  const isLoggedIn = Boolean(user);
  const totalSteps = isLoggedIn ? 2 : 3;

  // Redirection automatique des admins et des coursiers déjà inscrits
  useEffect(() => {
    if (authLoading || !user) return;

    // Un admin peut aussi s'inscrire comme livreur : pas de renvoi vers la console.
    // 2. Si le livreur existe déjà, aller directement au tableau de bord
    deliveryPersonService
      .getDeliveryPersonByUserId(user.id)
      .then((profile) => {
        if (profile && profile.name && profile.name.trim()) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // Pré-remplir les données depuis le compte Google / profil existant
        setFormData((prev) => ({
          ...prev,
          name: String(prev.name || userProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || ''),
          phone: String(prev.phone || userProfile?.phone || user.user_metadata?.phone || ''),
          photoPreview: String(prev.photoPreview || userProfile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || ''),
          payout_number: String(prev.payout_number || (userProfile as any)?.payout_number || userProfile?.phone || ''),
        }));
      })
      .catch((err) => console.error('Erreur vérification profil livreur:', err));
  }, [user, userProfile, authLoading, navigate]);

  const updateField = (field: keyof RegistrationFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo ne doit pas dépasser 5 Mo');
      return;
    }
    const preview = URL.createObjectURL(file);
    updateField('photo', file);
    updateField('photoPreview', preview);
  };

  const toggleZone = (zone: string) => {
    setFormData((prev) => ({
      ...prev,
      coverage_zones: prev.coverage_zones.includes(zone)
        ? prev.coverage_zones.filter((z) => z !== zone)
        : [...prev.coverage_zones, zone],
    }));
  };

  // Convertit l'étape d'affichage vers l'étape logique (1: Auth, 2: Infos, 3: Service)
  const getActualStep = (currentStep: number) => {
    if (!isLoggedIn) return currentStep;
    return currentStep + 1;
  };

  const canGoNext = () => {
    const actual = getActualStep(step);
    switch (actual) {
      case 1:
        return (
          formData.email.trim() !== '' &&
          formData.password.length >= 6 &&
          formData.password === formData.confirmPassword
        );
      case 2:
        return formData.name.trim() !== '' && formData.phone.trim() !== '';
      case 3:
        return formData.vehicle_type !== '' && formData.coverage_zones.length > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!isLoggedIn && step === 1) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      setSubmitting(true);
      try {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { role: 'livreur' } },
        });
        if (error) throw error;
        setStep(2);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : '';
        const isAlreadyRegistered =
          errMsg.toLowerCase().includes('already exists') ||
          errMsg.toLowerCase().includes('already registered') ||
          (err as any)?.status === 422;

        if (isAlreadyRegistered) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: formData.email.trim(),
            password: formData.password,
          });

          if (!signInErr && signInData.user) {
            toast.success('Compte DaloaMarket reconnu ! Renseignez vos infos coursier.');
            const existingDriver = await deliveryPersonService.getDeliveryPersonByUserId(signInData.user.id);
            if (existingDriver) {
              navigate('/dashboard');
              return;
            }
            setStep(1); // Comme l'utilisateur est maintenant connecté, étape 1 = infos perso
            return;
          }

          toast.error(
            'Un compte existe déjà avec cet email. Utilisez « Continuer avec Google » ou vérifiez le mot de passe.',
            { duration: 5000 }
          );
        } else {
          toast.error(errMsg || 'Erreur lors de la création du compte');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const currentUser = user || (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      toast.error('Vous devez être connecté pour finaliser');
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Veuillez renseigner votre nom complet et votre numéro de téléphone.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      await deliveryPersonService.registerDriverProfile({
        userId: currentUser.id,
        formData,
        userProfile,
      });

      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'CompleteRegistration', { content_name: 'LivreurProfile' });
      }

      toast.success('Profil livreur créé avec succès ! 🎉');
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Erreur inscription livreur:', err);
      const message = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-grey-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      {/* Header avec jauge d'étapes */}
      <div className="bg-primary px-4 pt-6 pb-20 rounded-b-[40px] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-100 block mb-0.5">
              Rejoindre la flotte
            </span>
            <h1 className="text-2xl font-black text-white">Devenir livreur</h1>
          </div>
          <div className="bg-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 text-xs font-black text-white border border-white/15">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Étape {step}/{totalSteps}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {/* Étape 1 : Création de compte (affichée uniquement si non connecté) */}
          {!isLoggedIn && step === 1 && (
            <AuthStep
              formData={formData}
              updateField={updateField}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          )}

          {/* Étape Infos Personnelles + Payout */}
          {((isLoggedIn && step === 1) || (!isLoggedIn && step === 2)) && (
            <PersonalInfoStep formData={formData} updateField={updateField} handlePhotoChange={handlePhotoChange} />
          )}

          {/* Étape Service & Zones */}
          {((isLoggedIn && step === 2) || (!isLoggedIn && step === 3)) && (
            <ServiceInfoStep formData={formData} updateField={updateField} setShowZonesModal={setShowZonesModal} />
          )}
        </AnimatePresence>

        {/* Boutons de navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
              className="flex-1 py-4 bg-white text-grey-900 rounded-2xl font-bold shadow-sm border border-grey-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-5 h-5" /> Retour
            </button>
          )}
          <button
            type="button"
            onClick={step < totalSteps ? handleNext : handleSubmit}
            disabled={!canGoNext() || submitting}
            className={`flex-[2] py-4 text-white rounded-2xl font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 ${
              step < totalSteps ? 'bg-primary' : 'bg-success'
            }`}
          >
            {step < totalSteps ? (
              <>Continuer <ChevronRight className="w-5 h-5" /></>
            ) : submitting ? (
              'Validation...'
            ) : (
              'Terminer mon inscription'
            )}
          </button>
        </div>
      </div>

      {/* Modal / Bottom sheet de sélection des zones */}
      <RegistrationZonesModal
        showZonesModal={showZonesModal}
        setShowZonesModal={setShowZonesModal}
        zoneSearch={zoneSearch}
        setZoneSearch={setZoneSearch}
        formData={formData}
        toggleZone={toggleZone}
      />
    </div>
  );
}
