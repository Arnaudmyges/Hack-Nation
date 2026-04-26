// app/config/city.ts — zero dependency, ship immediately
// Change city here, nothing else changes

export const CITY_CONFIG = {
  name: "Stuttgart",
  country: "Germany",
  lat: 48.7758,
  lng: 9.1829,
  timezone: "Europe/Berlin",
  searchRadius: 300,          // meters
  geofenceRadius: 200,        // meters — triggers passive detection
  payoneQuietThreshold: 35,   // % below normal = quiet period
  language: "en" as const,
};

// Usage: import { CITY_CONFIG } from "../config/city";
// Replace all hardcoded 48.7758, 9.1829 with CITY_CONFIG.lat, CITY_CONFIG.lng