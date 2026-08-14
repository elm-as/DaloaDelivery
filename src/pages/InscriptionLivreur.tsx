import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { supabase } from '../lib/supabase';
import { AuthStep } from '../components/registration/AuthStep';
import { PersonalInfoStep } from '../components/registration/PersonalInfoStep';
import { ServiceInfoStep } from '../components/registration/ServiceInfoStep';
import { RegistrationZonesModal } from '../components/registration/RegistrationZonesModal';
import toast from 'react-hot-toast';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  photo: File | null;
  photoPreview: string;
  vehicle_type: string;
  vehicle_details: string;
  coverage_zones: string[];
  pricing_description: string;
  description: string;
  terms_accepted: boolean;
  payout_network?: string;
  payout_number?: string;
}

export default function InscriptionLivreur() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabase();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Zones Bottom Sheet State
  const [showZonesModal, setShowZonesModal] = useState(false);
  const [zoneSearch, setZoneSearch] = useState('');

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    photo: null,
    photoPreview: '',
    vehicle_type: '',
    vehicle_details: '',
    coverage_zones: [],
    pricing_description: '',
    description: '',
    terms_accepted: false,
  });

  const isLoggedIn = !!user;
  const totalSteps = isLoggedIn ? 2 : 3;

  useEffect(() => {
    if (!authLoading && user) {
      deliveryPersonService.getDeliveryPersonByUserId(user.id).then((profile) => {
        if (profile) {
          setExistingProfile(true);
          toast('Vous avez déjà un profil de livreur', { icon: 'ℹ️' });
        }
      }).catch(() => {});
    }
  }, [user, authLoading]);

  const updateField = (field: keyof FormData, value: unknown) => {
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

  const getActualStep = (displayStep: number) => isLoggedIn ? displayStep : displayStep - 1;

  const canGoNext = () => {
    if (!isLoggedIn && step === 1) {
      return (
        formData.email.trim() !== '' &&
        formData.password.length >= 6 &&
        formData.password === formData.confirmPassword
      );
    }
    const actual = getActualStep(step);
    switch (actual) {
      case 1: return formData.name.trim() !== '' && formData.phone.trim() !== '' && !!formData.payout_network && !!formData.payout_number;
      case 2: return formData.vehicle_type !== '' && formData.coverage_zones.length > 0 && formData.terms_accepted;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (!isLoggedIn && step === 1) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      const domain = formData.email.split('@')[1]?.toLowerCase().trim();
      const disposableDomains = ['kierko.com', 'aganseo.com', 'tempmail.com', 'yopmail.com', 'guerrillamail.com'];
      if (domain && disposableDomains.includes(domain)) {
        toast.error('Les adresses email temporaires ou jetables ne sont pas autorisées');
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
          msg = "Un compte avec cet e-mail existe déjà sur DaloaMarket/DaloaDelivery. Veuillez utiliser la page de connexion pour vous connecter.";
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
      toast.error('Vous devez être connecté');
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
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('livreur-photos')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      // Sync name & phone to the main users table to prevent N/A in Admin list
      await supabase
        .from('users')
        .update({
          full_name: formData.name,
          phone: formData.phone
        })
        .eq('id', currentUser.id);

      await deliveryPersonService.createDeliveryPerson({
        user_id: currentUser.id,
        name: formData.name,
        phone: formData.phone,
        photo_url: photoUrl,
        is_available: true,
        vehicle_type: formData.vehicle_type,
        vehicle_details: formData.vehicle_details,
        coverage_zones: formData.coverage_zones,
        pricing_description: formData.pricing_description,
        description: formData.description,
        current_location: null,
        payout_network: formData.payout_network || null,
        payout_number: formData.payout_number || null,
      });

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'CompleteRegistration', { content_name: 'LivreurProfile' });
      }

      toast.success('Profil livreur créé avec succès ! 🎉');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
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
        <p className="text-grey-500 mb-8 max-w-sm">Vous possédez déjà un profil actif. Gérez vos courses et paramètres depuis votre espace.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full max-w-sm py-4 bg-primary text-white rounded-2xl font-bold active:scale-95 transition-transform"
        >
          Aller au tableau de bord
        </button>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-slate-50 pb-28 max-w-3xl mx-auto lg:pt-6">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 px-6 pt-8 pb-20 rounded-b-[2.5rem] shadow-xl shadow-orange-500/20 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Devenir Livreur Partenaire</h1>
            <p className="text-xs text-orange-100 font-medium mt-0.5">Rejoignez la flotte DaloaDelivery & commencez à livrer</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-black text-white border border-white/20 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Étape {step}/{totalSteps}</span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20 space-y-4">
        <AnimatePresence mode="wait">
          {/* Step 1 (no user): Account creation */}
          {!isLoggedIn && step === 1 && (
            <AuthStep 
              formData={formData} 
              updateField={updateField} 
              showPassword={showPassword} 
              setShowPassword={setShowPassword} 
            />
          )}

          {/* Infos personnelles step */}
          {((isLoggedIn && step === 1) || (!isLoggedIn && step === 2)) && (
            <PersonalInfoStep 
              formData={formData} 
              updateField={updateField} 
              handlePhotoChange={handlePhotoChange} 
            />
          )}

          {/* Service step */}
          {((isLoggedIn && step === 2) || (!isLoggedIn && step === 3)) && (
            <ServiceInfoStep 
              formData={formData} 
              updateField={updateField} 
              setShowZonesModal={setShowZonesModal} 
            />
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              disabled={submitting}
              className="flex-1 py-3.5 bg-white text-gray-800 rounded-2xl font-black text-xs shadow-sm border border-gray-200/80 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
          )}
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext() || submitting}
              className="flex-[2] py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canGoNext() || submitting}
              className="flex-[2] py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Validation en cours...' : 'Finaliser mon inscription 🎉'}
            </button>
          )}
        </div>
      </div>

      {/* Zones Bottom Sheet */}
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
