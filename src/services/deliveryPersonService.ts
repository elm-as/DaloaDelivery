import { supabase } from '../lib/supabase';
import type { DeliveryPerson, DeliveryPersonSearchFilters } from '../types/livreur';

export const deliveryPersonService = {
  async createDeliveryPerson(
    data: Omit<DeliveryPerson, 'id' | 'created_at' | 'updated_at' | 'rating' | 'total_reviews' | 'cni_url' | 'selfie_cni_url' | 'portrait_live_url'> & { 
      cni_url?: string | null;
      selfie_cni_url?: string | null;
      portrait_live_url?: string | null;
    }
  ) {
    const { data: result, error } = await supabase
      .from('delivery_persons')
      .insert({
        ...data,
        rating: 0,
        total_reviews: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }
    return result as DeliveryPerson;
  },

  async registerDriverProfile({
    userId,
    formData,
    userProfile,
  }: {
    userId: string;
    formData: {
      name: string;
      phone: string;
      photo: File | null;
      photoPreview: string;
      vehicle_type: string;
      vehicle_details: string;
      coverage_zones: string[];
      pricing_description: string;
      description: string;
      payout_network?: string;
      payout_number?: string;
    };
    userProfile?: Record<string, unknown> | null;
  }): Promise<DeliveryPerson> {
    let photoUrl: string | null = null;
    if (formData.photo) {
      const fileExt = formData.photo.name.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('livreur-photos')
        .upload(fileName, formData.photo, {
          upsert: true,
          contentType: formData.photo.type || 'image/jpeg',
        });
      if (uploadError) {
        console.warn('Upload photo livreur échoué:', uploadError);
      } else {
        photoUrl = supabase.storage.from('livreur-photos').getPublicUrl(fileName).data.publicUrl;
      }
    }

    const map: Record<string, string> = {
      wave: 'wave-ci',
      'wave-ci': 'wave-ci',
      orange: 'orange-money-ci',
      'orange-money-ci': 'orange-money-ci',
      mtn: 'mtn-ci',
      'mtn-ci': 'mtn-ci',
      moov: 'moov-ci',
      'moov-ci': 'moov-ci',
    };
    const cleanPayoutNetwork = formData.payout_network ? map[formData.payout_network] || 'wave-ci' : 'wave-ci';
    const safePreview = formData.photoPreview?.startsWith('http') ? formData.photoPreview : null;
    const safeUserAvatar = typeof userProfile?.avatar_url === 'string' && userProfile.avatar_url.startsWith('http')
      ? userProfile.avatar_url
      : null;
    const finalAvatar = photoUrl || safePreview || safeUserAvatar || null;

    let nextRole = 'livreur';
    try {
      const { data: userRow } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();
      if (userRow?.role === 'admin' || userRow?.role === 'superadmin' || userRow?.role === 'vendeur') {
        nextRole = userRow.role;
      }
    } catch {}

    try {
      await Promise.all([
        supabase.from('users').update({
          full_name: formData.name,
          phone: formData.phone,
          avatar_url: finalAvatar,
          role: nextRole,
          payout_network: cleanPayoutNetwork,
          payout_number: formData.payout_number || null,
        } as any).eq('id', userId),
        supabase.auth.updateUser({
          data: {
            full_name: formData.name,
            name: formData.name,
            phone: formData.phone,
            avatar_url: finalAvatar,
            role: nextRole,
          },
        }),
      ]);
    } catch (userSyncErr) {
      console.warn('Sync users warning:', userSyncErr);
    }

    return this.createDeliveryPerson({
      user_id: userId,
      name: formData.name,
      phone: formData.phone,
      photo_url: finalAvatar,
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
  },

  async updateDeliveryPerson(
    id: string,
    updates: Partial<Omit<DeliveryPerson, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) {
    const { data, error } = await supabase
      .from('delivery_persons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DeliveryPerson;
  },

  async toggleAvailability(id: string, isAvailable: boolean) {
    return this.updateDeliveryPerson(id, { is_available: isAvailable });
  },

  async getDeliveryPersonByUserId(userId: string) {
    const { data, error } = await supabase
      .from('delivery_persons')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as DeliveryPerson | null;
  },

  async getAvailableDeliveryPersons() {
    const { data, error } = await supabase
      .from('delivery_persons_directory')
      .select('*')
      .eq('is_available', true)
      .not('name', 'is', null)
      .neq('name', '')
      .order('rating', { ascending: false });

    if (error) throw error;
    return ((data as DeliveryPerson[]) || []).filter(
      (d) => Boolean(d.name && d.name.trim().length > 0 && d.phone && d.phone.trim().length > 0)
    );
  },

  async searchDeliveryPersons(filters: DeliveryPersonSearchFilters) {
    let query = supabase
      .from('delivery_persons_directory')
      .select('*')
      .not('name', 'is', null)
      .neq('name', '');

    if (filters.available_only) {
      query = query.eq('is_available', true);
    }

    if (filters.vehicle_type) {
      query = query.eq('vehicle_type', filters.vehicle_type);
    }

    if (filters.zone) {
      query = query.contains('coverage_zones', [filters.zone]);
    }

    if (filters.min_rating !== undefined && filters.min_rating > 0) {
      query = query.gte('rating', filters.min_rating);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    query = query.order('rating', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return ((data as DeliveryPerson[]) || []).filter(
      (d) => Boolean(d.name && d.name.trim().length > 0 && d.phone && d.phone.trim().length > 0)
    );
  },

  async getDeliveryPersonById(id: string) {
    const { data, error } = await supabase
      .from('delivery_persons_directory')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as DeliveryPerson;
  },

  rotateEquitably(persons: DeliveryPerson[]): DeliveryPerson[] {
    return rotateDeliveryPersonsEquitably(persons);
  },
};

/**
 * Réorganise équitablement la liste des livreurs disponibles.
 * Évite d'avantager systématiquement les premiers inscrits en base de données.
 * Les livreurs de même niveau de note ou statut sont brassés de manière uniforme.
 *
 * @param persons Liste des livreurs à réordonner
 * @returns Nouvelle liste ordonnée de façon équitable
 */
export function rotateDeliveryPersonsEquitably(persons: DeliveryPerson[]): DeliveryPerson[] {
  if (!persons || persons.length <= 1) return persons ? [...persons] : [];

  // Mélange Fisher-Yates impartial
  const shuffled = [...persons];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  // Tri équilibré : disponibilité d'abord, puis statut vérifié, puis note si > 0
  return shuffled.sort((a, b) => {
    if (a.is_available !== b.is_available) {
      return a.is_available ? -1 : 1;
    }
    const aVerified = a.is_verified || a.verification_status === 'approved' ? 1 : 0;
    const bVerified = b.is_verified || b.verification_status === 'approved' ? 1 : 0;
    if (bVerified !== aVerified) {
      return bVerified - aVerified;
    }
    if (a.rating > 0 || b.rating > 0) {
      return b.rating - a.rating;
    }
    return 0;
  });
}
