import { supabase } from '../lib/supabase';
import type { Review } from '../types/livreur';

export interface ReviewEligibility {
  canReview: boolean;
  reason?: 'not_authenticated' | 'own_profile' | 'already_reviewed' | 'no_completed_delivery';
  completedDeliveryCount?: number;
}

export const reviewService = {
  /**
   * Vérifie si un utilisateur est strictement éligible à laisser un avis pour ce livreur.
   * Règle d'intégrité : seuls les clients (buyer) ou commerçants (seller) ayant une course
   * livrée et validée (status 'delivered' ou 'auto_released') avec ce coursier peuvent noter.
   */
  async canReviewDriver(deliveryPersonId: string, userId?: string | null): Promise<ReviewEligibility> {
    if (!userId) {
      return { canReview: false, reason: 'not_authenticated' };
    }

    // 1. Vérifier si l'utilisateur est le livreur lui-même (interdiction d'auto-évaluation)
    const { data: driverRecord } = await supabase
      .from('delivery_persons')
      .select('user_id')
      .eq('id', deliveryPersonId)
      .maybeSingle();

    if (driverRecord?.user_id && driverRecord.user_id === userId) {
      return { canReview: false, reason: 'own_profile' };
    }

    // 2. Vérifier si l'utilisateur a déjà soumis un avis pour ce coursier
    const { data: existingReview } = await supabase
      .from('delivery_person_reviews')
      .select('id')
      .eq('delivery_person_id', deliveryPersonId)
      .eq('reviewer_id', userId)
      .maybeSingle();

    if (existingReview) {
      return { canReview: false, reason: 'already_reviewed' };
    }

    // 3. Rechercher les courses terminées avec ce coursier
    const { data: assignments, error: assignError } = await supabase
      .from('delivery_assignments')
      .select('order_id')
      .eq('delivery_person_id', deliveryPersonId)
      .in('status', ['delivered', 'auto_released']);

    if (assignError || !assignments || assignments.length === 0) {
      return { canReview: false, reason: 'no_completed_delivery' };
    }

    const orderIds = Array.from(new Set(assignments.map((a) => a.order_id).filter(Boolean)));
    if (orderIds.length === 0) {
      return { canReview: false, reason: 'no_completed_delivery' };
    }

    // 4. Vérifier que l'utilisateur est soit le client (buyer_id) soit le vendeur (seller_id) d'au moins un de ces ordres
    const { data: validOrders, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .in('id', orderIds)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (orderError || !validOrders || validOrders.length === 0) {
      return { canReview: false, reason: 'no_completed_delivery' };
    }

    return {
      canReview: true,
      completedDeliveryCount: validOrders.length,
    };
  },

  async addReview(
    deliveryPersonId: string,
    reviewerId: string,
    reviewerName: string,
    rating: number,
    comment: string
  ) {
    // Vérification de sécurité avant insertion
    const eligibility = await this.canReviewDriver(deliveryPersonId, reviewerId);
    if (!eligibility.canReview) {
      if (eligibility.reason === 'already_reviewed') {
        throw new Error('Vous avez déjà noté ce coursier.');
      }
      if (eligibility.reason === 'own_profile') {
        throw new Error('Vous ne pouvez pas vous évaluer vous-même.');
      }
      if (eligibility.reason === 'no_completed_delivery') {
        throw new Error(
          'Seuls les clients ou commerçants ayant déjà effectué une livraison avec ce coursier peuvent donner un avis vérifié.'
        );
      }
      throw new Error('Vous devez être connecté pour déposer un avis.');
    }

    const { data: review, error } = await supabase
      .from('delivery_person_reviews')
      .insert({
        delivery_person_id: deliveryPersonId,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) throw error;

    // La note moyenne est recalculée par la base (trigger refresh_driver_rating) :
    // l'ancien UPDATE client était annulé par protect_delivery_persons_columns.
    return review as Review;
  },

  async getReviews(deliveryPersonId: string, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('delivery_person_reviews')
      .select('*', { count: 'exact' })
      .eq('delivery_person_id', deliveryPersonId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { reviews: data as Review[], total: count || 0 };
  },

  async getAverageRating(deliveryPersonId: string) {
    const { data, error } = await supabase
      .from('delivery_persons')
      .select('rating, total_reviews')
      .eq('id', deliveryPersonId)
      .single();

    if (error) throw error;
    return { rating: data.rating as number, total_reviews: data.total_reviews as number };
  },
};

