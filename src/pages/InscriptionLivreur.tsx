import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { supabase } from '../lib/supabase';
import { PersonalInfoStep } from '../components/registration/PersonalInfoStep';
import { ServiceInfoStep } from '../components/registration/ServiceInfoStep';
import { RegistrationZonesModal } from '../components/registration/RegistrationZonesModal';
import toast from 'react-hot-toast';

interface FormData {
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
  const { user, userProfile, loading: authLoading } = useSupabase();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);
  
  // Zones Bottom Sheet State
  const [showZonesModal, setShowZonesModal] = useState(false);
  const [zoneSearch, setZoneSearch] = useState('');

  // Extraction intelligente des métadonnées (Google OAuth + Profil Supabase)
  const getInitialName = (): string => {
    if (typeof userProfile?.full_name === 'string' && userProfile.full_name.trim()) return userProfile.full_name;
    const gName = user?.user_metadata?.full_name || user?.user_metadata?.name;
    if (typeof gName === 'string') return gName;
    return '';
  };

  const getInitialPhone = (): string => {
    if (typeof userProfile?.phone === 'string' && userProfile.phone.trim()) return userProfile.phone;
    const gPhone = user?.user_metadata?.phone || user?.phone;
    if (typeof gPhone === 'string') return gPhone;
    return '';
  };

  const getInitialPhoto = (): string => {
    if (typeof userProfile?.avatar_url === 'string' && userProfile.avatar_url.trim()) return userProfile.avatar_url;
    const gPhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    if (typeof gPhoto === 'string') return gPhoto;
    return '';
  };

  const [formData, setFormData] = useState<FormData>({
    name: getInitialName(),
    phone: getInitialPhone(),
    photo: null,
    photoPreview: getInitialPhoto(),
    vehicle_type: '',
    vehicle_details: '',
    coverage_zones: [],
    pricing_description: '',
    description: '',
    terms_accepted: false,
    payout_network: 'wave-ci',
    payout_number: getInitialPhone(),
  });

  const totalSteps = 2;

  // 1. Rediriger vers l'inscription/connexion si non connecté
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/register?redirect=/devenir-livreur', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // 2. Vérifier si le livreur possède déjà un profil
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

  // 3. Préremplir automatiquement dès que les infos Google OAuth ou Supabase sont chargées
  useEffect(() => {
    if (user || userProfile) {
      const gName = (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '') ||
                    (typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : '');
      const gAvatar = (typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : '') ||
                      (typeof user?.user_metadata?.picture === 'string' ? user.user_metadata.picture : '');
      const gPhone = (typeof user?.user_metadata?.phone === 'string' ? user.user_metadata.phone : '') ||
                     (typeof user?.phone === 'string' ? user.phone : '');

      const pName = typeof userProfile?.full_name === 'string' ? userProfile.full_name : '';
      const pPhone = typeof userProfile?.phone === 'string' ? userProfile.phone : '';
      const pAvatar = typeof userProfile?.avatar_url === 'string' ? userProfile.avatar_url : '';

      const detectedName = pName || gName;
      const detectedPhone = pPhone || gPhone;
      const detectedAvatar = pAvatar || gAvatar;

      setFormData((prev) => ({
        ...prev,
        name: prev.name || detectedName || '',
        phone: prev.phone || detectedPhone || '',
        photoPreview: prev.photoPreview || detectedAvatar || '',
        payout_number: prev.payout_number || detectedPhone || '',
      }));
    }
  }, [user, userProfile]);

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

  const canGoNext = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '' && formData.phone.trim() !== '' && !!formData.payout_network && !!formData.payout_number;
      case 2:
        return formData.vehicle_type !== '' && formData.coverage_zones.length > 0 && formData.terms_accepted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const currentUser = user || (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      toast.error('Vous devez être connecté');
      navigate('/login?redirect=/devenir-livreur');
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl: string | null = formData.photoPreview.startsWith('http') ? formData.photoPreview : null;
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

      // Synchroniser le nom et le téléphone dans la table users
      await supabase
        .from('users')
        .update({
          full_name: formData.name,
          phone: formData.phone,
          avatar_url: photoUrl || userProfile?.avatar_url || null,
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
      <div className="min-h-screen flex items-center justify-center bg-grey-50">
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
    <div className="min-h-screen bg-grey-50 pb-20 max-w-3xl mx-auto lg:pt-6">
      {/* App-like Header Background */}
      <div className="bg-primary px-6 pt-6 pb-20 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Devenir livreur partenaire</h1>
            <p className="text-xs text-white/80 mt-0.5">Complétez vos informations pour commencer vos livraisons</p>
          </div>
          <div className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1 text-sm font-bold text-white shrink-0">
            <span className="w-2 h-2 rounded-full bg-success" />
            Étape {step}/{totalSteps}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20">
        <AnimatePresence mode="wait">
          {/* Étape 1 : Infos personnelles & Payout */}
          {step === 1 && (
            <PersonalInfoStep 
              formData={formData} 
              updateField={updateField} 
              handlePhotoChange={handlePhotoChange} 
            />
          )}

          {/* Étape 2 : Service, Véhicule & Zones */}
          {step === 2 && (
            <ServiceInfoStep 
              formData={formData} 
              updateField={updateField} 
              setShowZonesModal={setShowZonesModal} 
            />
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
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
              Suivant <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canGoNext() || submitting}
              className="flex-[2] py-4 bg-success text-white rounded-2xl font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {submitting ? 'Création du profil...' : 'Terminer l\'inscription'}
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
