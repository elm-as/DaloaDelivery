import { supabase } from '../lib/supabase';

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
  // Téléphones des parties (récupérés via jointure orders→users)
  seller_phone?: string | null;
  buyer_phone?: string | null;
}



interface VerificationResult {
  success: boolean;
  reason?: string;
  attempts?: number;
  max_attempts?: number;
  status?: string;
}

function assertRpcSuccess(result: VerificationResult, context?: 'pickup' | 'delivery') {
  if (result.success) return;
  if (result.reason === 'invalid_otp') {
    throw new Error(`OTP incorrect. Tentative ${result.attempts || 1}/${result.max_attempts || 3}`);
  }
  if (result.reason === 'too_many_attempts') {
    throw new Error('Trop de tentatives incorrectes. Assignment passé en litige.');
  }
  if (result.reason === 'photo_required') {
    throw new Error('Photo obligatoire');
  }
  if (result.reason === 'gps_distance_exceeded') {
    if (context === 'pickup') {
      // GPS ignoré au pickup — on laisse passer
      return;
    }
    throw new Error('Vous êtes trop loin du point de livraison. Rapprochez-vous du client.');
  }
  throw new Error(result.reason || 'Action refusée');
}

/**
 * Enrichit les assignments avec les téléphones du vendeur et de l'acheteur
 * via une jointure orders -> users en deux étapes.
 */
async function enrichWithPhones(assignments: any[]): Promise<any[]> {
  if (!assignments || assignments.length === 0) return assignments || [];

  const orderIds = [...new Set(assignments.map((a) => a.order_id))];

  // Étape 1 : récupérer seller_id/buyer_id depuis orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, seller_id, buyer_id')
    .in('id', orderIds);

  if (!orders || orders.length === 0) return assignments;

  const userIds = new Set<string>();
  const orderMap = new Map<string, { seller_id: string; buyer_id: string }>();
  for (const o of orders) {
    orderMap.set(o.id, { seller_id: o.seller_id, buyer_id: o.buyer_id });
    userIds.add(o.seller_id);
    userIds.add(o.buyer_id);
  }

  // Étape 2 : récupérer les téléphones depuis users
  const { data: users } = await supabase
    .from('users')
    .select('id, phone')
    .in('id', Array.from(userIds));

  const phoneMap = new Map<string, string>();
  for (const u of (users || [])) {
    if (u.phone) phoneMap.set(u.id, u.phone);
  }

  // Fusion
  return assignments.map((a) => {
    const order = orderMap.get(a.order_id);
    return {
      ...a,
      seller_phone: order ? phoneMap.get(order.seller_id) || null : null,
      buyer_phone: order ? phoneMap.get(order.buyer_id) || null : null,
    };
  });
}

export const deliveryAssignmentService = {
  /**
   * Récupérer les assignments disponibles pour le livreur
   * (statut awaiting_pickup, pickup_confirmed_by_seller = true, pas de livreur assigné)
   */
  async getAvailableAssignments() {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('*')
      .eq('status', 'awaiting_pickup')
      .eq('pickup_confirmed_by_seller', true)
      .is('delivery_person_id', null);
    
    if (error) throw error;
    return enrichWithPhones(data) as DeliveryAssignment[];
  },

  /**
   * Récupérer les assignments du livreur connecté
   */
  async getMyAssignments(deliveryPersonId: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('*')
      .eq('delivery_person_id', deliveryPersonId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return enrichWithPhones(data) as DeliveryAssignment[];
  },

  /**
   * Accepter une assignment (changement de statut à 'accepted')
   */
  async acceptAssignment(assignmentId: string, deliveryPersonId: string) {
    const { data, error } = await supabase.rpc('accept_delivery_assignment', {
      p_assignment_id: assignmentId,
      p_delivery_person_id: deliveryPersonId
    });
    
    if (error) throw error;
    assertRpcSuccess(data as VerificationResult);
    return this.getById(assignmentId);
  },

  /**
   * Vérifier le pickup avec OTP uniquement (GPS et photo neutralisés côté RPC)
   */
  async verifyPickup(assignmentId: string, otp: string) {
    const { data, error } = await supabase.rpc('verify_pickup', {
      p_assignment_id: assignmentId,
      p_otp: otp,
      p_photo_url: 'pickup-verified',
      p_gps_lat: 0,
      p_gps_lng: 0
    });

    if (error) throw error;
    assertRpcSuccess(data as VerificationResult, 'pickup');
    return this.getById(assignmentId);
  },

  /**
   * Vérifier uniquement le code OTP pour la livraison (avant la photo/GPS)
   */
  async verifyDeliveryOtp(orderId: string, otp: string) {
    const { data, error } = await supabase.rpc('verify_delivery_otp', {
      p_order_id: orderId,
      p_code: otp
    });

    if (error) throw error;
    assertRpcSuccess(data as VerificationResult);
    return true;
  },

  /**
   * Vérifier la delivery avec OTP + photo + GPS
   */
  async verifyDelivery(assignmentId: string, otp: string, photo_url: string, gps_lat: number, gps_lng: number) {
    const { data, error } = await supabase.rpc('verify_delivery', {
      p_assignment_id: assignmentId,
      p_otp: otp,
      p_photo_url: photo_url,
      p_gps_lat: gps_lat,
      p_gps_lng: gps_lng
    });

    if (error) throw error;
    assertRpcSuccess(data as VerificationResult);
    return this.getById(assignmentId);
  },

  /**
   * Mettre à jour le statut (pour les transitions simples)
   */
  async updateStatus(assignmentId: string, status: DeliveryAssignment['status']) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .update({ status })
      .eq('id', assignmentId)
      .select()
      .single();
    
    if (error) throw error;
    return data as DeliveryAssignment;
  },

  /**
   * Récupérer un assignment par ID
   */
  async getById(assignmentId: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();
    
    if (error) throw error;
    return data as DeliveryAssignment;
  }
};
