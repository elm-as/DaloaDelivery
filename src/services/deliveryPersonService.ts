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
      .order('rating', { ascending: false });

    if (error) throw error;
    return data as DeliveryPerson[];
  },

  async searchDeliveryPersons(filters: DeliveryPersonSearchFilters) {
    let query = supabase.from('delivery_persons_directory').select('*');

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
    return data as DeliveryPerson[];
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
};
