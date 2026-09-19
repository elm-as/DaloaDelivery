import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';
import type { DeliveryRequest } from '../../services/deliveryOrderService';

// Fix icons Leaflet
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

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const sellerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const buyerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MAPBOX_TOKEN = (import.meta as any).env?.VITE_MAPBOX_TOKEN || '';
const TILE_URL_STREET = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

function MapBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    const bounds = L.latLngBounds(coords);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
}

interface CourseMapProps {
  order: DeliveryRequest;
  onOpenNavigation: () => void;
  className?: string;
  showNavButton?: boolean;
}

export const CourseMap: React.FC<CourseMapProps> = ({
  order,
  onOpenNavigation,
  className = 'h-full w-full',
  showNavButton = true,
}) => {
  const daloaCenter: [number, number] = [6.8774, -6.4502];
  const driverCoords: [number, number] = [6.8770, -6.4510];
  const sellerCoords: [number, number] = [
    order.pickup_lat ?? 6.8785,
    order.pickup_lng ?? -6.4490,
  ];
  const buyerCoords: [number, number] = [
    order.dropoff_lat ?? 6.8750,
    order.dropoff_lng ?? -6.4530,
  ];

  let boundsCoords: [number, number][] = [];
  let polylineCoords: [number, number][] = [];

  if (order.status === 'awaiting_pickup' || order.status === 'pending') {
    boundsCoords = [sellerCoords, buyerCoords];
  } else if (order.status === 'accepted') {
    boundsCoords = [driverCoords, sellerCoords];
    polylineCoords = [driverCoords, sellerCoords];
  } else if (order.status === 'picked_up' || order.status === 'in_transit') {
    boundsCoords = [driverCoords, buyerCoords];
    polylineCoords = [driverCoords, buyerCoords];
  } else {
    boundsCoords = [sellerCoords, buyerCoords];
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={daloaCenter}
        zoom={14}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution={MAPBOX_TOKEN ? '&copy; Mapbox' : '&copy; CARTO'}
          url={TILE_URL_STREET}
          subdomains="abcd"
          maxZoom={20}
        />
        <MapBounds coords={boundsCoords} />

        {/* Marqueur Livreur */}
        {['accepted', 'picked_up', 'in_transit'].includes(order.status) && (
          <Marker position={driverCoords} icon={driverIcon}>
            <Popup>Votre position (Livreur)</Popup>
          </Marker>
        )}

        {/* Marqueur Vendeur */}
        <Marker position={sellerCoords} icon={sellerIcon}>
          <Popup>Point de ramassage : {order.pickup_location}</Popup>
        </Marker>

        {/* Marqueur Client */}
        <Marker position={buyerCoords} icon={buyerIcon}>
          <Popup>Point de livraison : {order.dropoff_location}</Popup>
        </Marker>

        {/* Ligne d'itinéraire */}
        {polylineCoords.length > 0 && (
          <Polyline
            positions={polylineCoords}
            color="#FF9800"
            weight={5}
            opacity={0.85}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {/* Bouton Navigation GPS flottant sur la carte */}
      {showNavButton && ['accepted', 'picked_up', 'in_transit'].includes(order.status) && (
        <div className="absolute top-4 right-4 z-[400]">
          <button
            onClick={onOpenNavigation}
            className="px-4 py-2.5 bg-grey-900/90 hover:bg-grey-900 text-white rounded-xl font-bold text-xs shadow-lg backdrop-blur-xs flex items-center gap-2 active:scale-95 transition cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-primary" />
            Lancer GPS (Moto)
          </button>
        </div>
      )}
    </div>
  );
};
