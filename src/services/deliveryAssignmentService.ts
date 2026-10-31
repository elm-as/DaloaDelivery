import { supabase } from '../lib/supabase';
import { fetchContactPhones } from '../lib/contacts';

const SAFE_ASSIGNMENT_COLUMNS = [
  'id',
  'order_id',
  'delivery_person_id',
  'status',
  'pickup_location',
  'dropoff_location',
  'pickup_address',
  'dropoff_address',
  'delivery_price',
  'pickup_otp_attempts',
  'delivery_otp_attempts',
  'accepted_at',
  'pickup_confirmed_at',
  'pickup_confirmed_by_seller',
  'delivered_at',
  'buyer_confirmed_at',
  'auto_released_at',
  'pickup_photo_url',
  'delivery_photo_url',
  'pickup_gps',
  'delivery_gps',
  'pickup_gps_distance_m',
  'delivery_gps_distance_m',
  'disputed_at',
  'dispute_reason',
  'created_at',
  'updated_at',
].join(', ');

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
  pickup_otp?: string;
  delivery_otp?: string;
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
    if (context === 'pickup') return;
    throw new Error('Vous êtes trop loin du point de livraison. Rapprochez-vous du client.');
  }
  throw new Error(result.reason || 'Action refusée');
}

async function enrichWithPhones(assignments: any[]): Promise<any[]> {
  if (!assignments || assignments.length === 0) return assignments || [];

  const orderIds = [...new Set(assignments.map((a) => a.order_id))];
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

  const phoneMap = await fetchContactPhones(Array.from(userIds));

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
  async getAvailableAssignments() {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(SAFE_ASSIGNMENT_COLUMNS)
      .eq('status', 'awaiting_pickup')
      .eq('pickup_confirmed_by_seller', true)
      .is('delivery_person_id', null);

    if (error) throw error;
    return (await enrichWithPhones(data)) as DeliveryAssignment[];
  },

  async getMyAssignments(deliveryPersonId: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(SAFE_ASSIGNMENT_COLUMNS)
      .eq('delivery_person_id', deliveryPersonId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (await enrichWithPhones(data)) as DeliveryAssignment[];
  },

  async acceptAssignment(assignmentId: string, deliveryPersonId: string) {
    const { data, error } = await supabase.rpc('accept_delivery_assignment', {
      p_assignment_id: assignmentId,
      p_delivery_person_id: deliveryPersonId,
    });

    if (error) throw error;
    assertRpcSuccess(data as unknown as VerificationResult);
    return this.getById(assignmentId);
  },

  async verifyPickup(assignmentId: string, otp: string) {
    const { data, error } = await supabase.rpc('verify_pickup', {
      p_assignment_id: assignmentId,
      p_otp: otp,
      p_photo_url: 'pickup-verified',
      p_gps_lat: 0,
      p_gps_lng: 0,
    });

    if (error) throw error;
    assertRpcSuccess(data as unknown as VerificationResult, 'pickup');
    return this.getById(assignmentId);
  },

  async verifyDeliveryOtp(orderId: string, otp: string) {
    const { data, error } = await supabase.rpc('verify_delivery_otp', {
      p_order_id: orderId,
      p_code: otp,
    });

    if (error) throw error;
    assertRpcSuccess(data as unknown as VerificationResult);
    return true;
  },

  async verifyDelivery(assignmentId: string, otp: string, photo_url: string, gps_lat: number | null, gps_lng: number | null) {
    const { data, error } = await supabase.rpc('verify_delivery', {
      p_assignment_id: assignmentId,
      p_otp: otp,
      p_photo_url: photo_url,
      p_gps_lat: gps_lat as unknown as number,
      p_gps_lng: gps_lng as unknown as number,
    });

    if (error) throw error;
    assertRpcSuccess(data as unknown as VerificationResult);
    return this.getById(assignmentId);
  },

  async updateStatus(assignmentId: string, status: DeliveryAssignment['status']) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .update({ status })
      .eq('id', assignmentId)
      .select(SAFE_ASSIGNMENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as DeliveryAssignment;
  },

  async getById(assignmentId: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(SAFE_ASSIGNMENT_COLUMNS)
      .eq('id', assignmentId)
      .single();

    if (error) throw error;
    return data as unknown as DeliveryAssignment;
  },
};
