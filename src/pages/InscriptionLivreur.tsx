import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  normalizePayoutNetwork,
} from '../types/registration';

export default function InscriptionLivreur() {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useSupabase();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Zones Bottom Sheet State
  const [showZonesModal, setShowZonesModal] = useState(false);
  const [zoneSearch, setZoneSearch] = useState('');

  const [formData, setFormData] = useState<RegistrationFormData>(initialRegistrationFormData);

  const [startedLoggedIn] = useState(() => Boolean(user));
  const totalSteps = startedLoggedIn ? 2 : 3;

  // Pré-remplir les données si connecté
  useEffect(() => {
    if (!authLoading && user) {
      deliveryPersonService
        .getDeliveryPersonByUserId(user.id)
        .then((profile) => {
          if (profile) {
            setExistingProfile(true);
            toast('Vous avez déjà un profil de livreur actif', { icon: 'ℹ️' });
          } else {
            setFormData((prev) => ({
              ...prev,
              name: String(prev.name || userProfile?.full_name || user.user_metadata?.full_name || ''),
              phone: String(prev.phone || userProfile?.phone || user.user_metadata?.phone || ''),
              photoPreview: String(prev.photoPreview || userProfile?.avatar_url || user.user_metadata?.avatar_url || ''),
              payout_number: String(prev.payout_number || (userProfile as any)?.payout_number || userProfile?.phone || ''),
            }));
          }
        })
        .catch((err) => console.error('Erreur profil existant:', err));
    }
  }, [user, userProfile, authLoading]);

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

  // Convertit l'étape d'affichage vers l'étape logique (1: Auth si non connecté, 2: Infos, 3: Service)
  const getActualStep = (currentStep: number) => {
    if (!startedLoggedIn) return currentStep;
    return currentStep + 1;
  };

  const canGoNext = () => {
    if (!startedLoggedIn && step === 1) {
      return (
        formData.email.trim() !== '' &&
        formData.password.length >= 6 &&
        formData.password === formData.confirmPassword
      );
    }
    const actual = getActualStep(step);
    switch (actual) {
      case 2:
        return formData.name.trim() !== '' && formData.phone.trim() !== '';
      case 3:
        return formData.vehicle_type !== '' && formData.coverage_zones.length > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!startedLoggedIn && step === 1) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      setSubmitting(true);
      try {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        setStep(2);
      } catch (err: unknown) {
        let msg = err instanceof Error ? err.message : 'Erreur lors de la création du compte';
        if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
          msg = 'Un compte avec cet e-mail existe déjà. Veuillez vous connecter.';
        }
        toast.error(msg);
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

    if (!formData.name.trim()) {
      toast.error('Veuillez renseigner votre nom complet.');
      setStep(startedLoggedIn ? 1 : 2);
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Veuillez renseigner votre numéro de téléphone.');
      setStep(startedLoggedIn ? 1 : 2);
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl: string | null = null;
      if (formData.photo) {
        const fileExt = formData.photo.name.split('.').pop();
        const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('livreur-photos')
          .upload(fileName, formData.photo);
        if (uploadError) {
          console.warn('Upload photo livreur échoué:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('livreur-photos')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      const cleanPayoutNetwork = normalizePayoutNetwork(formData.payout_network);

      // 1. Synchroniser le profil utilisateur (users)
      try {
        await supabase
          .from('users')
          .update({
            full_name: formData.name,
            phone: formData.phone,
            avatar_url: photoUrl || formData.photoPreview || userProfile?.avatar_url || null,
            role: 'livreur',
            payout_network: cleanPayoutNetwork,
            payout_number: formData.payout_number || null,
          } as any)
          .eq('id', currentUser.id);
      } catch (userSyncErr) {
        console.warn('Sync users warning:', userSyncErr);
      }

      // 2. Créer l'enregistrement officiel dans delivery_persons
      await deliveryPersonService.createDeliveryPerson({
        user_id: currentUser.id,
        name: formData.name,
        phone: formData.phone,
        photo_url: photoUrl || formData.photoPreview || userProfile?.avatar_url || null,
        is_available: true,
        vehicle_type: formData.vehicle_type,
        vehicle_details: formData.vehicle_details || '',
        coverage_zones: formData.coverage_zones,
        pricing_description: formData.pricing_description || '',
        description: formData.description || '',
        current_location: null,
        payout_network: cleanPayoutNetwork,
        payout_number: formData.payout_number || null,
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

  if (existingProfile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-success-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-grey-900 mb-2">Vous êtes déjà livreur</h1>
        <p className="text-grey-500 mb-8 max-w-sm">
          Vous possédez déjà un profil actif sur DaloaDelivery. Gérez vos courses et vos gains depuis votre espace.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full max-w-sm py-4 bg-primary text-white rounded-2xl font-bold active:scale-95 transition-transform"
        >
          Accéder à mon tableau de bord
        </button>
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
          {/* Étape 1 : Création de compte (si non connecté au départ) */}
          {!startedLoggedIn && step === 1 && (
            <AuthStep
              formData={formData}
              updateField={updateField}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          )}

          {/* Étape Infos Personnelles + Payout */}
          {((startedLoggedIn && step === 1) || (!startedLoggedIn && step === 2)) && (
            <PersonalInfoStep
              formData={formData}
              updateField={updateField}
              handlePhotoChange={handlePhotoChange}
            />
          )}

          {/* Étape Service & Zones */}
          {((startedLoggedIn && step === 2) || (!startedLoggedIn && step === 3)) && (
            <ServiceInfoStep
              formData={formData}
              updateField={updateField}
              setShowZonesModal={setShowZonesModal}
            />
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

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext() || submitting}
              className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              Continuer <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canGoNext() || submitting}
              className="flex-[2] py-4 bg-success text-white rounded-2xl font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {submitting ? 'Validation...' : 'Terminer mon inscription'}
            </button>
          )}
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
