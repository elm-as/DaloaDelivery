import { supabase } from '../lib/supabase';

export interface DeliveryRequest {
  id: string; // assignment id
  order_id: string;
  client_id: string;
  listing_id: string;
  seller_id: string;
  seller_name?: string;
  seller_phone?: string;
  seller_avatar?: string;
  shop_name?: string;
  is_private?: boolean;
  pickup_location: string;
  dropoff_location: string;
  proposed_price: number;
  status: 'awaiting_pickup' | 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  assigned_driver_id: string | null;
  created_at: string;
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
  address: string;
  lat?: number;
  lng?: number;
}

function mapAssignmentToRequest(assignment: any, sellerInfo?: SellerInfo): DeliveryRequest {
  const order = Array.isArray(assignment.orders) 
    ? assignment.orders[0] || {}
    : assignment.orders || {};
  
  console.log("Mapping assignment:", assignment.id, "orders data:", assignment.orders, "extracted order:", order);

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
    is_private: assignment.is_private ?? false,
    pickup_location: assignment.pickup_location || sellerInfo?.address || 'Adresse du vendeur',
    dropoff_location: assignment.dropoff_location || order.delivery_address || 'Adresse de livraison',
    proposed_price: assignment.delivery_price || order.delivery_fee || 0,
    status: assignment.status,
    assigned_driver_id: assignment.delivery_person_id,
    created_at: assignment.created_at,
    pickup_lat: sellerInfo?.lat || undefined,
    pickup_lng: sellerInfo?.lng || undefined,
    dropoff_lat: order.delivery_lat || undefined,
    dropoff_lng: order.delivery_lng || undefined,
  };
}

// Helper to fetch seller addresses and coordinates for a list of assignments
async function fetchSellerAddresses(assignments: any[]): Promise<Record<string, SellerInfo>> {
  const sellerIds = assignments
    .map(a => {
      const order = Array.isArray(a.orders) ? a.orders[0] : a.orders;
      return order?.seller_id;
    })
    .filter(Boolean);
  
  if (sellerIds.length === 0) return {};

  const { data } = await supabase
    .from('users')
    .select('id, district, shop_latitude, shop_longitude, latitude, longitude, full_name, phone, avatar_url, shop_name, shop_logo_url')
    .in('id', sellerIds);
    
  const addressMap: Record<string, SellerInfo> = {};
  if (data) {
    data.forEach((u: any) => {
      addressMap[u.id] = {
        name: u.full_name || u.shop_name || 'Vendeur',
        phone: u.phone,
        avatarUrl: u.avatar_url || u.shop_logo_url || null,
        shopName: u.shop_name,
        address: u.district || 'Adresse du vendeur',
        lat: u.shop_latitude ?? u.latitude ?? undefined,
        lng: u.shop_longitude ?? u.longitude ?? undefined
      };
    });
  }
  return addressMap;
}

function getOrder(assignment: any) {
  return Array.isArray(assignment.orders) ? (assignment.orders[0] || {}) : (assignment.orders || {});
}

export const deliveryOrderService = {
  async getPendingRequests() {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(`
        *,
        orders (
          buyer_id, listing_id, seller_id, delivery_address, delivery_fee, delivery_lat, delivery_lng
        )
      `)
      .eq('status', 'awaiting_pickup');
    
    if (error) throw error;
    
    const addressMap = await fetchSellerAddresses(data || []);
    return (data || []).map(a => mapAssignmentToRequest(a, addressMap[getOrder(a).seller_id]));
  },

  async getRequestById(id: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(`
        *,
        orders (
          buyer_id, listing_id, seller_id, delivery_address, delivery_fee, delivery_lat, delivery_lng
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const addressMap = await fetchSellerAddresses([data]);
    return mapAssignmentToRequest(data, addressMap[getOrder(data).seller_id]);
  },

  async acceptRequest(assignmentId: string, driverId: string) {
    const { data: rpcData, error: rpcError } = await supabase.rpc('accept_delivery_assignment', {
      p_assignment_id: assignmentId,
      p_delivery_person_id: driverId
    });
    
    if (rpcError) throw rpcError;
    if (rpcData?.success === false) {
      throw new Error(rpcData.reason || 'Erreur lors de l\'acceptation de la course');
    }
    
    return this.getRequestById(assignmentId);
  },

  async makeCounterOffer(_requestId: string, _driverId: string, _price: number) {
    // Keep this as is for now, using the old table if it exists, or mock it.
    throw new Error('Négociation non supportée dans cette version');
  },

  async getMyOrders(driverId: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(`
        *,
        orders (
          buyer_id, listing_id, seller_id, delivery_address, delivery_fee, delivery_lat, delivery_lng
        )
      `)
      .eq('delivery_person_id', driverId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const addressMap = await fetchSellerAddresses(data || []);
    return (data || []).map(a => mapAssignmentToRequest(a, addressMap[getOrder(a).seller_id]));
  },

  async updateOrderStatus(assignmentId: string, status: string) {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .update({ status })
      .eq('id', assignmentId)
      .select(`
        *,
        orders (
          buyer_id, listing_id, seller_id, delivery_address, delivery_fee, delivery_lat, delivery_lng
        )
      `)
      .single();
    
    if (error) throw error;
    
    const addressMap = await fetchSellerAddresses([data]);
    return mapAssignmentToRequest(data, addressMap[getOrder(data).seller_id]);
  }
};
