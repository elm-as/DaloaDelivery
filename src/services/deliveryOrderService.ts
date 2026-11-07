import { supabase } from '../lib/supabase';
import { fetchContactPhones } from '../lib/contacts';

export interface GroupedSellerStop {
  stop_index?: number;
  seller_id: string;
  shop_name?: string;
  seller_name?: string;
  seller_phone?: string | null;
  district?: string | null;
  address?: string | null;
  pickup_address?: string | null;
  status: 'pending' | 'picked_up';
  picked_up_at?: string | null;
}

export interface DeliveryRequest {
  id: string;
  order_id: string;
  client_id: string;
  listing_id: string;
  seller_id: string;
  seller_name?: string;
  seller_phone?: string;
  seller_avatar?: string;
  shop_name?: string;
  buyer_name?: string;
  buyer_phone?: string;
  payment_method?: string;
  total_amount?: number;
  items_summary?: string;
  is_private?: boolean;
  pickup_location: string;
  dropoff_location: string;
  proposed_price: number;
  status: 'awaiting_pickup' | 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'disputed' | 'cancelled';
  assigned_driver_id: string | null;
  created_at: string;
  accepted_at: string | null;
  delivered_at: string | null;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  is_express?: boolean;
  package_description?: string | null;
  package_type?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  payer_role?: 'sender' | 'recipient' | null;
  is_grouped?: boolean;
  delivery_group_id?: string | null;
  group_total_stops?: number;
  group_completed_stops?: number;
  grouped_stops?: GroupedSellerStop[];
  buyer_cod_score?: number;
  buyer_cod_orders_count?: number;
  buyer_cod_delivered_count?: number;
  buyer_cod_refused_count?: number;
}

