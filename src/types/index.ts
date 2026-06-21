// All domain types for the Fajr app. No logic — types only.

export type CalculationMethodKey =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'NorthAmerica'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey'
  | 'Other';

export type AdhanRecitation =
  | 'makkah'
  | 'madinah'
  | 'mishary';

export type Location = {
  lat: number;
  lng: number;
  cityName: string;
  country: string;
};

export type AlarmDay = {
  date: string;          // ISO date string: YYYY-MM-DD
  fajrTime: Date;
  sunriseTime: Date;
  scheduled: boolean;
};

export type PrayerConfirmation = {
  date: string;          // ISO date string: YYYY-MM-DD
  confirmedAt: Date | null;
  isOnTime: boolean;     // true if confirmed before sunriseTime on that day
};

export type City = {
  name: string;
  country: string;
  lat: number;
  lng: number;
};

export type Reflection = {
  id: number;
  text: string;
  source: string;
};
