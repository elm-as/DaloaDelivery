import { supabase } from '../lib/supabase';

export interface DriverAffiliation {
  id: string;
  seller_id: string;
  delivery_person_id: string;
  status: 'pending' | 'active' | 'rejected';
  created_at: string;
  seller?: {
    id: string;
    full_name: string;
    phone: string;
    shop_name?: string;
    avatar_url?: string;
  };
}

export const driverAffiliationService = {
  /**
   * Récupère le profil livreur de l'utilisateur connecté
   */
  async getCurrentDriverId(): Promise<string | null> {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) return null;

    const { data, error } = await supabase
      .from('delivery_persons')
      .select('id')
      .eq('user_id', userRes.user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data.id;
  },

  /**
   * Récupère les affiliations (invitations et affiliations actives) pour le livreur
   */
  async getDriverAffiliations(): Promise<DriverAffiliation[]> {
    try {
      const driverId = await this.getCurrentDriverId();
      if (!driverId) return [];

      const { data, error } = await supabase
        .from('seller_delivery_affiliations')
        .select(`
          id,
          seller_id,
          delivery_person_id,
          status,
          created_at,
          seller:users!seller_delivery_affiliations_seller_id_fkey (
            id,
            full_name,
            phone,
            shop_name,
            avatar_url,
            shop_logo_url
          )
        `)
        .eq('delivery_person_id', driverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        seller_id: item.seller_id,
        delivery_person_id: item.delivery_person_id,
        status: item.status,
        created_at: item.created_at,
        seller: Array.isArray(item.seller) ? item.seller[0] : item.seller,
      }));
    } catch (err) {
      console.error('getDriverAffiliations error:', err);
      return [];
    }
  },

  /**
   * Accepter ou refuser une invitation d'affiliation
   */
  async respondToAffiliation(
    affiliationId: string,
    status: 'active' | 'rejected'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('seller_delivery_affiliations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', affiliationId);

      if (error) throw error;
      return {
        success: true,
        message: status === 'active' ? 'Invitation acceptée !' : 'Invitation refusée.',
      };
    } catch (err: any) {
      console.error('respondToAffiliation error:', err);
      return { success: false, message: err.message || 'Erreur lors de la réponse' };
    }
  },
};
