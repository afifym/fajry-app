import * as ExpoLocation from 'expo-location';

import citiesData from '@/assets/cities.json';
import type { CalculationMethodKey, City, Location } from '@/types';

const cities = citiesData as City[];

const LOCATION_CHANGE_THRESHOLD_KM = 50;

export type GPSError = { code: 'permission_denied' | 'unavailable' };

export async function requestGPSLocation(): Promise<Location> {
  const existing = await ExpoLocation.getForegroundPermissionsAsync();
  const status =
    existing.status === 'granted'
      ? existing.status
      : (await ExpoLocation.requestForegroundPermissionsAsync()).status;
  if (status !== 'granted') {
    throw { code: 'permission_denied' } satisfies GPSError;
  }

  const result = await ExpoLocation.getCurrentPositionAsync({
    accuracy: ExpoLocation.Accuracy.Balanced,
  });

  const { latitude, longitude } = result.coords;
  const nearest = nearestCity(latitude, longitude);
  return {
    lat: latitude,
    lng: longitude,
    cityName: nearest?.name ?? '',
    country: nearest?.country ?? '',
  };
}

function nearestCity(lat: number, lng: number): City | null {
  let best: City | null = null;
  let bestDist = Infinity;
  for (const city of cities) {
    const d = haversineKm(lat, lng, city.lat, city.lng);
    if (d < bestDist) { bestDist = d; best = city; }
  }
  return best;
}

export function searchCities(query: string): City[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  // Exact-prefix matches first, then substring matches
  const exactPrefix = cities.filter((c) => c.name.toLowerCase().startsWith(q));
  if (exactPrefix.length >= 10) return exactPrefix.slice(0, 20);
  const substring = cities.filter(
    (c) => !c.name.toLowerCase().startsWith(q) && c.name.toLowerCase().includes(q),
  );
  return [...exactPrefix, ...substring].slice(0, 20);
}

export function detectLocationChange(stored: Location, current: Location): boolean {
  return haversineKm(stored.lat, stored.lng, current.lat, current.lng) > LOCATION_CHANGE_THRESHOLD_KM;
}

// Country code → CalculationMethod mapping for Regional Default
export function inferRegionalDefault(countryCode: string): CalculationMethodKey {
  const map: Record<string, CalculationMethodKey> = {
    // North America
    US: 'NorthAmerica', CA: 'NorthAmerica',
    // Gulf / Arabian Peninsula
    SA: 'UmmAlQura', AE: 'Dubai', KW: 'Kuwait', QA: 'Qatar', BH: 'UmmAlQura', OM: 'UmmAlQura', YE: 'UmmAlQura',
    // Egypt / North Africa
    EG: 'Egyptian', LY: 'Egyptian', TN: 'Egyptian', DZ: 'MuslimWorldLeague', MA: 'MuslimWorldLeague',
    // Levant / Iraq / Jordan
    SY: 'MuslimWorldLeague', IQ: 'MuslimWorldLeague', JO: 'MuslimWorldLeague', LB: 'MuslimWorldLeague',
    // South / Southeast Asia
    PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi',
    SG: 'Singapore', MY: 'Singapore', ID: 'Singapore',
    // Iran
    IR: 'Tehran',
    // Turkey
    TR: 'Turkey',
    // UK / Europe / Default
    GB: 'MuslimWorldLeague', DE: 'MuslimWorldLeague', FR: 'MuslimWorldLeague',
  };
  return map[countryCode] ?? 'MuslimWorldLeague';
}

// Haversine formula — distance in km between two lat/lng points
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
