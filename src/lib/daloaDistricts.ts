/**
 * Référentiel des quartiers et barycentres GPS de Daloa
 * Utilisé pour identifier automatiquement le quartier d'un point GPS
 * ou extraire un quartier mentionné dans une adresse textuelle.
 */

export interface DistrictCoord {
  name: string;
  lat: number;
  lng: number;
}

export const DALOA_DISTRICTS: Record<string, { lat: number; lng: number }> = {
  'Tazibouo': { lat: 6.8795, lng: -6.4488 },
  'Balouzon': { lat: 6.9044, lng: -6.4234 },
  'Lobia': { lat: 6.8977, lng: -6.4492 },
  'Abattoir': { lat: 6.8611, lng: -6.4341 },
  'Commerce': { lat: 6.8900, lng: -6.4449 },
  'Centre-ville': { lat: 6.8850, lng: -6.4470 },
  'Kennedy': { lat: 6.8835, lng: -6.4520 },
  'Gbokora': { lat: 6.9147, lng: -6.4484 },
  'Huberson': { lat: 6.8811, lng: -6.4658 },
  'Suisse': { lat: 6.8724, lng: -6.4432 },
  'Belle-ville': { lat: 6.8750, lng: -6.4579 },
  'Millionnaire': { lat: 6.8883, lng: -6.4558 },
  'Odjenecourani': { lat: 6.8689, lng: -6.4500 },
  'Institut Pastoral': { lat: 6.9027, lng: -6.4406 },
  'Palmeraie': { lat: 6.8784, lng: -6.4514 },
  'Orly': { lat: 6.8710, lng: -6.4560 },
  'Dioulabougou': { lat: 6.8850, lng: -6.4480 },
  'Quartier Baoulé': { lat: 6.8792, lng: -6.4565 },
  'Savonnerie': { lat: 6.8730, lng: -6.4510 },
  'Évêché': { lat: 6.8800, lng: -6.4450 },
  'Garage': { lat: 6.8870, lng: -6.4580 },
  'Soleil': { lat: 6.8920, lng: -6.4380 },
  'Texas': { lat: 6.8760, lng: -6.4460 },
  'Labia': { lat: 6.8910, lng: -6.4510 },
  'Fadiga': { lat: 6.8820, lng: -6.4490 },
  'Marin': { lat: 6.8840, lng: -6.4550 },
  'Cissoko': { lat: 6.8780, lng: -6.4440 },
  'Gbeulville': { lat: 6.8830, lng: -6.4390 },
  'Cafop': { lat: 6.8690, lng: -6.4620 },
  'Koyakabougou': { lat: 6.8950, lng: -6.4520 },
  'Liberia': { lat: 6.8740, lng: -6.4380 },
  'Manioc': { lat: 6.8670, lng: -6.4460 },
  'Mossibougou': { lat: 6.8880, lng: -6.4410 },
  'Sapia': { lat: 6.9080, lng: -6.4350 },
  'Wolof': { lat: 6.8860, lng: -6.4450 },
  'Tagoura': { lat: 6.9150, lng: -6.4380 },
  'Tapeguhe': { lat: 6.8600, lng: -6.4550 },
};

/**
 * Recherche le quartier le plus proche d'un couple de coordonnées GPS (Daloa)
 */
export function findNearestDistrict(lat?: number | null, lng?: number | null): string | null {
  if (lat == null || lng == null) return null;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;

  // Daloa se situe approximativement entre lat 6.80 et 6.98, lng -6.52 et -6.38
  if (numLat < 6.78 || numLat > 7.02 || numLng < -6.56 || numLng > -6.35) {
    return null;
  }

  let bestDistrict: string | null = null;
  let minDistanceSq = Infinity;

  for (const [name, coords] of Object.entries(DALOA_DISTRICTS)) {
    const dLat = numLat - coords.lat;
    const dLng = (numLng - coords.lng) * Math.cos((coords.lat * Math.PI) / 180);
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      bestDistrict = name;
    }
  }

  return bestDistrict;
}

/**
 * Détecte si une chaîne d'adresse contient explicitement un nom de quartier de Daloa
 */
export function detectDistrictInText(text?: string | null): string | null {
  if (!text) return null;
  const normalized = text.toLowerCase();

  for (const district of Object.keys(DALOA_DISTRICTS)) {
    const distLower = district.toLowerCase();
    // Recherche de mot entier pour éviter les faux positifs (ex: "soleil" ou "gar")
    const regex = new RegExp(`(^|[^a-z0-9à-ÿ])${distLower}([^a-z0-9à-ÿ]|$)`, 'i');
    if (regex.test(normalized)) {
      return district;
    }
  }

  return null;
}

