import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Star, MapPin, Phone, Mail, Shield, Camera,
  ChevronRight, LogOut, Bike, Car, Truck,
  Wallet, TrendingUp, Users
} from 'lucide-react';
import { ZonesModal, ProfileModal, PhoneModal } from '../components/profile/ProfileModals';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { deliveryPersonService } from '../services/deliveryPersonService';
import { deliveryOrderService, type DeliveryRequest } from '../services/deliveryOrderService';
import { EarningsModal } from '../components/dashboard/EarningsModal';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';

import type { DeliveryPerson } from '../types/livreur';
import toast from 'react-hot-toast';

const VEHICLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Moto: Bike,
  Vélo: Bike,
  Voiture: Car,
  Triporteur: Truck,
  motorcycle: Bike,
  car: Car,
};

type EditModalState = 'none' | 'profile' | 'phone' | 'zones';

export default function DashboardProfil() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabase();
  const [profile, setProfile] = useState<DeliveryPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveryRequest[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  
  const [activeModal, setActiveModal] = useState<EditModalState>('none');
  const [updating, setUpdating] = useState(false);
  
  // Edit States
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editZones, setEditZones] = useState<string[]>([]);
  const [zoneSearch, setZoneSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const data = await deliveryPersonService.getDeliveryPersonByUserId(user.id);
      if (!data) {
        try {
          const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
          if (userData?.role === 'admin' || userData?.role === 'superadmin') {
            navigate('/admin');
            return;
          }
        } catch (err) {
          console.error("Error checking user role:", err);
        }
        navigate('/devenir-livreur');
        return;
      }
      setProfile(data);
      
      // Récupérer l'historique des gains
      const myOrders = await deliveryOrderService.getMyOrders(data.id);
      const delivered = myOrders.filter(o => o.status === 'delivered');
      setDeliveredOrders(delivered);
      
      const earnings = delivered.reduce((sum, o) => sum + (o.proposed_price || 0) * 0.9, 0); // 10% frais plateforme déduits
      setTotalEarnings(Math.round(earnings));
    } catch (err) {
      console.error(err);
      toast.error('Erreur de chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
    navigate('/');
  };

  const openModal = (type: EditModalState) => {
    if (!profile) return;
    if (type === 'profile') {
      setEditName(profile.name);
      setEditDescription(profile.description || '');
    } else if (type === 'phone') {
      setEditPhone(profile.phone);
    } else if (type === 'zones') {
      setEditZones([...profile.coverage_zones]);
      setZoneSearch('');
    }
    setActiveModal(type);
  };

  const handleUpdate = async (updates: Partial<DeliveryPerson>) => {
    if (!profile) return;
    setUpdating(true);
    try {
      await deliveryPersonService.updateDeliveryPerson(profile.id, updates);
      toast.success('Profil mis à jour');
      await fetchProfile(); // Reload
      setActiveModal('none');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !user) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo ne doit pas dépasser 5 Mo');
      return;
    }

    toast.loading('Mise à jour de la photo...', { id: 'photo-upload' });
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `photo-${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('livreur-photos')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('livreur-photos')
        .getPublicUrl(fileName);
        
      await deliveryPersonService.updateDeliveryPerson(profile.id, { photo_url: urlData.publicUrl });
      toast.success('Photo mise à jour !', { id: 'photo-upload' });
      await fetchProfile();
    } catch {
      toast.error('Erreur lors de la mise à jour de la photo', { id: 'photo-upload' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) return null;

  const VehicleIcon = VEHICLE_ICONS[profile.vehicle_type] || Bike;

  const menuItems = [
    {
      icon: User,
      label: 'Modifier le profil',
      subtitle: 'Nom, description',
      action: () => openModal('profile'),
    },
    {
      icon: Phone,
      label: 'Téléphone',
      subtitle: profile.phone,
      action: () => openModal('phone'),
    },
    {
      icon: MapPin,
      label: 'Zones de couverture',
      subtitle: profile.coverage_zones.length > 0 ? profile.coverage_zones.join(', ') : 'Non définies',
      action: () => openModal('zones'),
    },
    {
      icon: Wallet,
      label: 'Moyen de réception des fonds',
      subtitle: profile.payout_network ? `${profile.payout_network.replace('-ci', '').toUpperCase()} - ${profile.payout_number}` : 'Non défini',
      action: () => navigate('/dashboard/profil/payout'),
    },
    {
      icon: TrendingUp,
      label: 'Historique des gains',
      subtitle: `${totalEarnings.toLocaleString('fr-FR')} FCFA cumulés (net)`,
      action: () => setShowEarningsModal(true),
    },
    {
      icon: Users,
      label: 'Mes Vendeurs Affiliés',
      subtitle: 'Gérer les demandes et partenariats vendeurs',
      action: () => navigate('/affiliations'),
    },
    {
      icon: Shield,
      label: 'Vérification',
      subtitle: profile.verification_status === 'approved' 
        ? 'Profil vérifié ✓' 
        : profile.verification_status === 'rejected' 
          ? `Refusé : ${profile.verification_rejection_reason || 'voir détails'}`
          : profile.verification_status === 'pending'
            ? "Document en cours d'examen"
            : profile.cni_url
              ? "Document en cours d'examen"
              : 'Soumettre un document',
      action: () => navigate('/dashboard/profil/verification'),
    },
  ];

  return (
    <div className="pb-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary to-primary-700 px-4 pt-6 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30 shadow-lg">
              {profile.photo_url ? (
                <img 
                  src={profile.photo_url} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=ffffff&color=ea580c&size=128`;
                  }}
                />
              ) : (
                <User className="w-10 h-10 text-white/70" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer">
              <Camera className="w-3.5 h-3.5 text-primary" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload} 
              />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{profile.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm font-semibold text-white">{profile.rating.toFixed(1)}</span>
              </div>
              <span className="text-white/50">·</span>
              <span className="text-sm text-white/80">{profile.total_reviews} avis</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <VehicleIcon className="w-4 h-4 text-white/70" />
              <span className="text-sm text-white/70">{profile.vehicle_type}</span>
              {profile.vehicle_details && (
                <span className="text-sm text-white/50 truncate"> — {profile.vehicle_details}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - overlapping the gradient */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-grey-100"
          >
            <p className="text-2xl font-black text-primary">{profile.rating.toFixed(1)}</p>
            <p className="text-[11px] text-grey-500 font-medium mt-1">Note</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-grey-100"
          >
            <p className="text-2xl font-black text-secondary">{profile.total_reviews}</p>
            <p className="text-[11px] text-grey-500 font-medium mt-1">Avis</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-grey-100"
          >
            <p className="text-2xl font-black text-success">{profile.coverage_zones.length}</p>
            <p className="text-[11px] text-grey-500 font-medium mt-1">Zones</p>
          </motion.div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-6 space-y-2">
        <p className="text-xs font-bold text-grey-400 uppercase tracking-wider px-1 mb-3">Paramètres</p>
        <div className="bg-white rounded-2xl border border-grey-100 shadow-sm overflow-hidden divide-y divide-grey-100">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                onClick={item.action}
                className="flex items-center gap-4 w-full p-4 active:bg-grey-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-grey-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-grey-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-grey-900">{item.label}</p>
                  <p className="text-xs text-grey-500 truncate mt-0.5">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-grey-300 flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Email */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-grey-100 shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-grey-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-grey-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-grey-900">Email</p>
            <p className="text-xs text-grey-500 truncate mt-0.5">{user?.email || '—'}</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-error-50 text-error rounded-2xl font-bold text-sm active:scale-95 transition-transform"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>

      {/* Modals / Bottom Sheets */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !updating && setActiveModal('none')}
              className="fixed inset-0 bg-grey-900/40 backdrop-blur-sm z-[100]"
            />
            
            <ZonesModal
              active={activeModal === 'zones'}
              onClose={() => setActiveModal('none')}
              updating={updating}
              editZones={editZones}
              setEditZones={setEditZones}
              zoneSearch={zoneSearch}
              setZoneSearch={setZoneSearch}
              handleUpdate={handleUpdate}
            />

            <ProfileModal
              active={activeModal === 'profile'}
              onClose={() => setActiveModal('none')}
              updating={updating}
              editName={editName}
              setEditName={setEditName}
              editDescription={editDescription}
              setEditDescription={setEditDescription}
              handleUpdate={handleUpdate}
            />

            <PhoneModal
              active={activeModal === 'phone'}
              onClose={() => setActiveModal('none')}
              updating={updating}
              editPhone={editPhone}
              setEditPhone={setEditPhone}
              handleUpdate={handleUpdate}
            />
          </>
        )}
      </AnimatePresence>

      {/* Modal Historique des gains */}
      <EarningsModal
        show={showEarningsModal}
        onClose={() => setShowEarningsModal(false)}
        deliveredOrders={deliveredOrders}
      />
    </div>
  );
}