export interface SellerInfo {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  shopName?: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface BuyerInfo {
  name?: string;
  phone?: string;
  codScore: number;
  codOrdersCount: number;
  codDeliveredCount: number;
  codRefusedCount: number;
}

const ASSIGNMENT_WITH_ORDER_SELECT = `
  id, order_id, delivery_person_id, status, pickup_location, dropoff_location,
  delivery_price, is_private, is_express, package_description, package_type,
  sender_name, sender_phone, recipient_name, recipient_phone, payer_role,
  is_grouped, delivery_group_id, group_total_stops, group_completed_stops,
  grouped_stops, created_at, accepted_at, delivered_at,
  orders (
    buyer_id, listing_id, seller_id, delivery_address, delivery_fee,
    delivery_lat, delivery_lng, payment_method, total_amount, quantity,
    listings:listing_id(title, photos),
    order_items(id, quantity, listings:listing_id(title))
  )
`;

function getOrder(assignment: any) {
  return Array.isArray(assignment.orders) ? (assignment.orders[0] || {}) : (assignment.orders || {});
}

function buildItemsSummary(order: any): string | undefined {
  if (Array.isArray(order.order_items) && order.order_items.length > 0) {
    return order.order_items
      .map((it: any) => `${it.quantity || 1}x ${it.listings?.title || order.listings?.title || 'Article'}`)
      .join(' • ');
  }
  if (order.listings?.title) {
    return `${order.quantity || 1}x ${order.listings.title}`;
  }
  return undefined;
}

function mapAssignmentToRequest(
  assignment: any,
  sellerInfo?: SellerInfo,
  buyerInfo?: BuyerInfo
): DeliveryRequest {
  const order = getOrder(assignment);
  const isExpress = Boolean(assignment.is_express);

  return {
    id: assignment.id,
    order_id: assignment.order_id,
    client_id: order.buyer_id || '',
    listing_id: order.listing_id || '',
    seller_id: order.seller_id || '',
    seller_name: isExpress
      ? (assignment.sender_name || 'Expéditeur Express')
      : (sellerInfo?.shopName || sellerInfo?.name || 'Vendeur'),
    seller_phone: isExpress ? (assignment.sender_phone || sellerInfo?.phone) : sellerInfo?.phone,
    seller_avatar: sellerInfo?.avatarUrl,
    shop_name: sellerInfo?.shopName,
    buyer_name: isExpress ? (assignment.recipient_name || buyerInfo?.name) : buyerInfo?.name,
    buyer_phone: isExpress ? (assignment.recipient_phone || buyerInfo?.phone) : buyerInfo?.phone,
    payment_method: order.payment_method,
    total_amount: order.total_amount,
    items_summary: buildItemsSummary(order),
    is_private: assignment.is_private ?? false,
    pickup_location: assignment.pickup_location || sellerInfo?.address || 'Adresse du vendeur',
    dropoff_location: assignment.dropoff_location || order.delivery_address || 'Adresse de livraison',
    proposed_price: assignment.delivery_price || order.delivery_fee || 0,
    status: assignment.status,
    assigned_driver_id: assignment.delivery_person_id,
    created_at: assignment.created_at,
    accepted_at: assignment.accepted_at ?? null,
    delivered_at: assignment.delivered_at ?? null,
    pickup_lat: sellerInfo?.lat || undefined,
    pickup_lng: sellerInfo?.lng || undefined,
    dropoff_lat: order.delivery_lat || undefined,
    dropoff_lng: order.delivery_lng || undefined,
    is_express: isExpress,
    package_description: assignment.package_description || null,
    package_type: assignment.package_type || null,
    sender_name: assignment.sender_name || null,
    sender_phone: assignment.sender_phone || null,
    recipient_name: assignment.recipient_name || null,
    recipient_phone: assignment.recipient_phone || null,
    payer_role: assignment.payer_role || null,
    is_grouped: Boolean(assignment.is_grouped),
    delivery_group_id: assignment.delivery_group_id || null,
    group_total_stops: Number(assignment.group_total_stops || 1),
    group_completed_stops: Number(assignment.group_completed_stops || 0),
    grouped_stops: Array.isArray(assignment.grouped_stops) ? assignment.grouped_stops : [],
    buyer_cod_score: buyerInfo?.codScore ?? 100,
    buyer_cod_orders_count: buyerInfo?.codOrdersCount ?? 0,
    buyer_cod_delivered_count: buyerInfo?.codDeliveredCount ?? 0,
    buyer_cod_refused_count: buyerInfo?.codRefusedCount ?? 0,
  };
}

async function fetchPartiesInfo(assignments: any[]): Promise<{
  sellers: Record<string, SellerInfo>;
  buyers: Record<string, BuyerInfo>;
}> {
  const sellerIds = new Set<string>();
  const buyerIds = new Set<string>();

  assignments.forEach((a) => {
    const order = getOrder(a);
    if (order?.seller_id) sellerIds.add(order.seller_id);
    if (order?.buyer_id) buyerIds.add(order.buyer_id);
  });

  const allUserIds = Array.from(new Set([...sellerIds, ...buyerIds]));
  if (allUserIds.length === 0) return { sellers: {}, buyers: {} };

  const [{ data }, phones] = await Promise.all([
    (supabase.from('users') as any)
      .select(
        'id, district, shop_latitude, shop_longitude, full_name, avatar_url, shop_name, shop_logo_url, cod_reliability_score, cod_orders_count, cod_delivered_count, cod_refused_count'
      )
      .in('id', allUserIds),
    fetchContactPhones(allUserIds),
  ]);

  const sellers: Record<string, SellerInfo> = {};
  const buyers: Record<string, BuyerInfo> = {};

  (data || []).forEach((u: any) => {
    sellers[u.id] = {
      name: u.full_name || u.shop_name || 'Vendeur',
      phone: phones.get(u.id),
      avatarUrl: u.avatar_url || u.shop_logo_url || null,
      shopName: u.shop_name,
      address: u.district || 'Adresse du vendeur',
      lat: u.shop_latitude ?? undefined,
      lng: u.shop_longitude ?? undefined,
    };
    buyers[u.id] = {
      name: u.full_name || 'Client',
      phone: phones.get(u.id),
      codScore: Number(u.cod_reliability_score ?? 100),
      codOrdersCount: Number(u.cod_orders_count || 0),
      codDeliveredCount: Number(u.cod_delivered_count || 0),
      codRefusedCount: Number(u.cod_refused_count || 0),
    };
  });

  return { sellers, buyers };
}

let lastWebStaleSweepAt = 0;

async function sweepStaleAcceptedRequestsIfNeeded() {
  const now = Date.now();
  if (now - lastWebStaleSweepAt < 60_000) return;
  lastWebStaleSweepAt = now;
  try {
    await supabase.rpc('release_stale_accepted_assignments', { p_timeout_minutes: 210 });
  } catch {
    // Non-bloquant
  }
}

export const deliveryOrderService = {
  async getPendingRequests() {
    await sweepStaleAcceptedRequestsIfNeeded();

    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(ASSIGNMENT_WITH_ORDER_SELECT)
      .eq('status', 'awaiting_pickup');

    if (error) throw error;

    const seenGroups = new Set<string>();
    const deduped = (data || []).filter((a: any) => {
      if (!a.delivery_group_id) return true;
      if (seenGroups.has(a.delivery_group_id)) return false;
      seenGroups.add(a.delivery_group_id);
      return true;
    });

    const { sellers, buyers } = await fetchPartiesInfo(deduped);
    return deduped.map((a: any) => {
      const o = getOrder(a);
      return mapAssignmentToRequest(a, sellers[o.seller_id], buyers[o.buyer_id]);
    });
  },

  async getRequestById(id: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(ASSIGNMENT_WITH_ORDER_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    const { sellers, buyers } = await fetchPartiesInfo([data]);
    const o = getOrder(data);
    return mapAssignmentToRequest(data, sellers[o.seller_id], buyers[o.buyer_id]);
  },

  async acceptRequest(assignmentId: string, driverId: string) {
    const { data: rpcData, error: rpcError } = await supabase.rpc('accept_delivery_assignment', {
      p_assignment_id: assignmentId,
      p_delivery_person_id: driverId,
    });

    if (rpcError) throw rpcError;
    const accepted = rpcData as { success?: boolean; reason?: string; message?: string } | null;
    if (accepted?.success === false) {
      throw new Error(accepted.message || accepted.reason || "Erreur lors de l'acceptation de la course");
    }

    return this.getRequestById(assignmentId);
  },

  async releaseRequest(assignmentId: string, reason = 'driver_released') {
    const { data: rpcData, error: rpcError } = await supabase.rpc('release_delivery_assignment', {
      p_assignment_id: assignmentId,
      p_reason: reason,
    });

    if (rpcError) throw rpcError;
    const released = rpcData as { success?: boolean; reason?: string; message?: string } | null;
    if (released?.success === false) {
      throw new Error(released.message || released.reason || 'Impossible de libérer cette course');
    }

    return released;
  },
  async getMyOrders(driverId: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(ASSIGNMENT_WITH_ORDER_SELECT)
      .eq('delivery_person_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const { sellers, buyers } = await fetchPartiesInfo(data || []);
    return (data || []).map((a: any) => {
      const o = getOrder(a);
      return mapAssignmentToRequest(a, sellers[o.seller_id], buyers[o.buyer_id]);
    });
  },

  async confirmGroupedPickupStop(
    assignmentId: string,
    stopIndex: number,
    sellerId: string,
    otpCode?: string
  ) {
    const { data, error } = await (supabase as any).rpc('confirm_grouped_pickup_stop', {
      p_assignment_id: assignmentId,
      p_stop_index: stopIndex,
      p_seller_id: sellerId,
      p_notes: null,
      p_otp_code: otpCode?.trim() || null,
    });
    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.message || data?.reason || 'Impossible de valider cet arrêt marchand');
    }
    return data as {
      success: boolean;
      completed_stops: number;
      total_stops: number;
      all_picked_up?: boolean;
      all_completed?: boolean;
    };
  },

  async reportCodRefusal(orderId: string, reason: string, notes?: string) {
    const { data, error } = await (supabase as any).rpc('report_cod_delivery_refusal', {
      p_order_id: orderId,
      p_reason: reason,
      p_notes: notes?.trim() || null,
    });
    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.reason || 'Impossible de signaler ce refus');
    }
    return data as { success: boolean; is_now_blocked?: boolean };
  },

  async publishDriverLiveLocation(
    assignmentId: string,
    lat: number,
    lng: number,
    heading?: number | null,
    speedKmh?: number | null
  ) {
    await (supabase as any).rpc('update_driver_run_location', {
      p_assignment_id: assignmentId,
      p_lat: lat,
      p_lng: lng,
      p_heading: heading ?? null,
      p_speed: speedKmh ?? null,
    });
  },
};
