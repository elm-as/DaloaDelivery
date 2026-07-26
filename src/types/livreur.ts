export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DeliveryPerson {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  photo_url: string | null;
  cni_url: string | null;
  selfie_cni_url: string | null;
  portrait_live_url: string | null;
  is_available: boolean;
  is_verified?: boolean;
  verification_status?: 'none' | 'pending' | 'approved' | 'rejected';
  verification_rejection_reason?: string | null;
  rating: number;
  total_reviews: number;
  vehicle_type: string;
  vehicle_details: string;
  coverage_zones: string[];
  pricing_description: string;
  description: string;
  payout_network?: string | null;
  payout_number?: string | null;
  current_location: Coordinates | null;
  ai_verification_results?: Record<string, { probability: number; is_ai: boolean; details: string }> | null;
  ai_flagged?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  delivery_person_id: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface DeliveryPersonSearchFilters {
  vehicle_type?: string;
  zone?: string;
  min_rating?: number;
  available_only?: boolean;
  search?: string;
}

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  delivery_person_id: string | null;
  status: 'pending_seller_confirmation' | 'awaiting_pickup' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'auto_released' | 'disputed' | 'cancelled';
  pickup_location: string;
  dropoff_location: string;
  pickup_address: { lat: number; lng: number; address: string } | null;
  dropoff_address: { lat: number; lng: number; address: string } | null;
  delivery_price: number;
  pickup_otp: string;
  delivery_otp: string;
  pickup_otp_attempts: number;
  delivery_otp_attempts: number;
  accepted_at: string | null;
  pickup_confirmed_at: string | null;
  pickup_confirmed_by_seller: boolean;
  delivered_at: string | null;
  buyer_confirmed_at: string | null;
  auto_released_at: string | null;
  pickup_photo_url: string | null;
  delivery_photo_url: string | null;
  pickup_gps: { lat: number; lng: number } | null;
  delivery_gps: { lat: number; lng: number } | null;
  pickup_gps_distance_m: number | null;
  delivery_gps_distance_m: number | null;
  disputed_at: string | null;
  dispute_reason: string | null;
  created_at: string;
  updated_at: string;
}
