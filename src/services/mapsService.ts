import type { Coordinates } from '../types/livreur';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

const DALOA_CENTER: Coordinates = { lat: 6.8774, lng: -6.4502 };
const DALOA_RADIUS_KM = 50;

export const mapsService = {
  async geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
      const url = new URL(`${NOMINATIM_BASE_URL}/search`);
      url.searchParams.set('q', `${address}, Daloa, Côte d'Ivoire`);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('accept-language', 'fr');

      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'DaloaDelivery/1.0' },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data || data.length === 0) return null;

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    } catch {
      return null;
    }
  },

  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371;
    const dLat = toRadians(to.lat - from.lat);
    const dLng = toRadians(to.lng - from.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(from.lat)) *
        Math.cos(toRadians(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  },

  validateCoordinates(lat: number, lng: number): boolean {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    const distance = this.calculateDistance(DALOA_CENTER, { lat, lng });
    return distance <= DALOA_RADIUS_KM;
  },

  getDistanceFromDaloa(lat: number, lng: number): number {
    return this.calculateDistance(DALOA_CENTER, { lat, lng });
  },
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
