import { detectLocationChange, haversineKm, inferRegionalDefault, searchCities } from '../location';
import type { Location } from '@/types';

const CAIRO: Location = { lat: 30.06263, lng: 31.24967, cityName: 'Cairo', country: 'EG' };

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineKm(30, 31, 30, 31)).toBe(0);
  });

  it('calculates London → Cairo as roughly 3500 km', () => {
    const dist = haversineKm(51.5085, -0.1257, 30.0626, 31.2497);
    expect(dist).toBeGreaterThan(3400);
    expect(dist).toBeLessThan(3600);
  });

  it('calculates close points as small distances', () => {
    // ~1 km difference in lat (~0.009 degrees)
    const dist = haversineKm(30.0, 31.0, 30.009, 31.0);
    expect(dist).toBeLessThan(2);
  });
});

describe('detectLocationChange', () => {
  it('returns false when locations are close (< 50km)', () => {
    const nearCairo: Location = { lat: 30.1, lng: 31.3, cityName: 'Near Cairo', country: 'EG' };
    expect(detectLocationChange(CAIRO, nearCairo)).toBe(false);
  });

  it('returns true when locations are far apart (> 50km)', () => {
    const london: Location = { lat: 51.50853, lng: -0.12574, cityName: 'London', country: 'GB' };
    expect(detectLocationChange(CAIRO, london)).toBe(true);
  });

  it('triggers right at 50km boundary', () => {
    // ~50 km north of Cairo (roughly 0.45 degrees of latitude)
    const borderLocation: Location = { lat: 30.51, lng: 31.24967, cityName: '', country: 'EG' };
    const dist = haversineKm(CAIRO.lat, CAIRO.lng, borderLocation.lat, borderLocation.lng);
    expect(dist).toBeGreaterThan(49);
    expect(dist).toBeLessThan(51);
  });
});

describe('searchCities', () => {
  it('returns empty array for empty query', () => {
    expect(searchCities('')).toHaveLength(0);
    expect(searchCities('  ')).toHaveLength(0);
  });

  it('finds Cairo', () => {
    const results = searchCities('Cairo');
    expect(results.some((c) => c.name === 'Cairo' && c.country === 'EG')).toBe(true);
  });

  it('returns prefix matches before substring matches', () => {
    const results = searchCities('Cai');
    expect(results[0].name.toLowerCase().startsWith('cai')).toBe(true);
  });

  it('caps results at 20', () => {
    const results = searchCities('a');
    expect(results.length).toBeLessThanOrEqual(20);
  });
});

describe('inferRegionalDefault', () => {
  it('returns Egyptian for EG', () => {
    expect(inferRegionalDefault('EG')).toBe('Egyptian');
  });

  it('returns UmmAlQura for SA', () => {
    expect(inferRegionalDefault('SA')).toBe('UmmAlQura');
  });

  it('returns NorthAmerica for US', () => {
    expect(inferRegionalDefault('US')).toBe('NorthAmerica');
  });

  it('falls back to MuslimWorldLeague for unknown country', () => {
    expect(inferRegionalDefault('XX')).toBe('MuslimWorldLeague');
  });
});
