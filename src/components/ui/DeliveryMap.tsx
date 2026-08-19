import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeliveryPerson } from '../../types/livreur';
import type { DeliveryRequest } from '../../services/deliveryOrderService';

// Fix for default marker icons in react-leaflet
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icon for orders
const orderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface DeliveryMapProps {
  livreurs: DeliveryPerson[];
  orders?: DeliveryRequest[];
  className?: string;
}

// Composant pour recentrer la carte automatiquement pour inclure tous les marqueurs
function MapBounds({ livreurs, orders = [] }: { livreurs: DeliveryPerson[], orders?: DeliveryRequest[] }) {
  const map = useMap();

  useEffect(() => {
    const validPoints: [number, number][] = [];

    livreurs.forEach(l => {
      if (l.current_location) {
        const { lat, lng } = l.current_location;
        if (!isNaN(lat) && !isNaN(lng)) validPoints.push([lat, lng]);
      }
    });

    orders.forEach(o => {
      if (o.pickup_location) {
        const [lat, lng] = o.pickup_location.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) validPoints.push([lat, lng]);
      }
    });

    if (validPoints.length === 0) {
      // Centre par défaut sur Daloa
      map.setView([6.8774, -6.4502], 13);
      return;
    }

    const bounds = L.latLngBounds(validPoints);

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [livreurs, orders, map]);

  return null;
}

export function DeliveryMap({ livreurs, orders = [], className = '' }: DeliveryMapProps) {
  // Centre par défaut sur Daloa
  const defaultCenter: [number, number] = [6.8774, -6.4502];

  return (
    <div className={`w-full h-[400px] rounded-lg overflow-hidden border border-grey-200 shadow-sm z-0 relative ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {livreurs.map((livreur) => {
          if (!livreur.current_location) return null;

          const { lat, lng } = livreur.current_location;
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={livreur.id} position={[lat, lng]}>
              <Popup>
                <div className="p-1">
                  <div className="font-semibold text-grey-900">{livreur.name}</div>
                  <div className="text-xs text-grey-600 capitalize mb-1">{livreur.vehicle_type}</div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-warning">★</span>
                    <span className="font-medium">{livreur.rating.toFixed(1)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {orders.map((order) => {
          if (!order.pickup_location) return null;

          const coords = order.pickup_location.split(',');
          if (coords.length !== 2) return null;

          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);

          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={order.id} position={[lat, lng]} icon={orderIcon}>
              <Popup>
                <div className="p-1">
                  <div className="font-semibold text-grey-900">Commande {Math.round(order.proposed_price * 0.9)} FCFA net</div>
                  <div className="text-xs text-grey-600 mb-1">De: {order.pickup_location}</div>
                  <div className="text-xs text-grey-600">À: {order.dropoff_location}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapBounds livreurs={livreurs} orders={orders} />
      </MapContainer>
    </div>
  );
}
