import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../hooks/useSupabase';
import { deliveryPersonService } from '../services/deliveryPersonService';
import {
  Bike,
  Phone,
  User,
  Upload,
  Clock,
  Shield,
  FileText,
  AlertCircle,
  Truck,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    fbq?: any;
  }
}

export default function InscriptionLivreur() {
  const navigate = useNavigate();
  const { user: currentUser, userProfile, loading: authLoading } = useSupabase();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle_type: 'Moto',
    vehicle_details: '',
    coverage_zones: [] as string[],
    pricing_description: '',
    description: '',
    photo: null as File | null,
    payout_network: 'wave' as 'wave' | 'orange' | 'mtn' | 'moov',
    payout_number: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<boolean | null>(null);

  const zonesDisponibles = [
    'Centre-ville',
    'Commerce',
    'Lobia',
    'Tazibouo',
    'Kennedy',
    'Marais',
    'Huberson',
    'Sapia',
    'Garage',
    'Gbeuliville',
    'Zone Industrielle',
    'Tous quartiers',
  ];

  const vehicleTypes = [
    { value: 'Moto', label: 'Moto', icon: Bike },
    { value: 'Vélo', label: 'Vélo', icon: Bike },
    { value: 'Voiture', label: 'Voiture', icon: Truck },
    { value: 'Triporteur', label: 'Triporteur', icon: Truck },
  ];

  // Vérifier si l'utilisateur a déjà un profil livreur
  useEffect(() => {
    async function checkProfile() {
      if (!currentUser) return;
      try {
        const profile = await deliveryPersonService.getDeliveryPersonByUserId(currentUser.id);
        if (profile) {
          setExistingProfile(true);
        } else {
          setExistingProfile(false);
          // Préremplir avec les infos du compte
          setFormData((prev) => ({
            ...prev,
            name: userProfile?.full_name || '',
            phone: userProfile?.phone || '',
          }));
        }
      } catch (err) {
        console.error('Erreur vérification profil:', err);
        setExistingProfile(false);
      }
    }
    if (!authLoading) {
      if (!currentUser) {
        navigate('/login?redirect=/inscription');
      } else {
        checkProfile();
      }
    }
  }, [currentUser, userProfile, authLoading, navigate]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleZoneToggle = (zone: string) => {
    setFormData((prev) => {
      const exists = prev.coverage_zones.includes(zone);
      if (exists) {
        return { ...prev, coverage_zones: prev.coverage_zones.filter((z) => z !== zone) };
      } else {
        return { ...prev, coverage_zones: [...prev.coverage_zones, zone] };
      }
    });
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 5 Mo');
        return;
      }
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Veuillez entrer votre nom complet');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Veuillez entrer votre numéro de téléphone');
      return;
    }
    if (formData.coverage_zones.length === 0) {
      toast.error('Veuillez sélectionner au moins une zone de livraison');
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl: string | null = null;

      // 1. Upload de la photo de profil si fournie
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

      // 2. Synchroniser le rôle 'livreur' dans la table users
      await supabase
        .from('users')
        .update({
          full_name: formData.name,
          phone: formData.phone,
          avatar_url: photoUrl || userProfile?.avatar_url || null,
          role: 'livreur',
        } as any)
        .eq('id', currentUser.id);

      // 3. Création dans delivery_persons
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

      toast.success('Profil livreur créé avec succès !');
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
      <div className="min-h-screen flex items-center justify-center bg-grey-50 px-4">
        <div className="bg-white rounded-2xl p-8 shadow-card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-grey-900 mb-2">Vous êtes déjà inscrit !</h2>
          <p className="text-grey-600 mb-6 text-sm">
            Vous disposez déjà d'un profil livreur sur DaloaDelivery. Accédez à votre tableau de bord
            pour gérer votre disponibilité et vos livraisons.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl transition"
          >
            Accéder à mon tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mb-4">
            <Bike className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-grey-900">
            Devenir Livreur DaloaDelivery
          </h1>
          <p className="mt-2 text-grey-600 text-sm">
            Rejoignez notre réseau de livreurs de confiance à Daloa et commencez à recevoir des courses
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 sm:p-8 space-y-6">
          {/* Informations Personnelles */}
          <div>
            <h3 className="text-lg font-bold text-grey-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informations Personnelles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-1">
                  Nom complet <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Kouassi Jean"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-grey-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-1">
                  Numéro de téléphone <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-grey-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Ex: 07 00 00 00 00"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-grey-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Photo de profil */}
          <div>
            <label className="block text-sm font-medium text-grey-700 mb-2">
              Photo de profil (visage clair recommandé)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-grey-100 border-2 border-dashed border-grey-300 flex items-center justify-center overflow-hidden shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-grey-400" />
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-grey-100 hover:bg-grey-200 text-grey-700 font-medium text-sm rounded-xl cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  Choisir une photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-grey-500 mt-1">JPG, PNG max 5 Mo</p>
              </div>
            </div>
          </div>

          {/* Véhicule */}
          <div className="border-t border-grey-100 pt-6">
            <h3 className="text-lg font-bold text-grey-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Moyen de Transport
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {vehicleTypes.map((v) => {
                const IconComp = v.icon;
                const isSelected = formData.vehicle_type === v.value;
                return (
                  <button
                    type="button"
                    key={v.value}
                    onClick={() => setFormData((prev) => ({ ...prev, vehicle_type: v.value }))}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-primary bg-primary-50 text-primary font-bold'
                        : 'border-grey-200 hover:border-grey-300 text-grey-700'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-xs">{v.label}</span>
                  </button>
                );
              })}
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-700 mb-1">
                Détails du véhicule (marque, modèle, plaque si disponible)
              </label>
              <input
                type="text"
                name="vehicle_details"
                value={formData.vehicle_details}
                onChange={handleChange}
                placeholder="Ex: Moto Haojue 125cc Rouge - 1234 DL 01"
                className="w-full px-4 py-2.5 rounded-xl border border-grey-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>
          </div>

          {/* Zones de couverture */}
          <div className="border-t border-grey-100 pt-6">
            <h3 className="text-lg font-bold text-grey-900 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Quartiers Couverts à Daloa <span className="text-error">*</span>
            </h3>
            <p className="text-xs text-grey-500 mb-4">
              Sélectionnez les quartiers où vous êtes disponible pour livrer
            </p>
            <div className="flex flex-wrap gap-2">
              {zonesDisponibles.map((zone) => {
                const isSelected = formData.coverage_zones.includes(zone);
                return (
                  <button
                    type="button"
                    key={zone}
                    onClick={() => handleZoneToggle(zone)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-grey-100 hover:bg-grey-200 text-grey-700'
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paiement / Mobile Money */}
          <div className="border-t border-grey-100 pt-6">
            <h3 className="text-lg font-bold text-grey-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Réception des Gains (Mobile Money)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-1">
                  Réseau de paiement
                </label>
                <select
                  name="payout_network"
                  value={formData.payout_network}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-grey-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                >
                  <option value="wave">Wave</option>
                  <option value="orange">Orange Money</option>
                  <option value="mtn">MTN MoMo</option>
                  <option value="moov">Moov Money</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-1">
                  Numéro Mobile Money pour les virements
                </label>
                <input
                  type="tel"
                  name="payout_number"
                  value={formData.payout_number}
                  onChange={handleChange}
                  placeholder="Ex: 07 00 00 00 00"
                  className="w-full px-4 py-2.5 rounded-xl border border-grey-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Description & Tarification */}
          <div className="border-t border-grey-100 pt-6">
            <h3 className="text-lg font-bold text-grey-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Présentation & Disponibilités
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-1">
                  Présentez-vous brièvement (expérience, horaires, etc.)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ex: Livreur sérieux et ponctuel, disponible tous les jours de 8h à 20h. Plus de 3 ans d'expérience à Daloa."
                  className="w-full px-4 py-2.5 rounded-xl border border-grey-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Note de validation */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Vérification de sécurité :</strong> Pour recevoir des courses de forte valeur et être certifié,
              une copie de votre pièce d'identité ou permis de conduire vous sera demandée depuis votre espace livreur.
            </p>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-button text-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Création de votre profil en cours...</span>
              </>
            ) : (
              <span>Finaliser mon inscription livreur</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
