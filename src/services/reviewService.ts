import { supabase } from '../lib/supabase';
import type { Review } from '../types/livreur';

export const reviewService = {
  async addReview(
    deliveryPersonId: string,
    reviewerId: string,
    reviewerName: string,
    rating: number,
    comment: string
  ) {
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

    const { data: reviews } = await supabase
      .from('delivery_person_reviews')
      .select('rating')
      .eq('delivery_person_id', deliveryPersonId);

    const totalReviews = reviews?.length || 0;
    const avgRating =
      totalReviews > 0
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    await supabase
      .from('delivery_persons')
      .update({
        rating: Math.round(avgRating * 10) / 10,
        total_reviews: totalReviews,
      })
      .eq('id', deliveryPersonId);

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
