import { supabase } from '../lib/supabase';
import { fetchContactPhones } from '../lib/contacts';
import { findNearestDistrict, detectDistrictInText } from '../lib/daloaDistricts';

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
  items_summary?: string;
  is_private?: boolean;
  pickup_location: string;
  dropoff_location: string;
  seller_district?: string | null;
  buyer_district?: string | null;
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
}

export interface DeliveryOffer {
  id: string;
  request_id: string;
  driver_id: string;
  offered_price: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface SellerInfo {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  shopName?: string;
  district?: string | null;
  address: string;
  lat?: number;
  lng?: number;
}

const ASSIGNMENT_WITH_ORDER_SELECT = `
  id, order_id, delivery_person_id, status, pickup_location, dropoff_location,
  delivery_price, is_private, created_at, accepted_at, delivered_at,
  orders (
    buyer_id, listing_id, seller_id, delivery_address, delivery_fee,
    delivery_lat, delivery_lng, payment_method, total_amount, quantity,
    listings:listing_id(title, photos, district),
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
  buyerInfo?: { name?: string; phone?: string; district?: string }
): DeliveryRequest {
  const order = getOrder(assignment);

  const rawPickup = (assignment.pickup_location || '').trim();
  const isGenericPickup =
    !rawPickup ||
    rawPickup.toLowerCase() === 'boutique du vendeur' ||
    rawPickup.toLowerCase() === 'boutique' ||
    rawPickup.toLowerCase() === 'adresse du vendeur';

  const sellerDistrict =
    sellerInfo?.district ||
    order.listings?.district ||
    detectDistrictInText(rawPickup) ||
    findNearestDistrict(sellerInfo?.lat, sellerInfo?.lng) ||
    null;

  let resolvedPickup = rawPickup;
  if (isGenericPickup) {
    const shop = sellerInfo?.shopName || sellerInfo?.name || 'Boutique';
    resolvedPickup = sellerDistrict ? `${shop} (${sellerDistrict})` : shop;
  }

  const rawDropoff = (assignment.dropoff_location || order.delivery_address || 'Adresse de livraison').trim();
  const buyerDistrict =
    buyerInfo?.district ||
    detectDistrictInText(rawDropoff) ||
    findNearestDistrict(order.delivery_lat, order.delivery_lng) ||
    null;

  return {
    id: assignment.id,
    order_id: assignment.order_id,
    client_id: order.buyer_id || '',
    listing_id: order.listing_id || '',
    seller_id: order.seller_id || '',
    seller_name: sellerInfo?.shopName || sellerInfo?.name || 'Vendeur',
    seller_phone: sellerInfo?.phone,
    seller_avatar: sellerInfo?.avatarUrl,
    shop_name: sellerInfo?.shopName,
    buyer_name: buyerInfo?.name,
    buyer_phone: buyerInfo?.phone,
    items_summary: buildItemsSummary(order),
    is_private: assignment.is_private ?? false,
    pickup_location: resolvedPickup,
    dropoff_location: rawDropoff,
    seller_district: sellerDistrict,
    buyer_district: buyerDistrict,
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
  };
}

async function fetchPartiesAddresses(assignments: any[]): Promise<{
  sellers: Record<string, SellerInfo>;
  buyers: Record<string, { name?: string; phone?: string; district?: string }>;
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
    supabase
      .from('users')
      .select('id, district, shop_latitude, shop_longitude, full_name, avatar_url, shop_name, shop_logo_url')
      .in('id', allUserIds),
    fetchContactPhones(allUserIds),
  ]);

  const sellers: Record<string, SellerInfo> = {};
  const buyers: Record<string, { name?: string; phone?: string; district?: string }> = {};
  if (data) {
    data.forEach((u: any) => {
      sellers[u.id] = {
        name: u.full_name || u.shop_name || 'Vendeur',
        phone: phones.get(u.id),
        avatarUrl: u.avatar_url || u.shop_logo_url || null,
        shopName: u.shop_name,
        district: u.district || null,
        address: u.district ? `Quartier ${u.district}` : 'Daloa',
        lat: u.shop_latitude ?? undefined,
        lng: u.shop_longitude ?? undefined,
      };
      buyers[u.id] = {
        name: u.full_name || 'Client',
        phone: phones.get(u.id),
        district: u.district || undefined,
      };
    });
  }
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

    const { sellers, buyers } = await fetchPartiesAddresses(data || []);
    return (data || []).map((a) => {
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

    const { sellers, buyers } = await fetchPartiesAddresses([data]);
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

  async makeCounterOffer(_requestId: string, _driverId: string, _price: number) {
    throw new Error('Négociation non supportée dans cette version');
  },

  async getMyOrders(driverId: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(ASSIGNMENT_WITH_ORDER_SELECT)
      .eq('delivery_person_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { sellers, buyers } = await fetchPartiesAddresses(data || []);
    return (data || []).map((a) => {
      const o = getOrder(a);
      return mapAssignmentToRequest(a, sellers[o.seller_id], buyers[o.buyer_id]);
    });
  },

  async updateOrderStatus(assignmentId: string, status: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .update({ status })
      .eq('id', assignmentId)
      .select(ASSIGNMENT_WITH_ORDER_SELECT)
      .single();

    if (error) throw error;

    const { sellers, buyers } = await fetchPartiesAddresses([data]);
    const o = getOrder(data);
    return mapAssignmentToRequest(data, sellers[o.seller_id], buyers[o.buyer_id]);
  },
};
